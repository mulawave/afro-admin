"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import UserDrawer from "@/components/users/UserDrawer";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(Array.isArray(res) ? res : res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const columns = [
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{filtered.length} users</span>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by email, UID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadUsers} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage="No users found"
          />
        </div>
      )}

      {/* Drawer */}
      <UserDrawer
        user={selected}
        onClose={() => {
          setSelected(null);
          loadUsers();
        }}
      />
    </div>
  );
}
