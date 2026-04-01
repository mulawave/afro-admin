import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

await access(path.join(root, "src/app/layout.jsx"));
await access(path.join(root, "src/app/page.jsx"));
await access(path.join(root, "src/app/(admin)/layout.jsx"));
await access(path.join(root, "src/app/(auth)/login/page.jsx"));

const requiredDirs = [
  "src/app/(admin)/dashboard",
  "src/app/(admin)/users",
  "src/app/(admin)/channels",
  "src/app/(admin)/gifts",
  "src/app/(admin)/ledger",
  "src/app/(admin)/wallets",
  "src/app/(admin)/settings",
  "src/app/(admin)/blockchain",
  "src/app/(admin)/economy",
  "src/app/(admin)/audit"
];

for (const dir of requiredDirs) {
  await access(path.join(root, dir, "page.jsx"));
}

const sidebar = await readFile(path.join(root, "src/components/layout/Sidebar.jsx"), "utf8");
if (!sidebar.includes("AfroVision Admin")) {
  throw new Error("Sidebar branding missing.");
}

const guard = await readFile(path.join(root, "src/lib/useAuthGuard.js"), "utf8");
if (!guard.includes("admin_token")) {
  throw new Error("Auth guard token key mismatch.");
}

const files = await readdir(path.join(root, "src/app/(admin)"));
if (!files.includes("layout.jsx")) {
  throw new Error("Admin layout missing.");
}

console.log("Step 1 build verification passed: routing graph and protected shell structure are complete.");
