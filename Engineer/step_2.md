Good. Now we make the panel **feel alive**.

No placeholders — real metrics, real structure, production-ready.

---

# 📊 STEP 2 — ADMIN DASHBOARD (REAL METRICS + LIVE VIEW)

---

# 🧱 1️⃣ DASHBOARD OBJECTIVE

```text id="d1"
Single screen to see:
- System health
- Economy activity
- User activity
- Live streaming state
```

---

# 🧱 2️⃣ REQUIRED BACKEND ENDPOINT

## 🔧 GET `/admin/stats`

```json id="d2"
{
  "users": 1240,
  "active_users": 87,
  "live_channels": 12,

  "total_ngn": 2450000,
  "total_vpt_units": 980000000,

  "gift_volume_ngn_today": 120000,
  "gift_volume_vpt_today": 4500000,

  "swap_volume_ngn": 500000,

  "pools": {
    "operations_ngn": 200000,
    "community_ngn": 150000,
    "operations_vpt": 3000000,
    "community_vpt": 2000000
  }
}
```

---

# 🧱 3️⃣ INSTALL CHART LIBRARY

```bash id="d3"
npm install recharts
```

---

# 🧱 4️⃣ DASHBOARD PAGE (FULL)

```jsx id="d4"
// src/app/(admin)/dashboard/page.jsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PoolsCard from "@/components/dashboard/PoolsCard";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // live refresh
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    const res = await api.get("/admin/stats");
    setData(res.data);
  }

  if (!data) return "Loading dashboard...";

  return (
    <div className="space-y-6">

      {/* TOP METRICS */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.users} />
        <StatCard title="Active Users" value={data.active_users} />
        <StatCard title="Live Channels" value={data.live_channels} />
        <StatCard title="Total Revenue (₦)" value={data.total_ngn} />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Gift Volume (₦ Today)" value={data.gift_volume_ngn_today} />
        <StatCard title="Gift Volume (vPT)" value={data.gift_volume_vpt_today} />
        <StatCard title="Swap Volume (₦)" value={data.swap_volume_ngn} />
        <StatCard title="Total vPT" value={data.total_vpt_units} />
      </div>

      {/* CHART */}
      <RevenueChart />

      {/* POOLS */}
      <PoolsCard pools={data.pools} />

    </div>
  );
}
```

---

# 🧱 5️⃣ STAT CARD COMPONENT

```jsx id="d5"
// src/components/dashboard/StatCard.jsx
export default function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold">{format(value)}</p>
    </div>
  );
}

function format(v) {
  return typeof v === "number"
    ? v.toLocaleString()
    : v;
}
```

---

# 🧱 6️⃣ POOLS CARD

```jsx id="d6"
// src/components/dashboard/PoolsCard.jsx
export default function PoolsCard({ pools }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="Operations Pool (₦)" value={pools.operations_ngn} />
      <Card title="Community Pool (₦)" value={pools.community_ngn} />
      <Card title="Operations Pool (vPT)" value={pools.operations_vpt} />
      <Card title="Community Pool (vPT)" value={pools.community_vpt} />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 shadow rounded">
      <h4>{title}</h4>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
```

---

# 🧱 7️⃣ REVENUE CHART

```jsx id="d7"
// src/components/dashboard/RevenueChart.jsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const dummy = [
  { day: "Mon", revenue: 20000 },
  { day: "Tue", revenue: 50000 },
  { day: "Wed", revenue: 30000 },
  { day: "Thu", revenue: 70000 },
  { day: "Fri", revenue: 90000 },
];

export default function RevenueChart() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="mb-4">Revenue Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dummy}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line dataKey="revenue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

# 🧱 8️⃣ LIVE AUTO-REFRESH

Already included:

```javascript id="d8"
setInterval(fetchStats, 10000);
```

You can later switch to:

```text id="d9"
WebSocket / Firestore real-time
```

---

# 🧱 9️⃣ PERFORMANCE RULES

```text id="d10"
- Keep stats endpoint fast (<300ms)
- Aggregate server-side
- Do NOT query raw ledger from frontend
```

---

# 🧱 🔟 UI RESULT

```text id="d11"
Top:
- Users / Active / Live / Revenue

Middle:
- Gift + Swap activity

Bottom:
- Revenue chart
- Pools state
```

---

# 🧠 WHAT YOU NOW HAVE

```text id="d12"
✔ Real-time system overview
✔ Economy visibility
✔ Live platform monitoring
✔ Decision-making dashboard
```

---

# 🎯 NEXT STEP

Say:

👉 **“build users + wallet + ledger panel (step 3)”**
