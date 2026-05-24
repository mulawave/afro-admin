# AfroVision — Admin Features Memory

> **Policy**: Every new module/feature implementation MUST include its admin controls documented here.
> Admin has full control and management over every aspect of the project.

## Wiring Status

### Backend Admin Wiring
- Admin HTTP access is protected by token auth via `/admin/*` and `/vpt/admin/*` route groups.
- Role enforcement is performed server-side in `backend/src/admin/admin.controller.js` and `backend/src/vpt/vpt.controller.js` using `requireAdmin(...)` checks.
- Runtime admin settings are backed by Firestore only through `backend/src/admin/settings.service.js`.

### Frontend Admin Wiring
- There is intentionally **no dedicated admin settings UI yet**.
- Current admin-facing Flutter wiring is limited to the admin-only blockchain preflight visibility on the Digital Assets screen.
- Existing frontend admin hook points:
	- `lib/features/wallet/services/wallet_service.dart` → `getBlockchainPreflight()`
	- `lib/features/wallet/screens/digital_assets_screen.dart` → admin-only preflight card rendering

### Deferred By Design
- Full admin dashboard UI
- Admin settings screen/editor UI
- Admin user/channel/wallet management screens
- These remain documented here as pending implementations and should not be treated as already built frontend surfaces.

---

## Module 1 — Auth & User Management

### Implemented ✅
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Set User Role | `/admin/set-role` | POST | Assign role: viewer / creator / admin |
| Set Premium Creator | `/admin/set-premium` | POST | Toggle premium creator status (bool) |
| Set KYC Status | `/admin/set-kyc` | POST | Set KYC: none / pending / verified |

### TODO 🔲
- [ ] **List All Users** — GET `/admin/users` — paginated user list with filters (role, kyc, premium, subscription status)
- [ ] **Get User Detail** — GET `/admin/users/:id` — full user profile with subscription, wallet, vPT balance, ledger history
- [ ] **Suspend/Ban User** — POST `/admin/users/:id/suspend` — disable user account
- [ ] **Delete User** — DELETE `/admin/users/:id` — remove user and related data
- [ ] **Admin Bootstrap** — POST `/admin/bootstrap` — create first admin (one-time, when no admin exists)
- [ ] **Audit Log for Role Changes** — log all role/kyc/premium changes to ledger

---

## Module 2 — Subscription Plans

### Implemented ✅
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Create Plan | `/admin/plans` | POST | Create subscription plan (name, price, currency, features, badge) |
| Update Plan | `/admin/plans/:id` | PATCH | Update plan fields |
| Delete Plan | `/admin/plans/:id` | DELETE | Remove plan |
| Add Feature to Plan | `/admin/plans/:id/features` | POST | Add feature key + label |
| Remove Feature from Plan | `/admin/plans/:id/features/:feature` | DELETE | Remove feature from plan |

### TODO 🔲
- [ ] **List All Plans** — GET `/admin/plans` — list all plans (active + inactive)
- [ ] **Toggle Plan Active/Inactive** — PATCH `/admin/plans/:id/toggle` — enable/disable plan without deleting
- [ ] **View Plan Subscribers** — GET `/admin/plans/:id/subscribers` — list users on a specific plan
- [ ] **Subscription Analytics** — GET `/admin/subscriptions/stats` — total revenue, plan distribution, churn rate
- [ ] **Override User Subscription** — POST `/admin/users/:id/subscription` — manually set/extend user subscription

---

## Module 3 — Channels & Categories

### Implemented ✅
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| List Categories | `/admin/categories` | GET | Get all categories (including inactive) |
| Create Category | `/admin/categories` | POST | Create new content category |
| Update Category | `/admin/categories/:id` | PATCH | Update category name/status |
| Delete Category | `/admin/categories/:id` | DELETE | Remove category |

### TODO 🔲
- [ ] **List All Channels** — GET `/admin/channels` — paginated list of all channels with stats
- [ ] **Get Channel Detail** — GET `/admin/channels/:id` — full channel data + subscriber count + revenue
- [ ] **Suspend Channel** — POST `/admin/channels/:id/suspend` — disable a channel
- [ ] **Delete Channel** — DELETE `/admin/channels/:id` — remove channel and content
- [ ] **Feature/Pin Channel** — POST `/admin/channels/:id/feature` — promote channel on home screen
- [ ] **Content Moderation Queue** — GET `/admin/moderation` — flagged content review
- [ ] **Channel Analytics** — GET `/admin/channels/stats` — growth, engagement, top creators

---

## Module 4 — Currencies

### Implemented ✅
_(Currencies are currently hardcoded with static rates)_

### TODO 🔲
- [ ] **View Currency Rates** — GET `/admin/currencies` — list all currency conversion rates
- [ ] **Update Currency Rate** — PATCH `/admin/currencies/:code` — set custom conversion rate
- [ ] **Add Currency** — POST `/admin/currencies` — add new supported currency
- [ ] **Toggle Currency Active** — PATCH `/admin/currencies/:code/toggle` — enable/disable currency

---

## Module 5 — Economic Engine (vPT / Wallet / Distribution)

### Implemented ✅
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Queue Stats | `/vpt/admin/stats` | GET | Pending/processing/completed/failed counts, total NGN pending, total vPT distributed |
| Ledger Stats | `/vpt/admin/ledger-stats` | GET | Aggregated ledger counts and financial stats |
| Full Ledger | `/vpt/admin/ledger` | GET | System-wide financial audit trail (limit param) |
| Batch History | `/vpt/admin/batches` | GET | View processed batch history |
| Failed Batches | `/vpt/admin/batches/failed` | GET | View retry-eligible failed batches |
| Retry Batch | `/vpt/admin/batches/:batchId/retry` | POST | Retry a failed distribution batch |
| Blockchain Preflight | `/vpt/admin/preflight` | GET | Staging blockchain readiness, missing settings, chain validation |
| Trigger Batch Process | `/vpt/admin/process-batch` | POST | Manually trigger vPT batch swap + distribution |
| Treasury Dashboard | `/vpt/admin/treasury` | GET | Treasury wallet balance and token balance |

### TODO 🔲
- [ ] **View All Wallets** — GET `/admin/wallets` — list all BSC wallets with balances
- [ ] **Get Wallet Detail** — GET `/admin/wallets/:userId` — wallet info + transaction history
- [ ] **Freeze Wallet** — POST `/admin/wallets/:userId/freeze` — disable wallet transactions
- [ ] **Set vPT Balance** — POST `/admin/users/:id/vpt-balance` — manual vPT balance adjustment
- [ ] **Retry Failed Distributions** — POST `/admin/distributions/retry` — retry all failed queue items
- [ ] **Distribution History** — GET `/admin/distributions` — paginated distribution history with filters
- [ ] **Treasury Dashboard** — GET `/admin/treasury` — treasury wallet balance, total swaps, total distributed

---

## Module 5.1 — Admin Settings (Runtime Config)

### Implemented ✅
| Feature | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Get All Settings | `/admin/settings` | GET | View all configurable settings with categories |
| Get Setting by Key | `/admin/settings/:key` | GET | View single setting |
| Update Setting | `/admin/settings/:key` | PATCH | Update setting value in Firestore |
| Bulk Update Settings | `/admin/settings/bulk` | PATCH | Update multiple settings in Firestore |
| Reset Setting to Default | `/admin/settings/:key/reset` | POST | Reset setting to Firestore-backed default |
| Settings Auto-Initialization | internal | startup/service | Missing setting docs are created in Firestore automatically |
| Default Backfill | internal | startup/service | Existing null/empty settings are backfilled from intended defaults |

### Configurable Settings
| Key | Category | Description | Firestore Default |
|-----|----------|-------------|-------------------|
| `WALLET_SECRET` | blockchain | AES-256-CBC wallet encryption secret | `null` |
| `BSC_RPC` | blockchain | BSC RPC endpoint URL | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
| `TREASURY_PRIVATE_KEY` | blockchain | Treasury wallet private key | `null` |
| `VPT_TOKEN_ADDRESS` | blockchain | vPT token contract address | `0x0000000000000000000000000000000000000000` placeholder |
| `PANCAKE_ROUTER` | blockchain | PancakeSwap router contract address | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` |
| `WBNB_ADDRESS` | blockchain | WBNB token contract address | `0xae13d989dac2f0debff460ac112a837c89baa7cd` |
| `NGN_TO_BNB_RATE` | rates | NGN to BNB conversion rate | `0.0000004` |
| `COMMUNITY_POOL_PERCENT` | rates | % of subscription allocated to community pool | `20` |
| `VPT_EXTRACTION_PERCENT` | rates | % of community pool extracted for vPT conversion | `30` |
| `VPT_PRICE_NGN` | rates | Reference price of 1 vPT in Naira | `750` |
| `BATCH_SIZE` | system | Max items per batch distribution | hardcoded (100) |
| `MAX_RETRY_ATTEMPTS` | system | Max retry attempts for failed distributions | hardcoded (3) |
| `JWT_SECRET` | system | JWT signing secret for API authentication | `null` |
| `ENVIRONMENT` | system | Runtime environment guard for blockchain execution | `staging` |

### Source Of Truth
- Firestore is the single source of truth for admin runtime settings.
- `.env` fallback is not part of the admin settings model.
- Sensitive values that still require real operator input and are intentionally not auto-generated:
	- `WALLET_SECRET`
	- `TREASURY_PRIVATE_KEY`
	- `JWT_SECRET`
- `VPT_TOKEN_ADDRESS` may be initialized with a placeholder zero address, but blockchain readiness should still treat that as not configured until replaced with the real token contract.

### TODO 🔲
- [ ] **Settings Change Audit Log** — log every settings change with who/when/old-value/new-value
- [ ] **Settings Encryption** — encrypt sensitive settings (private keys, secrets) at rest
- [ ] **Settings Validation** — validate setting values (e.g., valid BSC address, valid URL format)
- [ ] **Settings Export/Import** — export/import settings as JSON for backup/migration
- [ ] **Dedicated Admin Settings UI** — deferred by product decision; backend exists, frontend editor intentionally not built yet

---

## Global Admin TODO 🔲

- [ ] **Admin Dashboard Summary** — GET `/admin/dashboard` — aggregated stats (users, revenue, vPT, channels)
- [ ] **Dedicated Admin App Surfaces** — full Flutter admin UI is intentionally deferred; do not assume an admin dashboard/settings app already exists
- [ ] **System Health** — GET `/admin/health` — server status, memory usage, queue backlog
- [ ] **Activity Log** — GET `/admin/activity` — recent admin actions audit trail
- [ ] **Notification System** — POST `/admin/notifications` — send system notifications to users
- [ ] **Maintenance Mode** — POST `/admin/maintenance` — toggle maintenance mode (block non-admin requests)
- [ ] **Backup/Export** — GET `/admin/export` — export all data as JSON (for migration to database)
