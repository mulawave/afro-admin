"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function AdminLayout({ children }) {
  const { checking, user } = useAuthGuard();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/10 bg-[var(--admin-surface)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--av-light-orange)] border-t-transparent" />
          <p className="mt-4 text-sm text-white/70">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="flex min-h-screen flex-col md:pl-72">
        <Header user={user} />

        <main className="flex-1 px-4 pb-8 pt-32 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
