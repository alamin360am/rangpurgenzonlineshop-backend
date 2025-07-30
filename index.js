import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import { connectDB } from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';

const app = express();

dotenv.config();
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // frontend host url
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

app.use("/api/user", userRouter)

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect DB:", error.message);
    process.exit(1); // Force stop the app
  }
};

startServer();
