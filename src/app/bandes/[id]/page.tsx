"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bird, Calendar, Users, Phone, Banknote,
  Tag, CheckCircle2, XCircle, Wheat, HeartPulse, TrendingDown,
  Target, Activity, AlertTriangle, Clock, TrendingUp, ShoppingCart,
  Package, Lightbulb, Scale, Trash2, ShieldCheck, Thermometer, Droplets, Sun, Sparkles,
  Camera, Upload, Plus
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { 
  computeKPIs, 
  formatMontant, 
  formatDateLong,
  PROPHYLAXIS_SCHEDULE,
  getClimateRecommendation,
  getFeedRecommendation,
  DIAGNOSTIC_IA_DISEASES
} from "@/lib/kpi";
import { SVGDoughnutChart } from "@/components/ui/SVGDoughnutChart";
import { SVGLineChart } from "@/components/ui/SVGLineChart";
import { AlimentForm } from "@/components/alimentation/AlimentForm";
import { SanteForm } from "@/components/sante/SanteForm";
import { SortieForm } from "@/components/sorties/SortieForm";

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
  const { 
    getBandeById, 
    cloturerBande, 
    getConsommationsByBande, 
    getSanteByBande, 
    getSortiesByBande,
    deleteConsommation, 
    deleteSanteOp, 
    deleteSortie,
    addSanteOp
  } = useBandesStore();

  const bande = getBandeById(id);
  if (!bande) return notFound();

  // Advanced co-pilots state management
  const [activeTab, setActiveTab] = useState<"meteo" | "alimentation" | "ia">("ia");
  const [showAlimentModal, setShowAlimentModal] = useState(false);
  const [showSanteModal, setShowSanteModal] = useState(false);
  const [showSortieModal, setShowSortieModal] = useState(false);
  
  // 1. Weather Co-pilot
  const [selectedTown, setSelectedTown] = useState("Abidjan (CI)");
  const [weather, setWeather] = useState<{ temp: number; humidity: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const TOWNS = [
    { name: "Abidjan (CI)", lat: 5.36, lon: -4.00 },
    { name: "Dakar (SN)", lat: 14.72, lon: -17.47 },
    { name: "Bamako (ML)", lat: 12.63, lon: -8.00 },
    { name: "Yamoussoukro (CI)", lat: 6.82, lon: -5.28 },
    { name: "Bouaké (CI)", lat: 7.69, lon: -5.03 },
  ];

  useEffect(() => {
    async function fetchWeather() {
      const town = TOWNS.find(t => t.name === selectedTown) || TOWNS[0];
      setWeatherLoading(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${town.lat}&longitude=${town.lon}&current=temperature_2m,relative_humidity_2m`);
        if (res.ok) {
          const data = await res.json();
          setWeather({
            temp: data.current.temperature_2m,
            humidity: data.current.relative_humidity_2m
          });
        }
      } catch (err) {
        console.error("Météo error", err);
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchWeather();
  }, [selectedTown]);

  // 2. IA Diagnostic Simulator
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [diagnosedDisease, setDiagnosedDisease] = useState<any>(null);
  const [convalescenceList, setConvalescenceList] = useState<{ label: string; checked: boolean }[]>([]);
  const [treatmentLogged, setTreatmentLogged] = useState(false);

  const handleSampleClick = (diseaseId: string) => {
    setSelectedSample(diseaseId);
    setIsScanning(true);
    setScanComplete(false);
    setTreatmentLogged(false);
    
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      const disease = DIAGNOSTIC_IA_DISEASES.find(d => d.id === diseaseId);
      setDiagnosedDisease(disease);
      
      if (disease && disease.dureeConvalescenceJours > 0) {
        setConvalescenceList([
          { label: "Suivi quotidien de l'ingestion d'eau", checked: false },
          { label: "Nettoyage et désinfection complète des mangeoires", checked: false },
          { label: "Isolement total du compartiment infecté", checked: false },
          { label: "Assèchement mécanique et chaulage de la litière", checked: false },
          { label: "Vérification de l'absence de râles bronchiques", checked: false }
        ]);
      } else {
        setConvalescenceList([]);
      }
    }, 2000);
  };

  const handleToggleConvalescence = (index: number) => {
    setConvalescenceList(prev => prev.map((item, idx) => idx === index ? { ...item, checked: !item.checked } : item));
  };

  const handleLogTreatment = async () => {
    if (!diagnosedDisease) return;
    try {
      let med = "Amprolium 20% (Anticoccidien)";
      if (diagnosedDisease.id === "newcastle") med = "Oxytétracycline + Vitamines (Soutien)";
      if (diagnosedDisease.id === "colibacillose") med = "Enrofloxacine 10% (Antibiotique)";
      
      await addSanteOp({
        bande_id: id,
        date: new Date().toISOString().split("T")[0],
        type_op: "Traitement Curatif",
        medicament: med,
        maladie_cible: diagnosedDisease.nom,
        montant: 4500, // Standard local pack cost
      });
      setTreatmentLogged(true);
    } catch (err) {
      console.error(err);
    }
  };

  const convalescenceCompletedCount = convalescenceList.filter(c => c.checked).length;
  const convalescenceProgressPct = convalescenceList.length > 0 ? Math.round((convalescenceCompletedCount / convalescenceList.length) * 100) : 0;

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

        {/* Slices of logged details (Feed, Health, Outflows) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed log slice */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                <Wheat size={14} className="text-blue-500" />
                Alimentation
              </h2>
              <button onClick={() => setShowAlimentModal(true)} className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline cursor-pointer bg-transparent border-0 outline-none">+ Saisir</button>
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
              <button onClick={() => setShowSanteModal(true)} className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline cursor-pointer bg-transparent border-0 outline-none">+ Saisir</button>
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
              <button onClick={() => setShowSortieModal(true)} className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline cursor-pointer bg-transparent border-0 outline-none">+ Saisir</button>
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


        {/* Style block for radar scanner effect */}
        <style>{`
          @keyframes scan {
            0% { top: 0%; opacity: 0.8; }
            50% { top: 100%; opacity: 0.8; }
            100% { top: 0%; opacity: 0.8; }
          }
          .animate-scanner {
            position: absolute;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(to right, transparent, #eab308, transparent);
            box-shadow: 0 0 10px #eab308, 0 0 20px #eab308;
            animation: scan 2s infinite ease-in-out;
            pointer-events: none;
          }
        `}</style>

        {/* 🛠️ CO-PILOTES EXPERTS MULTI-ONGLETS */}
        {isActive && (
          <div className="card overflow-hidden border border-brand-200/80 bg-white shadow-md transition-all duration-300">
            {/* Header Onglets */}
            <div className="flex border-b border-gray-150/80 bg-gray-50/50 p-2 gap-1 flex-wrap">
              {[
                { id: "meteo", label: "Météo Live & Climat", icon: Sun, color: "text-amber-600 bg-amber-50" },
                { id: "alimentation", label: "Rationnement Cobb 500", icon: Wheat, color: "text-blue-600 bg-blue-50" },
                { id: "ia", label: "Diagnostic Vision IA", icon: Camera, color: "text-brand-600 bg-brand-50" }
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer border ${
                      isSelected
                        ? "bg-white border-gray-200 shadow-sm text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60"
                    }`}
                  >
                    <Icon size={14} className={isSelected ? tab.color.split(" ")[0] : "text-gray-400"} strokeWidth={2.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Contenu de l'onglet 1 : Météo Live & Climat */}
            {activeTab === "meteo" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sun size={15} className="text-amber-500" />
                      Station Bioclimatique de l'Élevage
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      Croisement en direct de la météo d'Open-Meteo avec les standards d'âge J+{kpi.ageBande}
                    </p>
                  </div>

                  {/* Town selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Localisation :</span>
                    <select
                      value={selectedTown}
                      onChange={(e) => setSelectedTown(e.target.value)}
                      className="text-xs font-black text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-sm cursor-pointer"
                    >
                      {TOWNS.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weather cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Local weather condition card */}
                  <div className="rounded-xl border border-gray-150 p-4 bg-gradient-to-b from-gray-50/50 to-white flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <span className="text-[8px] bg-amber-500/10 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider absolute top-3 right-3 animate-pulse">En Direct API</span>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Météo Locale Réelle</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 truncate">{selectedTown}</p>
                    </div>
                    {weatherLoading ? (
                      <div className="h-10 flex items-center gap-2 mt-4">
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce" />
                        <span className="text-[10px] text-gray-400 font-semibold">Synchronisation...</span>
                      </div>
                    ) : weather ? (
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">{weather.temp}°C</span>
                        <span className="text-xs font-bold text-gray-500">/ {weather.humidity}% HR</span>
                      </div>
                    ) : (
                      <p className="text-xs text-red-500 font-bold mt-4">Station météo injoignable</p>
                    )}
                  </div>

                  {/* Temp recommendation */}
                  <div className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between ${
                    weather && (weather.temp > climate.tempMax || weather.temp < climate.tempMin) 
                      ? "border-red-200 bg-red-50/20" 
                      : "border-gray-150 bg-white"
                  }`}>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Seuil Température Idéal</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Recommandé pour J+{kpi.ageBande}</p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <Thermometer size={16} className="text-red-500" strokeWidth={2.5} />
                      <span className="text-xl font-black text-gray-900">
                        {climate.tempMin} - {climate.tempMax}°C
                      </span>
                    </div>
                  </div>

                  {/* Humidity recommendation */}
                  <div className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between ${
                    weather && (weather.humidity > climate.humiditeMax || weather.humidity < climate.humiditeMin)
                      ? "border-orange-200 bg-orange-50/20" 
                      : "border-gray-150 bg-white"
                  }`}>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Humidité Relative Cible</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Optimale pour la litière</p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <Droplets size={16} className="text-blue-500" strokeWidth={2.5} />
                      <span className="text-xl font-black text-gray-900">
                        {climate.humiditeMin} - {climate.humiditeMax}%
                      </span>
                    </div>
                  </div>

                  {/* Lighting recommendation */}
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Durée Éclairage Requise</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Stimulation hypophysaire</p>
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <Clock size={16} className="text-amber-500" strokeWidth={2.5} />
                      <span className="text-xl font-black text-gray-900">
                        {climate.eclairageHeures} h <span className="text-[10px] text-gray-400 font-medium">/ 24h</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bioclimatic Threat / Stress Alert Cards */}
                {weather && (
                  <div className="space-y-2">
                    {weather.temp > climate.tempMax && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold shadow-sm">
                        <AlertTriangle size={15} className="text-red-500 animate-bounce flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-950 font-black block">Alerte Stress Thermique Critique !</strong>
                          La température réelle ({weather.temp}°C) excède le seuil tolérable de {climate.tempMax}°C pour ce stade de croissance. Activez d'urgence la ventilation dynamique, disposez des glaçons dans les abreuvoirs et réduisez l'épaisseur de la litière.
                        </div>
                      </div>
                    )}
                    {weather.temp < climate.tempMin && (
                      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold shadow-sm">
                        <AlertTriangle size={15} className="text-blue-500 animate-bounce flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-blue-950 font-black block">Alerte Refroidissement Brutal !</strong>
                          La température réelle ({weather.temp}°C) est inférieure au minimum vital de {climate.tempMin}°C. Risque élevé de syndrome respiratoire et de colibacillose. Allumez les radiants de chauffage ou isolez les entrées d'air froid.
                        </div>
                      </div>
                    )}
                    {weather.humidity > climate.humiditeMax && (
                      <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl flex items-start gap-2.5 text-xs font-semibold shadow-sm">
                        <AlertTriangle size={15} className="text-orange-500 animate-bounce flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-orange-950 font-black block">Alerte Humidité Excessive (Litière Humide) !</strong>
                          L'humidité relative ({weather.humidity}%) dépasse {climate.humiditeMax}%. Risque de fermentation anaérobie de la litière et déclenchement de la coccidiose. Ajoutez du copeau sec, évitez les éclaboussures d'abreuvoirs et augmentez la ventilation.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Climate advice footer */}
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 flex items-start gap-3">
                  <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">Conseil Technique de Croissance</h4>
                    <p className="text-xs text-amber-800 font-semibold mt-1 leading-relaxed">{climate.conseil}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenu de l'onglet 2 : Rationnement Cobb 500 */}
            {activeTab === "alimentation" && (
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wheat size={15} className="text-blue-500" />
                      Algorithme d'Alimentation Prédictive
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      Rationnement optimal calculé selon les standards nutritionnels Cobb 500
                    </p>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider self-start sm:self-auto">
                    Cobb 500 Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Daily per bird card */}
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Bird size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ration / Sujet / Jour</p>
                      <p className="text-lg font-black text-gray-800 mt-0.5">{getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).besoinJournalierParSujetGrams} g</p>
                    </div>
                  </div>

                  {/* Daily total lot card */}
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Wheat size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Besoin Journalier Total (Lot)</p>
                      <p className="text-lg font-black text-gray-800 mt-0.5">{getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).besoinJournalierTotalKg.toLocaleString("fr-FR")} kg</p>
                    </div>
                  </div>

                  {/* Weekly bags card */}
                  <div className="rounded-xl border border-gray-150 p-4 bg-white shadow-sm flex items-center gap-3.5 relative overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Package size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Cumul Hebdomadaire Suggéré</p>
                      <p className="text-lg font-black text-purple-950 mt-0.5">
                        {getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).besoinHebdoTotalKg.toLocaleString("fr-FR")} kg
                      </p>
                      <p className="text-[9px] text-purple-500 font-bold mt-0.5">
                        ≈ {(getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).besoinHebdoTotalKg / 50).toFixed(1)} sacs de 50 kg
                      </p>
                    </div>
                  </div>
                </div>

                {/* Growth Stage Visual Timeline */}
                <div className="bg-gray-50/60 border border-gray-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                    <span>Stade de Croissance actuel</span>
                    <span className="text-blue-600 font-black">{getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).typeAliment}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { range: "J+1 à J+14", label: "Démarrage", aliment: "Aliment Démarrage (Miette)", active: kpi.ageBande <= 14, color: "bg-blue-500" },
                      { range: "J+15 à J+28", label: "Croissance", aliment: "Aliment Croissance (Granulé)", active: kpi.ageBande > 14 && kpi.ageBande <= 28, color: "bg-emerald-500" },
                      { range: "J+29 à J+45+", label: "Finition", aliment: "Aliment Finition", active: kpi.ageBande > 28, color: "bg-purple-500" }
                    ].map((stage) => (
                      <div key={stage.label} className={`p-3 rounded-lg border text-center transition-all ${
                        stage.active 
                          ? "border-gray-300 bg-white shadow-sm ring-1 ring-brand-500/20" 
                          : "border-transparent bg-gray-100 opacity-60"
                      }`}>
                        <p className={`text-[10px] font-black uppercase ${stage.active ? "text-gray-800" : "text-gray-400"}`}>{stage.label}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">{stage.range}</p>
                        <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${stage.active ? stage.color : "bg-gray-200"}`} style={{ width: stage.active ? "100%" : "0%" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ration advice */}
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4 flex items-start gap-3">
                  <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">Directive d'alimentation du technicien avicole</h4>
                    <p className="text-xs text-blue-800 font-semibold mt-1 leading-relaxed">
                      {getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).conseil} 
                      {kpi.volaillesActuelles > 0 && ` Pour votre cheptel de ${kpi.volaillesActuelles} têtes, distribuez de préférence la ration de ${getFeedRecommendation(kpi.ageBande, kpi.volaillesActuelles).besoinJournalierTotalKg.toFixed(1)} kg répartie sur deux repas quotidiens (matin frais et fin d'après-midi).`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contenu de l'onglet 3 : Diagnostic Vision IA */}
            {activeTab === "ia" && (
              <div className="p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150/80">
                  <div>
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={15} className="text-brand-500 animate-pulse" />
                      Scanner Intelligent de Pathologies (Vision IA)
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      Simulation de Computer Vision entraînée sur Cobb 500 pour une détection terrain instantanée
                    </p>
                  </div>
                  <Badge variant="warning" className="bg-brand-500 text-white animate-pulse border-none">BETA EXPERT</Badge>
                </div>

                {/* Image upload selector area */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Selectors / Upload simulators (4 cols) */}
                  <div className="md:col-span-4 flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sélectionnez une photo échantillon :</p>
                    
                    {[
                      { id: "sain", name: "Fientes Normales", desc: "Sujets en bonne santé", color: "border-emerald-200 hover:border-emerald-500 bg-emerald-50/10 text-emerald-950" },
                      { id: "coccidiose", name: "Fientes Rosâtres à Rouges", desc: "Indices hémorragiques de Coccidiose", color: "border-red-200 hover:border-red-500 bg-red-50/10 text-red-950" },
                      { id: "newcastle", name: "Diarrhée Aqueuse Verdâtre", desc: "Symptôme viral de Newcastle", color: "border-purple-200 hover:border-purple-500 bg-purple-50/10 text-purple-950" },
                      { id: "colibacillose", name: "Fientes Blanchâtres pâteuses", desc: "Signes d'infection à E. coli", color: "border-amber-200 hover:border-amber-500 bg-amber-50/10 text-amber-950" }
                    ].map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSampleClick(sample.id)}
                        disabled={isScanning}
                        className={`card p-3 text-left border rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group flex flex-col justify-between cursor-pointer ${
                          selectedSample === sample.id ? "ring-2 ring-brand-500 " + sample.color : "border-gray-150"
                        } ${isScanning ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div>
                          <p className="text-xs font-black tracking-tight">{sample.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight font-semibold">{sample.desc}</p>
                        </div>
                      </button>
                    ))}

                    <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50/30 opacity-60">
                      <Upload size={18} className="text-gray-400" />
                      <p className="text-[10px] text-gray-500 font-bold mt-1.5">Importer une photo personnalisée</p>
                      <p className="text-[8px] text-gray-400 mt-0.5">Formats acceptés : PNG, JPG</p>
                    </div>
                  </div>

                  {/* Scanning visualization and report area (8 cols) */}
                  <div className="md:col-span-8 bg-gray-50/50 rounded-xl border border-gray-150 p-4 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                    {/* Scanner animation */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-brand-500/10 flex flex-col items-center justify-center z-10">
                        <div className="animate-scanner" />
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg animate-pulse text-brand-600 mb-3">
                          <Camera size={24} />
                        </div>
                        <p className="text-xs font-black text-brand-700 uppercase tracking-widest animate-bounce">
                          Analyse par convolution IA...
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold mt-1">Comparaison des biomarqueurs avec la base Cobb 500</p>
                      </div>
                    )}

                    {/* Default state */}
                    {!selectedSample && !isScanning && (
                      <div className="text-center py-12 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center shadow-inner mb-4">
                          <Camera size={28} />
                        </div>
                        <p className="text-sm font-black text-gray-800 tracking-tight">Aucun échantillon en cours d'analyse</p>
                        <p className="text-xs text-gray-400 mt-1 font-semibold max-w-sm">
                          Sélectionnez l'un des échantillons photographiques sur la gauche pour lancer la simulation d'analyse d'imagerie diagnostique.
                        </p>
                      </div>
                    )}

                    {/* Scan complete results */}
                    {scanComplete && diagnosedDisease && !isScanning && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-gray-400">Pathologie Détectée</span>
                              <Badge variant={diagnosedDisease.id === "sain" ? "success" : "error"}>
                                {diagnosedDisease.id === "sain" ? "Sain" : "Alerte Sanitaire"}
                              </Badge>
                            </div>
                            <h4 className="text-base font-black text-gray-900 tracking-tight mt-1 flex items-center gap-1.5">
                              {diagnosedDisease.nom}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-gray-400 block uppercase">Indice de Confiance</span>
                            <span className={`text-xl font-black ${diagnosedDisease.id === "sain" ? "text-emerald-600" : "text-red-600"}`}>
                              {diagnosedDisease.id === "sain" ? "99.8%" : "94.2%"}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description Clinique</p>
                          <p className="text-xs text-gray-600 font-semibold mt-1 leading-relaxed bg-white p-3 rounded-lg border border-gray-200/60 shadow-sm">{diagnosedDisease.description}</p>
                        </div>

                        {/* Symptoms & Urgency grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Symptoms */}
                          <div className="bg-white/80 border border-gray-200/80 p-3.5 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-50 pb-1">Symptômes Observés</p>
                            <ul className="space-y-1.5">
                              {diagnosedDisease.symptomes.map((symptom: string) => (
                                <li key={symptom} className="text-xs text-gray-600 font-semibold flex items-start gap-1.5">
                                  <span className="text-brand-500 mt-0.5">•</span>
                                  {symptom}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Urgency measures */}
                          <div className="bg-white/80 border border-gray-200/80 p-3.5 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2 border-b border-gray-50 pb-1">Mesures d'Urgence Immédiates</p>
                            <ul className="space-y-1.5">
                              {diagnosedDisease.mesuresUrgence.map((measure: string) => (
                                <li key={measure} className="text-xs text-red-700 font-semibold flex items-start gap-1.5">
                                  <span className="text-red-500 mt-0.5">!</span>
                                  {measure}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Treatment recommend and convalescence log */}
                        <div className="rounded-xl border border-brand-200 bg-brand-50/20 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Traitement Technico-Médical Suggéré</p>
                              <p className="text-xs text-gray-700 font-black mt-1 leading-relaxed">{diagnosedDisease.traitementPropose}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1.5">
                                Durée d'isolement recommandée : {diagnosedDisease.dureeConvalescenceJours} jours
                              </p>
                            </div>
                            
                            {diagnosedDisease.dureeConvalescenceJours > 0 && (
                              <div className="self-start sm:self-auto flex-shrink-0">
                                {treatmentLogged ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg shadow-sm">
                                    <CheckCircle2 size={12} /> Loggué au Registre
                                  </span>
                                ) : (
                                  <button
                                    onClick={handleLogTreatment}
                                    className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-black transition-all duration-200 shadow-md shadow-brand-500/25 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Plus size={14} /> Loguer le traitement
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 🩺 CONVALESCENCE PROGRESS LOG */}
                          {diagnosedDisease.dureeConvalescenceJours > 0 && convalescenceList.length > 0 && (
                            <div className="mt-4 pt-3.5 border-t border-brand-100 space-y-3">
                              <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <span>Suivi Quotidien de Convalescence</span>
                                <span className="text-brand-600 font-black">{convalescenceProgressPct}% validé</span>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                  style={{ width: `${convalescenceProgressPct}%` }}
                                />
                              </div>

                              {/* Interactive symptom checkoff */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {convalescenceList.map((item, idx) => (
                                  <button
                                    key={item.label}
                                    onClick={() => handleToggleConvalescence(idx)}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs font-semibold border transition-all ${
                                      item.checked 
                                        ? "bg-white border-brand-300 text-gray-800" 
                                        : "bg-transparent border-gray-150 text-gray-500 hover:bg-white"
                                    } cursor-pointer`}
                                  >
                                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                      item.checked ? "bg-brand-500 border-brand-500 text-white" : "border-gray-300 bg-white"
                                    }`}>
                                      {item.checked && <CheckCircle2 size={10} className="text-white" />}
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
      </div>

      {/* Modals structures */}
      {showAlimentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <Wheat size={16} className="text-blue-500" />
                Saisir une Alimentation
              </h3>
              <button
                onClick={() => setShowAlimentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-6">
              <AlimentForm
                bandeId={bande.id}
                onSuccess={() => setShowAlimentModal(false)}
                onCancel={() => setShowAlimentModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showSanteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <HeartPulse size={16} className="text-purple-500" />
                Saisir un Soin / Santé
              </h3>
              <button
                onClick={() => setShowSanteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-6">
              <SanteForm
                bandeId={bande.id}
                onSuccess={() => setShowSanteModal(false)}
                onCancel={() => setShowSanteModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showSortieModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown size={16} className="text-red-500" />
                Saisir une Vente / Décès
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
                bandeId={bande.id}
                onSuccess={() => setShowSortieModal(false)}
                onCancel={() => setShowSortieModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
