import type { IncomingMessage, ServerResponse } from 'http';

import { connectMongo } from '../src/db/connect';
import { app } from '../src/index';

let connectPromise: Promise<void> | null = null;

/** Reuse a single MongoDB connection promise across warm Vercel invocations. */
async function ensureDb(): Promise<void> {
  if (!connectPromise) {
    connectPromise = connectMongo().catch((err) => {
      connectPromise = null;
      throw err;
    });
  }
  return connectPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await ensureDb();
  } catch {
    // Allow health/root routes to respond even if MongoDB connection fails.
  }

  await new Promise<void>((resolve) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
  });
}
