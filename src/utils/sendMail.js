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
  if (!options.to && !options.email) {
    throw new Error('Recipient email address is required');
  }

  return await transporter.sendMail({
    from: options.from || process.env.SMTP_FROM,
    to: options.to || options.email,
    subject: options.subject,
    html: options.html,
  });
};
