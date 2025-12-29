import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        message: "Say It English API",
        endpoints: ["/api/register", "/api/login", "/api/logout", "/api/user", "/api/content"]
    });
}
