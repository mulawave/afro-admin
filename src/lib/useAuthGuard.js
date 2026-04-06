"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, getAdminToken, getCurrentAdmin, getStoredAdmin } from "@/lib/api";

export function useAuthGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(() => getStoredAdmin());

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getAdminToken();

      if (!token) {
        router.replace("/login");
        if (!cancelled) {
          setUser(null);
          setChecking(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentAdmin();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        clearAdminSession();
        router.replace("/login");
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { checking, user };
}
