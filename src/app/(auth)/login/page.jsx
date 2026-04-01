"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    try {
      setError("");
      setIsLoading(true);
      const res = await api.post("/admin/login", { email, password });

      localStorage.setItem("admin_token", res.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 bg-white shadow rounded w-80">
        <h1 className="mb-4 text-xl">Admin Login</h1>

        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-3 p-2 border rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-60"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
