import type { VercelRequest, VercelResponse } from '@vercel/node';

// Step 1: Simple test - no external dependencies
export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';
  
  // Test endpoint
  if (url.includes('/api/ping') || url.includes('/api/test')) {
    return res.status(200).json({
      status: "alive",
      version: "6.0.0-test",
      timestamp: new Date().toISOString(),
      path: url,
      env: {
        hasDb: !!process.env.DATABASE_URL,
        hasSmsKey: !!process.env.SMS_IR_API_KEY,
        hasTemplateId: !!process.env.SMS_IR_TEMPLATE_ID,
        hasSupabase: !!process.env.SUPABASE_URL
      }
    });
  }
  
  // For all other requests, return a message
  return res.status(200).json({
    message: "API is working but routes are not loaded yet",
    requestedPath: url,
    hint: "This is a test version to verify Vercel is working"
  });
}
