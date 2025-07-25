import nodemailer from "nodemailer";
import { getVerificationEmailHtml } from "./emailTemplate.js";

export const sendVerificationEmail = async (name, to, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Verify OTP" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code",
    html: getVerificationEmailHtml(code, name)
  };

  await transporter.sendMail(mailOptions);
};
 