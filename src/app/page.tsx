"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bird, Wheat, HeartPulse, TrendingDown, ArrowRight,
  AlertTriangle, Banknote, Activity, Clock, Target, TrendingUp, Sun, Sparkles
} from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";
import { computeKPIs, formatMontant } from "@/lib/kpi";
import { Badge } from "@/components/ui/Badge";
import { SVGDoughnutChart } from "@/components/ui/SVGDoughnutChart";

function KPICard({
  label, value, sub, icon: Icon, color, iconColor, alert,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; iconColor: string; alert?: boolean;
}) {
  return (
    <div className={`card p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}>
      {alert && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm ${iconColor}`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] opacity-75 font-semibold mt-1">{sub}</p>}
      <p className="text-xs font-bold opacity-90 mt-2 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { bandes, consommations, santeOps, sorties, cloturerBande } = useBandesStore();

  const [selectedBandeId, setSelectedBandeId] = useState<string>("all");

  const bandesActives = bandes.filter((b) => b.statut === "actif");
  const bandesCloturees = bandes.filter((b) => b.statut === "cloture");

  const allKPIs = bandes.map((b) => {
    const bc = consommations.filter((c) => c.bande_id === b.id);
    const bs = santeOps.filter((s) => s.bande_id === b.id);
    const bso = sorties.filter((s) => s.bande_id === b.id);
    return { bande: b, kpi: computeKPIs(b, bc, bs, bso) };
  });

  // Calculate filtered sets based on selectedBandeId
  const filteredBandes = selectedBandeId === "all"
    ? bandes
    : bandes.filter((b) => b.id === selectedBandeId);

  const filteredConsommations = selectedBandeId === "all"
    ? consommations
    : consommations.filter((c) => c.bande_id === selectedBandeId);

  const filteredSanteOps = selectedBandeId === "all"
    ? santeOps
    : santeOps.filter((s) => s.bande_id === selectedBandeId);

  const filteredSorties = selectedBandeId === "all"
    ? sorties
    : sorties.filter((s) => s.bande_id === selectedBandeId);

  const selectedKPIs = filteredBandes.map((b) => {
    const bc = consommations.filter((c) => c.bande_id === b.id);
    const bs = santeOps.filter((s) => s.bande_id === b.id);
    const bso = sorties.filter((s) => s.bande_id === b.id);
    return { bande: b, kpi: computeKPIs(b, bc, bs, bso) };
  });

  const computedKPIs = selectedKPIs.map((x) => x.kpi);

  const totalVolailles = selectedBandeId === "all"
    ? allKPIs
        .filter((x) => x.bande.statut === "actif")
        .reduce((acc, x) => acc + x.kpi.volaillesActuelles, 0)
    : (selectedKPIs[0]?.bande.statut === "actif"
        ? selectedKPIs[0]?.kpi.volaillesActuelles
        : selectedKPIs[0]?.kpi.survivants || 0);

  const effectifSubtext = selectedBandeId === "all"
    ? `${bandesActives.length} bande(s) active(s)`
    : `Statut : ${selectedKPIs[0]?.bande.statut === "actif" ? "Actif" : "Clôturé"}`;

  // Dynamic sums for global/filtered cards & chart
  const totalAchatPoussins = filteredBandes.reduce((acc, b) => acc + b.prix_achat_global, 0);
  const totalAliment = filteredConsommations.reduce((acc, c) => acc + c.montant, 0);
  const totalSante = filteredSanteOps.reduce((acc, s) => acc + s.montant, 0);
  
  const totalDepenses = totalAchatPoussins + totalAliment + totalSante;
  const totalRevenu = computedKPIs.reduce((acc, k) => acc + k.revenuGenere, 0);
  const totalMarge = totalRevenu - totalDepenses;
  const totalDeces = computedKPIs.reduce((acc, k) => acc + k.totalDeces, 0);

  const netBilanSubtext = selectedBandeId === "all"
    ? (totalMarge >= 0 ? "Bénéfice global actuel" : "Déficit global actuel")
    : (totalMarge >= 0 ? "Bénéfice actuel du lot" : "Déficit actuel du lot");

  const greetingSubtext = selectedBandeId === "all"
    ? (bandesActives.length > 0
        ? `Votre élevage compte actuellement ${totalVolailles.toLocaleString("fr-FR")} sujets actifs répartis sur ${bandesActives.length} lot${bandesActives.length > 1 ? "s" : ""}.`
        : "Aucun lot actif pour le moment. Lancer un lot pour démarrer.")
    : (() => {
        const selected = selectedKPIs[0];
        if (!selected) return "";
        return `Lot "${selected.bande.nom_lot}" · ${selected.bande.race} · Âge: J+${selected.kpi.ageBande} jours · ${
          selected.bande.statut === "actif"
            ? `${selected.kpi.volaillesActuelles.toLocaleString("fr-FR")} sujets actifs`
            : `Clôturé avec ${selected.kpi.survivants.toLocaleString("fr-FR")} survivants`
        }.`;
      })();

  const quickLinks = [
    { label: "Nouvelle bande", href: "/bandes/nouvelle", icon: Bird, desc: "Lancer un nouveau lot", color: "hover:border-brand-300" },
    { label: "Saisie Aliment", href: "/alimentation", icon: Wheat, desc: "Ajouter une consommation", color: "hover:border-blue-300" },
    { label: "Saisie Santé", href: "/sante", icon: HeartPulse, desc: "Vacciner ou soigner", color: "hover:border-purple-300" },
    { label: "Saisie Sortie", href: "/sorties", icon: TrendingDown, desc: "Déclarer vente ou décès", color: "hover:border-red-300" },
  ];

  // Feed distribution data to doughnut chart
  const chartData = [
    { label: "Achat Poussins", value: totalAchatPoussins, color: "text-gray-400", strokeColor: "#9ca3af" },
    { label: "Alimentation", value: totalAliment, color: "text-blue-500", strokeColor: "#3b82f6" },
    { label: "Santé & Hygiène", value: totalSante, color: "text-purple-500", strokeColor: "#a855f7" },
  ];

  const bandsReadyForTransition = allKPIs.filter(
    (x) => (selectedBandeId === "all" || x.bande.id === selectedBandeId) && x.bande.statut === "actif" && x.kpi.ageBande >= 45
  );

  const displayedKPIs = selectedBandeId === "all"
    ? allKPIs
    : allKPIs.filter((x) => x.bande.id === selectedBandeId);

  const doughnutChartTitle = selectedBandeId === "all"
    ? "Structure financière globale"
    : `Structure financière du lot : ${selectedKPIs[0]?.bande.nom_lot}`;

  const doughnutChartSubtitle = selectedBandeId === "all"
    ? "Répartition des charges directes de l'exploitation"
    : `Répartition des charges directes pour ce lot (${selectedKPIs[0]?.bande.race})`;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Dynamic Header Greeting */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150/80 bg-white/50 backdrop-blur-md pb-6 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={13} className="animate-spin-slow" />
            Poulet-Tech intelligent
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight lg:text-3xl flex items-center gap-2">
            Bonjour ! <Sun className="text-amber-500 animate-pulse" size={24} />
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {greetingSubtext}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown de filtrage par bande */}
          <div className="relative">
            <select
              value={selectedBandeId}
              onChange={(e) => setSelectedBandeId(e.target.value)}
              className="appearance-none bg-white pl-9 pr-8 py-2 rounded-2xl border border-gray-200 hover:border-brand-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 text-xs font-bold text-gray-700 shadow-sm transition-all cursor-pointer outline-none"
            >
              <option value="all">Tous les lots</option>
              {bandes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nom_lot} ({b.statut === "actif" ? "Actif" : "Clôturé"})
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Bird size={14} className="text-brand-500" />
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg className="w-3.5 h-3.5 fill-current opacity-70" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200/60 shadow-sm">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600 font-bold">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-6 pb-12">
        {/* Bandeau d'alerte de transition de bande (Rotation) */}
        {bandsReadyForTransition.length > 0 && (
          <div className="card p-5 border-l-4 border-l-brand-500 bg-gradient-to-br from-brand-50/60 to-white/90 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Bird size={120} className="text-brand-800" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <AlertTriangle size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span>Cycle de production terminé (J+45+)</span>
                  <Badge variant="warning" className="bg-brand-500 text-white border-none animate-pulse">
                    Rotation recommandée
                  </Badge>
                </h3>
                <p className="text-xs text-gray-600 font-semibold mt-1.5 leading-relaxed max-w-3xl">
                  Le cycle nominal de <strong className="text-brand-700">45 jours</strong> a été atteint pour certains de vos lots.
                  Prolonger le cycle au-delà dégrade l'<strong>Indice de Consommation (FCR)</strong> : les poulets consomment davantage d'aliment de finition pour un gain de muscle très ralenti, réduisant vos marges nettes.
                </p>

                <div className="mt-4 space-y-3">
                  {bandsReadyForTransition.map(({ bande, kpi }) => (
                    <div key={bande.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-white/80 border border-gray-150 shadow-sm gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">
                          J+{kpi.ageBande}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-800">{bande.nom_lot}</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                            {kpi.volaillesActuelles} sujets restants · FCR dégradé estimé : +{((kpi.ageBande - 45) * 0.08).toFixed(2)} pts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            if (confirm(`Êtes-vous sûr de vouloir clôturer le lot "${bande.nom_lot}" pour lancer la rotation ?`)) {
                              await cloturerBande(bande.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-black transition-all duration-200 shadow-sm cursor-pointer"
                        >
                          Clôturer le lot
                        </button>
                        <Link
                          href={`/bandes/nouvelle?rotation_from=${encodeURIComponent(bande.nom_lot)}`}
                          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-black transition-all duration-200 shadow-md shadow-brand-500/25 flex items-center gap-1 cursor-pointer"
                        >
                          Lancer la rotation
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Effectif vivant" value={totalVolailles.toLocaleString("fr-FR")} sub={effectifSubtext} icon={Bird} color="bg-gradient-to-br from-emerald-50 to-white text-emerald-950 border border-emerald-100" iconColor="bg-emerald-100/80 text-emerald-700" />
          <KPICard label="Total charges" value={formatMontant(totalDepenses)} sub={`${formatMontant(totalAliment)} alimentation`} icon={Banknote} color="bg-gradient-to-br from-red-50 to-white text-red-950 border border-red-100" iconColor="bg-red-100/80 text-red-700" />
          <KPICard label="Revenus cumulés" value={formatMontant(totalRevenu)} sub={`${totalDeces} décès totaux`} icon={TrendingUp} color="bg-gradient-to-br from-blue-50 to-white text-blue-950 border border-blue-100" iconColor="bg-blue-100/80 text-blue-700" />
          <KPICard label="Bilan net" value={formatMontant(totalMarge)} sub={netBilanSubtext} icon={Activity} color={totalMarge >= 0 ? "bg-gradient-to-br from-forest-50 to-white text-forest-950 border border-forest-100" : "bg-gradient-to-br from-orange-50 to-white text-orange-950 border border-orange-100"} iconColor={totalMarge >= 0 ? "bg-forest-100/80 text-forest-700" : "bg-orange-100/80 text-orange-700"} alert={totalMarge < 0} />
        </div>

        {/* Global charges analysis and quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doughnut Chart card */}
          <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Activity size={15} className="text-brand-500" />
                {doughnutChartTitle}
              </h2>
              <p className="text-xs text-gray-400 font-semibold mb-4">{doughnutChartSubtitle}</p>
            </div>
            {totalDepenses > 0 ? (
              <SVGDoughnutChart data={chartData} />
            ) : (
              <div className="h-40 flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs text-gray-400">Aucune dépense enregistrée</p>
              </div>
            )}
          </div>

          {/* Quick Actions grid */}
          <div className="flex flex-col justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-500 animate-pulse" />
              Pilotage rapide
            </h2>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {quickLinks.map(({ label, href, icon: Icon, desc, color }) => (
                <Link key={label} href={href} className={`card p-4 transition-all duration-300 hover:shadow-md border border-gray-150 hover:-translate-y-0.5 flex flex-col justify-between group ${color}`}>
                  <div className="w-8 h-8 rounded-lg bg-gray-150/60 group-hover:bg-brand-500/10 group-hover:scale-105 flex items-center justify-center transition-all duration-300">
                    <Icon size={16} className="text-gray-500 group-hover:text-brand-600 transition-colors" strokeWidth={2} />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-black text-gray-800 tracking-tight flex items-center gap-0.5">
                      {label}
                      <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-0.5 duration-300" />
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5 leading-tight">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bands tracking list */}
        {displayedKPIs.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bird size={15} className="text-emerald-500" />
              Suivi détaillé des lots
            </h2>
            <div className="space-y-4">
              {displayedKPIs.map(({ bande, kpi }) => {
                const mortaliteOk = kpi.tauxMortalite < 3;
                const standardBroilerCycle = 45; // standard market maturity in days (45 days nominal)
                const progressPct = Math.min(100, (kpi.ageBande / standardBroilerCycle) * 100);

                return (
                  <div key={bande.id} className={`card overflow-hidden transition-all duration-300 hover:shadow-md hover:border-gray-300 ${bande.statut === "cloture" ? "bg-gray-50/70 opacity-80" : "bg-white"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 pb-3 border-b border-gray-100 gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${bande.statut === "actif" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          <Bird size={18} className={bande.statut === "actif" ? "text-emerald-600" : "text-gray-400"} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900 tracking-tight">{bande.nom_lot}</p>
                            {bande.statut === "cloture" ? (
                              <span className="text-[9px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Clôturé</span>
                            ) : (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Actif</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{bande.race} · Âge: J+{kpi.ageBande} jours</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2.5">
                        <Badge variant={mortaliteOk ? "success" : "error"}>
                          {kpi.tauxMortalite.toFixed(1)}% mortalité
                        </Badge>
                        <Link href={`/bandes/${bande.id}`} className="w-8 h-8 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-500/5 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-all duration-300">
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>

                    {/* Progress tracking line for growth cycle */}
                    {bande.statut === "actif" && (
                      <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/20">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold mb-1">
                          <span>Croissance du lot (Cycle standard)</span>
                          <span>J+{kpi.ageBande} / {standardBroilerCycle} jours ({Math.round(progressPct)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct >= 80 ? "bg-amber-500" : progressPct >= 50 ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y lg:divide-y-0 divide-gray-100 bg-gray-50/10">
                      {/* Vivantes */}
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Bird size={15} className="text-emerald-600 mb-1" strokeWidth={2.5} />
                        <p className="text-sm font-black text-gray-900 leading-none">
                          {bande.statut === "cloture" ? kpi.survivants.toLocaleString("fr-FR") : kpi.volaillesActuelles.toLocaleString("fr-FR")}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Vivantes</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">sur {bande.nbr_poussins} initiaux</p>
                      </div>
                      {/* Seuil de vente */}
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Target size={15} className="text-brand-500 mb-1" strokeWidth={2.5} />
                        <p className="text-sm font-black text-gray-900 leading-none">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Seuil rentabilité</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Prix min / sujet</p>
                      </div>
                      {/* Dépenses */}
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Banknote size={15} className="text-red-500 mb-1" strokeWidth={2.5} />
                        <p className="text-sm font-black text-gray-900 leading-none">{formatMontant(kpi.totalDepenses)}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Charges totales</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Investissements</p>
                      </div>
                      {/* Marge */}
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Activity size={15} className={`${kpi.marge >= 0 ? "text-emerald-600" : "text-orange-500"} mb-1`} strokeWidth={2.5} />
                        <p className="text-sm font-black text-gray-900 leading-none">{formatMontant(kpi.marge)}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Bilan financier</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{kpi.marge >= 0 ? "Marge bénéficiaire" : "Perte"}</p>
                      </div>
                    </div>

                    {kpi.tauxMortalite >= 3 && (
                      <div className="px-4 py-2.5 bg-gradient-to-r from-red-50 to-white border-t border-red-100 flex items-center gap-2 text-[11px] text-red-700 font-semibold">
                        <AlertTriangle size={13} className="text-red-500 animate-bounce" />
                        Alerte sanitaire : Taux de mortalité critique ({kpi.tauxMortalite.toFixed(1)}%) — {kpi.totalDeces} pertes enregistrées.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global warnings panel */}
        {totalDeces > 0 && (
          <div className="card p-4 border-l-4 border-l-orange-400 bg-orange-50/50 flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-950 leading-tight">Attention — Suivi de la mortalité</p>
              <p className="text-xs text-orange-700/90 mt-1 font-semibold">
                {totalDeces} décès cumulés enregistrés. Veillez à surveiller les paramètres d'élevage (climat, hygiène de la litière et abreuvement).
              </p>
            </div>
            <Link href="/sorties" className="flex items-center gap-1 text-xs text-orange-800 hover:text-orange-950 font-bold hover:underline whitespace-nowrap">
              Détails sorties <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* No active batches fallback */}
        {bandesActives.length === 0 && (
          <div className="card p-12 text-center bg-gradient-to-b from-white to-gray-50/50">
            <Bird size={48} className="text-gray-300 mx-auto mb-3 animate-bounce" strokeWidth={1.5} />
            <p className="text-gray-600 font-black tracking-tight text-lg">Aucune bande active détectée</p>
            <p className="text-xs text-gray-400 mb-6 font-medium mt-1">Commencez par créer votre premier lot pour démarrer le pilotage intelligent.</p>
            <Link href="/bandes/nouvelle" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md shadow-brand-500/25">
              <Bird size={16} strokeWidth={2.5} />
              Lancer ma première bande
            </Link>
          </div>
        )}

        {/* Explanatory legend panel */}
        <div className="card p-5 bg-gradient-to-br from-white to-gray-50/50 border border-gray-150">
          <div className="flex items-center gap-2 mb-3.5">
            <Clock size={15} className="text-brand-500 animate-spin-slow" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Base de calcul de la plateforme</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-gray-500 font-semibold">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">🐔 Vivantes :</span>
              <span>Effectif total initial diminué des décès constatés et des ventes réelles enregistrées.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold">📉 Mortalité :</span>
              <span>Pourcentage cumulé des décès par rapport à la taille initiale du lot. Seuil d'alerte à 3%.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold">🎯 Seuil vente :</span>
              <span>Coût de revient global unitaire calculé sur la base de la population vivante restante.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">💰 Marge nette :</span>
              <span>Revenus réels générés par les ventes diminués de l'ensemble des dépenses (achat, aliment, santé).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
