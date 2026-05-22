/**
 * Bootstrap — loads .env.local BEFORE any other modules are imported.
 *
 * ESM imports are hoisted, so dotenv must run in a separate file
 * that dynamically imports the worker after env vars are loaded.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerRoot = path.resolve(__dirname, "..");

// Load .env.local (must happen before any dynamic import)
dotenv.config({ path: path.join(workerRoot, ".env.local") });
dotenv.config({ path: path.join(workerRoot, ".env") });

// Now dynamically import the worker (env vars are available)
const { startWorker } = await import("./worker.js");
startWorker();
