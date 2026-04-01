/**
 * Step 2 Verification: Dashboard implementation checks
 *
 * Tests:
 * 1. All dashboard component files exist
 * 2. Dashboard page imports correct components
 * 3. API integration (api.get calls present)
 * 4. Auto-refresh with setInterval
 * 5. Tailwind CSS configured
 * 6. recharts dependency present
 * 7. Loading + error states handled
 * 8. PoolsCard renders 4 pool tiles
 * 9. StatCard supports accent colors
 * 10. RevenueChart fetches from /admin/stats/trend
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

console.log("\n🔍 Step 2 Verification: Dashboard\n");

// 1. Dashboard component files exist
console.log("── File Structure ──");
const dashComponents = [
  "src/components/dashboard/StatCard.jsx",
  "src/components/dashboard/PoolsCard.jsx",
  "src/components/dashboard/RevenueChart.jsx",
];
dashComponents.forEach((f) => check(`${f} exists`, existsSync(resolve(ROOT, f))));

check("src/app/(admin)/dashboard/page.jsx exists", existsSync(resolve(ROOT, "src/app/(admin)/dashboard/page.jsx")));
check("src/app/globals.css exists", existsSync(resolve(ROOT, "src/app/globals.css")));
check("postcss.config.mjs exists", existsSync(resolve(ROOT, "postcss.config.mjs")));

// 2. Dashboard page content checks
console.log("\n── Dashboard Page ──");
const dashPage = readSrc("src/app/(admin)/dashboard/page.jsx");
if (dashPage) {
  check("imports StatCard", dashPage.includes("StatCard"));
  check("imports RevenueChart", dashPage.includes("RevenueChart"));
  check("imports PoolsCard", dashPage.includes("PoolsCard"));
  check("imports api from @/lib/api", dashPage.includes("@/lib/api"));
  check("uses api.get(/admin/stats)", dashPage.includes('api.get("/admin/stats")'));
  check("has setInterval for auto-refresh", dashPage.includes("setInterval"));
  check("has loading state", dashPage.includes("Loading dashboard"));
  check("has error state", dashPage.includes("error") && dashPage.includes("Failed"));
  check("has retry button", dashPage.includes("Retry"));
  check("has live indicator", dashPage.includes("Live"));
  check("responsive grid (lg:grid-cols-4)", dashPage.includes("lg:grid-cols-4"));
} else {
  check("dashboard page readable", false);
}

// 3. StatCard
console.log("\n── StatCard ──");
const statCard = readSrc("src/components/dashboard/StatCard.jsx");
if (statCard) {
  check("exports default StatCard", statCard.includes("export default function StatCard"));
  check("accepts title prop", statCard.includes("title"));
  check("accepts value prop", statCard.includes("value"));
  check("accepts accent prop", statCard.includes("accent"));
  check("formats numbers with toLocaleString", statCard.includes("toLocaleString"));
  check("uses colored left border", statCard.includes("border-l-4"));
} else {
  check("StatCard readable", false);
}

// 4. PoolsCard
console.log("\n── PoolsCard ──");
const poolsCard = readSrc("src/components/dashboard/PoolsCard.jsx");
if (poolsCard) {
  check("exports default PoolsCard", poolsCard.includes("export default function PoolsCard"));
  check("renders operations_ngn", poolsCard.includes("operations_ngn"));
  check("renders community_ngn", poolsCard.includes("community_ngn"));
  check("renders operations_vpt", poolsCard.includes("operations_vpt"));
  check("renders community_vpt", poolsCard.includes("community_vpt"));
  check("formats pool values", poolsCard.includes("toLocaleString"));
} else {
  check("PoolsCard readable", false);
}

// 5. RevenueChart
console.log("\n── RevenueChart ──");
const revenueChart = readSrc("src/components/dashboard/RevenueChart.jsx");
if (revenueChart) {
  check("exports default RevenueChart", revenueChart.includes("export default function RevenueChart"));
  check("imports from recharts", revenueChart.includes("recharts"));
  check("uses LineChart", revenueChart.includes("LineChart"));
  check("uses ResponsiveContainer", revenueChart.includes("ResponsiveContainer"));
  check("fetches from /admin/stats/trend", revenueChart.includes("/admin/stats/trend"));
  check("has loading state", revenueChart.includes("Loading chart"));
  check("has error state", revenueChart.includes("error"));
  check("has empty data state", revenueChart.includes("No trend data"));
} else {
  check("RevenueChart readable", false);
}

// 6. Tailwind + PostCSS
console.log("\n── Tailwind Config ──");
const globalsCss = readSrc("src/app/globals.css");
check("globals.css imports tailwindcss", globalsCss && globalsCss.includes("tailwindcss"));
const postcss = readSrc("postcss.config.mjs");
check("postcss uses @tailwindcss/postcss", postcss && postcss.includes("@tailwindcss/postcss"));
const rootLayout = readSrc("src/app/layout.jsx");
check("root layout imports globals.css", rootLayout && rootLayout.includes("globals.css"));

// 7. Package.json
console.log("\n── Dependencies ──");
const pkg = JSON.parse(readSrc("package.json"));
check("recharts in dependencies", Boolean(pkg.dependencies?.recharts));
check("tailwindcss in devDependencies", Boolean(pkg.devDependencies?.tailwindcss));
check("@tailwindcss/postcss in devDependencies", Boolean(pkg.devDependencies?.["@tailwindcss/postcss"]));
check("postcss in devDependencies", Boolean(pkg.devDependencies?.postcss));

// Summary
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("❌ STEP 2 VERIFICATION FAILED\n");
  process.exit(1);
} else {
  console.log("✅ STEP 2 VERIFICATION PASSED\n");
  process.exit(0);
}
