import { Router } from 'express';
import { getUser, getUsers } from '../controllers/user.controller.js';
import authorization from '../middleware/auth.middleware.js';

const userRouter = Router();

userRouter.get('/', authorization, getUsers);
userRouter.get('/:id', authorization, getUser);

export default userRouter;
