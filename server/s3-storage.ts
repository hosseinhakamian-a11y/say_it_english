import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Helper to ensure env vars are present
function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.warn(`Missing env var: ${key}`);
    return "";
  }
  return val;
}

// Initialize S3 Client (ArvanCloud / MinIO / AWS)
// For ArvanCloud: 
// Endpoint: https://s3.ir-tbz-sh1.arvanstorage.ir (example)
const s3Client = new S3Client({
  region: "default",
  endpoint: process.env.ARVAN_ENDPOINT || "https://s3.ir-tbz-sh1.arvanstorage.ir",
  credentials: {
    accessKeyId: process.env.ARVAN_ACCESS_KEY || "",
    secretAccessKey: process.env.ARVAN_SECRET_KEY || "",
  },
  forcePathStyle: true, // Required for many S3-compatible services
});

const BUCKET_NAME = process.env.ARVAN_BUCKET_NAME || "say-it-english-content";

/**
 * Generates a temporary (signed) URL for downloading a file.
 * The browser can use this URL to download directly from ArvanCloud.
 * @param fileKey The key (filename) of the object in the bucket
 * @param expiresInSeconds Validity duration (default 1 hour)
 */
export async function generateDownloadLink(fileKey: string, expiresInSeconds = 3600, disposition: "attachment" | "inline" = "attachment") {
  if (!fileKey) return null;
  
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ResponseContentDisposition: disposition, // Support streaming (inline) or download (attachment)
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    console.error("Error generating download link:", error);
    return null;
  }
}

/**
 * Generates a temporary (signed) URL for UPLOADING a file directly from the browser.
 * Useful for the admin panel to upload large files without hitting Vercel limits.
 */
export async function generateUploadLink(fileKey: string, contentType: string, expiresInSeconds = 3600) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      return url;
    } catch (error) {
      console.error("Error generating upload link:", error);
      return null;
    }
  }
