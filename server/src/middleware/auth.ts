import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken, type AccessClaims } from '../utils/tokens';

export type AuthedRequest = Request & { user?: AccessClaims };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  try {
    const token = header.slice('Bearer '.length).trim();
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
