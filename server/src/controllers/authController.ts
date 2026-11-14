import type { Response } from 'express';

import { User, hashPassword } from '../models/User';
import type { AuthedRequest } from '../middleware/auth';
import {
  compareTokenHash,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';

function publicUser(user: { _id: { toString: () => string }; email: string; displayName: string }) {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
  };
}

export async function register(req: AuthedRequest, res: Response): Promise<void> {
  const { email, password, displayName } = req.body as {
    email: string;
    password: string;
    displayName: string;
  };

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    displayName,
  });

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
  });
  const refreshToken = signRefreshToken(user._id.toString());
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  res.status(201).json({
    user: publicUser(user),
    accessToken,
    refreshToken,
  });
}

export async function login(req: AuthedRequest, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.verifyPassword(password))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
  });
  const refreshToken = signRefreshToken(user._id.toString());
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  res.json({
    user: publicUser(user),
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: AuthedRequest, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken: string };

  try {
    const { sub } = verifyRefreshToken(refreshToken);
    const user = await User.findById(sub);
    if (!user || !(await compareTokenHash(refreshToken, user.refreshTokenHash ?? null))) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const accessToken = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
    });
    const nextRefresh = signRefreshToken(user._id.toString());
    user.refreshTokenHash = await hashToken(nextRefresh);
    await user.save();

    res.json({ accessToken, refreshToken: nextRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function me(req: AuthedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      displayName: req.user.displayName,
    },
  });
}
