import { Router } from "express";
import { getUser, getUsers } from "../controller/user.controller.js";
import authorization from "../middleware/auth.middleware.js";


const userRouter = Router();

userRouter.get('/', getUsers);
userRouter.get('/:id', authorization, getUser);
userRouter.post('/', (req, res) => res.send({ title: "CREATE  users" }));
userRouter.put('/:id', (req, res) => res.send({ title: "update user detail" }));
userRouter.delete('/:id', (req, res) => res.send({ title: "DELETE  users" }));

export default userRouter;