import mongoose from "mongoose";

/**
 * Connects to MongoDB.
 * - If MONGODB_URI is set (e.g. a MongoDB Atlas free-tier connection string),
 *   it is used directly.
 * - Otherwise, in development we spin up an in-memory MongoDB so the app runs
 *   with zero setup. (Data is not persisted across restarts in that mode.)
 */

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = global as unknown as { _mongoose?: Cached };

const cached: Cached =
  globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cached;

async function resolveUri(): Promise<string> {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to the environment.",
    );
  }

  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const g = global as unknown as { _mongoMem?: { getUri(): string } };
  if (!g._mongoMem) {
    g._mongoMem = await MongoMemoryServer.create();
    console.log("[db] Started in-memory MongoDB (dev fallback).");
  }
  return g._mongoMem.getUri();
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = resolveUri().then((uri) =>
      mongoose.connect(uri, { dbName: "snr_quotes" }),
    );
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
