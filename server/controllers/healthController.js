import mongoose from "mongoose";

const connectionStates = ["disconnected", "connected", "connecting", "disconnecting"];

export function getHealth(_request, response) {
  const connectionState = connectionStates[mongoose.connection.readyState] ?? "unknown";
  const connected = mongoose.connection.readyState === 1;

  response.status(200).json({
    status: "ok",
    message: "Misconception Lab API is running.",
    mongodb: {
      connected,
      state: connectionState,
    },
  });
}
