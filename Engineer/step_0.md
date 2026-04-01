This will guide you on what we aer building the steps and the overal plan so study this and then proceed to read step_1.md 

Let’s build the **real Admin Console (AfroVision Command Center)** — the one that can actually run the platform.

No fluff. Full structure + implementation direction.
Building rule: you must build and test in a strict sequential step by step process. 
---

# 🧠 AFROVISION ADMIN CONSOLE — V3 (ENTERPRISE)

## 🎯 OBJECTIVE

```text
One interface to control:
- Economy
- Blockchain
- Users
- Streaming
- Infrastructure
- Growth
```

---

# 🧱 1️⃣ SYSTEM ARCHITECTURE (FRONTEND)

```text
Next.js (App Router)

State:
- React Query (data)
- Zustand (global state)

UI:
- Tailwind + component system

Security:
- Middleware (route protection)
```

---

# 🧱 2️⃣ REAL FOLDER STRUCTURE (SCALED)

```text
src/
 ├── app/
 │   ├── dashboard/
 │   ├── users/
 │   ├── creators/
 │   ├── channels/
 │   ├── broadcasts/
 │   ├── economy/
 │   ├── blockchain/
 │   ├── wallets/
 │   ├── ledger/
 │   ├── gifts/
 │   ├── plans/
 │   ├── withdrawals/
 │   ├── communication/
 │   ├── feature-flags/
 │   ├── settings/
 │   ├── audit/
 │   ├── system/
 │
 ├── components/
 │   ├── data-table/
 │   ├── forms/
 │   ├── charts/
 │   ├── modals/
 │   ├── layout/
 │
 ├── services/
 │   ├── api/
 │   ├── hooks/
 │
 ├── store/
```

---

# 🧱 3️⃣ CORE PANELS (FULL BREAKDOWN)

---

## 📊 DASHBOARD (REAL METRICS)

```text
- Active users (live)
- Active streams
- Gift volume (₦ + vPT)
- Swap volume
- Revenue split summary
- System health
```

---

## 👤 USERS PANEL (ADVANCED)

```text
- Search (email, uid)
- View profile
- View wallet
- View full ledger
- Ban / suspend
- Delete user (hard delete)
- Convert to creator/admin
```

---

## 🎥 CHANNELS + BROADCAST PANEL

```text
- View all channels (public + private)
- Live status indicator
- Force stop stream
- View schedule (EPG)
- Edit / delete channel
```

---

## 💰 ECONOMY CONTROL PANEL

```text
- VPT price (₦)
- NGN → BNB rate
- Split ratios (50/30/20 editable)
- Pool balances
- Live economy stats
```

---

## 🔗 BLOCKCHAIN PANEL (CRITICAL)

```text
- ENV switch (staging/production)
- RPC URL
- Treasury wallet (masked)
- Contract addresses
- Liquidity status (manual check)
- Last swap logs
```

---

### 🔧 UI (Example)

```jsx
<input value={settings.VPT_TOKEN_ADDRESS} />
<button>Update Contract</button>
```

---

## 💼 WALLET PANEL

```text
- View any wallet
- Adjust balance (vPT / NGN)
- See transaction history
- Freeze wallet
```

---

## 📜 LEDGER PANEL (PRO LEVEL)

```text
- Filter:
  • by user
  • by type
  • by channel
  • by date

- Export CSV
- Drill-down transaction view
```

---

## 🎁 GIFTS PANEL

```text
- Create gift
- Set:
   • currency
   • price
   • animation
- Drag to reorder
- Enable / disable
```

---

## 📦 PLANS PANEL

```text
- Add / edit plans
- Toggle features
- Set price
```

---

## 💸 WITHDRAWALS PANEL

```text
- View requests
- Approve / reject
- Mark as paid
- Track status
```

---

## 📡 COMMUNICATION PANEL

```text
- Send push notification
- Send email broadcast
- Send SMS
- Segment users (future)
```

---

## 🚦 FEATURE FLAGS PANEL

```text
- Toggle:
   • gifting
   • streaming
   • withdrawals
```

---

## ⚙️ SYSTEM SETTINGS PANEL

```text
- All runtime configs editable
- Secrets masked
- Audit logged
```

---

## 📜 AUDIT PANEL

```text
- Every admin action
- Filter by:
   • admin
   • action
   • time
```

---

## 🧠 SYSTEM HEALTH PANEL

```text
- API status
- Swap success rate
- Error logs
- Queue status
```

---

# 🧱 4️⃣ DATA TABLE COMPONENT (REUSABLE)

```jsx
export function DataTable({ columns, data }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          {columns.map(c => <th key={c}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            {columns.map(c => <td>{row[c]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

# 🧱 5️⃣ GLOBAL MODAL SYSTEM

```jsx
// Confirm actions like delete / env switch
openModal({
  title: "Confirm Delete",
  onConfirm: () => deleteUser(id)
});
```

---

# 🧱 6️⃣ ROLE-BASED ROUTE PROTECTION

```javascript
// middleware.js
export function middleware(req) {
  const role = getRole(req);

  if (role !== "admin" && role !== "super_admin") {
    return redirect("/login");
  }
}
```

---

# 🧱 7️⃣ CRITICAL ACTION GUARDS

```text
- Delete user → confirm modal
- Switch ENV → password confirm
- Update private key → re-auth
```

---

# 🧱 8️⃣ REAL-TIME UPDATES

Use Firestore listeners for:

```text
- live streams
- gifts
- ledger updates
```

---

# 🧱 9️⃣ CHARTS (IMPORTANT)

Use:

```bash
npm install recharts
```

Show:

```text
- revenue over time
- gift activity
- user growth
```

---

# 🧱 🔟 PERFORMANCE

```text
- pagination on all tables
- server-side filtering
- lazy loading pages
```

---

# 🧱 1️⃣1️⃣ SECURITY

```text
- No secrets rendered raw
- All writes via backend
- Token expiry
- Admin session timeout
```

---

# 🧱 1️⃣2️⃣ UI EXPERIENCE (IMPORTANT)

```text
- Fast navigation
- Clean layout
- Minimal clicks to perform actions
```

---

# 🚀 BUILD ORDER (DO THIS EXACTLY)

## STEP 1

```text
Layout + Sidebar + Routing
```

## STEP 2

```text
Dashboard (metrics)
```

## STEP 3

```text
Users + Wallet + Ledger panels
```

## STEP 4

```text
Gifts + Plans + Channels
```

## STEP 5

```text
Economy + Blockchain + Settings
```

## STEP 6

```text
Communication + Audit + Feature Flags
```

---

# 🧠 FINAL TRUTH

What you are building now is not:

```text
“an admin page”
```

It is:

```text
A CONTROL SYSTEM for a digital economy + media platform
```

---

# 🎯 NEXT MOVE

Say:

👉 **“build admin layout + routing (step 1)”**

