import mongoose from 'mongoose';

// Turn off buffered commands globally so queries do not hang when disconnected
mongoose.set('bufferCommands', false);

let isConnected = false;

export function isDbReady(): boolean {
  return isConnected;
}

export async function connectDB() {
  if (isConnected) return true;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ WARNING: MONGO_URI is missing from your environment variables!');
    console.warn('The server will run in local mock memory fallback mode until MongoDB Atlas is configured in Settings.');
    return false;
  }

  try {
    // Set low timeout values (e.g. 2000ms) to fail fast on blocked/non-whitelisted connections
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`🔌 MongoDB Connected: ${conn.connection.host}/${conn.connection.db?.databaseName || 'arisan'}`);
    return true;
  } catch (error) {
    console.warn('⚠️ Connection to MongoDB Atlas failed/timed out. Reverting to server-side In-Memory Fallback mode.');
    console.error('❌ Mongoose connection details:', error);
    isConnected = false;
    return false;
  }
}

