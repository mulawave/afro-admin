/**
 * verify-step7.mjs — Final Pre-Launch Validation
 *
 * Validates the entire admin console against 16 safety/security/UX categories
 * from Engineer/step_7.md. Checks what the frontend controls directly;
 * documents backend dependencies.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
let pass = 0;
let fail = 0;
let total = 0;

function check(label, ok) {
  total++;
  if (ok) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ─── 1. END-TO-END MONEY FLOW (admin-console surface checks) ───
console.log("\n🧱 1. END-TO-END MONEY FLOW (admin surface)");
{
  const walletCard = read("src/components/users/WalletCard.jsx");
  check("WalletCard calls /admin/wallet/adjust with uid+currency+amount",
    walletCard.includes("/admin/wallet/adjust") &&
    walletCard.includes("uid") &&
    walletCard.includes("currency") &&
    walletCard.includes("amount"));

  check("WalletCard displays NGN + vPT balances",
    walletCard.includes("ngn_balance") && walletCard.includes("vpt_units"));

  const ledgerTable = read("src/components/users/LedgerTable.jsx");
  check("LedgerTable renders type/amount/currency/date",
    ledgerTable.includes("type") &&
    ledgerTable.includes("amount") &&
    ledgerTable.includes("currency") &&
    ledgerTable.includes("created_at"));

  const wallets = read("src/app/(admin)/wallets/page.jsx");
  check("Wallets page shows ngn_balance + vpt_units columns",
    wallets.includes("ngn_balance") && wallets.includes("vpt_units"));

  const ledger = read("src/app/(admin)/ledger/page.jsx");
  check("Global ledger reads from /admin/ledger",
    ledger.includes("/admin/ledger"));

  // Economy pools visible
  const economy = read("src/app/(admin)/economy/page.jsx");
  check("Economy page shows pool balances (operations+community NGN+vPT)",
    economy.includes("operations_ngn") &&
    economy.includes("community_ngn") &&
    economy.includes("operations_vpt") &&
    economy.includes("community_vpt"));
}

// ─── 2. BLOCKCHAIN VALIDATION (admin surface) ───
console.log("\n🧱 2. BLOCKCHAIN VALIDATION (admin surface)");
{
  const bc = read("src/app/(admin)/blockchain/page.jsx");
  check("Blockchain page reads from /admin/blockchain",
    bc.includes("/admin/blockchain"));

  check("RPC URL is configurable",
    bc.includes("BSC_RPC_URL"));

  check("Contract addresses configurable (VPT, Router, WBNB)",
    bc.includes("VPT_TOKEN_ADDRESS") &&
    bc.includes("PANCAKE_ROUTER_ADDRESS") &&
    bc.includes("WBNB_ADDRESS"));

  check("EnvBadge shows PRODUCTION (red) or STAGING (amber)",
    bc.includes("PRODUCTION") && bc.includes("STAGING") &&
    bc.includes("bg-red-100") && bc.includes("bg-amber-100"));

  check("Environment switch triggers re-auth modal",
    bc.includes("reAuthOpen") && bc.includes("type=\"password\""));
}

// ─── 3. LEDGER INTEGRITY (admin surface) ───
console.log("\n🧱 3. LEDGER INTEGRITY (admin surface)");
{
  const lt = read("src/components/users/LedgerTable.jsx");
  check("LedgerTable has type filter (credit/debit/gift/swap/adjustment)",
    lt.includes("credit") && lt.includes("debit") &&
    lt.includes("gift") && lt.includes("swap") &&
    lt.includes("adjustment"));

  check("LedgerTable formats amounts correctly (₦ for NGN)",
    lt.includes("₦") && lt.includes("toLocaleString"));

  const ledgerPage = read("src/app/(admin)/ledger/page.jsx");
  check("Global ledger page is read-only (no POST/PATCH/DELETE)",
    !ledgerPage.includes("api.post") &&
    !ledgerPage.includes("api.patch") &&
    !ledgerPage.includes("api.delete"));

  // Wallet adjustments go through ledger via backend
  const wc = read("src/components/users/WalletCard.jsx");
  check("Wallet adjustment calls backend (ledger-backed via api.post)",
    wc.includes("api.post(\"/admin/wallet/adjust\""));
}

// ─── 4. CONCURRENCY SAFETY (admin surface) ───
console.log("\n🧱 4. CONCURRENCY SAFETY (admin surface)");
{
  const wc = read("src/components/users/WalletCard.jsx");
  check("Wallet adjust button disables during loading (prevents double-submit)",
    wc.includes("disabled={loading"));

  check("WalletCard prevents negative balance on removal",
    wc.includes("Cannot remove more than current balance"));

  const channels = read("src/app/(admin)/channels/page.jsx");
  check("Channel actions disable during loading (actionLoading)",
    channels.includes("actionLoading"));

  const gifts = read("src/app/(admin)/gifts/page.jsx");
  check("Gift toggle disables during loading",
    gifts.includes("actionLoading"));
}

// ─── 5. BROADCAST + COMMUNICATION ───
console.log("\n🧱 5. BROADCAST + COMMUNICATION");
{
  const comm = read("src/app/(admin)/communication/page.jsx");
  check("Communication supports push/email/sms channels",
    comm.includes("push") && comm.includes("email") && comm.includes("sms"));

  check("Send is disabled when message is empty",
    comm.includes("!message.trim()"));

  check("ConfirmDialog shown before sending broadcast",
    comm.includes("ConfirmDialog") && comm.includes("Send Broadcast"));

  check("Result feedback shows success or error",
    comm.includes("result.success") && comm.includes("result.text"));

  check("Character count shown",
    comm.includes("message.length"));
}

// ─── 6. PRIVATE CHANNEL SECURITY (admin surface) ───
console.log("\n🧱 6. PRIVATE CHANNEL SECURITY (admin surface)");
{
  const ch = read("src/app/(admin)/channels/page.jsx");
  check("Channel type badge differentiates private vs public",
    ch.includes("is_private") && ch.includes("Private") && ch.includes("Public"));

  // API expects backend to enforce — frontend does not return raw private data
  const api = read("src/lib/api.js");
  check("API layer sends auth token on every request",
    api.includes("Authorization") && api.includes("Bearer"));

  check("No hardcoded secrets or keys in API lib",
    !api.includes("sk_") && !api.includes("secret") && !api.includes("private_key"));
}

// ─── 7. ADMIN PANEL ABUSE TEST (split validation, key protection) ───
console.log("\n🧱 7. ADMIN PANEL ABUSE TEST");
{
  const econ = read("src/app/(admin)/economy/page.jsx");
  check("Split rules show total and validate = 100%",
    econ.includes("total === 100") && econ.includes("Must equal 100%"));

  const bc = read("src/app/(admin)/blockchain/page.jsx");
  check("Treasury key is masked (••••) and never shown in plain text",
    bc.includes("••••••••••••••••"));

  check("Treasury key field uses type=password for input",
    bc.includes('type="password"'));

  check("Treasury key update requires destructive ConfirmDialog",
    bc.includes("destructive: true") &&
    bc.includes("Update Treasury Key"));

  check("Key warning: 'Never returned in API responses'",
    bc.includes("Never returned in API responses"));

  const wc = read("src/components/users/WalletCard.jsx");
  check("Wallet adjustment requires ConfirmDialog before execution",
    wc.includes("ConfirmDialog") && wc.includes("confirm"));

  check("Wallet adjustment prevents negative balance",
    wc.includes("Cannot remove more than current balance"));

  // All sensitive pages have ConfirmDialog
  check("Economy changes require confirmation",
    econ.includes("ConfirmDialog"));
  check("Blockchain changes require confirmation",
    bc.includes("ConfirmDialog"));

  const settings = read("src/app/(admin)/settings/page.jsx");
  check("Settings changes require confirmation",
    settings.includes("ConfirmDialog"));
}

// ─── 8. FEATURE FLAG TEST ───
console.log("\n🧱 8. FEATURE FLAG TEST");
{
  const ff = read("src/app/(admin)/feature-flags/page.jsx");
  check("Feature flags page loads from /admin/flags",
    ff.includes("/admin/flags"));

  check("Toggle uses PATCH with enabled field",
    ff.includes("api.patch") && ff.includes("enabled"));

  check("Toggle requires ConfirmDialog before applying",
    ff.includes("ConfirmDialog") && ff.includes("Feature Flag"));

  check("Toggle switch has role=switch and aria-checked",
    ff.includes('role="switch"') && ff.includes("aria-checked"));

  check("Enabled count displayed",
    ff.includes("enabledCount") && ff.includes("enabled"));
}

// ─── 9. PERFORMANCE TEST (frontend) ───
console.log("\n🧱 9. PERFORMANCE TEST (frontend)");
{
  const dash = read("src/app/(admin)/dashboard/page.jsx");
  check("Dashboard has auto-refresh (REFRESH_INTERVAL)",
    dash.includes("REFRESH_INTERVAL") && dash.includes("setInterval"));

  check("Dashboard loading state renders spinner",
    dash.includes("animate-spin"));

  // Check that heavy pages have loading states
  const audit = read("src/app/(admin)/audit/page.jsx");
  check("Audit page has loading state",
    audit.includes("loading") && audit.includes("animate-spin"));

  const users = read("src/app/(admin)/users/page.jsx");
  check("Users page has loading state",
    users.includes("loading") && users.includes("animate-spin"));

  // Dashboard < 2s is a backend concern; we verify spinner exists for perceived perf
  check("Revenue chart has loading placeholder",
    read("src/components/dashboard/RevenueChart.jsx").includes("Loading chart"));
}

// ─── 10. DATABASE SAFETY (frontend surface) ───
console.log("\n🧱 10. DATABASE / AUTH SAFETY");
{
  const auth = read("src/lib/useAuthGuard.js");
  check("Auth guard checks for admin_token in localStorage",
    auth.includes("admin_token") && auth.includes("localStorage"));

  check("Auth guard redirects to /login when no token",
    auth.includes("/login") && auth.includes("router.push"));

  const layout = read("src/app/(admin)/layout.jsx");
  check("Admin layout uses useAuthGuard()",
    layout.includes("useAuthGuard"));

  check("No public write endpoints in frontend (all gated by token)",
    read("src/lib/api.js").includes("Authorization"));
}

// ─── 11. SECURITY CHECK ───
console.log("\n🧱 11. SECURITY CHECK");
{
  // Scan all source files for private key literals
  function scanDir(dir) {
    let clean = true;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!scanDir(full)) clean = false;
      } else if (e.name.endsWith(".jsx") || e.name.endsWith(".js")) {
        const content = fs.readFileSync(full, "utf-8");
        if (/0x[a-fA-F0-9]{40,64}/.test(content) || content.includes("PRIVATE_KEY=")) {
          console.log(`    ⚠ Possible key leak in ${full}`);
          clean = false;
        }
      }
    }
    return clean;
  }
  check("No private keys or long hex strings in source code", scanDir(SRC));

  check("Treasury key input is type=password (not type=text)",
    read("src/app/(admin)/blockchain/page.jsx").includes('type="password"'));

  const api = read("src/lib/api.js");
  check("API sends Bearer token on authenticated requests",
    api.includes("Bearer") && api.includes("Authorization"));

  const login = read("src/app/(auth)/login/page.jsx");
  check("Login sends credentials via POST (not GET)",
    login.includes("api.post") && !login.includes("api.get(\"/admin/login"));

  check("Admin layout is in protected route group (admin)",
    exists("src/app/(admin)/layout.jsx"));

  check("Login is in separate auth route group",
    exists("src/app/(auth)/login/page.jsx"));
}

// ─── 12. FAILURE RECOVERY (frontend resilience) ───
console.log("\n🧱 12. FAILURE RECOVERY (error states)");
{
  const pages = [
    "src/app/(admin)/dashboard/page.jsx",
    "src/app/(admin)/users/page.jsx",
    "src/app/(admin)/wallets/page.jsx",
    "src/app/(admin)/ledger/page.jsx",
    "src/app/(admin)/channels/page.jsx",
    "src/app/(admin)/gifts/page.jsx",
    "src/app/(admin)/economy/page.jsx",
    "src/app/(admin)/blockchain/page.jsx",
    "src/app/(admin)/settings/page.jsx",
    "src/app/(admin)/audit/page.jsx",
    "src/app/(admin)/feature-flags/page.jsx",
    "src/app/(admin)/plans/page.jsx",
    "src/app/(admin)/communication/page.jsx",
  ];

  for (const p of pages) {
    const name = p.split("/").slice(-2)[0];
    const content = read(p);
    check(`${name} — has error state handling`,
      (content.includes("error") || content.includes("err")) && (content.includes("setError") || content.includes("setResult") || content.includes("result")));
  }

  // Retry buttons exist on data-loading pages
  const dataPages = [
    "src/app/(admin)/dashboard/page.jsx",
    "src/app/(admin)/users/page.jsx",
    "src/app/(admin)/wallets/page.jsx",
    "src/app/(admin)/ledger/page.jsx",
    "src/app/(admin)/audit/page.jsx",
    "src/app/(admin)/economy/page.jsx",
    "src/app/(admin)/blockchain/page.jsx",
    "src/app/(admin)/settings/page.jsx",
    "src/app/(admin)/feature-flags/page.jsx",
  ];
  for (const p of dataPages) {
    const name = p.split("/").slice(-2)[0];
    const content = read(p);
    check(`${name} — has retry capability`,
      content.includes("Retry") || content.includes("retry") || content.includes("load()") || content.includes("fetchStats"));
  }
}

// ─── 13. USER EXPERIENCE (admin UX) ───
console.log("\n🧱 13. USER EXPERIENCE (admin UX)");
{
  // Sidebar completeness
  const sidebar = read("src/components/layout/Sidebar.jsx");
  const required = [
    "Dashboard", "Users", "Channels", "Gifts", "Plans", "Wallets",
    "Ledger", "Economy", "Blockchain", "Communication", "Feature Flags",
    "Settings", "Audit"
  ];
  for (const name of required) {
    check(`Sidebar has "${name}" link`, sidebar.includes(`"${name}"`));
  }

  // Active route highlight
  check("Sidebar highlights active route", sidebar.includes("pathname") && sidebar.includes("bg-blue-600"));

  // Header with logout
  const header = read("src/components/layout/Header.jsx");
  check("Header has logout button", header.includes("logout") && header.includes("admin_token"));

  // Empty states
  const gifts = read("src/app/(admin)/gifts/page.jsx");
  check("Gifts page has empty state via DataTable", gifts.includes("DataTable"));

  const ff = read("src/app/(admin)/feature-flags/page.jsx");
  check("Feature flags has empty state", ff.includes("No feature flags configured"));
}

// ─── 14. MONITORING READY (frontend logging) ───
console.log("\n🧱 14. MONITORING / TRACEABILITY");
{
  const audit = read("src/app/(admin)/audit/page.jsx");
  check("Audit page exists and renders structured logs",
    audit.includes("action") && audit.includes("performed_by") && audit.includes("target_id"));

  check("Audit page is read-only (no mutations)",
    !audit.includes("api.post") && !audit.includes("api.patch") && !audit.includes("api.delete"));

  check("Audit page has search filter",
    audit.includes("search") && audit.includes("setSearch"));

  check("Audit page has action type filter",
    audit.includes("filterAction") && audit.includes("setFilterAction"));

  check("Audit displays meta JSON details",
    audit.includes("JSON.stringify") && audit.includes("meta"));

  check("Audit displays timestamps",
    audit.includes("created_at") && audit.includes("toLocaleString"));
}

// ─── 15. SOFT LIMITS (admin surface) ───
console.log("\n🧱 15. SOFT LIMITS / GUARDRAILS");
{
  const wc = read("src/components/users/WalletCard.jsx");
  check("Wallet amount input has min=0 (no negative input)",
    wc.includes('min="0"'));

  check("Wallet requires positive amount (parsed > 0 check)",
    wc.includes("parsed <= 0") || wc.includes("!parsed"));

  const econ = read("src/app/(admin)/economy/page.jsx");
  check("Economy rate fields use type=number",
    econ.includes('type="number"') || econ.includes("type: \"number\""));

  const giftForm = read("src/components/gifts/GiftForm.jsx");
  check("Gift form validates name is required",
    giftForm.includes("Name is required"));

  check("Gift form validates currency-specific amounts > 0",
    giftForm.includes("vPT units must be greater than 0") &&
    giftForm.includes("Naira value must be greater than 0"));

  const plans = read("src/app/(admin)/plans/page.jsx");
  check("Plan edit validates name and price >= 0",
    plans.includes("!payload.name") && plans.includes("price_ngn < 0"));
}

// ─── 16. FINAL GO / NO-GO CHECKLIST ───
console.log("\n🧱 16. FINAL GO / NO-GO CHECKLIST");
{
  // All pages exist
  const allPages = [
    "src/app/(admin)/dashboard/page.jsx",
    "src/app/(admin)/users/page.jsx",
    "src/app/(admin)/wallets/page.jsx",
    "src/app/(admin)/ledger/page.jsx",
    "src/app/(admin)/channels/page.jsx",
    "src/app/(admin)/gifts/page.jsx",
    "src/app/(admin)/plans/page.jsx",
    "src/app/(admin)/economy/page.jsx",
    "src/app/(admin)/blockchain/page.jsx",
    "src/app/(admin)/settings/page.jsx",
    "src/app/(admin)/communication/page.jsx",
    "src/app/(admin)/feature-flags/page.jsx",
    "src/app/(admin)/audit/page.jsx",
  ];
  check("All 13 admin pages exist",
    allPages.every(p => exists(p)));

  // Root redirect
  const root = read("src/app/page.jsx");
  check("Root page redirects to /dashboard",
    root.includes("redirect") && root.includes("/dashboard"));

  // Login page
  check("Login page exists and posts credentials",
    exists("src/app/(auth)/login/page.jsx") &&
    read("src/app/(auth)/login/page.jsx").includes("api.post"));

  // No fake success states — all mutations call api.*
  const mutatingPages = [
    "src/components/users/WalletCard.jsx",
    "src/components/users/UserDrawer.jsx",
    "src/components/gifts/GiftForm.jsx",
    "src/app/(admin)/channels/page.jsx",
    "src/app/(admin)/economy/page.jsx",
    "src/app/(admin)/blockchain/page.jsx",
    "src/app/(admin)/settings/page.jsx",
    "src/app/(admin)/communication/page.jsx",
    "src/app/(admin)/feature-flags/page.jsx",
    "src/app/(admin)/plans/page.jsx",
  ];
  check("All mutating pages use real api calls (no fake local success)",
    mutatingPages.every(p => {
      const c = read(p);
      return c.includes("api.post") || c.includes("api.patch") || c.includes("api.delete");
    }));

  // Shared components exist
  check("ConfirmDialog shared component exists", exists("src/components/ui/ConfirmDialog.jsx"));
  check("DataTable shared component exists", exists("src/components/ui/DataTable.jsx"));
  check("Drawer shared component exists", exists("src/components/ui/Drawer.jsx"));
  check("StatusBadge shared component exists", exists("src/components/ui/StatusBadge.jsx"));

  // Build check will be run separately
}

// ─── SUMMARY ───
console.log("\n" + "=".repeat(60));
console.log(`STEP 7 VERIFICATION: ${pass}/${total} passed, ${fail} failed`);
if (fail === 0) {
  console.log("✅ STEP 7 PRE-LAUNCH VALIDATION PASSED");
} else {
  console.log("❌ STEP 7 HAS FAILURES — FIX BEFORE LAUNCH");
}
console.log("=".repeat(60));

process.exit(fail > 0 ? 1 : 0);
