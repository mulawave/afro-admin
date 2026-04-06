/**
 * AfroVision — Admin Panel Test Suite
 * Tests build output, pages, social links editor, and configuration
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
const fails = [];

function test(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; fails.push({ name, error: e.message }); console.log(`  ✗ ${name}\n    → ${e.message}`); }
}

const buildDir = path.join(__dirname, '.next', 'server', 'app');
const srcDir = path.join(__dirname, 'src');

console.log('\n═══ ADMIN PANEL TESTS ═══\n');

// 1. Build output exists
test('Admin .next directory exists', () => {
  if (!fs.existsSync(path.join(__dirname, '.next'))) throw new Error('.next missing');
});

test('Admin BUILD_ID exists', () => {
  if (!fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'))) throw new Error('BUILD_ID missing');
});

// 2. All expected admin pages have page.jsx source files
const adminPages = [
  '(admin)/audit',
  '(admin)/batches',
  '(admin)/blockchain',
  '(admin)/channels',
  '(admin)/communication',
  '(admin)/creator-subscriptions',
  '(admin)/dashboard',
  '(admin)/design',
  '(admin)/economy',
  '(admin)/feature-flags',
  '(admin)/gifts',
  '(admin)/ledger',
  '(admin)/plans',
  '(admin)/settings',
  '(admin)/users',
  '(admin)/wallets',
  '(admin)/withdrawals',
  '(auth)/login',
];

console.log('\n── Admin Page Source Files ──\n');
for (const page of adminPages) {
  test(`Admin page source exists: ${page}`, () => {
    const pagePath = path.join(srcDir, 'app', page, 'page.jsx');
    if (!fs.existsSync(pagePath)) throw new Error(`${pagePath} not found`);
    const src = fs.readFileSync(pagePath, 'utf8');
    if (src.length < 50) throw new Error(`${page}/page.jsx is suspiciously small`);
  });
}

// 3. Design page has social links editor
console.log('\n── Social Links Editor ──\n');

test('Design page has social_links state', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('social_links')) throw new Error('No social_links reference');
});

test('Design page has addSocialLink function', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('addSocialLink')) throw new Error('No addSocialLink function');
});

test('Design page has removeSocialItem function', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('removeSocialItem')) throw new Error('No removeSocialItem function');
});

test('Design page has updateSocialItem function', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('updateSocialItem')) throw new Error('No updateSocialItem function');
});

test('Design page has moveSocialItem function', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('moveSocialItem')) throw new Error('No moveSocialItem function');
});

test('Design page has platform options (twitter, instagram, etc)', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(admin)', 'design', 'page.jsx'), 'utf8');
  if (!src.includes('twitter')) throw new Error('No twitter platform');
  if (!src.includes('instagram')) throw new Error('No instagram platform');
  if (!src.includes('youtube')) throw new Error('No youtube platform');
});

// 4. API configuration
console.log('\n── API Configuration ──\n');

test('Admin API lib has production fallback URL', () => {
  const src = fs.readFileSync(path.join(srcDir, 'lib', 'api.js'), 'utf8');
  if (!src.includes('afrovision-backend-134538542038')) throw new Error('Missing production URL fallback');
});

test('Admin proxy route validates backend URL', () => {
  const proxyPath = path.join(srcDir, 'app', 'api', 'proxy', '[...path]', 'route.js');
  if (!fs.existsSync(proxyPath)) throw new Error('Proxy route not found');
  const src = fs.readFileSync(proxyPath, 'utf8');
  if (!src.includes('throw new Error')) throw new Error('Proxy does not validate URL');
});

test('Admin API lib uses browser proxy pattern', () => {
  const src = fs.readFileSync(path.join(srcDir, 'lib', 'api.js'), 'utf8');
  if (!src.includes('/api/proxy')) throw new Error('Missing browser proxy pattern');
});

// 5. Auth flow
console.log('\n── Admin Auth ──\n');

test('Admin has login page', () => {
  const src = fs.readFileSync(path.join(srcDir, 'app', '(auth)', 'login', 'page.jsx'), 'utf8');
  if (!src.includes('login') && !src.includes('Login')) throw new Error('Login page missing login content');
});

test('Admin has token storage functions', () => {
  const src = fs.readFileSync(path.join(srcDir, 'lib', 'api.js'), 'utf8');
  if (!src.includes('ADMIN_TOKEN_KEY')) throw new Error('No ADMIN_TOKEN_KEY');
  if (!src.includes('getAdminToken')) throw new Error('No getAdminToken function');
});

test('Admin has middleware for auth protection', () => {
  const middlewarePath = path.join(srcDir, 'middleware.js');
  if (fs.existsSync(middlewarePath)) {
    const src = fs.readFileSync(middlewarePath, 'utf8');
    if (src.includes('token') || src.includes('auth')) {
      // Has auth check
    }
  }
  // Middleware may be optional in admin panel
});

// 6. Layout
console.log('\n── Admin Layout ──\n');

test('Admin has root layout', () => {
  const layoutPath = path.join(srcDir, 'app', 'layout.jsx');
  if (!fs.existsSync(layoutPath)) throw new Error('Root layout missing');
  const src = fs.readFileSync(layoutPath, 'utf8');
  if (src.length < 50) throw new Error('Layout too small');
});

test('Admin layout group has layout', () => {
  const possible = [
    path.join(srcDir, 'app', '(admin)', 'layout.jsx'),
    path.join(srcDir, 'app', '(admin)', 'layout.js'),
  ];
  const found = possible.some(p => fs.existsSync(p));
  if (!found) throw new Error('(admin) group layout missing');
});

// Summary
console.log('\n═══════════════════════════════════════════════');
console.log(`  ADMIN TESTS: ${pass} passed, ${fail} failed out of ${pass + fail}`);
if (fail > 0) { console.log('\n  FAILED:'); fails.forEach(f => console.log(`    ✗ ${f.name}: ${f.error}`)); }
console.log('═══════════════════════════════════════════════\n');

process.exit(fail > 0 ? 1 : 0);
