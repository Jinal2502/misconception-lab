import { defineConfig } from "vite";
import { request } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiPortFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../server/.api-port",
);

const apiProxy = {
  name: "misconception-lab-api-proxy",
  configureServer(server) {
    server.middlewares.use((incomingRequest, response, next) => {
      if (!incomingRequest.url?.startsWith("/api/")) return next();

      const configuredPort = existsSync(apiPortFile)
        ? Number(readFileSync(apiPortFile, "utf8").trim())
        : 5000;
      const port = Number.isInteger(configuredPort) && configuredPort > 0
        ? configuredPort
        : 5000;
      const proxyRequest = request(
        {
          hostname: "localhost",
          port,
          path: incomingRequest.url,
          method: incomingRequest.method,
          headers: { ...incomingRequest.headers, host: `localhost:${port}` },
        },
        (proxyResponse) => {
          response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
          proxyResponse.pipe(response);
        },
      );

      proxyRequest.on("error", (error) => {
        console.error(`API proxy error: ${error.message}`);
        if (!response.headersSent) {
          response.statusCode = 502;
          response.end("API server is unavailable.");
        }
      });

      incomingRequest.pipe(proxyRequest);
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxy],
});
