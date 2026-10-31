import prisma from '../database/prisma.js';
import { verifyAccessToken } from '../utils/auth.js';

const authorization = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (typeof header !== 'string' || header.slice(0, 7) !== 'Bearer ' || header.slice(7).includes(' ') || !header.slice(7)) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const decoded = verifyAccessToken(header.slice(7));
        if (!decoded || typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, email: true },
        });

        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        req.user = user;
        next();

    } catch (error) {
        req.log?.warn({ err: error }, 'Access token authorization failed');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};

export default authorization;