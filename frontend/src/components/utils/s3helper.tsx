
export const getS3ImageUrl = (key: string | null | undefined): string => {
    console.log("getS3ImageUrl called with key:", key);
    
    if (!key) {
      console.log("No key provided, returning placeholder");
      return '/placeholder.svg?text=No+Image';
    }
    
    if (key.startsWith('http')) {
      console.log("Key is already a URL:", key);
      return key;
    }
    
    const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;
    const region = import.meta.env.VITE_AWS_REGION;
    
    console.log("Env vars:", { bucketName, region });
    
    if (!bucketName || !region) {
      console.error("S3 environment variables are not set");
      return '/placeholder.svg?text=Config+Error';
    }
    
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    console.log("Generated URL:", url);
    return url;
  }