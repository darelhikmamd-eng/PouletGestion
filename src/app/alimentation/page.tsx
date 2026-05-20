"use client";

import { useState } from "react";
import { Plus, Wheat, Calendar, Scale, Banknote, X } from "lucide-react";
import { AlimentForm } from "@/components/alimentation/AlimentForm";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { formatMontant, formatDate } from "@/lib/kpi";

const ALIMENT_COLORS: Record<string, string> = {
  "Démarrage": "info",
  "Croissance": "warning",
  "Finition": "success",
};

export default function AlimentationPage() {
  const { consommations, bandes } = useBandesStore();
  const [showForm, setShowForm] = useState(false);
  const [filterBande, setFilterBande] = useState("tous");

  const sorted = [...consommations].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = filterBande === "tous" ? sorted : sorted.filter((c) => c.bande_id === filterBande);

  const totalKg = filtered.reduce((acc, c) => acc + c.quantite_kg, 0);
  const totalMontant = filtered.reduce((acc, c) => acc + c.montant, 0);

  function getBandeName(id: string) {
    return bandes.find((b) => b.id === id)?.nom_lot ?? id;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alimentation</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} entrée{filtered.length > 1 ? "s" : ""} · {totalKg.toLocaleString("fr-FR")} kg total
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nouvelle entrée</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-4">
        {showForm && (
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Nouvelle consommation d'aliment</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <AlimentForm
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card bg-blue-50 text-blue-700">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-1">
              <Scale size={15} strokeWidth={2} />
            </div>
            <p className="text-xl font-bold">{totalKg.toLocaleString("fr-FR")} kg</p>
            <p className="text-xs opacity-80">Total consommé</p>
          </div>
          <div className="stat-card bg-brand-50 text-brand-700">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center mb-1">
              <Banknote size={15} strokeWidth={2} />
            </div>
            <p className="text-xl font-bold">{formatMontant(totalMontant)}</p>
            <p className="text-xs opacity-80">Total dépensé</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterBande("tous")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterBande === "tous" ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Toutes les bandes
          </button>
          {bandes.map((b) => (
            <button
              key={b.id}
              onClick={() => setFilterBande(b.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterBande === b.id ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {b.nom_lot}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Wheat size={36} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Aucune entrée d'aliment</p>
            <p className="text-sm text-gray-400 mb-4">Commencez à enregistrer les consommations journalières.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={15} />
              Ajouter une entrée
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.id} className="card flex items-center gap-3 p-3 sm:p-4">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Wheat size={16} className="text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{getBandeName(c.bande_id)}</span>
                    <Badge variant={ALIMENT_COLORS[c.type_aliment] as "info" | "warning" | "success"}>
                      {c.type_aliment}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(c.date)}</span>
                    <span className="flex items-center gap-1"><Scale size={11} />{c.quantite_kg} kg</span>
                    <span className="text-gray-400">{c.conditionnement}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatMontant(c.montant)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
