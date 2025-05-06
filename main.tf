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

resource "aws_vpc" "benchracers_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "BenchRacers-VPC" }
}

resource "aws_subnet" "benchracers_subnet_1" {
  vpc_id                  = aws_vpc.benchracers_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  tags = { Name = "BenchRacers-Subnet-1" }
}

resource "aws_subnet" "benchracers_subnet_2" {
  vpc_id            = aws_vpc.benchracers_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"
  tags = { Name = "BenchRacers-Subnet-2" }
}

resource "aws_subnet" "benchracers_subnet_3" {
  vpc_id            = aws_vpc.benchracers_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-west-2c"
  tags = { Name = "BenchRacers-Subnet-3" }
}

resource "aws_subnet" "benchracers_subnet_4" {
  vpc_id            = aws_vpc.benchracers_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-west-2d"
  tags = { Name = "BenchRacers-Subnet-4" }
}

resource "aws_internet_gateway" "benchracers_igw" {
  vpc_id = aws_vpc.benchracers_vpc.id
  tags = { Name = "BenchRacers-IGW" }
}

resource "aws_route_table" "benchracers_rt" {
  vpc_id = aws_vpc.benchracers_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.benchracers_igw.id
  }

  tags = { Name = "BenchRacers-RT" }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.benchracers_subnet_1.id
  route_table_id = aws_route_table.benchracers_rt.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.benchracers_subnet_2.id
  route_table_id = aws_route_table.benchracers_rt.id
}

resource "aws_route_table_association" "c" {
  subnet_id      = aws_subnet.benchracers_subnet_3.id
  route_table_id = aws_route_table.benchracers_rt.id
}

resource "aws_route_table_association" "d" {
  subnet_id      = aws_subnet.benchracers_subnet_4.id
  route_table_id = aws_route_table.benchracers_rt.id
}

resource "aws_security_group" "benchracers_alb_sg" {
  name        = "benchracers-alb-sg"
  description = "Security group for BenchRacers ALB"
  vpc_id      = aws_vpc.benchracers_vpc.id

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "BenchRacers-ALB-SG" }
}

resource "aws_security_group" "benchracers_ec2_sg" {
  name        = "benchracers-ec2-sg"
  description = "Security group for BenchRacers EC2 instances"
  vpc_id      = aws_vpc.benchracers_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.benchracers_alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "BenchRacers-EC2-SG" }
}

resource "aws_launch_template" "benchracers_template" {
  name_prefix   = "benchracers-template"
  image_id      = "ami-07b0c09aab6e66ee9"  # Amazon Linux 2 AMI - update as needed
  instance_type = "t2.small"
  key_name      = "benchracers-key"  # Your SSH key name
  
  # Include both the new security group and your existing EC2-RDS security groups
  vpc_security_group_ids = [
    aws_security_group.benchracers_ec2_sg.id,
    "sg-0ea3c922ba9f4df17",  # ec2-rds-3
    "sg-043fe2ac5228b6fd3"   # launch-wizard-2
  ]

  # Add the IAM instance profile for CloudWatch
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  user_data = base64encode(<<EOF
#!/bin/bash
set -e  # Stop script on error
exec > /var/log/user-data.log 2>&1  # Log output for debugging

echo "Starting user data script at $(date)"  # Forces Terraform to detect changes

# Update system and install dependencies (Amazon Linux commands)
echo "Updating system packages..."
sudo yum update -y
sudo yum install -y nginx git curl 

cat > /etc/nginx/conf.d/benchracers.conf <<EOT
server {
    listen 80;
    server_name _;
    
    location /health {
        return 200 'healthy';
        add_header Content-Type text/plain;
    }

    location / {
        if ($request_method = 'OPTIONS') {
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

sudo systemctl restart nginx

# Install Node.js on Amazon Linux
echo "Installing Node.js..."
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs gcc-c++ make

# Install CloudWatch agent for Amazon Linux
echo "Installing CloudWatch agent..."
sudo yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
echo "Configuring CloudWatch agent..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOT'
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
            "file_path": "/var/log/benchracers-api/*.log",
            "log_group_name": "/benchracers/api/calls",
            "log_stream_name": "{instance_id}-api-logs",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          },
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

# Start CloudWatch agent
echo "Starting CloudWatch agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

# Create log directories
sudo mkdir -p /var/log/benchracers-api
sudo chmod 755 /var/log/benchracers-api
sudo mkdir -p /home/ec2-user/BenchRacers/backend/logs
sudo chmod 755 /home/ec2-user/BenchRacers/backend/logs

# Clone backend repo if not already present
cd /home/ec2-user
if [ ! -d "BenchRacers/backend" ]; then
  echo "Cloning BenchRacers backend repo..."
  git clone https://github.com/AnthonyL103/BenchRacers.git
else
  echo "BenchRacers backend repo already exists, pulling latest changes..."
  cd BenchRacers/backend
  sudo chown -R ec2-user:ec2-user .  
  export HOME=/home/ec2-user
  sudo -u ec2-user git config --global --add safe.directory /home/ec2-user/BenchRacers/backend
  sudo -u ec2-user git reset --hard origin/main  
  sudo -u ec2-user git pull origin main
  
  cd ..

  find . -mindepth 1 -maxdepth 1 -not -name "backend" -exec rm -rf {} \;
fi

# Note: Environment variables should be configured separately to avoid
# storing secrets in version control
# You can use one of these approaches instead:
# 1. AWS Systems Manager Parameter Store
# 2. AWS Secrets Manager 
# 3. Manual configuration after deployment
# 4. CI/CD pipeline secrets injection

# Ensure dependencies are installed
echo "Installing Node.js dependencies..."
cd /home/ec2-user/BenchRacers/backend
npm install
npm install --save bcrypt express cors dotenv uuid @sendgrid/mail jsonwebtoken winston winston-daily-rotate-file aws-sdk multer multer-s3

# Ensure no stale processes are running
echo "Killing old processes..."
for port in 3000 3001 3002 3003; do
  sudo fuser -k $port/tcp || true
done
sudo pkill -f node || true
sudo pkill -f pm2 || true

# Install PM2 and start processes
echo "Starting PM2 processes..."
cd /home/ec2-user/BenchRacers/backend

# Update PM2 to ensure consistent version
npm install pm2@latest -g

# Force PM2 to update
pm2 update

# Clear any existing PM2 processes
pm2 delete all || true

# Create pm2 ecosystem file if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
  cat > ecosystem.config.js <<EOT
module.exports = {
  apps: [{
    name: "benchracers-api",
    script: "server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/out.log"
  }]
}
EOT
fi

# Start processes
pm2 start ecosystem.config.js
pm2 save
pm2 startup

sudo chown -R ec2-user:ec2-user /home/ec2-user/.pm2
sudo chmod -R 775 /home/ec2-user/.pm2

# Setup Nginx reverse proxy - Amazon Linux uses a different Nginx config location
cat > /etc/nginx/conf.d/benchracers.conf <<EOT
server {
    listen 80;
    server_name api.benchracers.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOT

# Remove default nginx site if it exists
rm -f /etc/nginx/conf.d/default.conf || true

# Restart services
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "User data script finished successfully at $(date)"  # Forces Terraform to recognize changes
EOF
  )

  # Forces instance replacement when the script updates
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb" "benchracers_alb" {
  name               = "benchracers-alb" 
  internal           = false
  load_balancer_type = "application"
  
  # Use the security group
  security_groups    = [aws_security_group.benchracers_alb_sg.id]
  
  # Use the subnets
  subnets            = [
    aws_subnet.benchracers_subnet_1.id,
    aws_subnet.benchracers_subnet_2.id,
    aws_subnet.benchracers_subnet_3.id,
    aws_subnet.benchracers_subnet_4.id
  ]

  enable_deletion_protection = false

  tags = {
    Name = "BenchRacers-ALB"
  }
}

resource "aws_lb_target_group" "benchracers_target_group" {
  name        = "benchracers-tg"
  port        = 80
  protocol    = "HTTP"
  
  # Use the VPC
  vpc_id      = aws_vpc.benchracers_vpc.id
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
}

# Use manually created certificate for HTTPS listener
resource "aws_lb_listener" "benchracers_https_listener" {
  load_balancer_arn = aws_lb.benchracers_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  
  # Reference your existing certificate - Update this with your actual certificate ARN
  certificate_arn   = " arn:aws:acm:us-west-2:060795900722:certificate/7c9b7b25-72b6-4802-80e6-787021dd4942"
 
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.benchracers_target_group.arn
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
}

resource "aws_autoscaling_group" "benchracers_asg" {
  name                 = "benchracers-asg"
  desired_capacity     = 1
  max_size             = 3
  min_size             = 1
  
  # Use the new subnets
  vpc_zone_identifier  = [
    aws_subnet.benchracers_subnet_1.id,
    aws_subnet.benchracers_subnet_2.id,
    aws_subnet.benchracers_subnet_3.id,
    aws_subnet.benchracers_subnet_4.id
  ]

  launch_template {
    id      = aws_launch_template.benchracers_template.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.benchracers_target_group.arn]

  lifecycle {
    create_before_destroy = true  
  }

  tag {
    key                 = "Name"
    value               = "BenchRacers-ASG-Instance"
    propagate_at_launch = true
  }
}

# Reference existing RDS instance
data "aws_db_instance" "benchracers_rds" {
  db_instance_identifier = "database-1"  # Verify this is your actual RDS identifier
}

# Reference existing Amplify app
data "aws_amplify_app" "benchracers_amplify" {
  app_id = "d3bmjlq8fmb7xr"  # Verify this is your actual Amplify app ID
}

# S3 bucket for storing photos/images
resource "aws_s3_bucket" "benchracers_photos" {
  bucket = "benchracers-photos"  # This needs to be globally unique
  
  tags = {
    Name = "BenchRacers Photos"
    Environment = "Production"
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
  depends_on = [aws_s3_bucket_ownership_controls.benchracers_photos_ownership]
  
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