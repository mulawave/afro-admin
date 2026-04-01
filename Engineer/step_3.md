Good. This is where the admin console becomes **powerful**.

We’re building **Users + Wallet + Ledger (fully connected, drill-down, actionable)**.

No shortcuts.

---

# 🧱 STEP 3 — USERS + WALLET + LEDGER PANEL

---

# 🧱 1️⃣ USERS PAGE (CORE CONTROL)

## 📍 Route

```text
/admin/users
```

---

## 🔧 PAGE

```jsx
// src/app/(admin)/users/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import UserDrawer from "@/components/users/UserDrawer";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }

  return (
    <div>
      <h1 className="text-xl mb-4">Users</h1>

      <table className="w-full">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>

              <td>
                <button onClick={() => setSelected(u)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
```

---

# 🧱 2️⃣ USER DRAWER (FULL CONTROL PANEL)

This is the **brain of user management**.

---

```jsx
// src/components/users/UserDrawer.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import WalletCard from "./WalletCard";
import LedgerTable from "./LedgerTable";

export default function UserDrawer({ user, onClose }) {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const w = await api.get(`/admin/wallet/${user.uid}`);
    const l = await api.get(`/admin/ledger/${user.uid}`);

    setWallet(w.data);
    setLedger(l.data);
  }

  async function deleteUser() {
    if (!confirm("Delete user?")) return;

    await api.delete(`/admin/users/${user.uid}`);
    onClose();
  }

  async function suspend() {
    await api.patch(`/admin/users/${user.uid}/status`, {
      status: "suspended",
    });
  }

  return (
    <div className="fixed right-0 top-0 w-[500px] h-full bg-white shadow p-4 overflow-y-auto">

      <div className="flex justify-between mb-4">
        <h2>User Details</h2>
        <button onClick={onClose}>X</button>
      </div>

      <p><b>Email:</b> {user.email}</p>
      <p><b>Role:</b> {user.role}</p>

      {/* ACTIONS */}
      <div className="flex gap-2 mt-3">
        <button onClick={suspend}>Suspend</button>
        <button onClick={deleteUser} className="text-red-500">
          Delete
        </button>
      </div>

      {/* WALLET */}
      {wallet && <WalletCard wallet={wallet} user={user} />}

      {/* LEDGER */}
      <LedgerTable data={ledger} />
    </div>
  );
}
```

---

# 🧱 3️⃣ WALLET CARD (WITH ADJUSTMENT)

```jsx
// src/components/users/WalletCard.jsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function WalletCard({ wallet, user }) {
  const [amount, setAmount] = useState("");

  async function adjust(type) {
    await api.post("/admin/wallet/adjust", {
      uid: user.uid,
      currency: "ngn",
      amount: type === "add" ? +amount : -amount,
    });

    alert("Updated");
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded">
      <h3>Wallet</h3>

      <p>NGN: ₦{wallet.ngn_balance}</p>
      <p>vPT: {wallet.vpt_units}</p>

      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex gap-2 mt-2">
        <button onClick={() => adjust("add")}>+ Add</button>
        <button onClick={() => adjust("remove")}>- Remove</button>
      </div>
    </div>
  );
}
```

---

# 🧱 4️⃣ LEDGER TABLE (FILTERABLE BASE)

```jsx
// src/components/users/LedgerTable.jsx
export default function LedgerTable({ data }) {
  return (
    <div className="mt-6">
      <h3>Ledger</h3>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map((l) => (
            <tr key={l.id}>
              <td>{l.type}</td>
              <td>
                {l.amount_ngn || l.amount_vpt_units}
              </td>
              <td>{l.currency}</td>
              <td>
                {new Date(l.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

# 🧱 5️⃣ GLOBAL LEDGER PAGE (FULL SYSTEM VIEW)

```jsx
// src/app/(admin)/ledger/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function LedgerPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/admin/ledger").then(res => setData(res.data));
  }, []);

  return (
    <div>
      <h1>Ledger</h1>

      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {data.map((l) => (
            <tr key={l.id}>
              <td>{l.uid}</td>
              <td>{l.type}</td>
              <td>{l.amount_ngn || l.amount_vpt_units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

# 🧱 6️⃣ REQUIRED BACKEND ENDPOINTS

```text
GET    /admin/users
GET    /admin/wallet/:uid
GET    /admin/ledger/:uid
GET    /admin/ledger

DELETE /admin/users/:uid
PATCH  /admin/users/:uid/status

POST   /admin/wallet/adjust
```

---

# 🧱 7️⃣ CRITICAL SAFETY RULES

```text
- Wallet adjustment MUST go through ledger
- Delete user MUST:
   → delete wallet
   → delete sessions
   → archive ledger (optional)
- Never allow negative balance
```

---

# 🧠 WHAT YOU NOW HAVE

```text
✔ Full user control
✔ Wallet visibility + control
✔ Ledger transparency
✔ Financial traceability
✔ Admin enforcement tools
```

---

# 🎯 NEXT STEP

Say:

👉 **“build gifts + plans + channels panel (step 4)”**

That’s where you control:

* monetization
* content
* platform structure
