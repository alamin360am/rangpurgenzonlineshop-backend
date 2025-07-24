import express from 'express'
import { logIn, logOut, signUp, verifyOtp } from '../controller/user.controller.js';

const userRouter = express.Router();

userRouter.post('/signup', signUp);
userRouter.post('/signin', logIn);
userRouter.post('/verify', verifyOtp);
userRouter.post('/logout', logOut);

export default userRouter;