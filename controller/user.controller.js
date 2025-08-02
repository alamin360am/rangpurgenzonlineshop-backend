import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {User} from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../utils/jwt.js";
import {sendEmail} from '../utils/sendEmail.js'
import {getForgetPasswordEmailHtml, getVerificationEmailHtml} from '../utils/emailTemplate.js'

export const signUp = async(req, res) => {
    const {name, email, phone, password} = req.body;

    try {

        if (!email || !phone) {
            return res.status(400).json({ message: "Email and Phone is required" });
        }

        if(!name || !password) {
            return res.status(400).json({ message: "Name and Password is required" });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10)
        const verificationToken = Math.floor(100000 + Math.random()* 900000).toString();

        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            otp: verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000
        });

        // jwt
        generateTokenAndSetCookie(res, user._id);

        // Email sending
        await sendEmail(email, "Your verification code for sign in", getVerificationEmailHtml(verificationToken, name))

        await user.save();

        res.status(201).json({
            success: true,
            message: "user created successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        })

    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
}

export const logIn = async(req, res) => {    
    try {
        const { email, phone, emailOrPhone, password } = req.body;
        const identifier = emailOrPhone || email || phone;
        
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Email/Phone and password are required"
            });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phone: identifier }
            ]
        });

        if(!user) {
            return res.status(400).json({success: false, message: "Invalid credentials"})
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(400).json({success: false, message: "Invalid credentials"})
        }

        if (!user.verified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your account first"
            });
        }

        generateTokenAndSetCookie(res, user._id);

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        })

    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
}

export const verifyOtp = async(req, res) => {
    const {email, code} = req.body;
    
    try {        
        if(!email || !code) {
            return res.status(400).json({success: false, message: "Email and verification code is required"})
        }
        
        const user = await User.findOne({email});        

        if(!user) {
            return res.status(400).json({success: false, message: "User Not found"})
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: "User already verified" });
        }

        if (!user.otp || !user.verificationTokenExpiresAt) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request again." });
        }

        if (user.otp !== code) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.verificationTokenExpiresAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        user.verified = true;
        user.otp = null;
        user.verificationTokenExpiresAt = null;

        await user.save();

        res.status(200).json({success: true, message: "Email verification successful"})

    } catch (error) {
        res.status(500).json({success: false, message: "Server Error"})
    }
}

export const logOut = async(req, res) => {
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Logged out successfully"})
}

export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpire = Date.now() + 1000 * 60 * 10; // 10 minutes

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpire;
        await user.save();

        // Email link (frontend will build a reset page based on this token)
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        
        await sendEmail(email, "Password Reset Link", getForgetPasswordEmailHtml(resetLink, user.name));

        res.status(200).json({ success: true, message: 'Reset link sent to your email' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};