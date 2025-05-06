import mongoose from "mongoose";

// A variable to store the connection status
let isConnected = false;

export const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    // For a real project, you'd use environment variables for the MongoDB URI
    // In this demo, we'll use a mock connection
    await mongoose.connect("mongodb://localhost:27017/parking-share");
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// For development purposes only
export const disconnectFromDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}; 