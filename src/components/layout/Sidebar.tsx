"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Bird,
  Wheat,
  HeartPulse,
  TrendingDown,
  FolderOpen,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutGrid },
  { href: "/bandes", label: "Gestion des Bandes", icon: Bird },
  { href: "/alimentation", label: "Alimentation", icon: Wheat },
  { href: "/sante", label: "Santé & Hygiène", icon: HeartPulse },
  { href: "/sorties", label: "Sorties", icon: TrendingDown },
  { href: "/documents", label: "Documents", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
          <Bird size={20} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Poulet-Tech</h1>
          <p className="text-xs text-gray-500">Gestion avicole</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group
                ${isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-brand-500" : "text-gray-400 group-hover:text-gray-600"}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight size={14} className="text-brand-400" strokeWidth={2} />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Poulet-Tech v0.1 — Beta
        </p>
      </div>
    </aside>
  );
}
