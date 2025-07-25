import {User} from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { generateTokenAndSetCookie } from "../utils/jwt.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

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
        if (existingUser) return res.status(400).json({ msg: "User already exists" });

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
        await sendVerificationEmail(name, email, verificationToken);

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