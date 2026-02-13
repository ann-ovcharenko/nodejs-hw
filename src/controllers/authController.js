import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw createHttpError(400, 'Email in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Notes App!',
        html: `<h1>Вітаємо, ${user.email}!</h1><p>Ви успішно зареєструвалися.</p>`,
      });
    } catch (mailError) {
      console.error('Email sending failed:', mailError.message);
    }

    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(201).json({
      status: 201,
      message: 'Successfully registered a user!',
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await Session.deleteOne({ userId: user._id });

    const session = await createSession(user._id);
    setSessionCookies(res, session);

    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in a user!',
      data: {
        accessToken: session.accessToken,
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    const session = await Session.findOne({
      _id: sessionId,
      refreshToken,
    });

    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    const isSessionTokenExpired =
      new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
      throw createHttpError(401, 'Session token expired');
    }

    await Session.deleteOne({ _id: sessionId });

    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    res.status(200).json({
      status: 200,
      message: 'Successfully refreshed a session!',
      data: {
        accessToken: newSession.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'reset-password-email.html',
    );
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    const html = template({
      name: user.username || user.email,
      link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset email',
        html,
      });
    } catch (error) {
      console.error(error);
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
      );
    }

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    let entries;
    try {
      entries = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw createHttpError(401, 'Token is expired or invalid');
    }

    const user = await User.findOne({
      _id: entries.sub,
      email: entries.email,
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne({ _id: user._id }, { password: hashedPassword });

    await Session.deleteMany({ userId: user._id });

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
