"use client";

import { useState } from "react";
import { Plus, TrendingDown, Calendar, Users, Banknote, X, AlertTriangle } from "lucide-react";
import { SortieForm } from "@/components/sorties/SortieForm";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { formatMontant, formatDate } from "@/lib/kpi";

export default function SortiesPage() {
  const { sorties, bandes } = useBandesStore();
  const [showForm, setShowForm] = useState(false);
  const [filterBande, setFilterBande] = useState("tous");
  const [filterMotif, setFilterMotif] = useState<"tous" | "vente" | "décès">("tous");

  const sorted = [...sorties].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted
    .filter((s) => filterBande === "tous" || s.bande_id === filterBande)
    .filter((s) => filterMotif === "tous" || s.motif === filterMotif);

  const totalVentes = filtered.filter((s) => s.motif === "vente").reduce((acc, s) => acc + s.montant_total, 0);
  const totalDeces = filtered.filter((s) => s.motif === "décès").reduce((acc, s) => acc + s.quantite, 0);
  const totalVendus = filtered.filter((s) => s.motif === "vente").reduce((acc, s) => acc + s.quantite, 0);

  function getBandeName(id: string) {
    return bandes.find((b) => b.id === id)?.nom_lot ?? id;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sorties</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} mouvement{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nouvelle sortie</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-4">
        {showForm && (
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Enregistrer une sortie</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <SortieForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card bg-forest-50 text-forest-700">
            <div className="w-8 h-8 rounded-lg bg-forest-100 flex items-center justify-center mb-1">
              <Banknote size={15} strokeWidth={2} />
            </div>
            <p className="text-lg font-bold">{formatMontant(totalVentes)}</p>
            <p className="text-xs opacity-80">Revenus ventes</p>
          </div>
          <div className="stat-card bg-blue-50 text-blue-700">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-1">
              <Users size={15} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold">{totalVendus}</p>
            <p className="text-xs opacity-80">Sujets vendus</p>
          </div>
          <div className="stat-card bg-red-50 text-red-700">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mb-1">
              <AlertTriangle size={15} strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold">{totalDeces}</p>
            <p className="text-xs opacity-80">Décès</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["tous", "vente", "décès"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMotif(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterMotif === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {m === "tous" ? "Tous" : m === "vente" ? "💰 Ventes" : "💀 Décès"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterBande("tous")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterBande === "tous" ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              Toutes bandes
            </button>
            {bandes.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilterBande(b.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterBande === b.id ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {b.nom_lot}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <TrendingDown size={36} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Aucune sortie enregistrée</p>
            <p className="text-sm text-gray-400 mb-4">Enregistrez vos ventes et mortalités.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={15} />
              Ajouter une sortie
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="card flex items-center gap-3 p-3 sm:p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.motif === "vente" ? "bg-forest-100" : "bg-red-100"}`}>
                  {s.motif === "vente"
                    ? <Banknote size={16} className="text-forest-600" strokeWidth={2} />
                    : <AlertTriangle size={16} className="text-red-500" strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{getBandeName(s.bande_id)}</span>
                    <Badge variant={s.motif === "vente" ? "success" : "error"}>
                      {s.motif === "vente" ? "Vente" : "Décès"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(s.date)}</span>
                    <span className="flex items-center gap-1"><Users size={11} />{s.quantite} sujets</span>
                    {s.cause_deces && <span className="text-gray-400">{s.cause_deces}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {s.motif === "vente" ? (
                    <div>
                      <p className="text-sm font-bold text-forest-700">{formatMontant(s.montant_total)}</p>
                      <p className="text-xs text-gray-400">{formatMontant(s.prix_unitaire)}/sujet</p>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-red-500">−{s.quantite} sujets</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
