import express from 'express'
import { signUp } from '../controller/user.controller.js';

const userRouter = express.Router();

userRouter.post('/signup', signUp)

export default userRouter;