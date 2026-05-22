"use client";

import { useEffect } from "react";
import { Bird } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useBandesStore } from "@/store/useBandesStore";
import { useAuthStore } from "@/store/useAuthStore";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { fetchAll, isInitialized, isLoading: isDbLoading } = useBandesStore();
  const { isAuthenticated, isLoading: isAuthLoading, initialize } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // 1. Initialize authentication from localStorage
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Redirect based on auth state
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.replace("/login");
      } else if (isAuthenticated && pathname === "/login") {
        router.replace("/");
      }
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  // 3. Fetch data once authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitialized && !isDbLoading) {
      fetchAll();
    }
  }, [isAuthenticated, isInitialized, isDbLoading, fetchAll]);

  // 4. Loading States
  const showLoader = isAuthLoading || (isAuthenticated && (!isInitialized || isDbLoading));
  const isLoginPage = pathname === "/login";

  if (showLoader && !isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4 text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center animate-pulse shadow-xl shadow-brand-500/20">
          <Bird size={26} className="text-slate-950 font-black" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white tracking-wide">Chargement de Poulet-Tech…</p>
          <p className="text-xs text-slate-400 mt-1 font-semibold">Synchronisation sécurisée des données de la ferme</p>
        </div>
      </div>
    );
  }

  // 5. Render
  if (!isAuthenticated && !isLoginPage) {
    // Return empty during redirect to avoid visual flash
    return null;
  }

  return <>{children}</>;
}
