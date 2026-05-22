"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Bird, Settings, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  { href: "/", label: "Accueil", icon: LayoutGrid },
  { href: "/bandes", label: "Bandes", icon: Bird },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-bold transition-all duration-150 cursor-pointer
                ${isActive
                  ? "text-brand-600 bg-brand-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-brand-500 animate-pulse" : "text-gray-400"}
              />
              {label}
            </Link>
          );
        })}

        {/* Mobile LogOut Button */}
        <button
          onClick={() => {
            if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
              logout();
            }
          }}
          className="flex flex-1 flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-bold text-red-500 hover:bg-red-50/50 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-red-400" />
          Déconnex.
        </button>
      </div>
    </nav>
  );
}
