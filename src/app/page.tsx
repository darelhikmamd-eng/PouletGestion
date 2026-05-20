"use client";

import Link from "next/link";
import {
  Bird, Wheat, HeartPulse, TrendingDown, ArrowRight,
  AlertTriangle, Banknote, Activity, Clock, Target, TrendingUp,
} from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";
import { computeKPIs, formatMontant } from "@/lib/kpi";
import { Badge } from "@/components/ui/Badge";

function KPICard({
  label, value, sub, icon: Icon, color, iconColor, alert,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; iconColor: string; alert?: boolean;
}) {
  return (
    <div className={`stat-card ${color} relative overflow-hidden`}>
      {alert && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${iconColor}`}>
        <Icon size={15} strokeWidth={2} />
      </div>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { bandes, consommations, santeOps, sorties } = useBandesStore();

  const bandesActives = bandes.filter((b) => b.statut === "actif");
  const bandesCloturees = bandes.filter((b) => b.statut === "cloture");

  const allKPIs = bandes.map((b) => {
    const bc = consommations.filter((c) => c.bande_id === b.id);
    const bs = santeOps.filter((s) => s.bande_id === b.id);
    const bso = sorties.filter((s) => s.bande_id === b.id);
    return { bande: b, kpi: computeKPIs(b, bc, bs, bso) };
  });

  const globalKPIs = allKPIs.map((x) => x.kpi);

  const totalVolailles = allKPIs
    .filter((x) => x.bande.statut === "actif")
    .reduce((acc, x) => acc + x.kpi.volaillesActuelles, 0);
  const totalDepenses = globalKPIs.reduce((acc, k) => acc + k.totalDepenses, 0);
  const totalRevenu = globalKPIs.reduce((acc, k) => acc + k.revenuGenere, 0);
  const totalMarge = totalRevenu - totalDepenses;
  const totalDeces = globalKPIs.reduce((acc, k) => acc + k.totalDeces, 0);

  const quickLinks = [
    { label: "Nouvelle bande", href: "/bandes/nouvelle", icon: Bird, desc: "Créer un lot" },
    { label: "Alimentation", href: "/alimentation", icon: Wheat, desc: "Saisir une consommation", action: true },
    { label: "Santé", href: "/sante", icon: HeartPulse, desc: "Vaccin / traitement", action: true },
    { label: "Sortie", href: "/sorties", icon: TrendingDown, desc: "Vente ou décès", action: true },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {bandesActives.length} active{bandesActives.length > 1 ? "s" : ""}
            {bandesCloturees.length > 0 && ` · ${bandesCloturees.length} clôturée${bandesCloturees.length > 1 ? "s" : ""}`}
            {bandes.length === 0 && "Aucune bande"}
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard label="Volailles vivantes" value={totalVolailles.toLocaleString("fr-FR")} sub={`${bandes.reduce((a,b)=>a+b.nbr_poussins,0).toLocaleString("fr-FR")} initiaux (toutes)`} icon={Bird} color="bg-forest-50 text-forest-700" iconColor="bg-forest-100" />
          <KPICard label="Total dépenses" value={formatMontant(totalDepenses)} icon={Banknote} color="bg-red-50 text-red-700" iconColor="bg-red-100" />
          <KPICard label="Revenus générés" value={formatMontant(totalRevenu)} icon={TrendingUp} color="bg-blue-50 text-blue-700" iconColor="bg-blue-100" />
          <KPICard label="Marge nette" value={formatMontant(totalMarge)} icon={Activity} color={totalMarge >= 0 ? "bg-forest-50 text-forest-800" : "bg-orange-50 text-orange-700"} iconColor={totalMarge >= 0 ? "bg-forest-100" : "bg-orange-100"} alert={totalMarge < 0} />
        </div>

        {allKPIs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {bandesActives.length > 0 ? "KPIs par bande" : "Bandes enregistrées"}
            </h2>
            <div className="space-y-3">
              {allKPIs.map(({ bande, kpi }) => {
                const mortaliteOk = kpi.tauxMortalite < 3;

                return (
                  <div key={bande.id} className={`card overflow-hidden ${bande.statut === "cloture" ? "opacity-75" : ""}`}>
                    <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bande.statut === "actif" ? "bg-forest-100" : "bg-gray-100"}`}>
                          <Bird size={16} className={bande.statut === "actif" ? "text-forest-600" : "text-gray-400"} strokeWidth={2} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">{bande.nom_lot}</p>
                            {bande.statut === "cloture" && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">Clôturée</span>}
                          </div>
                          <p className="text-xs text-gray-500">{bande.race} · J+{kpi.ageBande}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={mortaliteOk ? "success" : "error"}>
                          {kpi.tauxMortalite.toFixed(1)}% mort.
                        </Badge>
                        <Link href={`/bandes/${bande.id}`} className="text-gray-400 hover:text-brand-600 transition-colors">
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-gray-100">
                      {/* Vivantes + date d'entrée */}
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Bird size={14} className="text-forest-600 mb-1" strokeWidth={2} />
                        <p className="text-xs font-bold text-gray-900">{kpi.volaillesActuelles.toLocaleString("fr-FR")} sujets</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{bande.statut === "cloture" ? "À la clôture" : "Vivantes"}</p>
                        <p className="text-[10px] text-gray-400">{bande.date_debut}</p>
                      </div>
                      {/* Seuil de vente vs prix d'achat/sujet */}
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Target size={14} className="text-brand-600 mb-1" strokeWidth={2} />
                        <p className="text-xs font-bold text-gray-900">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Seuil vente/sujet</p>
                        <p className="text-[10px] text-gray-400">
                          Entrée : {bande.nbr_poussins > 0 ? Math.round(bande.prix_achat_global / bande.nbr_poussins).toLocaleString("fr-FR") : "—"} F/sujet
                        </p>
                      </div>
                      {/* Dépenses */}
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Banknote size={14} className="text-red-500 mb-1" strokeWidth={2} />
                        <p className="text-xs font-bold text-gray-900">{formatMontant(kpi.totalDepenses)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Dépenses tot.</p>
                      </div>
                      {/* Marge */}
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Activity size={14} className={`${kpi.marge >= 0 ? "text-forest-600" : "text-orange-500"} mb-1`} strokeWidth={2} />
                        <p className="text-xs font-bold text-gray-900">{formatMontant(kpi.marge)}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Marge nette</p>
                      </div>
                    </div>

                    {kpi.tauxMortalite >= 3 && (
                      <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2 text-xs text-red-600">
                        <AlertTriangle size={12} />
                        Taux de mortalité élevé : {kpi.tauxMortalite.toFixed(1)}% — {kpi.totalDeces} décès enregistrés
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Actions rapides
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map(({ label, href, icon: Icon, desc }) => (
              <Link key={label} href={href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2 group">
                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
                  <Icon size={18} className="text-gray-500 group-hover:text-brand-600" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {totalDeces > 0 && (
          <div className="card p-4 border-l-4 border-l-orange-400 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Attention — Mortalités enregistrées</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {totalDeces} décès au total sur vos bandes actives. Vérifiez les conditions d'élevage.
                </p>
              </div>
              <Link href="/sorties" className="ml-auto flex items-center gap-1 text-xs text-orange-700 font-medium hover:underline whitespace-nowrap">
                Voir détail <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {bandesActives.length === 0 && (
          <div className="card p-10 text-center">
            <Bird size={40} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Aucune bande active</p>
            <p className="text-sm text-gray-400 mb-4">Commencez par créer votre premier lot de poussins.</p>
            <Link href="/bandes/nouvelle" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Bird size={16} />
              Créer une bande
            </Link>
          </div>
        )}

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-400" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Légende des formules</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
            <p>🐔 <strong>Vivantes</strong> = Initiaux − Décès − Vendus</p>
            <p>📉 <strong>Mortalité</strong> = Décès / Initiaux × 100</p>
            <p>🎯 <strong>Seuil vente</strong> = Dépenses totales / Vivantes</p>
            <p>💰 <strong>Marge</strong> = Revenus ventes − Dépenses totales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
