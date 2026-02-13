import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (options) => {
  try {
    return await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error('❌ Помилка SMTP (sendMail.js):', error.message);
    return null;
  }
};
