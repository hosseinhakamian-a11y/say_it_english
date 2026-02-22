
import { Router } from "express";
import { storage } from "../storage";
import { api } from "../../shared/routes";
import { AuthenticatedRequest, isAdmin } from "../utils/auth";

export const contentRouter = Router();

// Content List
contentRouter.get(api.content.list.path, async (req, res) => {
  const content = await storage.getContent();
  res.json(content);
});

// Content Detail
contentRouter.get("/api/content/:id", async (req, res) => {
  const item = await storage.getContentById(parseInt(req.params.id));
  if (!item) return res.status(404).send("Content not found");
  res.json(item);
});

// Create Content (Admin)
contentRouter.post(api.content.create.path, async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const content = await storage.createContent(req.body);
  res.status(201).json(content);
});

// Update Content (Admin)
contentRouter.patch("/api/content/:id", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  const updated = await storage.updateContent(parseInt(req.params.id), req.body);
  if (!updated) return res.status(404).send("Content not found");
  res.json(updated);
});

// Delete Content (Admin)
contentRouter.delete("/api/content/:id", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).send("Unauthorized");
  }
  await storage.deleteContent(parseInt(req.params.id));
  res.json({ success: true });
});

// Upload Link Generator (Admin)
contentRouter.get("/api/content/upload-link", async (req: AuthenticatedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).send("Unauthorized");
  
  const fileName = req.query.fileName as string;
  const contentType = req.query.contentType as string;
  
  if (!fileName || !contentType) {
    return res.status(400).send("fileName and contentType are required");
  }
  
  // Generate a unique key to prevent overwriting
  const fileKey = `uploads/${Date.now()}-${fileName}`;
  
  const { generateUploadLink } = await import("../s3-storage");
  const uploadUrl = await generateUploadLink(fileKey, contentType);
  
  if (!uploadUrl) {
    return res.status(500).send("Error generating upload link");
  }
  
  res.json({ uploadUrl, fileKey });
});

// Secure Download/Stream Endpoint
contentRouter.get("/api/download", async (req: AuthenticatedRequest, res) => {
  if (!req.isAuthenticated() || !req.user) return res.status(401).send("Unauthorized");
  
  const contentId = parseInt(req.query.id as string);
  if (isNaN(contentId)) return res.status(400).send("Invalid content ID");
  
  const item = await storage.getContentById(contentId);
  if (!item) return res.status(404).send("Content not found");
  
  // Check access for premium content
  if (item.isPremium && !isAdmin(req)) {
    const purchases = await storage.getUserPurchases(req.user.id);
    const hasPurchased = purchases.some(p => p.contentId === item.id);
    if (!hasPurchased) {
      return res.status(403).send("You must purchase this content to access it.");
    }
  }
  
  // Get fileKey from content record (S3/Arvan Object Key)
  const fileKey = item.fileKey || item.videoId || item.contentUrl;
  if (!fileKey) return res.status(400).send("No file associated with this content");
  
  // Generate signed URL from ArvanCloud S3
  const { generateDownloadLink } = await import("../s3-storage");
  const stream = req.query.stream === "true";
  const signedUrl = await generateDownloadLink(fileKey, 3600, stream ? "inline" : "attachment");
  
  if (!signedUrl) {
    return res.status(500).send("Error generating access link");
  }
  
  // Redirect user to the signed URL
  res.redirect(signedUrl);
});
