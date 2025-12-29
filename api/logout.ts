import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // In stateless JWT approach, logout is handled client-side
    res.status(200).json({ message: 'خروج موفق' });
}
