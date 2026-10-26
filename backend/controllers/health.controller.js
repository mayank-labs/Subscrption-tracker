import prisma from '../database/prisma.js';

export const health = (req, res) => {
  res.json({ success: true, status: 'ok' });
};

export const readiness = async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, status: 'ready' });
  } catch (error) {
    next(error);
  }
};
