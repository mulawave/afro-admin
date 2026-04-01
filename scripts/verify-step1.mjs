import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/app/layout.jsx",
  "src/app/page.jsx",
  "src/app/(admin)/layout.jsx",
  "src/app/(auth)/login/page.jsx",
  "src/components/layout/Sidebar.jsx",
  "src/components/layout/Header.jsx",
  "src/lib/useAuthGuard.js",
  "src/lib/api.js",
  "src/app/(admin)/dashboard/page.jsx",
  "src/app/(admin)/users/page.jsx",
  "src/app/(admin)/channels/page.jsx",
  "src/app/(admin)/gifts/page.jsx",
  "src/app/(admin)/ledger/page.jsx",
  "src/app/(admin)/wallets/page.jsx",
  "src/app/(admin)/settings/page.jsx",
  "src/app/(admin)/blockchain/page.jsx",
  "src/app/(admin)/economy/page.jsx",
  "src/app/(admin)/audit/page.jsx"
];

for (const file of requiredFiles) {
  await access(path.join(root, file));
}

const homePage = await readFile(path.join(root, "src/app/page.jsx"), "utf8");
if (!homePage.includes("redirect(\"/dashboard\")")) {
  throw new Error("Root page must redirect to /dashboard.");
}

const guard = await readFile(path.join(root, "src/lib/useAuthGuard.js"), "utf8");
if (!guard.includes("localStorage.getItem(\"admin_token\")")) {
  throw new Error("Auth guard must check admin_token.");
}
if (!guard.includes("router.push(\"/login\")")) {
  throw new Error("Auth guard must redirect to /login when no token.");
}

const adminLayout = await readFile(path.join(root, "src/app/(admin)/layout.jsx"), "utf8");
if (!adminLayout.includes("useAuthGuard()")) {
  throw new Error("Admin layout must enforce useAuthGuard.");
}

const sidebar = await readFile(path.join(root, "src/components/layout/Sidebar.jsx"), "utf8");
for (const route of ["/dashboard", "/users", "/channels", "/gifts", "/wallets", "/ledger", "/economy", "/blockchain", "/settings", "/audit"]) {
  if (!sidebar.includes(route)) {
    throw new Error(`Sidebar is missing route ${route}`);
  }
}

console.log("Step 1 verification passed: all required routing/auth shell files and invariants are present.");
