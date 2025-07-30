import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, template) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Rangpur Gen-Z Online Shop" <${process.env.EMAIL_USER}>`,
    to,
    subject: subject,
    html: template
  };

  await transporter.sendMail(mailOptions);
};
 