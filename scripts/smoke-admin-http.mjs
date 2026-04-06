const DEFAULT_BASE_URL = process.env.ADMIN_SMOKE_BASE_URL || "http://127.0.0.1:3001";
const REQUEST_TIMEOUT_MS = Number(process.env.ADMIN_SMOKE_TIMEOUT_MS || 20000);

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
    pass += 1;
    return;
  }

  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  fail += 1;
}

async function fetchText(path, options = {}) {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  return { response, text };
}

async function fetchTextWithRetry(path, attempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchText(path);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }

      console.log(`  ⏳ retrying ${path} after ${error.message}`);
    }
  }

  throw lastError;
}

async function checkPage(path, matcher) {
  const page = await fetchTextWithRetry(path, 2);
  check(`${path} responds 200`, page.response.status === 200, `status ${page.response.status}`);
  check(`${path} serves HTML`, (page.response.headers.get("content-type") || "").includes("text/html"));
  check(`${path} includes expected shell`, matcher(page.text));
}

console.log(`\n🔎 Admin HTTP smoke test against ${DEFAULT_BASE_URL}\n`);

try {
  console.log("── Route reachability ──");
  const root = await fetch(`${DEFAULT_BASE_URL}/`, {
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const rootLocation = root.headers.get("location") || "";
  check("root redirects to dashboard", root.status >= 300 && root.status < 400 && rootLocation.includes("/dashboard"), `status ${root.status}${rootLocation ? `, location ${rootLocation}` : ""}`);

  const login = await fetchTextWithRetry("/login", 2);
  check("login route responds 200", login.response.status === 200, `status ${login.response.status}`);
  check("login page includes admin console shell", login.text.includes("Admin Console") && login.text.includes("Login"));

  const dashboard = await fetchTextWithRetry("/dashboard", 2);
  check("dashboard route responds 200", dashboard.response.status === 200, `status ${dashboard.response.status}`);
  check(
    "dashboard HTML includes dashboard shell or loading state",
    dashboard.text.includes("Dashboard") || dashboard.text.includes("Loading dashboard") || dashboard.text.includes("Loading command center")
  );

  await checkPage("/communication", (text) => text.includes("Communication") || text.includes("Loading command center"));
  await checkPage("/withdrawals", (text) => text.includes("Withdrawals") || text.includes("Loading command center"));
  await checkPage("/batches", (text) => text.includes("Batch Operations") || text.includes("Loading command center"));
  await checkPage("/creator-subscriptions", (text) => text.includes("Creator Subscriptions") || text.includes("Loading command center"));

  console.log("\n── Response headers ──");
  check(
    "login page served as HTML",
    (login.response.headers.get("content-type") || "").includes("text/html"),
    login.response.headers.get("content-type") || "missing content-type"
  );
  check(
    "dashboard page served as HTML",
    (dashboard.response.headers.get("content-type") || "").includes("text/html"),
    dashboard.response.headers.get("content-type") || "missing content-type"
  );
} catch (error) {
  console.log(`  ❌ Smoke test failed to reach admin app — ${error.message}`);
  fail += 1;
}

console.log(`\nResults: ${pass} passed, ${fail} failed`);

if (fail > 0) {
  process.exit(1);
}

console.log("✅ Admin smoke test passed\n");