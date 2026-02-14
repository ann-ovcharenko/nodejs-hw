import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errors } from 'celebrate';
import 'dotenv/config';
import notesRouter from './routes/notesRoutes.js';
import authRouter from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { logger } from './middleware/logger.js';
import { connectMongoDB } from './db/connectMongoDB.js';
import userRouter from './routes/userRoutes.js';

const PORT = Number(process.env.PORT) || 3000;

export const startServer = async () => {
  const app = express();

  app.use(logger);
  app.use(cors({ credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(authRouter);
  app.use(notesRouter);
  app.use(userRouter);
  app.use(notFoundHandler);
  app.use(errors());
  app.use(errorHandler);

  try {
    await connectMongoDB();
    console.log('Database connection successful');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

startServer();
