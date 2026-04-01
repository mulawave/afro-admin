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
            className={`block p-2 rounded ${pathname === link.path ? "bg-blue-600" : "hover:bg-gray-800"}`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
