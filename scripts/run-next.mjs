import { spawn } from "child_process";
import { resolve } from "path";

const [, , mode, ...args] = process.argv;

if (!mode) {
  console.error("Missing Next.js mode. Use: node scripts/run-next.mjs <dev|build|start> [...args]");
  process.exit(1);
}

const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const env = {
  ...process.env,
  NEXT_PUBLIC_API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://afrovision-backend-134538542038.us-central1.run.app",
};

const child = spawn(process.execPath, [nextBin, mode, ...args], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});