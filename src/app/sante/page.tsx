"use client";

import { useState } from "react";
import { Plus, HeartPulse, Calendar, Pill, X, Banknote } from "lucide-react";
import { SanteForm } from "@/components/sante/SanteForm";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { formatMontant, formatDate } from "@/lib/kpi";

const OP_COLORS: Record<string, "success" | "error" | "info" | "warning" | "neutral"> = {
  "Vaccination": "success",
  "Traitement Curatif": "error",
  "Vitamines": "info",
};

export default function SantePage() {
  const { santeOps, bandes } = useBandesStore();
  const [showForm, setShowForm] = useState(false);
  const [filterBande, setFilterBande] = useState("tous");

  const sorted = [...santeOps].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = filterBande === "tous" ? sorted : sorted.filter((s) => s.bande_id === filterBande);

  const totalMontant = filtered.reduce((acc, s) => acc + s.montant, 0);

  function getBandeName(id: string) {
    return bandes.find((b) => b.id === id)?.nom_lot ?? id;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Santé & Hygiène</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} opération{filtered.length > 1 ? "s" : ""} · {formatMontant(totalMontant)} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Nouvelle opération</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-4">
        {showForm && (
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Nouvelle opération sanitaire</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <SanteForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Vaccinations", count: filtered.filter((s) => s.type_op === "Vaccination").length, color: "bg-forest-50 text-forest-700" },
            { label: "Traitements", count: filtered.filter((s) => s.type_op === "Traitement Curatif").length, color: "bg-red-50 text-red-700" },
            { label: "Vitamines", count: filtered.filter((s) => s.type_op === "Vitamines").length, color: "bg-blue-50 text-blue-700" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
          ))}
        </div>

        <div className="card p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <Banknote size={16} className="text-purple-500" />
            Total dépenses santé
          </span>
          <span className="text-sm font-bold text-gray-900">{formatMontant(totalMontant)}</span>
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
            <HeartPulse size={36} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Aucune opération sanitaire</p>
            <p className="text-sm text-gray-400 mb-4">Enregistrez vos vaccinations et traitements.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Plus size={15} />
              Ajouter une opération
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="card flex items-center gap-3 p-3 sm:p-4">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Pill size={16} className="text-purple-600" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{s.medicament}</span>
                    <Badge variant={OP_COLORS[s.type_op]}>{s.type_op}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(s.date)}</span>
                    <span>{getBandeName(s.bande_id)}</span>
                    {s.maladie_cible && <span className="text-gray-400">→ {s.maladie_cible}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatMontant(s.montant)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
