import express from 'express'
import { changePassword, forgotPassword, logIn, logOut, resetPassword, signUp, verifyOtp } from '../controller/user.controller.js';
import { protect } from '../middlewares/authMiddleware.js';

const userRouter = express.Router();

userRouter.post('/signup', signUp); // for create new user
userRouter.post('/signin', logIn); // for sign in user
userRouter.post('/verify', verifyOtp); // for verify email
userRouter.post('/logout', logOut); // for log out
userRouter.post('/change-password', protect, changePassword); // if user want to change password, should provide previous password for security.
userRouter.post('/forgot-password', forgotPassword); // if forget password an otp is send to email
userRouter.post('/reset-password', resetPassword); // after verify otp user can reset password

export default userRouter;

// TODO: Limit request for log in or sign up
// import rateLimit from "express-rate-limit"

// export const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many login attempts. Please try again later."
// });
