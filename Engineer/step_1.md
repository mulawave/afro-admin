Good. Step 1 = **foundation**. If this is wrong, everything breaks later.

No shortcuts. This is **production layout + routing + protection**.

---

# 🧱 STEP 1 — ADMIN LAYOUT + ROUTING (NEXT.JS APP ROUTER)

---

# 1️⃣ FINAL STRUCTURE (LOCK THIS)

```text
src/app/
 ├── (auth)/
 │    └── login/
 │         └── page.jsx
 │
 ├── (admin)/
 │    ├── layout.jsx        ← protected layout
 │    ├── dashboard/
 │    │     └── page.jsx
 │    ├── users/page.jsx
 │    ├── channels/page.jsx
 │    ├── gifts/page.jsx
 │    ├── ledger/page.jsx
 │    ├── wallets/page.jsx
 │    ├── settings/page.jsx
 │    ├── blockchain/page.jsx
 │    ├── economy/page.jsx
 │    ├── audit/page.jsx
 │
 ├── layout.jsx             ← root layout
 └── page.jsx               ← redirect
```

---

# 2️⃣ ROOT LAYOUT

```jsx
// src/app/layout.jsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

# 3️⃣ ROOT REDIRECT

```jsx
// src/app/page.jsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

---

# 4️⃣ ADMIN LAYOUT (CORE)

```jsx
// src/app/(admin)/layout.jsx
"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AdminLayout({ children }) {
  useAuthGuard(); // 🔒 protect all admin routes

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

# 5️⃣ AUTH GUARD (CRITICAL)

```javascript
// src/lib/useAuthGuard.js
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.push("/login");
    }
  }, []);
}
```

---

# 6️⃣ SIDEBAR (FULL NAVIGATION)

```jsx
// src/components/layout/Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Users", path: "/users" },
  { name: "Channels", path: "/channels" },
  { name: "Gifts", path: "/gifts" },
  { name: "Wallets", path: "/wallets" },
  { name: "Ledger", path: "/ledger" },
  { name: "Economy", path: "/economy" },
  { name: "Blockchain", path: "/blockchain" },
  { name: "Settings", path: "/settings" },
  { name: "Audit", path: "/audit" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-black text-white p-4">
      <h1 className="text-xl mb-6">AfroVision Admin</h1>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`block p-2 rounded ${
              pathname === link.path
                ? "bg-purple-600"
                : "hover:bg-gray-800"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

---

# 7️⃣ HEADER

```jsx
// src/components/layout/Header.jsx
"use client";

export default function Header() {
  function logout() {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
  }

  return (
    <header className="bg-white shadow p-4 flex justify-between">
      <h2 className="font-bold">Admin Console</h2>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </header>
  );
}
```

---

# 8️⃣ LOGIN PAGE

```jsx
// src/app/(auth)/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const res = await api.post("/admin/login", {
      email,
      password,
    });

    localStorage.setItem("admin_token", res.data.token);
    router.push("/dashboard");
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-6 bg-white shadow rounded w-80">
        <h1 className="mb-4 text-xl">Admin Login</h1>

        <input
          className="w-full mb-2 p-2 border"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-2 border"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white p-2"
        >
          Login
        </button>
      </div>
    </div>
  );
}
```

---

# 9️⃣ SAMPLE PAGE (DASHBOARD)

```jsx
// src/app/(admin)/dashboard/page.jsx
export default function Dashboard() {
  return <div>Dashboard Loaded</div>;
}
```

---

# 🔟 ROUTING RESULT

```text
/login        → public
/dashboard    → protected
/users        → protected
/settings     → protected
```

---

# 🔒 SECURITY (MANDATORY NEXT)

```text
- Replace localStorage token later with httpOnly cookie
- Validate token on backend
- Add role check (admin/super_admin)
```

---

# ✅ STEP 1 COMPLETE

You now have:

```text
✔ Protected admin routes
✔ Layout system
✔ Sidebar navigation
✔ Login flow
✔ Clean routing structure
```

---

# 🎯 NEXT STEP

Say:

👉 **“build dashboard (step 2)”**
