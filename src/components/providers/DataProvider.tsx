"use client";

import { useEffect } from "react";
import { Bird } from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { fetchAll, isInitialized, isLoading } = useBandesStore();

  useEffect(() => {
    if (!isInitialized) {
      fetchAll();
    }
  }, [isInitialized, fetchAll]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center animate-pulse">
          <Bird size={24} className="text-white" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">Chargement des données…</p>
          <p className="text-xs text-gray-400 mt-0.5">Connexion à la base de données</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
