import { Router } from 'express';

import * as groupsController from '../controllers/groupsController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  addExpenseSchema,
  createGroupSchema,
  joinGroupSchema,
  settleSchema,
} from '../schemas/groups';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.post('/', validateBody(createGroupSchema), (req, res) => {
  void groupsController.createGroup(req, res);
});
groupsRouter.get('/', (req, res) => {
  void groupsController.listGroups(req, res);
});
groupsRouter.post('/join', validateBody(joinGroupSchema), (req, res) => {
  void groupsController.joinGroup(req, res);
});
groupsRouter.get('/:id', (req, res) => {
  void groupsController.getGroup(req, res);
});
groupsRouter.post('/:id/expenses', validateBody(addExpenseSchema), (req, res) => {
  void groupsController.addExpense(req, res);
});
groupsRouter.get('/:id/balances', (req, res) => {
  void groupsController.getBalances(req, res);
});
groupsRouter.post('/:id/settle', validateBody(settleSchema), (req, res) => {
  void groupsController.settle(req, res);
});
