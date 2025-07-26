import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import { connectDB } from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';

const app = express();

dotenv.config();
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // আপনি যেখানে frontend host করছেন
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.use("/api/user", userRouter)

app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
