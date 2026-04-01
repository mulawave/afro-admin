// scripts/verify-step6.mjs
// Step 6 Verification: Communication + Audit + Feature Flags
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

console.log("\n🔍 STEP 6 VERIFICATION: COMMUNICATION + AUDIT + FEATURE FLAGS\n");

// ─── COMMUNICATION PAGE ───
console.log("── Communication Page ──");
const commPage = "src/app/(admin)/communication/page.jsx";
check("Communication page exists", fileExists(commPage));
check("Communication page is client component", fileContains(commPage, '"use client"'));
check("Communication page imports api", fileContains(commPage, 'from "@/lib/api"'));
check("Communication page imports ConfirmDialog", fileContains(commPage, "ConfirmDialog"));
check("Communication page has push notification option", fileContains(commPage, "push"));
check("Communication page has email option", fileContains(commPage, "email"));
check("Communication page has sms option", fileContains(commPage, "sms"));
check("Communication page has message textarea", fileContains(commPage, "textarea"));
check("Communication page has character count", fileContains(commPage, "characters"));
check("Communication page sends via api.post", fileContains(commPage, "api.post"));
check("Communication page sends to /admin/communication/send", fileContains(commPage, "/admin/communication/send"));
check("Communication page has confirm before send", fileContains(commPage, "setConfirm"));
check("Communication page has sending state", fileContains(commPage, "sending"));
check("Communication page has success result display", fileContains(commPage, "success"));
check("Communication page has error result display", fileContains(commPage, "Failed to send"));
check("Communication page has Send Broadcast button", fileContains(commPage, "Send Broadcast"));
check("Communication page has audit trail warning", fileContainsRegex(commPage, /audit|logged/i));
check("Communication page disables send when empty", fileContains(commPage, "!message.trim()"));
check("Communication page channel selector UI", fileContains(commPage, "CHANNEL_OPTIONS"));

// ─── FEATURE FLAGS PAGE ───
console.log("── Feature Flags Page ──");
const flagsPage = "src/app/(admin)/feature-flags/page.jsx";
check("Feature Flags page exists", fileExists(flagsPage));
check("Feature Flags page is client component", fileContains(flagsPage, '"use client"'));
check("Feature Flags page imports api", fileContains(flagsPage, 'from "@/lib/api"'));
check("Feature Flags page imports ConfirmDialog", fileContains(flagsPage, "ConfirmDialog"));
check("Feature Flags page fetches GET /admin/flags", fileContains(flagsPage, '"/admin/flags"'));
check("Feature Flags page has loading state", fileContains(flagsPage, "loading"));
check("Feature Flags page has error state with retry", fileContains(flagsPage, "Retry"));
check("Feature Flags page has flag toggle switch", fileContains(flagsPage, "role=\"switch\""));
check("Feature Flags page toggles via api.patch", fileContains(flagsPage, "api.patch"));
check("Feature Flags page has confirm before toggle", fileContains(flagsPage, "setConfirm"));
check("Feature Flags page displays flag key", fileContains(flagsPage, "flag.key"));
check("Feature Flags page displays flag description", fileContains(flagsPage, "flag.description"));
check("Feature Flags page shows enabled/total count", fileContains(flagsPage, "enabledCount"));
check("Feature Flags page has empty state", fileContains(flagsPage, "No feature flags configured"));
check("Feature Flags page has toggling state", fileContains(flagsPage, "toggling"));
check("Feature Flags page instant apply info", fileContainsRegex(flagsPage, /instantly|immediate/i));
check("Feature Flags page mentions audit logging", fileContainsRegex(flagsPage, /audit|logged/i));

// ─── AUDIT PAGE ───
console.log("── Audit Page ──");
const auditPage = "src/app/(admin)/audit/page.jsx";
check("Audit page exists", fileExists(auditPage));
check("Audit page is client component", fileContains(auditPage, '"use client"'));
check("Audit page imports api", fileContains(auditPage, 'from "@/lib/api"'));
check("Audit page imports DataTable", fileContains(auditPage, "DataTable"));
check("Audit page fetches GET /admin/audit", fileContains(auditPage, '"/admin/audit"'));
check("Audit page has loading state", fileContains(auditPage, "loading"));
check("Audit page has error state with retry", fileContains(auditPage, "Retry"));
check("Audit page has search filter", fileContains(auditPage, "search"));
check("Audit page has action filter dropdown", fileContains(auditPage, "filterAction"));
check("Audit page shows action column", fileContains(auditPage, "action"));
check("Audit page shows admin (performed_by)", fileContains(auditPage, "performed_by"));
check("Audit page shows target_id", fileContains(auditPage, "target_id"));
check("Audit page shows meta/details", fileContains(auditPage, "meta"));
check("Audit page shows created_at with date formatting", fileContains(auditPage, "toLocaleString"));
check("Audit page displays entry count", fileContains(auditPage, "filtered.length"));
check("Audit page immutability notice", fileContainsRegex(auditPage, /immutable|read.?only/i));
check("Audit page has empty state message", fileContains(auditPage, "No audit logs found"));

// ─── SIDEBAR ───
console.log("── Sidebar Navigation ──");
const sidebar = "src/components/layout/Sidebar.jsx";
check("Sidebar has Communication link", fileContains(sidebar, '"/communication"'));
check("Sidebar has Feature Flags link", fileContains(sidebar, '"/feature-flags"'));
check("Sidebar has Audit link", fileContains(sidebar, '"/audit"'));

// ─── SAFETY ───
console.log("── Safety & Compliance ──");
check("Communication sends via backend API", fileContains(commPage, "api.post"));
check("Feature flag toggles via backend API", fileContains(flagsPage, "api.patch"));
check("Audit logs are read-only (no writes in audit page)", !fileContainsRegex(auditPage, /api\.post|api\.patch|api\.delete/));
check("Communication has confirm dialog", fileContains(commPage, "ConfirmDialog"));
check("Feature flags has confirm dialog", fileContains(flagsPage, "ConfirmDialog"));
check("All operations are auditable", 
  fileContainsRegex(commPage, /audit|logged/i) && 
  fileContainsRegex(flagsPage, /audit|logged/i) && 
  fileContainsRegex(auditPage, /immutable/i)
);

// ─── RESULTS ───
console.log("\n" + results.join("\n"));
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`TOTAL: ${pass + fail}  |  ✅ ${pass}  |  ❌ ${fail}`);

if (fail === 0) {
  console.log("\n✅ STEP 6 VERIFICATION PASSED — ALL CHECKS GREEN\n");
  process.exit(0);
} else {
  console.log(`\n❌ STEP 6 VERIFICATION FAILED — ${fail} CHECK(S) RED\n`);
  process.exit(1);
}
