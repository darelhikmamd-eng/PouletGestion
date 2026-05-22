"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Bird, Search, XCircle, TrendingDown } from "lucide-react";
import { BandeCard } from "@/components/bandes/BandeCard";
import { useBandesStore } from "@/store/useBandesStore";
import { SortieForm } from "@/components/sorties/SortieForm";

type Filter = "tous" | "actif" | "cloture";

export default function BandesPage() {
  const { bandes, cloturerBande } = useBandesStore();
  const [filter, setFilter] = useState<Filter>("tous");
  const [search, setSearch] = useState("");
  const [showSortieModal, setShowSortieModal] = useState(false);

  const filtered = bandes.filter((b) => {
    const matchFilter = filter === "tous" || b.statut === filter;
    const matchSearch =
      search.trim() === "" ||
      b.nom_lot.toLowerCase().includes(search.toLowerCase()) ||
      b.race.toLowerCase().includes(search.toLowerCase()) ||
      b.fournisseur.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "tous", label: "Toutes", count: bandes.length },
    { key: "actif", label: "Actives", count: bandes.filter((b) => b.statut === "actif").length },
    { key: "cloture", label: "Clôturées", count: bandes.filter((b) => b.statut === "cloture").length },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Bandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {bandes.length} lot{bandes.length > 1 ? "s" : ""} enregistré{bandes.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSortieModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-red-500" strokeWidth={2.5} />
            <span className="hidden sm:inline">Nouvelle sortie</span>
            <span className="sm:hidden">Sortie</span>
          </button>
          <Link
            href="/bandes/nouvelle"
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nouvelle bande</span>
            <span className="sm:hidden">Nouveau</span>
          </Link>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher par nom, race, fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-colors
                ${filter === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Bird size={36} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            {search ? (
              <>
                <p className="text-gray-500 font-medium">Aucun résultat</p>
                <p className="text-sm text-gray-400">Essayez d'autres mots-clés.</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium">Aucune bande ici</p>
                <p className="text-sm text-gray-400 mb-4">
                  {filter === "actif" ? "Pas de bande active pour l'instant." : "Aucun lot enregistré."}
                </p>
                <Link
                  href="/bandes/nouvelle"
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <Plus size={15} />
                  Créer une bande
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((bande) => (
              <BandeCard
                key={bande.id}
                bande={bande}
                onCloturer={cloturerBande}
              />
            ))}
          </div>
        )}
      </div>

      {showSortieModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown size={16} className="text-red-500" />
                Enregistrer une sortie
              </h3>
              <button
                onClick={() => setShowSortieModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-6">
              <SortieForm
                onSuccess={() => setShowSortieModal(false)}
                onCancel={() => setShowSortieModal(false)}
                onlyVente={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
