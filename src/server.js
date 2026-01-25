import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import { errors } from 'celebrate';
import 'dotenv/config';

import notesRouter from './routes/notesRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { connectMongoDB } from './db/connectMongoDB.js';

const PORT = Number(process.env.PORT) || 3000;

export const startServer = async () => {
  const app = express();

  try {
    await connectMongoDB();
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.use(cors());
  app.use(express.json());
  app.use('/notes', notesRouter);

  app.use(notFoundHandler);
  app.use(errors());
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
