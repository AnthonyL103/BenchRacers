terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"  
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

data "aws_region" "current" {}

data "aws_db_instance" "benchracers_rds" {
  db_instance_identifier = "database-1"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "alb_sg" {
  name        = "benchracers-alb-sg"
  description = "Allow HTTP and HTTPS traffic"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "BenchRacers ALB SG"
  }
}



resource "aws_s3_bucket" "benchracers_photos" {
  bucket = "benchracers-photos"

  tags = {
    Name = "BenchRacers Photos"
    Environment = "Production"
  }
}


resource "aws_cloudwatch_log_group" "benchracers_api_logs" {
  name              = "/benchracers/api/calls"
  retention_in_days = 14
}

resource "aws_iam_role" "ec2_cloudwatch_role" {
  name = "benchracers-ec2-cloudwatch-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_policy_attachment" {
  role       = aws_iam_role.ec2_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "benchracers-ec2-cloudwatch-profile"
  role = aws_iam_role.ec2_cloudwatch_role.name
}

# Removed custom VPC, Internet Gateway, and Security Groups to rely on AWS default networking
# Make sure your instances and load balancer use the default VPC and subnets with open access if necessary

resource "aws_launch_template" "benchracers_template" {
  name_prefix   = "benchracers-template"
  image_id      = "ami-07b0c09aab6e66ee9"  # Amazon Linux 2 AMI
  instance_type = "t2.small"
  key_name      = "BenchWarmersEc2Key"

  vpc_security_group_ids = [aws_security_group.alb_sg.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<EOF
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

# Swap curl-minimal to curl to avoid conflicts
yum install -y --allowerasing curl


# Update system and install packages
yum update -y --skip-broken
yum install -y nginx git gcc-c++ make

# Configure Nginx
cat > /etc/nginx/conf.d/benchracers.conf <<EOT
server {
    listen 80;
    server_name api.benchracers.com;

    location /health {
        return 200 'healthy';
        add_header Content-Type text/plain;
    }

    location / {
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://www.benchracershq.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            return 204;
        }
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOT

systemctl restart nginx

# Node.js setup
curl -sL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs

# Clone and set up backend
cd /home/ec2-user
if [ ! -d "BenchRacers" ]; then
  git clone https://github.com/AnthonyL103/BenchRacers.git
fi
cd BenchRacers/backend
npm install

# Setup PM2
npm install -g pm2
mkdir -p logs
pm2 start server.js --name benchracers-api --log-date-format="YYYY-MM-DD HH:mm:ss" --output logs/out.log --error logs/error.log
pm2 save
pm2 startup
eval $(pm2 startup | grep sudo)

# CloudWatch Agent setup
yum install -y amazon-cloudwatch-agent
mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOT
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/home/ec2-user/BenchRacers/backend/logs/*.log",
            "log_group_name": "/benchracers/api/calls",
            "log_stream_name": "{instance_id}-backend-logs",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          }
        ]
      }
    }
  }
}
EOT

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

echo "User data script completed successfully."
EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_autoscaling_group" "benchracers_asg" {
  name                      = "benchracers-asg"
  max_size                  = 2
  min_size                  = 1
  desired_capacity          = 1
  vpc_zone_identifier       = data.aws_subnets.default.ids
  target_group_arns         = [aws_lb_target_group.benchracers_target_group.arn]
  health_check_type         = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.benchracers_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "BenchRacers Instance"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}



# Get list of subnet IDs in the default VPC
data "aws_subnet_ids" "default" {
  vpc_id = data.aws_vpc.default.id
}

# Fetch subnet details for filtering by AZ
data "aws_subnet" "selected" {
  for_each = toset(data.aws_subnet_ids.default.ids)
  id       = each.value
}

# ALB using only one subnet per availability zone
resource "aws_lb" "benchracers_alb" {
  name               = "benchracers-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups    = [aws_security_group.alb_sg.id]

  # Replace these with *exact* subnet IDs from different AZs
  subnets = [
    "subnet-0fa3bbd6a9b398729",  # e.g., us-west-2a
    "subnet-03b8554a7dd4aeec8"   # e.g., us-west-2b
    "subnet-0808f06feea54df94"
    "subnet-0c064f12fd07fae84"
  ]

  enable_deletion_protection = false

  tags = {
    Name = "BenchRacers-ALB"
  }

  depends_on = [aws_security_group.alb_sg]
}



resource "aws_lb_target_group" "benchracers_target_group" {
  name        = "benchracers-tg"
  port        = 80
  protocol    = "HTTP"
  
  # Use the VPC
  vpc_id = data.aws_vpc.default.id
  target_type = "instance"

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 2
    matcher             = "200-299"  # Accept any 2xx response as healthy
  }

  tags = {
    Name = "BenchRacers-TargetGroup"
  }
  lifecycle {
    create_before_destroy = true
  }
}

# Use manually created certificate for HTTPS listener
resource "aws_lb_listener" "benchracers_https_listener" {
  load_balancer_arn = aws_lb.benchracers_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  
  # Reference your existing certificate - Update this with your actual certificate ARN
  certificate_arn   = "arn:aws:acm:us-west-2:060795900722:certificate/7c9b7b25-72b6-4802-80e6-787021dd4942"
 
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.benchracers_target_group.arn
  }
  depends_on = [aws_lb_target_group.benchracers_target_group]
  lifecycle {
    create_before_destroy = true
  }


}

# HTTP listener with redirect to HTTPS
resource "aws_lb_listener" "benchracers_http_listener" {
  load_balancer_arn = aws_lb.benchracers_alb.arn
  port              = 80
  protocol          = "HTTP"
 
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  depends_on = [aws_lb_target_group.benchracers_target_group]
  lifecycle {
    create_before_destroy = true
  }
}


# S3 bucket ownership controls
resource "aws_s3_bucket_ownership_controls" "benchracers_photos_ownership" {
  bucket = aws_s3_bucket.benchracers_photos.id
  
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# S3 bucket ACL
resource "aws_s3_bucket_acl" "benchracers_photos_acl" {
  depends_on = [
    aws_lb_listener.benchracers_http_listener,
    aws_lb_listener.benchracers_https_listener
  ]
  
  bucket = aws_s3_bucket.benchracers_photos.id
  acl    = "private"  # Makes the bucket private by default
}

# S3 bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "benchracers_photos_cors" {
  bucket = aws_s3_bucket.benchracers_photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [
      "https://benchracershq.com", 
      "https://www.benchracershq.com", 
      "https://api.benchracershq.com"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# IAM policy for S3 access
resource "aws_iam_policy" "s3_access_policy" {
  name        = "benchracers-s3-access-policy"
  description = "Policy for EC2 instances to access S3 photos bucket"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        Effect = "Allow",
        Resource = [
          "${aws_s3_bucket.benchracers_photos.arn}",
          "${aws_s3_bucket.benchracers_photos.arn}/*"
        ]
      }
    ]
  })
}

# Attach S3 access policy to EC2 role
resource "aws_iam_role_policy_attachment" "s3_access_attachment" {
  role       = aws_iam_role.ec2_cloudwatch_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}