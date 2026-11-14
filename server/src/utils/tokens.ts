import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export type AccessClaims = {
  sub: string;
  email: string;
  displayName: string;
};

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl } as jwt.SignOptions);
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, typ: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshTtl,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.jwtAccessSecret) as AccessClaims;
  return payload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as { sub: string; typ?: string };
  if (payload.typ !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return { sub: payload.sub };
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

export async function compareTokenHash(token: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(token, hash);
}

export function createInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}
