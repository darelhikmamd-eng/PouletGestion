"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Bird,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/bandes", label: "Gestion des Bandes", icon: Bird },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, farmProfile } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-40 text-slate-300">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 animate-pulse">
          <Bird size={22} className="text-slate-950 font-black" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-black tracking-tight text-white truncate flex items-center gap-1">
            {farmProfile?.nom_ferme || "Poulet-Tech"}
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold truncate">
            {farmProfile?.localite ? `${farmProfile.localite}, ${farmProfile.ville}` : "Gestionnaire avicole"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group hover:translate-x-1.5
                ${isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-400 text-slate-950 shadow-md shadow-brand-500/10 font-bold"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`transition-colors duration-300 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-brand-400"}`}
              />
              <span className="flex-1">{label}</span>
              {isActive ? (
                <ChevronRight size={14} className="text-slate-950" strokeWidth={2.5} />
              ) : (
                <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" strokeWidth={2} />
              )}
            </Link>
          );
        })}

        {/* Déconnexion action button */}
        <button
          onClick={() => {
            if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
              logout();
            }
          }}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group hover:translate-x-1.5 text-slate-400 hover:bg-red-950/30 hover:text-red-400 cursor-pointer text-left"
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
            className="text-slate-400 group-hover:text-red-400 transition-colors"
          />
          <span className="flex-1">Déconnexion</span>
        </button>
      </nav>

      <div className="px-5 py-4 border-t border-slate-800/80 bg-slate-950/20">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Poulet-Tech v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>
    </aside>
  );
}
