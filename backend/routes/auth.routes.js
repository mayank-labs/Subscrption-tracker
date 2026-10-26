import { Router } from "express";
import { refresh, signUp, signIn, signOut } from "../controllers/auth.controller.js";
import {validateBody} from "../middleware/validate.middleware.js";
import { signUpSchema, signInSchema } from "../validation/auth.validation.js";
const authRouter = Router();

authRouter.post('/sign-up', validateBody(signUpSchema), signUp);
authRouter.post('/sign-in', validateBody(signInSchema), signIn);
authRouter.post('/refresh', refresh);
authRouter.post('/sign-out', signOut);

export default authRouter;
