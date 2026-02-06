import { generateDownloadLink, generateUploadLink } from "../server/s3-storage";
import { resolve } from "path";

// Load .env.local using Node.js native feature (Node 20+)
try {
  process.loadEnvFile(resolve(process.cwd(), ".env.local"));
} catch (e) {
  console.warn("⚠️ .env.local not found or failed to load. Ensure env vars are set.");
}

async function testStorage() {
  console.log("🧪 Testing ArvanCloud Storage...");
  console.log("--------------------------------");
  console.log("Bucket:", process.env.ARVAN_BUCKET_NAME);
  console.log("Endpoint:", process.env.ARVAN_ENDPOINT);
  
  const testKey = "test-file.txt";

  // 1. Generate Upload Link
  console.log("\n1️⃣ Generating Upload Link (for Admin)...");
  const uploadUrl = await generateUploadLink(testKey, "text/plain");
  if (uploadUrl) {
      console.log("✅ Upload URL Generated:", uploadUrl.substring(0, 50) + "...");
  } else {
      console.error("❌ Failed to generate Upload URL. Check credentials.");
  }

  // 2. Generate Download Link
  console.log("\n2️⃣ Generating Download Link (for User)...");
  const downloadUrl = await generateDownloadLink(testKey);
  if (downloadUrl) {
      console.log("✅ Download URL Generated:", downloadUrl.substring(0, 50) + "...");
      console.log("\n⚠️ To verify real access, uploading a file named 'test-file.txt' to your bucket is required.");
  } else {
      console.error("❌ Failed to generate Download URL.");
  }
}

testStorage();
