import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Creates a fresh S3 client instance.
 * Ensures we pick up latest environment variables.
 */
function getClient() {
  const endpoint = process.env.ARVAN_ENDPOINT;
  const accessKeyId = process.env.ARVAN_ACCESS_KEY;
  const secretAccessKey = process.env.ARVAN_SECRET_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 Configuration is missing in environment variables (ARVAN_ENDPOINT, ARVAN_ACCESS_KEY, ARVAN_SECRET_KEY)");
  }

  return new S3Client({
    region: "default",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function getBucketName() {
  const bucket = process.env.ARVAN_BUCKET_NAME;
  if (!bucket) throw new Error("ARVAN_BUCKET_NAME is not defined");
  return bucket;
}

/**
 * Generates a temporary (signed) URL for downloading a file.
 */
export async function generateDownloadLink(fileKey: string, expiresInSeconds = 3600, disposition: "attachment" | "inline" = "attachment") {
  if (!fileKey) return null;
  
  try {
    const s3Client = getClient();
    const command = new GetObjectCommand({
      Bucket: getBucketName(),
      Key: fileKey,
      ResponseContentDisposition: disposition,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error("Error generating download link:", error);
    return null;
  }
}

/**
 * Generates a temporary (signed) URL for UPLOADING a file directly from the browser.
 */
export async function generateUploadLink(fileKey: string, contentType: string, expiresInSeconds = 3600) {
  try {
    const s3Client = getClient();
    const command = new PutObjectCommand({
      Bucket: getBucketName(),
      Key: fileKey,
      ContentType: contentType,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    // This will now catch "Config missing" errors too
    console.error("Error generating upload link:", error);
    return null;
  }
}
