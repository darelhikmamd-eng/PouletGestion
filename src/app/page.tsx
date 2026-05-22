"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bird, Wheat, ArrowRight, AlertTriangle, Banknote, Activity,
  Clock, Target, TrendingUp, TrendingDown, Sun, Sparkles,
  ShieldCheck, Zap, Trophy, AlertCircle, CheckCircle2, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, ChevronUp, ChevronDown,
  Star, XCircle, Lightbulb, RefreshCw
} from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";
import { computeKPIs, formatMontant } from "@/lib/kpi";
import { Badge } from "@/components/ui/Badge";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          size={11}
          className={s <= score ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function TrendBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600">
      <ArrowUpRight size={11} />{value.toFixed(1)}{suffix}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-red-500">
      <ArrowDownRight size={11} />{Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-gray-400">
      <Minus size={11} />—
    </span>
  );
}

// ─── Inline SVG Bar Chart ─────────────────────────────────────────────────────

function SVGBarChart({ data }: {
  data: { label: string; charges: number; revenus: number; color: string }[];
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.charges, d.revenus]), 1);
  const chartH = 100;
  const barW = 18;
  const gap = 4;
  const groupW = barW * 2 + gap + 12;
  const svgW = data.length * groupW + 10;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${chartH + 36}`} className="w-full min-w-[320px]" style={{ height: 160 }}>
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1={0} y1={chartH - pct * chartH}
              x2={svgW} y2={chartH - pct * chartH}
              stroke="#f1f5f9" strokeWidth={1}
            />
          </g>
        ))}

        {data.map((d, i) => {
          const x = i * groupW + 5;
          const chargesH = maxVal > 0 ? (d.charges / maxVal) * chartH : 0;
          const revenusH = maxVal > 0 ? (d.revenus / maxVal) * chartH : 0;
          const isProfit = d.revenus >= d.charges;

          return (
            <g key={d.label}>
              {/* Charges bar */}
              <rect
                x={x}
                y={chartH - chargesH}
                width={barW}
                height={chargesH}
                rx={3}
                fill="#f87171"
                fillOpacity={0.85}
              />
              {/* Revenus bar */}
              <rect
                x={x + barW + gap}
                y={chartH - revenusH}
                width={barW}
                height={revenusH}
                rx={3}
                fill={isProfit ? "#34d399" : "#fb923c"}
                fillOpacity={0.85}
              />
              {/* Label */}
              <text
                x={x + barW + gap / 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={8}
                fill="#6b7280"
                fontWeight={700}
              >
                {d.label.length > 8 ? d.label.slice(0, 8) + "…" : d.label}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <rect x={5} y={chartH + 24} width={8} height={8} rx={2} fill="#f87171" fillOpacity={0.85} />
        <text x={16} y={chartH + 31} fontSize={7} fill="#6b7280" fontWeight={600}>Charges</text>
        <rect x={60} y={chartH + 24} width={8} height={8} rx={2} fill="#34d399" fillOpacity={0.85} />
        <text x={71} y={chartH + 31} fontSize={7} fill="#6b7280" fontWeight={600}>Revenus</text>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { bandes, consommations, santeOps, sorties, cloturerBande } = useBandesStore();
  const [sortBy, setSortBy] = useState<"marge" | "mortalite" | "age" | "fcr">("marge");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const bandesActives = bandes.filter((b) => b.statut === "actif");

  // Compute KPIs for ALL bands
  const allKPIs = useMemo(() => bandes.map((b) => {
    const bc = consommations.filter((c) => c.bande_id === b.id);
    const bs = santeOps.filter((s) => s.bande_id === b.id);
    const bso = sorties.filter((s) => s.bande_id === b.id);
    return { bande: b, kpi: computeKPIs(b, bc, bs, bso) };
  }), [bandes, consommations, santeOps, sorties]);

  // Global aggregates (active bands only)
  const activeKPIs = allKPIs.filter((x) => x.bande.statut === "actif");
  const totalVolaillesActives = activeKPIs.reduce((acc, x) => acc + x.kpi.volaillesActuelles, 0);
  const totalCharges = allKPIs.reduce((acc, x) => acc + x.kpi.totalDepenses, 0);
  const totalRevenus = allKPIs.reduce((acc, x) => acc + x.kpi.revenuGenere, 0);
  const totalMarge = totalRevenus - totalCharges;
  const totalDeces = allKPIs.reduce((acc, x) => acc + x.kpi.totalDeces, 0);
  const avgMortalite = allKPIs.length > 0
    ? allKPIs.reduce((acc, x) => acc + x.kpi.tauxMortalite, 0) / allKPIs.length
    : 0;

  // Lot scoring (0-3 stars): mortalite < 3 = +1, marge > 0 = +1, age <= 45 ou cloture = +1
  function scoreBande(b: typeof allKPIs[0]): number {
    let score = 0;
    if (b.kpi.tauxMortalite < 3) score++;
    if (b.kpi.marge > 0 || b.kpi.beneficePotentiel20 > 0) score++;
    if (b.bande.statut === "cloture" || b.kpi.ageBande <= 45) score++;
    return score;
  }

  // Sorted comparison table
  const sortedKPIs = useMemo(() => {
    return [...allKPIs].sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === "marge") { valA = a.kpi.marge; valB = b.kpi.marge; }
      if (sortBy === "mortalite") { valA = a.kpi.tauxMortalite; valB = b.kpi.tauxMortalite; }
      if (sortBy === "age") { valA = a.kpi.ageBande; valB = b.kpi.ageBande; }
      if (sortBy === "fcr") { valA = a.kpi.fcr ?? 0; valB = b.kpi.fcr ?? 0; }
      return sortDir === "desc" ? valB - valA : valA - valB;
    });
  }, [allKPIs, sortBy, sortDir]);

  // Band ready for rotation
  const bandsReadyForTransition = allKPIs.filter(
    (x) => x.bande.statut === "actif" && x.kpi.ageBande >= 45
  );

  // AI Decision recommendations
  const recommendations = useMemo(() => {
    const recs: { type: "danger" | "warning" | "success" | "info"; icon: React.ElementType; title: string; desc: string; action?: { label: string; href: string } }[] = [];

    // Rotation urgente
    bandsReadyForTransition.forEach(({ bande, kpi }) => {
      recs.push({
        type: "warning",
        icon: RefreshCw,
        title: `Rotation recommandée — ${bande.nom_lot}`,
        desc: `J+${kpi.ageBande} dépassé (cycle nominal = 45j). Le FCR se dégrade d'environ +${((kpi.ageBande - 45) * 0.08).toFixed(2)} pts/jour de retard. Clôturez et relancez pour préserver vos marges.`,
        action: { label: "Clôturer le lot", href: `/bandes/${bande.id}` },
      });
    });

    // Mortalité critique
    allKPIs.filter((x) => x.bande.statut === "actif" && x.kpi.tauxMortalite >= 3).forEach(({ bande, kpi }) => {
      recs.push({
        type: "danger",
        icon: AlertCircle,
        title: `Alerte sanitaire critique — ${bande.nom_lot}`,
        desc: `Taux de mortalité de ${kpi.tauxMortalite.toFixed(1)}% (${kpi.totalDeces} décès). Seuil critique = 3%. Consultez l'onglet Santé du lot pour un diagnostic immédiat.`,
        action: { label: "Voir le lot", href: `/bandes/${bande.id}` },
      });
    });

    // Meilleur lot
    const bestLot = [...allKPIs].sort((a, b) => b.kpi.marge - a.kpi.marge)[0];
    if (bestLot && bestLot.kpi.marge > 0) {
      recs.push({
        type: "success",
        icon: Trophy,
        title: `Meilleure performance — ${bestLot.bande.nom_lot}`,
        desc: `Ce lot génère la marge la plus élevée avec ${formatMontant(bestLot.kpi.marge)} de bénéfice. Taux de mortalité : ${bestLot.kpi.tauxMortalite.toFixed(1)}%. Reproduisez ces conditions d'élevage.`,
        action: { label: "Voir les détails", href: `/bandes/${bestLot.bande.id}` },
      });
    }

    // Lot sans données alimentation
    allKPIs.filter((x) => x.bande.statut === "actif" && x.kpi.totalQuantiteKg === 0).forEach(({ bande }) => {
      recs.push({
        type: "info",
        icon: Wheat,
        title: `Alimentation non saisie — ${bande.nom_lot}`,
        desc: `Aucune consommation alimentaire enregistrée pour ce lot. Saisissez les données d'alimentation pour obtenir des KPIs financiers précis (FCR, coût/kg, seuil de vente).`,
        action: { label: "Saisir l'alimentation", href: `/bandes/${bande.id}` },
      });
    });

    // Lot en déficit
    allKPIs.filter((x) => x.bande.statut === "actif" && x.kpi.revenuGenere > 0 && x.kpi.marge < 0).forEach(({ bande, kpi }) => {
      recs.push({
        type: "danger",
        icon: TrendingDown,
        title: `Déficit actuel — ${bande.nom_lot}`,
        desc: `Ce lot accuse ${formatMontant(Math.abs(kpi.marge))} de déficit avec un prix de vente minimum requis de ${formatMontant(kpi.seuilVenteParSujet)}/sujet. Revoyez votre stratégie de vente.`,
        action: { label: "Voir les scénarios", href: `/bandes/${bande.id}` },
      });
    });

    if (recs.length === 0 && allKPIs.length > 0) {
      recs.push({
        type: "success",
        icon: CheckCircle2,
        title: "Exploitation en bonne santé",
        desc: "Aucune alerte critique détectée. Tous vos lots sont dans des paramètres nominaux. Continuez le suivi régulier.",
      });
    }

    return recs;
  }, [allKPIs, bandsReadyForTransition]);

  // Bar chart data
  const barChartData = allKPIs.map((x) => ({
    label: x.bande.nom_lot,
    charges: x.kpi.totalDepenses,
    revenus: x.kpi.revenuGenere,
    color: x.kpi.marge >= 0 ? "#34d399" : "#f87171",
  }));

  function handleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <Minus size={10} className="text-gray-300" />;
    return sortDir === "desc"
      ? <ChevronDown size={10} className="text-brand-500" />
      : <ChevronUp size={10} className="text-brand-500" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="page-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-150/80 bg-white/50 backdrop-blur-md pb-6 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={13} className="animate-spin-slow" />
            Centre de pilotage analytique
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight lg:text-3xl flex items-center gap-2">
            Tableau de Bord <Sun className="text-amber-500 animate-pulse" size={24} />
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {bandes.length > 0
              ? `${allKPIs.length} lot${allKPIs.length > 1 ? "s" : ""} analysé${allKPIs.length > 1 ? "s" : ""} · ${bandesActives.length} actif${bandesActives.length > 1 ? "s" : ""} · ${totalVolaillesActives.toLocaleString("fr-FR")} sujets vivants`
              : "Aucun lot enregistré. Commencez par créer votre premier lot."}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200/60 shadow-sm">
          <Clock size={14} className="text-gray-400" />
          <span className="text-xs text-gray-600 font-bold">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-7 pb-12">

        {/* ── 1. KPI Globaux ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Effectif */}
          <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-sm">
              <Bird size={17} strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black text-emerald-950 leading-none">{totalVolaillesActives.toLocaleString("fr-FR")}</p>
            <p className="text-[10px] text-emerald-700/70 font-semibold mt-1">{bandesActives.length} lot(s) actif(s)</p>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mt-2">Effectif vivant</p>
          </div>

          {/* Charges */}
          <div className="card p-5 bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-3 shadow-sm">
              <Banknote size={17} strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black text-red-950 leading-none">{formatMontant(totalCharges)}</p>
            <p className="text-[10px] text-red-700/70 font-semibold mt-1">Tous lots confondus</p>
            <p className="text-xs font-bold text-red-900 uppercase tracking-wider mt-2">Total charges</p>
          </div>

          {/* Revenus */}
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 shadow-sm">
              <TrendingUp size={17} strokeWidth={2.5} />
            </div>
            <p className="text-2xl font-black text-blue-950 leading-none">{formatMontant(totalRevenus)}</p>
            <p className="text-[10px] text-blue-700/70 font-semibold mt-1">{totalDeces} décès cumulés</p>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mt-2">Revenus encaissés</p>
          </div>

          {/* Bilan net */}
          <div className={`card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden ${
            totalMarge >= 0
              ? "bg-gradient-to-br from-forest-50 to-white border border-forest-100"
              : "bg-gradient-to-br from-orange-50 to-white border border-orange-100"
          }`}>
            {totalMarge < 0 && (
              <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm ${
              totalMarge >= 0 ? "bg-forest-100 text-forest-700" : "bg-orange-100 text-orange-700"
            }`}>
              <Activity size={17} strokeWidth={2.5} />
            </div>
            <p className={`text-2xl font-black leading-none ${totalMarge >= 0 ? "text-forest-950" : "text-orange-950"}`}>
              {formatMontant(totalMarge)}
            </p>
            <p className={`text-[10px] font-semibold mt-1 ${totalMarge >= 0 ? "text-forest-700/70" : "text-orange-700/70"}`}>
              {totalMarge >= 0 ? "Bénéfice global net" : "Déficit global net"}
            </p>
            <p className={`text-xs font-bold uppercase tracking-wider mt-2 ${totalMarge >= 0 ? "text-forest-900" : "text-orange-900"}`}>
              Bilan net
            </p>
          </div>
        </div>

        {/* ── 2. Recommandations IA décisionnelles ── */}
        {recommendations.length > 0 && (
          <div className="card overflow-hidden border border-brand-100/80">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-brand-50/60 to-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                <Zap size={15} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 tracking-tight">
                  Actions prioritaires recommandées
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold">
                  {recommendations.length} recommandation{recommendations.length > 1 ? "s" : ""} générée{recommendations.length > 1 ? "s" : ""} automatiquement par analyse de vos données
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {recommendations.map((rec, idx) => {
                const Icon = rec.icon;
                const colors = {
                  danger: { bg: "bg-red-50/60", border: "border-l-red-500", icon: "bg-red-100 text-red-600", badge: "bg-red-100 text-red-700", btn: "bg-red-500 hover:bg-red-600" },
                  warning: { bg: "bg-amber-50/60", border: "border-l-amber-500", icon: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700", btn: "bg-amber-500 hover:bg-amber-600" },
                  success: { bg: "bg-emerald-50/60", border: "border-l-emerald-500", icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-100 text-emerald-700", btn: "bg-emerald-500 hover:bg-emerald-600" },
                  info: { bg: "bg-blue-50/60", border: "border-l-blue-500", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-100 text-blue-700", btn: "bg-blue-500 hover:bg-blue-600" },
                };
                const c = colors[rec.type];
                return (
                  <div key={idx} className={`flex items-start gap-4 px-5 py-4 border-l-4 ${c.border} ${c.bg}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${c.icon}`}>
                      <Icon size={15} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-900 leading-tight">{rec.title}</p>
                      <p className="text-[11px] text-gray-500 font-semibold mt-0.5 leading-relaxed">{rec.desc}</p>
                    </div>
                    {rec.action && (
                      <Link
                        href={rec.action.href}
                        className={`flex-shrink-0 px-3 py-1.5 ${c.btn} text-white rounded-lg text-[10px] font-black transition-all duration-200 flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap`}
                      >
                        {rec.action.label} <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. Tableau comparatif inter-bandes ── */}
        {allKPIs.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">Comparaison analytique des lots</h2>
                  <p className="text-[10px] text-gray-400 font-semibold">Cliquez sur un entête pour trier · {allKPIs.length} lot(s) analysé(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />OK</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Attention</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Critique</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/30">
                    <th className="px-4 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Lot / Race</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Statut</th>
                    <th
                      className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:text-brand-600 select-none whitespace-nowrap"
                      onClick={() => handleSort("age")}
                    >
                      <span className="flex items-center gap-1">Âge <SortIcon col="age" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Effectif</th>
                    <th
                      className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:text-brand-600 select-none whitespace-nowrap"
                      onClick={() => handleSort("mortalite")}
                    >
                      <span className="flex items-center gap-1">Mortalité <SortIcon col="mortalite" /></span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:text-brand-600 select-none"
                      onClick={() => handleSort("fcr")}
                    >
                      <span className="flex items-center gap-1">FCR <SortIcon col="fcr" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Charges</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Revenus</th>
                    <th
                      className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:text-brand-600 select-none"
                      onClick={() => handleSort("marge")}
                    >
                      <span className="flex items-center gap-1">Marge <SortIcon col="marge" /></span>
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Prix min</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedKPIs.map(({ bande, kpi }, idx) => {
                    const score = scoreBande({ bande, kpi });
                    const isActive = bande.statut === "actif";
                    const isRotationDue = isActive && kpi.ageBande >= 45;
                    const isMortaliteCritique = kpi.tauxMortalite >= 3;
                    const isPositif = kpi.marge >= 0;

                    // Row highlight
                    const rowBg = isMortaliteCritique
                      ? "bg-red-50/40 hover:bg-red-50/70"
                      : isRotationDue
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : "hover:bg-gray-50/60";

                    return (
                      <tr key={bande.id} className={`transition-colors duration-200 ${rowBg}`}>
                        {/* Lot */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {idx === 0 && sortBy === "marge" && kpi.marge > 0 && (
                              <Trophy size={12} className="text-amber-400 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-black text-gray-900 leading-tight">{bande.nom_lot}</p>
                              <p className="text-[10px] text-gray-400 font-semibold">{bande.race}</p>
                            </div>
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-3 py-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Actif
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Clôturé</span>
                          )}
                        </td>

                        {/* Âge */}
                        <td className="px-3 py-3">
                          <span className={`text-xs font-black ${isRotationDue ? "text-amber-600" : "text-gray-800"}`}>
                            J+{kpi.ageBande}
                          </span>
                          {isRotationDue && (
                            <span className="ml-1 text-[9px] font-black text-amber-500">⚠️</span>
                          )}
                        </td>

                        {/* Effectif */}
                        <td className="px-3 py-3">
                          <div>
                            <p className="text-xs font-black text-gray-800">
                              {isActive ? kpi.volaillesActuelles.toLocaleString("fr-FR") : kpi.survivants.toLocaleString("fr-FR")}
                            </p>
                            <p className="text-[9px] text-gray-400 font-semibold">/ {bande.nbr_poussins}</p>
                          </div>
                        </td>

                        {/* Mortalité */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isMortaliteCritique ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                            }`} />
                            <span className={`text-xs font-black ${isMortaliteCritique ? "text-red-600" : "text-gray-800"}`}>
                              {kpi.tauxMortalite.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-400 font-semibold">{kpi.totalDeces} décès</p>
                        </td>

                        {/* FCR */}
                        <td className="px-3 py-3">
                          {(kpi.fcr ?? 0) > 0 ? (
                            <div>
                              <p className={`text-xs font-black ${
                                (kpi.fcr ?? 0) > 2.5 ? "text-orange-600"
                                : (kpi.fcr ?? 0) > 2 ? "text-amber-600"
                                : "text-emerald-600"
                              }`}>
                                {(kpi.fcr ?? 0).toFixed(2)}
                              </p>
                              <p className="text-[9px] text-gray-400 font-semibold">
                                {(kpi.fcr ?? 0) <= 2 ? "Excellent" : (kpi.fcr ?? 0) <= 2.5 ? "Correct" : "Dégradé"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-semibold">—</span>
                          )}
                        </td>

                        {/* Charges */}
                        <td className="px-3 py-3">
                          <p className="text-xs font-black text-red-700">{formatMontant(kpi.totalDepenses)}</p>
                          <p className="text-[9px] text-gray-400 font-semibold">{formatMontant(kpi.seuilVenteParSujet)}/sujet</p>
                        </td>

                        {/* Revenus */}
                        <td className="px-3 py-3">
                          <p className="text-xs font-black text-blue-700">{formatMontant(kpi.revenuGenere)}</p>
                          <p className="text-[9px] text-gray-400 font-semibold">{kpi.totalVendus} vendus</p>
                        </td>

                        {/* Marge */}
                        <td className="px-3 py-3">
                          <p className={`text-xs font-black ${isPositif ? "text-emerald-700" : kpi.revenuGenere === 0 ? "text-gray-400" : "text-red-600"}`}>
                            {kpi.revenuGenere === 0 ? "—" : `${isPositif ? "+" : ""}${formatMontant(kpi.marge)}`}
                          </p>
                          {kpi.tauxMargeActuel !== 0 && (
                            <TrendBadge value={kpi.tauxMargeActuel} suffix="%" />
                          )}
                        </td>

                        {/* Prix min vente */}
                        <td className="px-3 py-3">
                          <p className="text-xs font-black text-brand-700">{formatMontant(kpi.prixRecommande20)}</p>
                          <p className="text-[9px] text-gray-400 font-semibold">+20% marge</p>
                        </td>

                        {/* Score */}
                        <td className="px-3 py-3">
                          <ScoreStars score={score} />
                        </td>

                        {/* Action */}
                        <td className="px-3 py-3">
                          <Link
                            href={`/bandes/${bande.id}`}
                            className="w-7 h-7 rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-500/5 flex items-center justify-center text-gray-400 hover:text-brand-600 transition-all duration-200"
                          >
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer with averages */}
            {allKPIs.length > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Mortalité moy.</p>
                  <p className={`text-xs font-black mt-0.5 ${avgMortalite >= 3 ? "text-red-600" : "text-gray-800"}`}>
                    {avgMortalite.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Charges totales</p>
                  <p className="text-xs font-black text-red-700 mt-0.5">{formatMontant(totalCharges)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Revenus totaux</p>
                  <p className="text-xs font-black text-blue-700 mt-0.5">{formatMontant(totalRevenus)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Bilan consolidé</p>
                  <p className={`text-xs font-black mt-0.5 ${totalMarge >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {totalMarge >= 0 ? "+" : ""}{formatMontant(totalMarge)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 4. Graphique Charges vs Revenus ── */}
        {allKPIs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">Charges vs Revenus par lot</h2>
                  <p className="text-[10px] text-gray-400 font-semibold">Rouge = charges · Vert = revenus encaissés</p>
                </div>
              </div>
              {totalCharges > 0 || totalRevenus > 0 ? (
                <SVGBarChart data={barChartData} />
              ) : (
                <div className="h-32 flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs text-gray-400">Aucune donnée financière saisie</p>
                </div>
              )}
            </div>

            {/* Financial summary per band */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Target size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 tracking-tight">Rentabilité par lot</h2>
                  <p className="text-[10px] text-gray-400 font-semibold">Prix de vente conseillé (+20% marge) et état financier</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {allKPIs.map(({ bande, kpi }) => {
                  const pctCharge = totalCharges > 0 ? (kpi.totalDepenses / totalCharges) * 100 : 0;
                  const isPositif = kpi.marge >= 0;
                  return (
                    <div key={bande.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                        kpi.tauxMortalite >= 3 ? "bg-red-400" :
                        kpi.ageBande >= 45 && bande.statut === "actif" ? "bg-amber-400" : "bg-emerald-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-gray-800 truncate">{bande.nom_lot}</p>
                          <span className={`text-[10px] font-black ml-2 flex-shrink-0 ${isPositif ? "text-emerald-600" : kpi.revenuGenere === 0 ? "text-gray-400" : "text-red-500"}`}>
                            {kpi.revenuGenere === 0 ? "Pas de vente" : `${isPositif ? "+" : ""}${formatMontant(kpi.marge)}`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              kpi.tauxMortalite >= 3 ? "bg-red-400" : "bg-brand-500"
                            }`}
                            style={{ width: `${Math.min(100, pctCharge)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-[9px] text-gray-400 font-semibold">Charges: {formatMontant(kpi.totalDepenses)}</span>
                          <span className="text-[9px] text-brand-600 font-black">Vente min: {formatMontant(kpi.prixRecommande20)}/sujet</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Alerte mortalité globale ── */}
        {totalDeces > 0 && (
          <div className="card p-4 border-l-4 border-l-orange-400 bg-orange-50/50 flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-950 leading-tight">Suivi de la mortalité</p>
              <p className="text-xs text-orange-700/90 mt-1 font-semibold">
                {totalDeces} décès cumulés sur l'ensemble des lots. Surveillez les paramètres d'élevage (climat, hygiène, abreuvement).
              </p>
            </div>
            <Link href="/sorties" className="flex items-center gap-1 text-xs text-orange-800 hover:text-orange-950 font-bold hover:underline whitespace-nowrap">
              Détails <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* ── No batch fallback ── */}
        {bandes.length === 0 && (
          <div className="card p-12 text-center bg-gradient-to-b from-white to-gray-50/50">
            <Bird size={48} className="text-gray-300 mx-auto mb-3 animate-bounce" strokeWidth={1.5} />
            <p className="text-gray-600 font-black tracking-tight text-lg">Aucun lot enregistré</p>
            <p className="text-xs text-gray-400 mb-6 font-medium mt-1">Créez votre premier lot pour démarrer le pilotage analytique.</p>
            <Link href="/bandes/nouvelle" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md shadow-brand-500/25">
              <Bird size={16} strokeWidth={2.5} />
              Lancer ma première bande
            </Link>
          </div>
        )}

        {/* ── Légende plateforme ── */}
        <div className="card p-5 bg-gradient-to-br from-white to-gray-50/50 border border-gray-150">
          <div className="flex items-center gap-2 mb-3.5">
            <Lightbulb size={14} className="text-brand-500" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Guide de lecture des indicateurs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] text-gray-500 font-semibold">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold flex-shrink-0">FCR :</span>
              <span>Indice de Consommation. Kg d'aliment par kg de poids vif gagné. Idéal = 1.6–2.0 pour Cobb 500.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-500 font-bold flex-shrink-0">Mortalité :</span>
              <span>Seuil d'alerte critique = 3%. Au-delà, une intervention sanitaire immédiate est requise.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-brand-500 font-bold flex-shrink-0">Prix min :</span>
              <span>Prix de vente minimum avec 20% de marge nette intégrée sur le coût de revient unitaire.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold flex-shrink-0">Score ⭐ :</span>
              <span>Évaluation globale du lot sur 3 critères : mortalité {'<'} 3%, marge positive, cycle respecté.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
