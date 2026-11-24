import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = fileURLToPath(new URL("../backend/", import.meta.url));
const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const windows = process.platform === "win32";
const python = fileURLToPath(new URL(
  windows ? "../backend/.venv/Scripts/python.exe" : "../backend/.venv/bin/python",
  import.meta.url,
));
const children = [];
let stopping = false;

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;

  for (const child of children) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) continue;
    if (windows) {
      const result = spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
        windowsHide: true,
      });
      if (result.status !== 0) child.kill();
    } else {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    }
  }
}

function start(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);

  for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    createInterface({ input: stream }).on("line", (line) => output.write(`[${name}] ${line}\n`));
  }

  child.on("error", (error) => {
    console.error(`[${name}] Could not start: ${error.message}`);
    stop(1);
  });
  child.on("close", (code, signal) => {
    if (stopping) return;
    console.error(`[${name}] Stopped unexpectedly (${signal ?? `exit code ${code}`}).`);
    stop(code || 1);
  });
}

if (!existsSync(vite)) {
  console.error("[Frontend] Run npm install from the project root first.");
  process.exitCode = 1;
} else if (!existsSync(python)) {
  console.error("[API] Set up backend/.venv and install the Python dependencies. See README.md.");
  process.exitCode = 1;
} else {
  process.on("SIGINT", () => stop(130));
  process.on("SIGTERM", () => stop(143));
  process.on("SIGBREAK", () => stop(130));

  start("API", python, ["-B", "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], backend);
  start("Frontend", process.execPath, [vite, "--host", "127.0.0.1", "--port", "5173", "--strictPort"], root);
}
