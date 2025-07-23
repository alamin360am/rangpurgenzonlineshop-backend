import {User} from "../models/user.model.js";
import bcrypt from 'bcryptjs'
import { generateTokenAndSetCookie } from "../utils/jwt.js";

export const signUp = async(req, res) => {
    const {name, email, phone, password} = req.body;

    try {

        if (!email && !phone) {
            return res.status(400).json({ message: "Email or Phone is required" });
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