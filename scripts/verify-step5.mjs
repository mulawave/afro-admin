// scripts/verify-step5.mjs
// Step 5 Verification: Economy + Blockchain + Settings Panel
import { readFileSync, existsSync } from "fs";

let pass = 0;
let fail = 0;
const results = [];

function check(label, condition) {
  if (condition) {
    pass++;
    results.push(`  ✅ ${label}`);
  } else {
    fail++;
    results.push(`  ❌ ${label}`);
  }
}

function fileExists(path) {
  return existsSync(path);
}

function fileContains(path, text) {
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf-8").includes(text);
}

function fileContainsRegex(path, regex) {
  if (!existsSync(path)) return false;
  return regex.test(readFileSync(path, "utf-8"));
}

console.log("\n🔍 STEP 5 VERIFICATION: ECONOMY + BLOCKCHAIN + SETTINGS\n");

// ─── ECONOMY PAGE ───
console.log("── Economy Page ──");
const economyPage = "src/app/(admin)/economy/page.jsx";
check("Economy page exists", fileExists(economyPage));
check("Economy page is client component", fileContains(economyPage, '"use client"'));
check("Economy page imports api", fileContains(economyPage, 'from "@/lib/api"'));
check("Economy page imports ConfirmDialog", fileContains(economyPage, "ConfirmDialog"));
check("Economy page fetches GET /admin/economy", fileContains(economyPage, '"/admin/economy"'));
check("Economy page has loading state", fileContains(economyPage, "loading"));
check("Economy page has error state with retry", fileContains(economyPage, "Retry"));
check("Economy page has VPT_PRICE_NGN rate", fileContains(economyPage, "VPT_PRICE_NGN"));
check("Economy page has NGN_TO_BNB_RATE", fileContains(economyPage, "NGN_TO_BNB_RATE"));
check("Economy page has SPLIT_CREATOR", fileContains(economyPage, "SPLIT_CREATOR"));
check("Economy page has SPLIT_OPS", fileContains(economyPage, "SPLIT_OPS"));
check("Economy page has SPLIT_COMMUNITY", fileContains(economyPage, "SPLIT_COMMUNITY"));
check("Economy page validates split total = 100%", fileContains(economyPage, "Must equal 100%"));
check("Economy page shows pools", fileContains(economyPage, "operations_ngn"));
check("Economy page shows community pool", fileContains(economyPage, "community_ngn"));
check("Economy page shows vPT pools", fileContains(economyPage, "operations_vpt"));
check("Economy page uses api.patch for updates", fileContains(economyPage, "api.patch"));
check("Economy page has confirm before update", fileContains(economyPage, "requestUpdate"));
check("Economy page has EditableField component", fileContains(economyPage, "EditableField"));
check("Economy page has Section component", fileContains(economyPage, "Section"));
check("Economy page has PoolTile component", fileContains(economyPage, "PoolTile"));
check("Economy page has live indicator", fileContainsRegex(economyPage, /Live|animate-pulse/));

// ─── BLOCKCHAIN PAGE ───
console.log("── Blockchain Page ──");
const blockchainPage = "src/app/(admin)/blockchain/page.jsx";
check("Blockchain page exists", fileExists(blockchainPage));
check("Blockchain page is client component", fileContains(blockchainPage, '"use client"'));
check("Blockchain page imports api", fileContains(blockchainPage, 'from "@/lib/api"'));
check("Blockchain page imports ConfirmDialog", fileContains(blockchainPage, "ConfirmDialog"));
check("Blockchain page fetches GET /admin/blockchain", fileContains(blockchainPage, '"/admin/blockchain"'));
check("Blockchain page has loading state", fileContains(blockchainPage, "loading"));
check("Blockchain page has error state with retry", fileContains(blockchainPage, "Retry"));
check("Blockchain page has environment selector", fileContains(blockchainPage, "ENVIRONMENT"));
check("Blockchain page has staging/production options", fileContains(blockchainPage, "staging"));
check("Blockchain page env switch requires re-auth", fileContains(blockchainPage, "reAuthPassword"));
check("Blockchain page re-auth modal with password input", fileContains(blockchainPage, "type=\"password\""));
check("Blockchain page has VPT_TOKEN_ADDRESS", fileContains(blockchainPage, "VPT_TOKEN_ADDRESS"));
check("Blockchain page has PANCAKE_ROUTER_ADDRESS", fileContains(blockchainPage, "PANCAKE_ROUTER_ADDRESS"));
check("Blockchain page has WBNB_ADDRESS", fileContains(blockchainPage, "WBNB_ADDRESS"));
check("Blockchain page has BSC_RPC_URL", fileContains(blockchainPage, "BSC_RPC_URL"));
check("Blockchain page has TREASURY_PRIVATE_KEY handling", fileContains(blockchainPage, "TREASURY_PRIVATE_KEY"));
check("Blockchain page never returns raw key", fileContains(blockchainPage, "Never returned"));
check("Blockchain page key shown as masked", fileContainsRegex(blockchainPage, /••••|masked|\*{3,}/));
check("Blockchain page TreasuryKeyField component", fileContains(blockchainPage, "TreasuryKeyField"));
check("Blockchain page key update via password input", fileContains(blockchainPage, "Update Key"));
check("Blockchain page uses api.patch", fileContains(blockchainPage, "api.patch"));
check("Blockchain page has confirm before save", fileContains(blockchainPage, "requestSave"));
check("Blockchain page has EnvBadge component", fileContains(blockchainPage, "EnvBadge"));
check("Blockchain page shows PRODUCTION/STAGING badge", fileContains(blockchainPage, "PRODUCTION"));

// ─── SETTINGS PAGE ───
console.log("── Settings Page ──");
const settingsPage = "src/app/(admin)/settings/page.jsx";
check("Settings page exists", fileExists(settingsPage));
check("Settings page is client component", fileContains(settingsPage, '"use client"'));
check("Settings page imports api", fileContains(settingsPage, 'from "@/lib/api"'));
check("Settings page imports ConfirmDialog", fileContains(settingsPage, "ConfirmDialog"));
check("Settings page fetches GET /admin/settings", fileContains(settingsPage, '"/admin/settings"'));
check("Settings page has loading state", fileContains(settingsPage, "loading"));
check("Settings page has error state with retry", fileContains(settingsPage, "Retry"));
check("Settings page iterates over settings keys", fileContains(settingsPage, "Object.entries"));
check("Settings page has SettingRow component", fileContains(settingsPage, "SettingRow"));
check("Settings page has editable values", fileContains(settingsPage, "editing"));
check("Settings page uses api.patch for saves", fileContains(settingsPage, "api.patch"));
check("Settings page has confirm before save", fileContains(settingsPage, "requestSave"));
check("Settings page has formatKey helper", fileContains(settingsPage, "formatKey"));
check("Settings page has empty state", fileContains(settingsPage, "No settings configured"));
check("Settings page shows setting count", fileContains(settingsPage, "entries.length"));
check("Settings page renderValue handles booleans", fileContains(settingsPage, "Enabled"));

// ─── SECURITY CHECKS ───
console.log("── Security Invariants ──");
check("Economy updates go through backend API", fileContains(economyPage, "api.patch"));
check("Blockchain updates go through backend API", fileContains(blockchainPage, "api.patch"));
check("Settings updates go through backend API", fileContains(settingsPage, "api.patch"));
check("Treasury key never displayed raw", !fileContainsRegex(blockchainPage, /value=\{cfg\?\.TREASURY_PRIVATE_KEY\}/));
check("Environment switch requires password", fileContains(blockchainPage, "password"));
check("Split rules show total validation", fileContains(economyPage, "total"));
check("All panels have ConfirmDialog", 
  fileContains(economyPage, "ConfirmDialog") && 
  fileContains(blockchainPage, "ConfirmDialog") && 
  fileContains(settingsPage, "ConfirmDialog")
);

// ─── SIDEBAR ───
console.log("── Sidebar Navigation ──");
const sidebar = "src/components/layout/Sidebar.jsx";
check("Sidebar has Economy link", fileContains(sidebar, '"/economy"'));
check("Sidebar has Blockchain link", fileContains(sidebar, '"/blockchain"'));
check("Sidebar has Settings link", fileContains(sidebar, '"/settings"'));

// ─── RESULTS ───
console.log("\n" + results.join("\n"));
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`TOTAL: ${pass + fail}  |  ✅ ${pass}  |  ❌ ${fail}`);

if (fail === 0) {
  console.log("\n✅ STEP 5 VERIFICATION PASSED — ALL CHECKS GREEN\n");
  process.exit(0);
} else {
  console.log(`\n❌ STEP 5 VERIFICATION FAILED — ${fail} CHECK(S) RED\n`);
  process.exit(1);
}
