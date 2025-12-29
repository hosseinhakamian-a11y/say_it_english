import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // For now, return 401 - we'll implement proper auth later
    res.status(401).json({ error: 'Not authenticated' });
}
