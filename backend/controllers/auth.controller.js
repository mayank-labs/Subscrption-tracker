import { registerUser, authenticateUser, revokeRefreshToken, rotateRefreshToken } from '../services/auth.service.js';
import { REFRESH_COOKIE } from '../utils/auth.js';

export const signUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { accessToken, refreshToken, user } = await registerUser({ name, email, password });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800000,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { accessToken, user },
    });
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authenticateUser({ email, password });
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800000,
    });
    res.status(200).json({
      success: true,
      message: 'User signed in successfully',
      data: { accessToken, user },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    if (!req.cookies.refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      throw error;
    }
    const { accessToken, refreshToken, user } = await rotateRefreshToken(req.cookies.refreshToken);
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 604800000,
    });
    res.json({ success: true, data: { accessToken, user } });
  } catch (error) {
    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    await revokeRefreshToken(req.cookies.refreshToken);
    res.clearCookie(REFRESH_COOKIE);
    res.status(200).json({ success: true, message: 'User signed out successfully' });
  } catch (error) {
    next(error);
  }
};
