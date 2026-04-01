// scripts/verify-step4.mjs
// Step 4 Verification: Gifts + Plans + Channels Panel
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

console.log("\n🔍 STEP 4 VERIFICATION: GIFTS + PLANS + CHANNELS\n");

// ─── GIFTS PAGE ───
console.log("── Gifts Page ──");
const giftsPage = "src/app/(admin)/gifts/page.jsx";
check("Gifts page exists", fileExists(giftsPage));
check("Gifts page is client component", fileContains(giftsPage, '"use client"'));
check("Gifts page imports api", fileContains(giftsPage, 'from "@/lib/api"'));
check("Gifts page imports DataTable", fileContains(giftsPage, "DataTable"));
check("Gifts page imports StatusBadge", fileContains(giftsPage, "StatusBadge"));
check("Gifts page imports ConfirmDialog", fileContains(giftsPage, "ConfirmDialog"));
check("Gifts page imports GiftForm", fileContains(giftsPage, "GiftForm"));
check("Gifts page fetches GET /admin/gifts", fileContains(giftsPage, '"/admin/gifts"'));
check("Gifts page has loading state", fileContains(giftsPage, "loading"));
check("Gifts page has error state with retry", fileContains(giftsPage, "Retry"));
check("Gifts page has search filter", fileContains(giftsPage, "search"));
check("Gifts page has Add Gift button", fileContains(giftsPage, "Add Gift"));
check("Gifts page has toggle active/disable", fileContains(giftsPage, "toggleGift"));
check("Gifts page shows gift icon", fileContains(giftsPage, "icon"));
check("Gifts page shows gift value (vPT)", fileContains(giftsPage, "vpt_units"));
check("Gifts page shows gift value (NGN)", fileContains(giftsPage, "naira_value"));
check("Gifts page has Edit button", fileContains(giftsPage, "Edit"));
check("Gifts page has Enable/Disable toggle", fileContainsRegex(giftsPage, /is_active.*Disable|Disable.*Enable/));
check("Gifts page PATCH toggle uses api.patch", fileContains(giftsPage, "api.patch"));
check("Gifts page has confirmation before toggle", fileContains(giftsPage, "setConfirm"));

// ─── GIFT FORM ───
console.log("── Gift Form ──");
const giftForm = "src/components/gifts/GiftForm.jsx";
check("GiftForm component exists", fileExists(giftForm));
check("GiftForm is client component", fileContains(giftForm, '"use client"'));
check("GiftForm uses Drawer", fileContains(giftForm, "Drawer"));
check("GiftForm has name input", fileContains(giftForm, "Name"));
check("GiftForm has icon input", fileContains(giftForm, "Icon"));
check("GiftForm has currency selector", fileContains(giftForm, "currency"));
check("GiftForm has vPT units input", fileContains(giftForm, "vpt_units"));
check("GiftForm has naira value input", fileContains(giftForm, "naira_value"));
check("GiftForm validates name required", fileContains(giftForm, "Name is required"));
check("GiftForm validates value > 0", fileContains(giftForm, "greater than 0"));
check("GiftForm calls POST for new gifts", fileContains(giftForm, "api.post"));
check("GiftForm calls PATCH for editing", fileContains(giftForm, "api.patch"));
check("GiftForm has save/cancel buttons", fileContains(giftForm, "Cancel"));
check("GiftForm has saving state", fileContains(giftForm, "Saving"));
check("GiftForm has error display", fileContains(giftForm, "Failed to save"));

// ─── PLANS PAGE ───
console.log("── Plans Page ──");
const plansPage = "src/app/(admin)/plans/page.jsx";
check("Plans page exists", fileExists(plansPage));
check("Plans page is client component", fileContains(plansPage, '"use client"'));
check("Plans page imports api", fileContains(plansPage, 'from "@/lib/api"'));
check("Plans page imports DataTable", fileContains(plansPage, "DataTable"));
check("Plans page imports Drawer", fileContains(plansPage, "Drawer"));
check("Plans page imports ConfirmDialog", fileContains(plansPage, "ConfirmDialog"));
check("Plans page fetches GET /admin/plans", fileContains(plansPage, '"/admin/plans"'));
check("Plans page has loading state", fileContains(plansPage, "loading"));
check("Plans page has error state with retry", fileContains(plansPage, "Retry"));
check("Plans page shows plan name", fileContains(plansPage, "Plan Name"));
check("Plans page shows price in NGN", fileContains(plansPage, "price_ngn"));
check("Plans page shows private_channels feature", fileContains(plansPage, "private_channels"));
check("Plans page has Edit button", fileContains(plansPage, "Edit"));
check("Plans page has edit drawer with form", fileContains(plansPage, "startEdit"));
check("Plans page edit has name input", fileContains(plansPage, "_name"));
check("Plans page edit has price input", fileContains(plansPage, "_price_ngn"));
check("Plans page edit has feature toggles", fileContains(plansPage, "_features"));
check("Plans page save via PATCH", fileContains(plansPage, "api.patch"));
check("Plans page confirmation before save", fileContains(plansPage, "Save changes"));

// ─── CHANNELS PAGE ───
console.log("── Channels Page ──");
const channelsPage = "src/app/(admin)/channels/page.jsx";
check("Channels page exists", fileExists(channelsPage));
check("Channels page is client component", fileContains(channelsPage, '"use client"'));
check("Channels page imports api", fileContains(channelsPage, 'from "@/lib/api"'));
check("Channels page imports DataTable", fileContains(channelsPage, "DataTable"));
check("Channels page imports StatusBadge", fileContains(channelsPage, "StatusBadge"));
check("Channels page imports ConfirmDialog", fileContains(channelsPage, "ConfirmDialog"));
check("Channels page fetches GET /admin/channels", fileContains(channelsPage, '"/admin/channels"'));
check("Channels page has loading state", fileContains(channelsPage, "loading"));
check("Channels page has error state with retry", fileContains(channelsPage, "Retry"));
check("Channels page has search filter", fileContains(channelsPage, "search"));
check("Channels page shows channel name", fileContains(channelsPage, "Name"));
check("Channels page shows owner", fileContains(channelsPage, "owner_uid"));
check("Channels page shows type (public/private)", fileContains(channelsPage, "is_private"));
check("Channels page shows status (active/disabled)", fileContains(channelsPage, "is_active"));
check("Channels page shows live indicator", fileContains(channelsPage, "is_live"));
check("Channels page LIVE badge with pulse", fileContains(channelsPage, "animate-pulse"));
check("Channels page has Enable/Disable toggle", fileContains(channelsPage, "toggleChannel"));
check("Channels page has Stop Stream action", fileContains(channelsPage, "stopStream"));
check("Channels page has Delete action", fileContains(channelsPage, "deleteChannel"));
check("Channels toggle uses api.patch", fileContains(channelsPage, "api.patch"));
check("Channels stop uses api.post /stop", fileContains(channelsPage, "/stop"));
check("Channels delete uses api.delete", fileContains(channelsPage, "api.delete"));
check("Channels delete has warning about programs/events", fileContains(channelsPage, "programs"));
check("Channels confirm dialog present", fileContains(channelsPage, "setConfirm"));
check("Channels stop confirms force disconnect", fileContainsRegex(channelsPage, /disconnect|force stop/i));

// ─── SIDEBAR ───
console.log("── Sidebar Navigation ──");
const sidebar = "src/components/layout/Sidebar.jsx";
check("Sidebar has Gifts link", fileContains(sidebar, '"/gifts"'));
check("Sidebar has Plans link", fileContains(sidebar, '"/plans"'));
check("Sidebar has Channels link", fileContains(sidebar, '"/channels"'));

// ─── API LIB ───
console.log("── API Integration ──");
const apiLib = "src/lib/api.js";
check("API lib has GET method", fileContains(apiLib, "get:"));
check("API lib has POST method", fileContains(apiLib, "post:"));
check("API lib has PATCH method", fileContains(apiLib, "patch:"));
check("API lib has DELETE method", fileContains(apiLib, "delete:"));

// ─── SHARED UI ───
console.log("── Shared UI Primitives ──");
check("DataTable component exists", fileExists("src/components/ui/DataTable.jsx"));
check("ConfirmDialog component exists", fileExists("src/components/ui/ConfirmDialog.jsx"));
check("StatusBadge component exists", fileExists("src/components/ui/StatusBadge.jsx"));
check("Drawer component exists", fileExists("src/components/ui/Drawer.jsx"));

// ─── RESULTS ───
console.log("\n" + results.join("\n"));
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`TOTAL: ${pass + fail}  |  ✅ ${pass}  |  ❌ ${fail}`);

if (fail === 0) {
  console.log("\n✅ STEP 4 VERIFICATION PASSED — ALL CHECKS GREEN\n");
  process.exit(0);
} else {
  console.log(`\n❌ STEP 4 VERIFICATION FAILED — ${fail} CHECK(S) RED\n`);
  process.exit(1);
}
