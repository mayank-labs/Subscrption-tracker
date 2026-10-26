import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, JWT_ACCESS_SECRET } from '../config/env.js';

export const createAccessToken = (user) =>
  jwt.sign({ userId: user.id, email: user.email }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });

export const verifyAccessToken = (token) => jwt.verify(token, JWT_ACCESS_SECRET);

export const createRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const refreshTokenExpiry = () =>
  new Date(Date.now() + JWT_REFRESH_EXPIRES_IN * 1000);

export const REFRESH_COOKIE = 'refreshToken';
