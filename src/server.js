import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import dotenv from 'dotenv';

dotenv.config();

import { connectMongoDB } from './db/connectMongoDB.js';

export const setupServer = async () => {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  await connectMongoDB();

  app.use(cors());
  app.use(express.json());
  app.use(pino({ transport: { target: 'pino-pretty' } }));

  app.get('/notes', (req, res) => {
    res.status(200).json({ message: 'Retrieved all notes' });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
};

setupServer();
