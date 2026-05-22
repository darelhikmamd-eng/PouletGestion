"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Bird, Calendar, Users, Banknote, AlertTriangle, Target, Activity, Wheat, HeartPulse, TrendingDown, Scale, Clock, Sparkles } from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";
import { computeKPIs, formatMontant, formatDateLong, getEstimatedWeight } from "@/lib/kpi";

export default function RapportBandePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getBandeById, getConsommationsByBande, getSanteByBande, getSortiesByBande } = useBandesStore();

  const bande = getBandeById(id);
  if (!bande) return notFound();

  const consommations = getConsommationsByBande(id);
  const santeOps = getSanteByBande(id);
  const sorties = getSortiesByBande(id);
  const kpi = computeKPIs(bande, consommations, santeOps, sorties);
  const dateEdition = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date());

  const totalAlimentation = consommations.reduce((acc, c) => acc + c.montant, 0);
  const totalSante = santeOps.reduce((acc, s) => acc + s.montant, 0);

  return (
    <>
      <div className="print:hidden max-w-4xl mx-auto">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Link href={`/bandes/${id}`} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="page-title">Rapport de synthèse</h1>
              <p className="text-sm text-gray-500">{bande.nom_lot}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} />
            Imprimer / PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-8 pb-16 print:px-0 print:pb-0 print:max-w-none">
        <div className="bg-white print:shadow-none">
          <div className="border-b-2 border-brand-500 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center print:hidden">
                    <Bird size={16} className="text-white" strokeWidth={2} />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Poulet-Tech</h1>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">{bande.nom_lot}</h2>
                <p className="text-gray-500 mt-1">{bande.race} · {bande.fournisseur}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p className="font-semibold text-gray-900">Rapport de Synthèse</p>
                <p>Édité le {dateEdition}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${bande.statut === "actif" ? "bg-forest-100 text-forest-800" : "bg-gray-100 text-gray-700"}`}>
                  {bande.statut === "actif" ? "En cours" : "Clôturée"}
                </span>
              </div>
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">1. Informations générales</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Calendar, label: "Date de démarrage", value: formatDateLong(bande.date_debut) },
                { icon: Users, label: "Poussins initiaux", value: `${bande.nbr_poussins.toLocaleString("fr-FR")} sujets` },
                { icon: Bird, label: "Race / Souche", value: bande.race },
                { icon: Banknote, label: "Prix d'achat global", value: formatMontant(bande.prix_achat_global) },
                { icon: Calendar, label: "Âge de la bande", value: `J+${kpi.ageBande} jours` },
                { icon: Users, label: "Contact fournisseur", value: bande.contact_fournisseur || "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <Icon size={11} strokeWidth={2} />
                    {label}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">2. Indicateurs techniques</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border-2 border-forest-200 rounded-lg p-4 bg-forest-50 text-center">
                <Bird size={20} className="text-forest-600 mx-auto mb-1" strokeWidth={2} />
                <p className="text-2xl font-extrabold text-forest-700">{kpi.volaillesActuelles.toLocaleString("fr-FR")}</p>
                <p className="text-xs text-forest-600 font-medium mt-0.5">Volailles vivantes</p>
                <p className="text-[10px] text-gray-400">sur {bande.nbr_poussins} initiaux</p>
              </div>
              <div className={`border-2 rounded-lg p-4 text-center ${kpi.tauxMortalite >= 3 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <AlertTriangle size={20} className={`mx-auto mb-1 ${kpi.tauxMortalite >= 3 ? "text-red-500" : "text-gray-400"}`} strokeWidth={2} />
                <p className={`text-2xl font-extrabold ${kpi.tauxMortalite >= 3 ? "text-red-600" : "text-gray-700"}`}>{kpi.tauxMortalite.toFixed(2)}%</p>
                <p className="text-xs font-medium mt-0.5 text-gray-600">Taux de mortalité</p>
                <p className="text-[10px] text-gray-400">{kpi.totalDeces} décès enregistrés</p>
              </div>
              <div className="border-2 border-brand-200 rounded-lg p-4 bg-brand-50 text-center">
                <Target size={20} className="text-brand-600 mx-auto mb-1" strokeWidth={2} />
                <p className="text-2xl font-extrabold text-brand-700">{Math.round(kpi.seuilVenteParSujet).toLocaleString("fr-FR")}</p>
                <p className="text-xs text-brand-600 font-medium mt-0.5">Seuil vente (F/sujet)</p>
                <p className="text-[10px] text-gray-400">Prix minimum rentable</p>
              </div>
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50 text-center">
                <TrendingDown size={20} className="text-blue-500 mx-auto mb-1" strokeWidth={2} />
                <p className="text-2xl font-extrabold text-blue-700">{kpi.totalVendus.toLocaleString("fr-FR")}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">Sujets vendus</p>
                <p className="text-[10px] text-gray-400">sur {kpi.totalVendus + kpi.volaillesActuelles} disponibles</p>
              </div>
            </div>
          </section>

          <section className="mb-8 bg-gradient-to-br from-brand-50/15 to-white border border-brand-100/60 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity size={14} className="text-brand-500" />
              3. Performances zootechniques (Cobb 500)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Indice de Consommation Réel (FCR)</p>
                <p className="text-3xl font-black text-gray-900 flex items-baseline gap-1">
                  {kpi.fcr ? kpi.fcr.toFixed(2) : "—"}
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">(Standard : ~1.70)</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed">
                  {kpi.fcr && kpi.fcr > 1.85 ? (
                    <span className="text-red-600 font-bold">⚠️ FCR dégradé : Le lot consomme trop d'aliment par rapport à son gain de poids réel. Vérifiez la mortalité et les gaspillages.</span>
                  ) : kpi.fcr && kpi.fcr > 1.75 ? (
                    <span className="text-amber-600 font-bold">💡 FCR moyen : Niveau d'efficacité correct mais perfectible. Améliorez le confort thermique.</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">✨ FCR optimal : Efficacité alimentaire exceptionnelle. Valorisation maximale des intrants.</span>
                  )}
                </p>
              </div>

              <div className="bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Poids Moyen Estimé par Sujet</p>
                <p className="text-3xl font-black text-gray-900">
                  {kpi.poidsMoyenEstime ? kpi.poidsMoyenEstime.toFixed(2) : "—"} <span className="text-sm font-semibold">kg</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-2 font-medium">
                  Biomasse totale sur pied estimée : <span className="font-extrabold text-gray-800">{Math.round((kpi.poidsMoyenEstime || 0) * kpi.volaillesActuelles).toLocaleString("fr-FR")} kg</span> pour le cheptel vivant actuel.
                </p>
              </div>
            </div>

            {/* Prolongation cycle alert & commercial strategies */}
            <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex gap-2">
                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Aide à la Décision : Rentabilité & Écoulement</h4>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed font-semibold">
                    {kpi.ageBande >= 45 ? (
                      `⚠️ ALERTE DE PROLONGATION DE CYCLE : Le lot a dépassé le cycle nominal optimal de 45 jours (Âge actuel : J+${kpi.ageBande}). À partir de J+45, la prise de muscle ralentit fortement alors que le besoin énergétique de maintenance atteint son pic (220g+ d'aliment quotidien). Conserver les sujets dégrade considérablement l'Indice de Consommation (FCR) et réduit votre marge nette chaque jour. Procédez à l'écoulement immédiat.`
                    ) : (
                      `Âge actuel du lot : J+${kpi.ageBande} jours. L'indice FCR et la rentabilité sont optimisés pour une sortie à J+45. Planifiez dès maintenant les circuits de vente en gros ou au détail pour écouler la production à l'échéance nominale.`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">4. Indicateurs financiers</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Poste</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">% Dépenses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: "Achat des poussins", icon: Bird, montant: bande.prix_achat_global, color: "text-gray-600" },
                    { label: "Alimentation", icon: Wheat, montant: totalAlimentation, color: "text-blue-600" },
                    { label: "Santé & Hygiène", icon: HeartPulse, montant: totalSante, color: "text-purple-600" },
                  ].map(({ label, icon: Icon, montant, color }) => (
                    <tr key={label} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                        <Icon size={14} className={color} strokeWidth={2} />
                        {label}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMontant(montant)}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                        {kpi.totalDepenses > 0 ? ((montant / kpi.totalDepenses) * 100).toFixed(1) : "0"}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 border-t-2 border-red-200">
                    <td className="px-4 py-3 font-bold text-red-800">Total dépenses</td>
                    <td className="px-4 py-3 text-right font-extrabold text-red-700">{formatMontant(kpi.totalDepenses)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-400 hidden sm:table-cell">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="border border-forest-200 rounded-lg p-4 bg-forest-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Revenus générés</p>
                <p className="text-xl font-extrabold text-forest-700">{formatMontant(kpi.revenuGenere)}</p>
              </div>
              <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-center">
                <p className="text-xs text-gray-500 mb-1">Total dépenses</p>
                <p className="text-xl font-extrabold text-red-700">{formatMontant(kpi.totalDepenses)}</p>
              </div>
              <div className={`border-2 rounded-lg p-4 text-center ${kpi.marge >= 0 ? "border-forest-300 bg-forest-50" : "border-orange-200 bg-orange-50"}`}>
                <p className="text-xs text-gray-500 mb-1">
                  <Activity size={11} className="inline mr-0.5" strokeWidth={2} />
                  {kpi.marge >= 0 ? "Bénéfice net" : "Déficit"}
                </p>
                <p className={`text-xl font-extrabold ${kpi.marge >= 0 ? "text-forest-800" : "text-orange-700"}`}>
                  {kpi.marge >= 0 ? "+" : ""}{formatMontant(kpi.marge)}
                </p>
              </div>
            </div>
          </section>

          {(consommations.length > 0 || santeOps.length > 0) && (
            <section className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">5. Détail des opérations</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {consommations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><Wheat size={12} className="text-blue-500" />Alimentation ({consommations.length} entrées)</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-gray-500">Date</th><th className="text-left px-3 py-2 text-gray-500">Type</th><th className="text-right px-3 py-2 text-gray-500">Qt (kg)</th><th className="text-right px-3 py-2 text-gray-500">Montant</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {consommations.map((c) => (
                            <tr key={c.id}><td className="px-3 py-1.5 text-gray-600">{c.date}</td><td className="px-3 py-1.5 text-gray-700 font-medium">{c.type_aliment}</td><td className="px-3 py-1.5 text-right">{c.quantite_kg}</td><td className="px-3 py-1.5 text-right font-semibold">{formatMontant(c.montant)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {santeOps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5"><HeartPulse size={12} className="text-purple-500" />Santé ({santeOps.length} opérations)</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2 text-gray-500">Date</th><th className="text-left px-3 py-2 text-gray-500">Produit</th><th className="text-left px-3 py-2 text-gray-500">Type</th><th className="text-right px-3 py-2 text-gray-500">Montant</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                          {santeOps.map((s) => (
                            <tr key={s.id}><td className="px-3 py-1.5 text-gray-600">{s.date}</td><td className="px-3 py-1.5 text-gray-700 font-medium">{s.medicament}</td><td className="px-3 py-1.5 text-gray-500">{s.type_op}</td><td className="px-3 py-1.5 text-right font-semibold">{formatMontant(s.montant)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="border-t border-gray-200 pt-4 flex items-center justify-between text-xs text-gray-400">
            <span>Poulet-Tech — Rapport généré automatiquement</span>
            <span>{dateEdition}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
