"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bird, Calendar, Users, Phone, Banknote,
  Tag, CheckCircle2, XCircle, Wheat, HeartPulse, TrendingDown,
  Target, Activity, AlertTriangle, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useBandesStore } from "@/store/useBandesStore";
import { computeKPIs, formatMontant, formatDateLong } from "@/lib/kpi";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
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
  const { getBandeById, cloturerBande, getConsommationsByBande, getSanteByBande, getSortiesByBande } =
    useBandesStore();

  const bande = getBandeById(id);
  if (!bande) return notFound();

  const consommations = getConsommationsByBande(id);
  const santeOps = getSanteByBande(id);
  const sorties = getSortiesByBande(id);
  const kpi = computeKPIs(bande, consommations, santeOps, sorties);
  const isActive = bande.statut === "actif";
  const mortaliteAlert = kpi.tauxMortalite >= 3;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/bandes" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{bande.nom_lot}</h1>
              <Badge variant={isActive ? "success" : "neutral"}>{isActive ? "Actif" : "Clôturé"}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{bande.race} · J+{kpi.ageBande} jours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/bandes/${bande.id}/rapport`} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <Activity size={15} />
            <span className="hidden sm:inline">Rapport</span>
          </Link>
          {isActive && (
            <button onClick={() => cloturerBande(bande.id)} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <XCircle size={15} />
              <span className="hidden sm:inline">Clôturer</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-8 pb-8 space-y-4">
        {mortaliteAlert && (
          <div className="card p-3 border-l-4 border-l-red-500 bg-red-50 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Taux de mortalité élevé : {kpi.tauxMortalite.toFixed(1)}%</p>
              <p className="text-xs text-red-600">{kpi.totalDeces} décès sur {bande.nbr_poussins} poussins. Vérifiez l'alimentation, la ventilation et les traitements.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Volailles vivantes", value: kpi.volaillesActuelles.toLocaleString("fr-FR"), sub: `sur ${bande.nbr_poussins} initiaux`, icon: Bird, color: "bg-forest-50 text-forest-700", iconBg: "bg-forest-100" },
            { label: "Taux mortalité", value: `${kpi.tauxMortalite.toFixed(1)}%`, sub: `${kpi.totalDeces} décès`, icon: AlertTriangle, color: mortaliteAlert ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600", iconBg: mortaliteAlert ? "bg-red-100" : "bg-gray-100" },
            { label: "Seuil de vente", value: `${Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F`, sub: "par sujet min.", icon: Target, color: "bg-brand-50 text-brand-700", iconBg: "bg-brand-100" },
            { label: "Marge nette", value: formatMontant(kpi.marge), sub: kpi.marge >= 0 ? "Bénéfice" : "Déficit", icon: Activity, color: kpi.marge >= 0 ? "bg-forest-50 text-forest-800" : "bg-orange-50 text-orange-700", iconBg: kpi.marge >= 0 ? "bg-forest-100" : "bg-orange-100" },
          ].map(({ label, value, sub, icon: Icon, color, iconBg }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} mb-1`}>
                <Icon size={14} strokeWidth={2} />
              </div>
              <p className="text-lg font-bold leading-tight">{value}</p>
              {sub && <p className="text-[10px] opacity-70">{sub}</p>}
              <p className="text-xs font-medium opacity-80 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { label: "Achat poussins", value: formatMontant(bande.prix_achat_global), icon: Bird, color: "text-gray-500" },
            { label: "Total alimentation", value: formatMontant(kpi.totalAliment), icon: Wheat, color: "text-blue-500" },
            { label: "Total santé", value: formatMontant(kpi.totalSante), icon: HeartPulse, color: "text-purple-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className={color} strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-4 border border-brand-200 bg-brand-50">
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-brand-600" />
            <h2 className="text-sm font-semibold text-brand-800">Analyse financière</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Dépenses totales</p>
              <p className="text-base font-bold text-red-600">{formatMontant(kpi.totalDepenses)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Revenus ventes</p>
              <p className="text-base font-bold text-forest-600">{formatMontant(kpi.revenuGenere)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Marge</p>
              <p className={`text-base font-bold ${kpi.marge >= 0 ? "text-forest-700" : "text-orange-600"}`}>{formatMontant(kpi.marge)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Seuil vente/sujet</p>
              <p className="text-base font-bold text-brand-700">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Bird size={15} className="text-brand-500" />
              Informations générales
            </h2>
            <InfoRow icon={Calendar} label="Date de démarrage" value={formatDateLong(bande.date_debut)} />
            <InfoRow icon={Clock} label="Âge de la bande" value={`J+${kpi.ageBande} jours`} />
            <InfoRow icon={Tag} label="Objectif" value={bande.objectif} />
            <InfoRow icon={Users} label="Nombre initial" value={`${bande.nbr_poussins.toLocaleString("fr-FR")} poussins`} />
            <InfoRow icon={Banknote} label="Prix d'achat global" value={formatMontant(bande.prix_achat_global)} />
          </div>
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Phone size={15} className="text-brand-500" />
              Fournisseur
            </h2>
            <InfoRow icon={CheckCircle2} label="Nom" value={bande.fournisseur} />
            <InfoRow icon={Phone} label="Contact" value={bande.contact_fournisseur || "Non renseigné"} />
            <InfoRow icon={Bird} label="Race / Souche" value={bande.race} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Wheat size={15} className="text-blue-500" />Alimentation</h2>
              <Link href="/alimentation" className="text-xs text-brand-600 hover:underline font-medium">+ Saisir</Link>
            </div>
            {consommations.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucune entrée</p>
            ) : (
              <div className="space-y-1.5">
                {consommations.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{c.type_aliment}</span>
                    <span className="font-medium text-gray-800">{c.quantite_kg} kg — {formatMontant(c.montant)}</span>
                  </div>
                ))}
                {consommations.length > 4 && <p className="text-xs text-gray-400 text-center">+{consommations.length - 4} autres</p>}
              </div>
            )}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><HeartPulse size={15} className="text-purple-500" />Santé</h2>
              <Link href="/sante" className="text-xs text-brand-600 hover:underline font-medium">+ Saisir</Link>
            </div>
            {santeOps.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucune entrée</p>
            ) : (
              <div className="space-y-1.5">
                {santeOps.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate max-w-[100px]">{s.medicament}</span>
                    <span className="font-medium text-gray-800">{s.type_op}</span>
                  </div>
                ))}
                {santeOps.length > 4 && <p className="text-xs text-gray-400 text-center">+{santeOps.length - 4} autres</p>}
              </div>
            )}
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><TrendingDown size={15} className="text-red-500" />Sorties</h2>
              <Link href="/sorties" className="text-xs text-brand-600 hover:underline font-medium">+ Saisir</Link>
            </div>
            {sorties.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucune entrée</p>
            ) : (
              <div className="space-y-1.5">
                {sorties.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <Badge variant={s.motif === "vente" ? "success" : "error"}>{s.motif}</Badge>
                    <span className="font-medium text-gray-800">{s.quantite} sujets{s.motif === "vente" ? ` — ${formatMontant(s.montant_total)}` : ""}</span>
                  </div>
                ))}
                {sorties.length > 4 && <p className="text-xs text-gray-400 text-center">+{sorties.length - 4} autres</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
