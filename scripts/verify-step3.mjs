/**
 * Step 3 Verification: Users + Wallet + Ledger
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "..");
let pass = 0;
let fail = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}`);
    fail++;
  }
}

function readSrc(rel) {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

console.log("\n🔍 Step 3 Verification: Users + Wallet + Ledger\n");

// 1. File Structure
console.log("── File Structure ──");
const files = [
  "src/app/(admin)/users/page.jsx",
  "src/app/(admin)/wallets/page.jsx",
  "src/app/(admin)/ledger/page.jsx",
  "src/components/users/UserDrawer.jsx",
  "src/components/users/WalletCard.jsx",
  "src/components/users/LedgerTable.jsx",
  "src/components/ui/Drawer.jsx",
  "src/components/ui/DataTable.jsx",
  "src/components/ui/ConfirmDialog.jsx",
  "src/components/ui/StatusBadge.jsx",
];
files.forEach((f) => check(`${f} exists`, existsSync(resolve(ROOT, f))));

// 2. Users Page
console.log("\n── Users Page ──");
const usersPage = readSrc("src/app/(admin)/users/page.jsx");
if (usersPage) {
  check("is client component", usersPage.includes('"use client"'));
  check("imports DataTable", usersPage.includes("DataTable"));
  check("imports StatusBadge", usersPage.includes("StatusBadge"));
  check("imports UserDrawer", usersPage.includes("UserDrawer"));
  check("fetches from /admin/users", usersPage.includes("/admin/users"));
  check("has search filter", usersPage.includes("search") && usersPage.includes("filter"));
  check("has loading state", usersPage.includes("loading"));
  check("has error state with retry", usersPage.includes("error") && usersPage.includes("Retry"));
  check("user count displayed", usersPage.includes("filtered.length"));
} else {
  check("users page readable", false);
}

// 3. UserDrawer
console.log("\n── UserDrawer ──");
const drawer = readSrc("src/components/users/UserDrawer.jsx");
if (drawer) {
  check("imports Drawer primitives", drawer.includes("@/components/ui/Drawer"));
  check("imports ConfirmDialog", drawer.includes("ConfirmDialog"));
  check("imports WalletCard", drawer.includes("WalletCard"));
  check("imports LedgerTable", drawer.includes("LedgerTable"));
  check("fetches wallet data", drawer.includes("/admin/wallet/"));
  check("fetches ledger data", drawer.includes("/admin/ledger/"));
  check("suspend action with confirm", drawer.includes("Suspend") && drawer.includes("confirm"));
  check("delete action with confirm", drawer.includes("Delete") && drawer.includes("confirm"));
  check("reactivate action", drawer.includes("Reactivate") || drawer.includes("reactivate"));
  check("shows user email and UID", drawer.includes("email") && drawer.includes("uid"));
  check("shows user role and status", drawer.includes("role") && drawer.includes("status"));
} else {
  check("UserDrawer readable", false);
}

// 4. WalletCard
console.log("\n── WalletCard ──");
const walletCard = readSrc("src/components/users/WalletCard.jsx");
if (walletCard) {
  check("shows NGN balance", walletCard.includes("ngn_balance"));
  check("shows vPT units", walletCard.includes("vpt_units"));
  check("has amount input", walletCard.includes("amount") && walletCard.includes("input"));
  check("has currency selector", walletCard.includes("currency") && walletCard.includes("select"));
  check("add button", walletCard.includes("Add"));
  check("remove button", walletCard.includes("Remove"));
  check("calls /admin/wallet/adjust", walletCard.includes("/admin/wallet/adjust"));
  check("confirm before adjustment", walletCard.includes("ConfirmDialog") || walletCard.includes("confirm"));
  check("prevents negative balance", walletCard.includes("Cannot remove more") || walletCard.includes("negative"));
  check("formats with toLocaleString", walletCard.includes("toLocaleString"));
} else {
  check("WalletCard readable", false);
}

// 5. LedgerTable
console.log("\n── LedgerTable ──");
const ledgerTable = readSrc("src/components/users/LedgerTable.jsx");
if (ledgerTable) {
  check("exports default LedgerTable", ledgerTable.includes("export default function LedgerTable"));
  check("shows type column", ledgerTable.includes("type") && ledgerTable.includes("Type"));
  check("shows amount column", ledgerTable.includes("amount") && ledgerTable.includes("Amount"));
  check("shows currency column", ledgerTable.includes("currency") && ledgerTable.includes("Currency"));
  check("shows date column", ledgerTable.includes("created_at") && ledgerTable.includes("Date"));
  check("has type filter", ledgerTable.includes("filter"));
  check("supports showUser prop", ledgerTable.includes("showUser"));
  check("formats amounts", ledgerTable.includes("toLocaleString") || ledgerTable.includes("formatAmount"));
  check("empty state", ledgerTable.includes("No ledger entries"));
} else {
  check("LedgerTable readable", false);
}

// 6. Shared UI
console.log("\n── Shared UI Primitives ──");
const drawerUI = readSrc("src/components/ui/Drawer.jsx");
const dataTable = readSrc("src/components/ui/DataTable.jsx");
const confirmDialog = readSrc("src/components/ui/ConfirmDialog.jsx");
const statusBadge = readSrc("src/components/ui/StatusBadge.jsx");

check("Drawer has overlay", drawerUI && drawerUI.includes("overlay") || drawerUI && drawerUI.includes("bg-black"));
check("Drawer supports Escape key", drawerUI && drawerUI.includes("Escape"));
check("DataTable handles empty state", dataTable && dataTable.includes("emptyMessage"));
check("DataTable supports render column", dataTable && dataTable.includes("col.render"));
check("ConfirmDialog has cancel/confirm", confirmDialog && confirmDialog.includes("Cancel") && confirmDialog.includes("Confirm"));
check("ConfirmDialog supports destructive", confirmDialog && confirmDialog.includes("destructive"));
check("StatusBadge maps status to colors", statusBadge && statusBadge.includes("active") && statusBadge.includes("suspended"));

// 7. Wallets Page
console.log("\n── Wallets Page ──");
const walletsPage = readSrc("src/app/(admin)/wallets/page.jsx");
if (walletsPage) {
  check("is client component", walletsPage.includes('"use client"'));
  check("fetches from /admin/wallets", walletsPage.includes("/admin/wallets"));
  check("uses DataTable", walletsPage.includes("DataTable"));
  check("shows NGN + vPT columns", walletsPage.includes("ngn_balance") && walletsPage.includes("vpt_units"));
  check("has search", walletsPage.includes("search"));
} else {
  check("wallets page readable", false);
}

// 8. Global Ledger Page
console.log("\n── Global Ledger Page ──");
const ledgerPage = readSrc("src/app/(admin)/ledger/page.jsx");
if (ledgerPage) {
  check("is client component", ledgerPage.includes('"use client"'));
  check("fetches from /admin/ledger", ledgerPage.includes("/admin/ledger"));
  check("uses LedgerTable with showUser", ledgerPage.includes("LedgerTable") && ledgerPage.includes("showUser"));
  check("has loading state", ledgerPage.includes("loading"));
  check("has error state", ledgerPage.includes("error"));
} else {
  check("ledger page readable", false);
}

// Summary
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("❌ STEP 3 VERIFICATION FAILED\n");
  process.exit(1);
} else {
  console.log("✅ STEP 3 VERIFICATION PASSED\n");
  process.exit(0);
}
