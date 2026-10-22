import "./config/loadEnv.js";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(serverDirectory, "../.env");
const apiPortPath = path.resolve(serverDirectory, ".api-port");

const preferredPort = Number(process.env.PORT) || 5000;
let activePort = preferredPort;
const server = createServer(app);

server.on("listening", () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    console.error("Unable to determine the API server's listening port.");
    return;
  }

  activePort = address.port;
  writeFileSync(apiPortPath, String(activePort));
  console.log(`Misconception Lab API listening at http://localhost:${activePort}`);
  if (activePort !== preferredPort) {
    console.warn(`Port ${preferredPort} is unavailable; set PORT=${activePort} in the root .env to make this port explicit.`);
  }
  connectToDatabase(envPath);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && activePort < 65535) {
    console.warn(`Port ${activePort} is already in use; trying port ${activePort + 1}.`);
    activePort += 1;
    server.listen(activePort);
    return;
  }

  console.error(`Unable to start the API server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(activePort);

function removePortFile() {
  if (existsSync(apiPortPath) && readFileSync(apiPortPath, "utf8").trim() === String(activePort)) {
    unlinkSync(apiPortPath);
  }
}

function shutdown(signal) {
  console.log(`${signal} received; shutting down API server…`);
  server.close(async () => {
    removePortFile();
    await mongoose.disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
