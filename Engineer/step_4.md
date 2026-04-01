Good. This is **core control of monetization + content**.

We build:

```text
Gifts + Plans + Channels
```

Fully actionable. No placeholders.

---

# 🧱 STEP 4 — GIFTS + PLANS + CHANNELS PANEL

---

# 🎁 1️⃣ GIFTS PANEL (FULL CONTROL)

## 📍 Route

```text
/admin/gifts
```

---

## 🔧 PAGE

```jsx
// src/app/(admin)/gifts/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import GiftForm from "@/components/gifts/GiftForm";

export default function GiftsPage() {
  const [gifts, setGifts] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api.get("/admin/gifts");
    setGifts(res.data);
  }

  return (
    <div>
      <h1 className="text-xl mb-4">Gifts</h1>

      <button onClick={() => setEditing({})}>+ Add Gift</button>

      <div className="mt-4 space-y-2">
        {gifts.map(g => (
          <div key={g.id} className="flex justify-between p-3 bg-white shadow">
            <div>
              {g.icon} {g.name} — {g.currency === "vpt"
                ? g.vpt_units + " units"
                : "₦" + g.naira_value}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditing(g)}>Edit</button>

              <button onClick={() => toggle(g)}>
                {g.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <GiftForm gift={editing} onClose={() => {
          setEditing(null);
          load();
        }} />
      )}
    </div>
  );

  async function toggle(g) {
    await api.patch(`/admin/gifts/${g.id}`, {
      is_active: !g.is_active
    });
    load();
  }
}
```

---

## 🧱 GIFT FORM

```jsx
// src/components/gifts/GiftForm.jsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function GiftForm({ gift, onClose }) {
  const [form, setForm] = useState(gift);

  async function save() {
    if (form.id) {
      await api.patch(`/admin/gifts/${form.id}`, form);
    } else {
      await api.post("/admin/gifts", form);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-6 w-96">

        <input placeholder="Name"
          onChange={e => setForm({...form, name: e.target.value})} />

        <input placeholder="Icon"
          onChange={e => setForm({...form, icon: e.target.value})} />

        <select onChange={e => setForm({...form, currency: e.target.value})}>
          <option value="vpt">vPT</option>
          <option value="ngn">NGN</option>
        </select>

        {form.currency === "vpt" ? (
          <input placeholder="vPT Units"
            onChange={e => setForm({...form, vpt_units: +e.target.value})} />
        ) : (
          <input placeholder="₦ Value"
            onChange={e => setForm({...form, naira_value: +e.target.value})} />
        )}

        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}
```

---

# 📦 2️⃣ PLANS PANEL

## 📍 Route

```text
/admin/plans
```

---

## 🔧 PAGE

```jsx
// src/app/(admin)/plans/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get("/admin/plans").then(res => setPlans(res.data));
  }, []);

  async function update(plan, field, value) {
    await api.patch(`/admin/plans/${plan.id}`, {
      [field]: value
    });
  }

  return (
    <div>
      <h1>Plans</h1>

      {plans.map(p => (
        <div key={p.id} className="p-4 bg-white mb-2">

          <input
            value={p.name}
            onChange={e => update(p, "name", e.target.value)}
          />

          <input
            value={p.price_ngn}
            onChange={e => update(p, "price_ngn", +e.target.value)}
          />

          <label>
            Private Channels
            <input
              type="checkbox"
              checked={p.features.private_channels}
              onChange={e =>
                update(p, "features.private_channels", e.target.checked)
              }
            />
          </label>

        </div>
      ))}
    </div>
  );
}
```

---

# 📺 3️⃣ CHANNELS PANEL (FULL CONTROL)

## 📍 Route

```text
/admin/channels
```

---

## 🔧 PAGE

```jsx
// src/app/(admin)/channels/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await api.get("/admin/channels");
    setChannels(res.data);
  }

  return (
    <div>
      <h1>Channels</h1>

      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Type</th>
            <th>Status</th>
            <th>Live</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {channels.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.owner_uid}</td>
              <td>{c.is_private ? "Private" : "Public"}</td>
              <td>{c.is_active ? "Active" : "Disabled"}</td>
              <td>{c.is_live ? "LIVE" : "-"}</td>

              <td className="flex gap-2">
                <button onClick={() => toggle(c)}>
                  {c.is_active ? "Disable" : "Enable"}
                </button>

                <button onClick={() => stop(c)}>
                  Stop Stream
                </button>

                <button onClick={() => remove(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  async function toggle(c) {
    await api.patch(`/admin/channels/${c.id}`, {
      is_active: !c.is_active
    });
    load();
  }

  async function stop(c) {
    await api.post(`/admin/channels/${c.id}/stop`);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete channel?")) return;
    await api.delete(`/admin/channels/${id}`);
    load();
  }
}
```

---

# 🧱 4️⃣ REQUIRED BACKEND ENDPOINTS

```text
GET    /admin/gifts
POST   /admin/gifts
PATCH  /admin/gifts/:id

GET    /admin/plans
PATCH  /admin/plans/:id

GET    /admin/channels
PATCH  /admin/channels/:id
POST   /admin/channels/:id/stop
DELETE /admin/channels/:id
```

---

# ⚠️ CRITICAL RULES

```text
- Gift changes affect economy instantly
- Plan changes affect feature access immediately
- Channel delete must clean:
   → programs
   → events
   → references
- Stop stream must force disconnect
```

---

# 🧠 WHAT YOU NOW HAVE

```text
✔ Full monetization control (gifts)
✔ Subscription control (plans)
✔ Content control (channels)
✔ Live stream override power
```

---

# 🎯 NEXT STEP

Say:

👉 **“build economy + blockchain + settings panel (step 5)”**

This is the **most sensitive panel** — where money, tokens, and infrastructure are controlled.
