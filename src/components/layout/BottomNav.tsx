"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Bird, Wheat, HeartPulse, TrendingDown, FolderOpen } from "lucide-react";

const navItems = [
  { href: "/", label: "Accueil", icon: LayoutGrid },
  { href: "/bandes", label: "Bandes", icon: Bird },
  { href: "/alimentation", label: "Aliment.", icon: Wheat },
  { href: "/sante", label: "Santé", icon: HeartPulse },
  { href: "/sorties", label: "Sorties", icon: TrendingDown },
  { href: "/documents", label: "Docs", icon: FolderOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors duration-150
                ${isActive
                  ? "text-brand-600 bg-brand-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? "text-brand-500" : "text-gray-400"}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
