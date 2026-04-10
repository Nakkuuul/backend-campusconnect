import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let cached = global._mongoConn || null;

export const connectDB = async () => {
  if (cached) return cached;

  try {
    const conn = await mongoose.connect(env.mongoUri);
    cached = conn;
    global._mongoConn = conn;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};