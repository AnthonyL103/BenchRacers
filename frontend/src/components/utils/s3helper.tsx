
export const getS3ImageUrl = (key: string | null | undefined): string => {
    
    if (!key) {
      return '/placeholder.svg?text=No+Image';
    }
    
    if (key.startsWith('http')) {
      return key;
    }
    
    const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
    const region = import.meta.env.VITE_AWS_REGION;
    
    
    if (!bucketName || !region) {
      console.error("S3 environment variables are not set");
      return '/placeholder.svg?text=Config+Error';
    }
    
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    return url;
  }