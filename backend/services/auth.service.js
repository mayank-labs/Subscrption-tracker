import bcrypt from 'bcryptjs';
import prisma from '../database/prisma.js';
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from '../utils/auth.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
};

export const registerUser = async ({ name, email, password }) => {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.trim().toLowerCase(), passwordHash },
    select: publicUserSelect,
  });
  return issueTokens(user);
};

export const authenticateUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
  return issueTokens(user);
};

export const issueTokens = async (user) => {
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { accessToken: createAccessToken(user), refreshToken, user };
};

export const rotateRefreshToken = async (token) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: publicUserSelect } },
  });
  if (!stored || stored.expiresAt <= new Date()) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(stored.user);
};

export const revokeRefreshToken = async (token) => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
};
