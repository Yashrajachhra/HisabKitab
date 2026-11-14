import { Router } from 'express';

import * as authController from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), (req, res) => {
  void authController.register(req, res);
});
authRouter.post('/login', validateBody(loginSchema), (req, res) => {
  void authController.login(req, res);
});
authRouter.post('/refresh', validateBody(refreshSchema), (req, res) => {
  void authController.refresh(req, res);
});
authRouter.get('/me', requireAuth, (req, res) => {
  void authController.me(req, res);
});
