import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    role: { type: String, default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationTokenExpiresAt: Date,
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
