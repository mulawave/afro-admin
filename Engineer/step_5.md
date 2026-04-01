Good. This is the **most sensitive layer** — money + blockchain + runtime control.

Build it clean, guarded, and auditable.

---

# 🧱 STEP 5 — ECONOMY + BLOCKCHAIN + SETTINGS

---

# 🧠 GLOBAL RULES

```text id="e1"
- All writes go through backend
- Super-admin only for sensitive fields
- Every change → audit log
- Confirm modal + re-auth for critical updates
```

---

# 🧱 1️⃣ ECONOMY PANEL

## 📍 Route

```text id="e2"
/admin/economy
```

---

## 🔧 PAGE

```jsx id="e3"
// src/app/(admin)/economy/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function EconomyPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api.get("/admin/economy");
    setData(res.data);
  }

  async function update(key, value) {
    await api.patch("/admin/economy", { key, value });
    load();
  }

  if (!data) return "Loading...";

  return (
    <div className="space-y-6">

      <h1>Economy Control</h1>

      {/* RATES */}
      <Section title="Rates">
        <Input label="VPT Price (₦)"
          value={data.VPT_PRICE_NGN}
          onSave={(v) => update("VPT_PRICE_NGN", +v)}
        />

        <Input label="NGN → BNB Rate"
          value={data.NGN_TO_BNB_RATE}
          onSave={(v) => update("NGN_TO_BNB_RATE", +v)}
        />
      </Section>

      {/* SPLITS */}
      <Section title="Split Rules">
        <Input label="Creator %"
          value={data.SPLIT_CREATOR}
          onSave={(v) => update("SPLIT_CREATOR", +v)}
        />

        <Input label="Operations %"
          value={data.SPLIT_OPS}
          onSave={(v) => update("SPLIT_OPS", +v)}
        />

        <Input label="Community %"
          value={data.SPLIT_COMMUNITY}
          onSave={(v) => update("SPLIT_COMMUNITY", +v)}
        />
      </Section>

      {/* POOLS */}
      <Section title="Pools">
        <div>Operations ₦: {data.pools.operations_ngn}</div>
        <div>Community ₦: {data.pools.community_ngn}</div>
        <div>Operations vPT: {data.pools.operations_vpt}</div>
        <div>Community vPT: {data.pools.community_vpt}</div>
      </Section>

    </div>
  );
}
```

---

## 🧩 REUSABLE INPUT

```jsx id="e4"
function Input({ label, value, onSave }) {
  const [val, setVal] = useState(value);

  return (
    <div className="flex gap-2 items-center">
      <span className="w-48">{label}</span>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="border p-1"
      />
      <button onClick={() => onSave(val)}>Save</button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white p-4 shadow rounded">
      <h2 className="mb-2">{title}</h2>
      {children}
    </div>
  );
}
```

---

# 🧱 2️⃣ BLOCKCHAIN PANEL

## 📍 Route

```text id="e5"
/admin/blockchain
```

---

## 🔧 PAGE

```jsx id="e6"
// src/app/(admin)/blockchain/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function BlockchainPage() {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api.get("/admin/blockchain");
    setCfg(res.data);
  }

  async function save(key, value) {
    if (!confirm("Confirm update?")) return;

    await api.patch("/admin/blockchain", { key, value });
    load();
  }

  if (!cfg) return "Loading...";

  return (
    <div className="space-y-6">

      <h1>Blockchain Control</h1>

      {/* ENV */}
      <Section title="Environment">
        <select
          value={cfg.ENVIRONMENT}
          onChange={(e) => save("ENVIRONMENT", e.target.value)}
        >
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </Section>

      {/* CONTRACTS */}
      <Section title="Contracts">
        <Input label="VPT Token"
          value={cfg.VPT_TOKEN_ADDRESS}
          onSave={(v) => save("VPT_TOKEN_ADDRESS", v)}
        />

        <Input label="Router"
          value={cfg.PANCAKE_ROUTER_ADDRESS}
          onSave={(v) => save("PANCAKE_ROUTER_ADDRESS", v)}
        />

        <Input label="WBNB"
          value={cfg.WBNB_ADDRESS}
          onSave={(v) => save("WBNB_ADDRESS", v)}
        />
      </Section>

      {/* RPC */}
      <Section title="RPC">
        <Input label="RPC URL"
          value={cfg.BSC_RPC_URL}
          onSave={(v) => save("BSC_RPC_URL", v)}
        />
      </Section>

      {/* TREASURY */}
      <Section title="Treasury">
        <Input label="Private Key"
          value="*************"
          onSave={(v) => save("TREASURY_PRIVATE_KEY", v)}
        />
      </Section>

    </div>
  );
}
```

---

# 🧱 3️⃣ SETTINGS PANEL (GLOBAL CONFIG)

## 📍 Route

```text id="e7"
/admin/settings
```

---

## 🔧 PAGE

```jsx id="e8"
// src/app/(admin)/settings/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api.get("/admin/settings");
    setSettings(res.data);
  }

  async function save(key, value) {
    await api.patch("/admin/settings", { key, value });
  }

  return (
    <div>
      <h1>System Settings</h1>

      {Object.keys(settings).map((key) => (
        <Input
          key={key}
          label={key}
          value={settings[key]}
          onSave={(v) => save(key, v)}
        />
      ))}
    </div>
  );
}
```

---

# 🧱 4️⃣ REQUIRED BACKEND ENDPOINTS

```text id="e9"
GET    /admin/economy
PATCH  /admin/economy

GET    /admin/blockchain
PATCH  /admin/blockchain

GET    /admin/settings
PATCH  /admin/settings
```

---

# 🔒 5️⃣ CRITICAL SECURITY (NON-NEGOTIABLE)

```text id="e10"
- TREASURY_PRIVATE_KEY:
   → never returned raw
   → only update allowed

- ENV switch:
   → require password re-entry

- Split rules:
   → must always total 100%

- All changes:
   → write to audit_logs
```

---

# 🧠 WHAT YOU NOW HAVE

```text id="e11"
✔ Full economy control
✔ Blockchain configuration control
✔ Runtime environment switching
✔ Token + swap infrastructure control
✔ Centralized settings system
```

---

# 🚨 THIS PANEL CONTROLS REAL MONEY

```text id="e12"
Any mistake here =
financial loss
```

---

# 🎯 NEXT STEP

Say:

👉 **“build communication + audit + feature flags panel (step 6)”**

That completes the **entire admin command center**.
