"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Bird, Calendar, Users, Phone, Banknote,
  Tag, CheckCircle2, XCircle, Wheat, HeartPulse, TrendingDown,
  Target, Activity, AlertTriangle, Clock, TrendingUp, ShoppingCart,
  Package, Lightbulb, Scale, Trash2,
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
            <button onClick={() => void cloturerBande(bande.id)} className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
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

        {/* Décomposition des coûts */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Décomposition des coûts</h2>
            <span className="ml-auto text-xs font-bold text-red-600">{formatMontant(kpi.totalDepenses)} total</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Achat poussins", value: bande.prix_achat_global, icon: Bird, color: "bg-gray-400", pct: kpi.totalDepenses > 0 ? (bande.prix_achat_global / kpi.totalDepenses) * 100 : 0 },
              { label: "Alimentation", value: kpi.totalAliment, icon: Wheat, color: "bg-blue-400", pct: kpi.totalDepenses > 0 ? (kpi.totalAliment / kpi.totalDepenses) * 100 : 0 },
              { label: "Santé & Hygiène", value: kpi.totalSante, icon: HeartPulse, color: "bg-purple-400", pct: kpi.totalDepenses > 0 ? (kpi.totalSante / kpi.totalDepenses) * 100 : 0 },
            ].map(({ label, value, icon: Icon, color, pct }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{formatMontant(value)} <span className="text-gray-400">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {kpi.totalQuantiteKg > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Aliments consommés : <strong className="text-gray-700">{kpi.totalQuantiteKg.toLocaleString("fr-FR")} kg</strong></span>
              <span>Coût moyen / sujet : <strong className="text-gray-700">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F</strong></span>
            </div>
          )}
        </div>

        {/* Recommandations intelligentes de vente */}
        {kpi.volaillesActuelles > 0 && (
          <div className="card p-4 border border-brand-200">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={15} className="text-brand-500" />
              <h2 className="text-sm font-semibold text-gray-800">Recommandations de vente</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Basées sur <strong>{kpi.volaillesActuelles} volailles vivantes</strong> · Coût de revient : <strong>{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} F/sujet</strong>
            </p>

            {/* 3 scénarios de prix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {/* Plancher */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plancher</span>
                </div>
                <p className="text-2xl font-black text-gray-700">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")} <span className="text-sm font-medium">F</span></p>
                <p className="text-[10px] text-gray-500 mt-0.5">par sujet — ni gain ni perte</p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Si tout vendu :</p>
                  <p className="text-sm font-bold text-gray-700">{formatMontant(Math.round(kpi.seuilVenteParSujet) * kpi.volaillesActuelles)}</p>
                  <p className="text-xs text-gray-400">Bénéfice : 0 F</p>
                </div>
              </div>

              {/* Marge 20% — Recommandé */}
              <div className="rounded-xl border-2 border-brand-400 bg-brand-50 p-3 relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Recommandé</div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Marge 20%</span>
                </div>
                <p className="text-2xl font-black text-brand-700">{kpi.prixRecommande20.toLocaleString("fr-FR")} <span className="text-sm font-medium">F</span></p>
                <p className="text-[10px] text-brand-500 mt-0.5">par sujet — vente unité</p>
                <div className="mt-2 pt-2 border-t border-brand-200">
                  <p className="text-xs text-gray-500">Si tout vendu :</p>
                  <p className="text-sm font-bold text-brand-700">{formatMontant(kpi.prixRecommande20 * kpi.volaillesActuelles)}</p>
                  <p className="text-xs text-forest-600 font-semibold">+ {formatMontant(kpi.beneficePotentiel20)}</p>
                </div>
              </div>

              {/* Marge 30% — Optimal */}
              <div className="rounded-xl border border-forest-300 bg-forest-50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-forest-500" />
                  <span className="text-xs font-semibold text-forest-700 uppercase tracking-wide">Optimal 30%</span>
                </div>
                <p className="text-2xl font-black text-forest-700">{kpi.prixRecommande30.toLocaleString("fr-FR")} <span className="text-sm font-medium">F</span></p>
                <p className="text-[10px] text-forest-500 mt-0.5">par sujet — vente unité</p>
                <div className="mt-2 pt-2 border-t border-forest-200">
                  <p className="text-xs text-gray-500">Si tout vendu :</p>
                  <p className="text-sm font-bold text-forest-700">{formatMontant(kpi.prixRecommande30 * kpi.volaillesActuelles)}</p>
                  <p className="text-xs text-forest-600 font-semibold">+ {formatMontant(kpi.beneficePotentiel30)}</p>
                </div>
              </div>
            </div>

            {/* Comparaison vente unité vs gros */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                <ShoppingCart size={13} />
                Mode de vente — comparaison
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Package size={12} className="text-brand-500" />
                    <span className="text-xs font-semibold text-gray-700">Par unité</span>
                  </div>
                  <p className="text-xs text-gray-500">Prix conseillé</p>
                  <p className="text-base font-black text-brand-600">{kpi.prixRecommande20.toLocaleString("fr-FR")} F</p>
                  <p className="text-[10px] text-gray-400 mt-1">Meilleur revenu · Vente progressive</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-forest-500" />
                    <span className="text-xs font-semibold text-gray-700">En gros (lot entier)</span>
                  </div>
                  <p className="text-xs text-gray-500">Prix conseillé (−5%)</p>
                  <p className="text-base font-black text-forest-600">{kpi.prixGrosMarge20.toLocaleString("fr-FR")} F</p>
                  <p className="text-[10px] text-gray-400 mt-1">Paiement immédiat · Zéro invendu</p>
                </div>
              </div>
            </div>

            {/* Résultat actuel si ventes déjà faites */}
            {kpi.revenuGenere > 0 && (
              <div className={`mt-3 rounded-lg p-3 flex items-center gap-3 ${kpi.marge >= 0 ? "bg-forest-50 border border-forest-200" : "bg-orange-50 border border-orange-200"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.marge >= 0 ? "bg-forest-100" : "bg-orange-100"}`}>
                  <Activity size={14} className={kpi.marge >= 0 ? "text-forest-600" : "text-orange-600"} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">Résultat ventes réalisées</p>
                  <p className="text-xs text-gray-500">{kpi.totalVendus} sujets vendus · {formatMontant(kpi.revenuGenere)} encaissés</p>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black ${kpi.marge >= 0 ? "text-forest-700" : "text-orange-600"}`}>{formatMontant(kpi.marge)}</p>
                  <p className="text-[10px] text-gray-400">{kpi.marge >= 0 ? `+${kpi.tauxMargeActuel.toFixed(1)}%` : `${kpi.tauxMargeActuel.toFixed(1)}%`}</p>
                </div>
              </div>
            )}
          </div>
        )}

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
                  <div key={c.id} className="flex items-center justify-between text-xs group">
                    <span className="text-gray-600">{c.type_aliment}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{c.quantite_kg} kg — {formatMontant(c.montant)}</span>
                      <button onClick={() => void deleteConsommation(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
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
                  <div key={s.id} className="flex items-center justify-between text-xs group">
                    <span className="text-gray-600 truncate max-w-[100px]">{s.medicament}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{s.type_op}</span>
                      <button onClick={() => void deleteSanteOp(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
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
                  <div key={s.id} className="flex items-center justify-between text-xs group">
                    <Badge variant={s.motif === "vente" ? "success" : "error"}>{s.motif}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{s.quantite} sujets{s.motif === "vente" ? ` — ${formatMontant(s.montant_total)}` : ""}</span>
                      <button onClick={() => void deleteSortie(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
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
