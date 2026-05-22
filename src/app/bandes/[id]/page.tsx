"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bird, Calendar, Users, Phone, Banknote,
  Tag, CheckCircle2, XCircle, Wheat, HeartPulse, TrendingDown,
  Target, Activity, AlertTriangle, Clock, TrendingUp, ShoppingCart,
  Package, Lightbulb, Scale, Trash2, ShieldCheck, Thermometer, Droplets, Sun, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { 
  computeKPIs, 
  formatMontant, 
  formatDateLong,
  PROPHYLAXIS_SCHEDULE,
  getClimateRecommendation
} from "@/lib/kpi";
import { SVGDoughnutChart } from "@/components/ui/SVGDoughnutChart";
import { SVGLineChart } from "@/components/ui/SVGLineChart";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-150/40 last:border-0 hover:bg-gray-50/40 px-2 rounded-xl transition-colors">
      <div className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon size={15} className="text-gray-500" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-black text-gray-800 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function BandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getBandeById, cloturerBande, getConsommationsByBande, getSanteByBande, getSortiesByBande,
    deleteConsommation, deleteSanteOp, deleteSortie } = useBandesStore();

  const bande = getBandeById(id);
  if (!bande) return notFound();

  const consommations = getConsommationsByBande(id);
  const santeOps = getSanteByBande(id);
  const sorties = getSortiesByBande(id);
  const kpi = computeKPIs(bande, consommations, santeOps, sorties);
  const isActive = bande.statut === "actif";
  const mortaliteAlert = kpi.tauxMortalite >= 3;

  // Fetch smart climate suggestions based on batch age
  const climate = getClimateRecommendation(kpi.ageBande);

  // Generate dynamic veterinary prophylaxis calendar milestones
  const computedMilestones = PROPHYLAXIS_SCHEDULE.map((milestone) => {
    // Check if there is a matching santeOp for this disease/milestone
    const matchingOp = santeOps.find((op) => {
      const opDate = new Date(op.date);
      const startDate = new Date(bande.date_debut);
      const opAge = Math.floor((opDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const ageDiff = Math.abs(opAge - milestone.jour);
      const isAgeClose = ageDiff <= 4; // allow up to 4 days range for recording vaccine
      
      const isDiseaseMatch = op.maladie_cible.toLowerCase().includes(milestone.maladie.toLowerCase()) ||
                            op.medicament.toLowerCase().includes(milestone.maladie.toLowerCase()) ||
                            op.type_op.toLowerCase().includes(milestone.type.toLowerCase());
      
      return isAgeClose && isDiseaseMatch;
    });

    const milestoneDate = new Date(new Date(bande.date_debut).getTime() + milestone.jour * 24 * 60 * 60 * 1000);
    const formattedMilestoneDate = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(milestoneDate);

    let status: "done" | "todo" | "upcoming" = "upcoming";
    if (matchingOp) {
      status = "done";
    } else if (kpi.ageBande >= milestone.jour) {
      status = "todo";
    }

    return {
      ...milestone,
      matchingOp,
      formattedDate: formattedMilestoneDate,
      status,
    };
  });

  // Sort and prepare feed chart data chronologically
  const feedChartData = consommations
    .map((c) => ({
      date: c.date,
      value: c.quantite_kg,
      amount: c.montant,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Doughnut chart breakdown data
  const expenseChartData = [
    { label: "Achat Poussins", value: bande.prix_achat_global, color: "text-gray-400", strokeColor: "#9ca3af" },
    { label: "Alimentation", value: kpi.totalAliment, color: "text-blue-500", strokeColor: "#3b82f6" },
    { label: "Santé & Hygiène", value: kpi.totalSante, color: "text-purple-500", strokeColor: "#a855f7" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="page-header flex-col sm:flex-row gap-4 border-b border-gray-150/80 bg-white/50 backdrop-blur-md pb-6 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/bandes" className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-sm">
            <ArrowLeft size={16} className="text-gray-600" strokeWidth={2.5} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{bande.nom_lot}</h1>
              {isActive ? (
                <Badge variant="success">Actif</Badge>
              ) : (
                <Badge variant="neutral">Clôturé</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 font-semibold">{bande.race} · Âge: J+{kpi.ageBande} jours</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href={`/bandes/${bande.id}/rapport`} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-gray-600 border border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm">
            <Activity size={14} strokeWidth={2.5} />
            Rapport de synthèse
          </Link>
          {isActive && (
            <button onClick={() => void cloturerBande(bande.id)} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-red-600 border border-red-200 hover:border-red-400 bg-white hover:bg-red-50/50 px-4 py-2.5 rounded-xl transition-all duration-300 shadow-sm">
              <XCircle size={14} strokeWidth={2.5} />
              Clôturer le lot
            </button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-12 space-y-6">
        {mortaliteAlert && (
          <div className="card p-4 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white flex items-start gap-3 shadow-sm">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="text-sm font-bold text-red-950">Alerte : Taux de mortalité élevé ({kpi.tauxMortalite.toFixed(1)}%)</p>
              <p className="text-xs text-red-700/90 font-semibold mt-1">
                {kpi.totalDeces} décès enregistrés sur un total initial de {bande.nbr_poussins} poussins. Veuillez inspecter sans tarder les paramètres climatiques (température/courants d'air), vérifier l'hygiène de la litière et solliciter au besoin un vétérinaire.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard 4 KPI highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Sujets vivants", value: kpi.volaillesActuelles.toLocaleString("fr-FR"), sub: `sur ${bande.nbr_poussins} poussins`, icon: Bird, color: "bg-emerald-50/60 text-emerald-950 border border-emerald-100", iconBg: "bg-emerald-100/70 text-emerald-700" },
            { label: "Mortalité réelle", value: `${kpi.tauxMortalite.toFixed(1)}%`, sub: `${kpi.totalDeces} décès`, icon: AlertTriangle, color: mortaliteAlert ? "bg-red-50/60 text-red-950 border border-red-100" : "bg-gray-50/60 text-gray-900 border border-gray-150", iconBg: mortaliteAlert ? "bg-red-100/70 text-red-700" : "bg-gray-150/70 text-gray-600" },
            { label: "Seuil de vente", value: `${Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F`, sub: "Prix de revient unitaire", icon: Target, color: "bg-brand-50/60 text-brand-950 border border-brand-100", iconBg: "bg-brand-100/70 text-brand-700" },
            { label: "Résultat financier", value: formatMontant(kpi.marge), sub: kpi.marge >= 0 ? "Marge bénéficiaire" : "Perte", icon: Activity, color: kpi.marge >= 0 ? "bg-forest-50/60 text-forest-950 border border-forest-100" : "bg-orange-50/60 text-orange-950 border border-orange-100", iconBg: kpi.marge >= 0 ? "bg-forest-100/70 text-forest-700" : "bg-orange-100/70 text-orange-700" },
          ].map(({ label, value, sub, icon: Icon, color, iconBg }) => (
            <div key={label} className={`card p-4 transition-all duration-300 hover:shadow-md ${color}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} mb-2 shadow-sm`}>
                <Icon size={16} strokeWidth={2.5} />
              </div>
              <p className="text-xl font-black tracking-tight leading-none text-gray-900">{value}</p>
              <p className="text-[10px] opacity-75 font-semibold mt-1">{sub}</p>
              <p className="text-xs font-bold opacity-90 mt-2 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Adaptative Climate Guidance Widget */}
        {isActive && (
          <div className="card p-5 bg-gradient-to-br from-white to-gray-50/30 border border-gray-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                  <Sun size={15} className="text-amber-500 animate-spin-slow" />
                  Co-pilote Élevage — Guide Climat
                </h2>
                <p className="text-xs text-gray-400 font-semibold">Paramètres idéaux préconisés à J+{kpi.ageBande}</p>
              </div>
              <span className="text-[10px] bg-brand-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider self-start sm:self-auto">Recommandations J+{kpi.ageBande}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Temp recommendation */}
              <div className="bg-white border border-gray-150 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                  <Thermometer size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Température</p>
                  <p className="text-base font-black text-gray-800 mt-0.5">
                    {climate.tempMin} - {climate.tempMax}°C
                  </p>
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-white border border-gray-150 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <Droplets size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Humidité</p>
                  <p className="text-base font-black text-gray-800 mt-0.5">
                    {climate.humiditeMin} - {climate.humiditeMax}%
                  </p>
                </div>
              </div>

              {/* Lighting */}
              <div className="bg-white border border-gray-150 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <Sun size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Durée Éclairage</p>
                  <p className="text-base font-black text-gray-800 mt-0.5">
                    {climate.eclairageHeures} h / 24h
                  </p>
                </div>
              </div>
            </div>

            {/* Smart veterinarian advice */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3.5 flex items-start gap-3">
              <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-amber-900">Conseil technique de croissance :</p>
                <p className="text-xs text-amber-800 font-semibold mt-1 leading-relaxed">{climate.conseil}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Prophylaxis Calendar Co-pilot Widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prophylaxis co-pilot timeline (2/3 width) */}
          <div className="card p-5 md:col-span-2">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500" />
              Co-pilote Vétérinaire — Calendrier de Prophylaxie
            </h2>
            <p className="text-xs text-gray-400 font-semibold mb-5">
              Plan vaccinal et de santé standard (Cobb 500 / Ross 308)
            </p>

            <div className="relative pl-4 border-l-2 border-gray-100 space-y-4">
              {computedMilestones.map((milestone) => {
                const isDone = milestone.status === "done";
                const isTodo = milestone.status === "todo";
                const isUpcoming = milestone.status === "upcoming";

                return (
                  <div key={milestone.jour} className="relative group pl-3">
                    {/* Circle timeline indicator */}
                    <span className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm
                      ${isDone ? "border-emerald-500 bg-emerald-50" : ""}
                      ${isTodo ? "border-amber-500 bg-amber-50 animate-pulse" : ""}
                      ${isUpcoming ? "border-gray-200 bg-gray-50" : ""}
                    `}>
                      {isDone && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {isTodo && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black text-gray-800">{milestone.label}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{milestone.type}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Échéance : J+{milestone.jour} ({milestone.formattedDate})</p>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-tight">{milestone.note}</p>
                      </div>
                      <div className="self-start sm:self-auto">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shadow-sm">
                            <CheckCircle2 size={9} /> Complété
                          </span>
                        ) : isTodo ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">
                            ⚠️ À faire
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            À venir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Expenses doughnut breakdown (1/3 width) */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Scale size={15} className="text-gray-500" />
                Décomposition des coûts
              </h2>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full inline-block mt-1">Total : {formatMontant(kpi.totalDepenses)}</span>
            </div>

            <div className="mt-4 flex-1 flex items-center justify-center">
              <SVGDoughnutChart data={expenseChartData} />
            </div>

            {kpi.totalQuantiteKg > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1 text-[11px] text-gray-500 font-semibold">
                <div className="flex justify-between">
                  <span>Aliment consommé :</span>
                  <span className="text-gray-800 font-black">{kpi.totalQuantiteKg.toLocaleString("fr-FR")} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Coût moyen / sujet :</span>
                  <span className="text-gray-800 font-black">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Feed Consumption Line Chart Widget */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Wheat size={15} className="text-blue-500" />
            Suivi chronologique de la consommation alimentaire
          </h2>
          <p className="text-xs text-gray-400 font-semibold mb-4">Quantité de nourriture distribuée (kg) par saisie</p>
          <div className="w-full pt-2">
            <SVGLineChart data={feedChartData} yLabel="kg" />
          </div>
        </div>

        {/* Recommandations de vente à 20% & 30% */}
        {kpi.volaillesActuelles > 0 && (
          <div className="card p-5 border border-brand-200 bg-gradient-to-br from-white to-brand-50/10">
            <div className="flex items-center gap-2 mb-1.5">
              <Lightbulb size={15} className="text-brand-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Scénarios de rentabilité de vente</h2>
            </div>
            <p className="text-xs text-gray-400 font-semibold mb-4">
              Estimations sur la base de <strong>{kpi.volaillesActuelles} sujets vivants</strong> restants · Seuil de rentabilité plancher : <strong>{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F/sujet</strong>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Plancher */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prix Plancher (0% gain)</span>
                </div>
                <p className="text-2xl font-black text-gray-700">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} <span className="text-xs font-semibold">F</span></p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">par sujet</p>
                <div className="mt-3 pt-3 border-t border-gray-200/80 text-[11px] text-gray-500">
                  <p>Revenu total estimé :</p>
                  <p className="text-sm font-extrabold text-gray-700 mt-0.5">{formatMontant(Math.round(kpi.seuilVenteParSujet) * kpi.volaillesActuelles)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Marge nette : 0 F</p>
                </div>
              </div>

              {/* Marge 20% — Recommandé */}
              <div className="rounded-xl border-2 border-brand-400 bg-brand-50/40 p-4 relative transition-all duration-300 hover:shadow-md">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Conseillé</div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Marge Cible +20%</span>
                </div>
                <p className="text-2xl font-black text-brand-700">{kpi.prixRecommande20.toLocaleString("fr-FR")} <span className="text-xs font-semibold">F</span></p>
                <p className="text-[10px] text-brand-500 font-semibold mt-1">par sujet</p>
                <div className="mt-3 pt-3 border-t border-brand-200/60 text-[11px] text-gray-600">
                  <p>Revenu total estimé :</p>
                  <p className="text-sm font-extrabold text-brand-800 mt-0.5">{formatMontant(kpi.prixRecommande20 * kpi.volaillesActuelles)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Bénéfice : +{formatMontant(kpi.beneficePotentiel20)}</p>
                </div>
              </div>

              {/* Marge 30% — Optimal */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/20 p-4 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Marge Optimale +30%</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">{kpi.prixRecommande30.toLocaleString("fr-FR")} <span className="text-xs font-semibold">F</span></p>
                <p className="text-[10px] text-emerald-500 font-semibold mt-1">par sujet</p>
                <div className="mt-3 pt-3 border-t border-emerald-200 text-[11px] text-gray-600">
                  <p>Revenu total estimé :</p>
                  <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatMontant(kpi.prixRecommande30 * kpi.volaillesActuelles)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Bénéfice : +{formatMontant(kpi.beneficePotentiel30)}</p>
                </div>
              </div>
            </div>

            {/* Comparaison vente unité vs gros */}
            <div className="rounded-xl bg-gray-50/80 border border-gray-150 p-4">
              <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                <ShoppingCart size={13} strokeWidth={2.5} />
                Modes de commercialisation préconisés
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package size={12} className="text-brand-500" strokeWidth={2.5} />
                      <span className="text-xs font-bold text-gray-800">Vente Progressive au Détail</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-tight mt-1">
                      Idéale pour maximiser les profits en commercialisant directement auprès des particuliers au prix unitaire conseillé.
                    </p>
                  </div>
                  <p className="text-lg font-black text-brand-600 mt-3">{kpi.prixRecommande20.toLocaleString("fr-FR")} F <span className="text-[10px] text-gray-400 font-medium">/ sujet</span></p>
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp size={12} className="text-emerald-500" strokeWidth={2.5} />
                      <span className="text-xs font-bold text-gray-800">Vente en Gros en un Seul Lot</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-tight mt-1">
                      Remise de 5% intégrée. Vente rapide du lot entier à un grossiste, libérant le bâtiment d'élevage immédiatement sans risque de mévente.
                    </p>
                  </div>
                  <p className="text-lg font-black text-emerald-600 mt-3">{kpi.prixGrosMarge20.toLocaleString("fr-FR")} F <span className="text-[10px] text-gray-400 font-medium">/ sujet</span></p>
                </div>
              </div>
            </div>

            {/* Revenu déjà généré */}
            {kpi.revenuGenere > 0 && (
              <div className={`mt-4 rounded-xl p-4 flex items-center justify-between shadow-sm ${kpi.marge >= 0 ? "bg-emerald-50/50 border border-emerald-100" : "bg-orange-50/50 border border-orange-100"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.marge >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                    <Activity size={15} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Bilan des ventes réelles</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{kpi.totalVendus} sujets vendus · {formatMontant(kpi.revenuGenere)} encaissés</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black ${kpi.marge >= 0 ? "text-emerald-700" : "text-orange-700"}`}>{kpi.marge >= 0 ? "+" : ""}{formatMontant(kpi.marge)}</p>
                  <p className="text-[9px] text-gray-400 font-bold">{kpi.marge >= 0 ? `+${kpi.tauxMargeActuel.toFixed(1)}%` : `${kpi.tauxMargeActuel.toFixed(1)}%`} rentabilité</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Technical & Commercial Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General characteristics */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bird size={15} className="text-brand-500 animate-pulse" />
              Caractéristiques Générales
            </h2>
            <div className="space-y-1">
              <InfoRow icon={Calendar} label="Date de mise en place" value={formatDateLong(bande.date_debut)} />
              <InfoRow icon={Clock} label="Âge du lot actuel" value={`J+${kpi.ageBande} jours`} />
              <InfoRow icon={Tag} label="Objectif commercial" value={bande.objectif} />
              <InfoRow icon={Users} label="Taille du lot initiale" value={`${bande.nbr_poussins.toLocaleString("fr-FR")} poussins`} />
              <InfoRow icon={Banknote} label="Coût d'acquisition global" value={formatMontant(bande.prix_achat_global)} />
            </div>
          </div>

          {/* Supplier characteristics */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Phone size={15} className="text-brand-500 animate-pulse" />
              Données Fournisseur & Souche
            </h2>
            <div className="space-y-1">
              <InfoRow icon={CheckCircle2} label="Raison Sociale Fournisseur" value={bande.fournisseur} />
              <InfoRow icon={Phone} label="Contact Téléphonique" value={bande.contact_fournisseur || "Non renseigné"} />
              <InfoRow icon={Bird} label="Souche / Race du Poussin" value={bande.race} />
            </div>
          </div>
        </div>

        {/* Slices of logged details (Feed, Health, Outflows) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed log slice */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                <Wheat size={14} className="text-blue-500" />
                Alimentation
              </h2>
              <Link href="/alimentation" className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline">+ Saisir</Link>
            </div>
            {consommations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Aucun repas ou sac enregistré</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {consommations.slice().reverse().map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs group p-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div className="min-w-0">
                      <span className="font-bold text-gray-700 truncate block text-[11px]">{c.type_aliment}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{c.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-gray-800 text-[11px]">{c.quantite_kg} kg · {formatMontant(c.montant)}</span>
                      <button onClick={() => void deleteConsommation(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health log slice */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                <HeartPulse size={14} className="text-purple-500" />
                Soins & Santé
              </h2>
              <Link href="/sante" className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline">+ Saisir</Link>
            </div>
            {santeOps.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Aucun traitement ou vaccin</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {santeOps.slice().reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs group p-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div className="min-w-0">
                      <span className="font-bold text-gray-700 truncate block text-[11px]">{s.medicament}</span>
                      <span className="text-[9px] text-gray-400 font-semibold">{s.type_op} · {s.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-gray-800 text-[11px]">{formatMontant(s.montant)}</span>
                      <button onClick={() => void deleteSanteOp(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outflow log slice */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingDown size={14} className="text-red-500" />
                Ventes & Décès
              </h2>
              <Link href="/sorties" className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline">+ Saisir</Link>
            </div>
            {sorties.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Aucune vente ou perte déclarée</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {sorties.slice().reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs group p-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-gray-700 text-[11px]">{s.quantite} sujets</span>
                        <Badge variant={s.motif === "vente" ? "success" : "error"}>{s.motif}</Badge>
                      </div>
                      <span className="text-[9px] text-gray-400 font-semibold">{s.date}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold text-gray-800 text-[11px]">
                        {s.motif === "vente" ? formatMontant(s.montant_total) : (s.cause_deces || "Mortel")}
                      </span>
                      <button onClick={() => void deleteSortie(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-0.5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
