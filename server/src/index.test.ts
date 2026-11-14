import request from 'supertest';

import { app } from './index';

describe('API health', () => {
  it('returns ok from /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, service: 'hisabkitab-api' });
  });
});
