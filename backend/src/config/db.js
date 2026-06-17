import mongoose from 'mongoose';
import { env } from './env.js';

// Cache the connection promise so warm serverless invocations reuse a single
// connection instead of opening a new one each time (Atlas free tier caps
// concurrent connections). On failure we clear the cache so the next
// invocation can retry, and we let the error surface instead of process.exit
// (which is wrong in a serverless function).
let promise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!promise) {
    mongoose.set('strictQuery', true);
    promise = mongoose
      .connect(env.mongoUri)
      .then((m) => {
        console.log(`✓ MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m.connection;
      })
      .catch((error) => {
        promise = null;
        console.error(`✗ MongoDB connection failed: ${error.message}`);
        throw error;
      });
  }
  return promise;
};
