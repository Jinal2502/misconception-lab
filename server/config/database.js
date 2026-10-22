import dotenv from "dotenv";
import mongoose from "mongoose";

export async function connectToDatabase(envPath) {
  dotenv.config({ path: envPath });
  const { MONGODB_URI: mongoUri } = process.env;

  if (!mongoUri) {
    console.warn(
      "MongoDB URI is not configured. Add MONGODB_URI to the root .env file; the API will remain available without a database connection.",
    );
    return;
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully.");
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost; the API remains available.");
  });
  mongoose.connection.on("error", (error) => {
    console.error(`MongoDB connection error (${error.name}). Check MONGODB_URI and Atlas network access.`);
  });

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    console.error(
      `Could not connect to MongoDB (${error.name}). Check MONGODB_URI and Atlas network access.`,
    );
  }
}
