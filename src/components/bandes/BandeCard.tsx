"use client";

import Link from "next/link";
import { Bird, Calendar, Users, Phone, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Bande } from "@/types";

interface BandeCardProps {
  bande: Bande;
  onCloturer?: (id: string) => void;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatMontant(montant: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(montant);
}

export function BandeCard({ bande, onCloturer }: BandeCardProps) {
  const isActive = bande.statut === "actif";
  const today = new Date();
  const debut = new Date(bande.date_debut);
  const ageJours = Math.max(
    0,
    Math.floor((today.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-forest-100" : "bg-gray-100"}`}>
            <Bird size={18} strokeWidth={2} className={isActive ? "text-forest-600" : "text-gray-400"} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">{bande.nom_lot}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{bande.race}</p>
          </div>
        </div>
        <Badge variant={isActive ? "success" : "neutral"}>
          {isActive ? "Actif" : "Clôturé"}
        </Badge>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={12} className="flex-shrink-0" />
          <span>{formatDate(bande.date_debut)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users size={12} className="flex-shrink-0" />
          <span>{bande.nbr_poussins.toLocaleString("fr-FR")} sujets</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Phone size={12} className="flex-shrink-0" />
          <span className="truncate">{bande.fournisseur}</span>
        </div>
        <div className="text-xs font-medium text-gray-700">
          {formatMontant(bande.prix_achat_global)}
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between gap-2">
        {isActive && onCloturer && (
          <button
            onClick={() => {
              if (ageJours < 45) {
                alert(`Impossible de clôturer la bande "${bande.nom_lot}". Le nombre de jours minimum requis est de 45 jours. L'âge actuel est de ${ageJours} jour(s).`);
                return;
              }
              if (confirm(`Êtes-vous sûr de vouloir clôturer la bande "${bande.nom_lot}" ?`)) {
                onCloturer(bande.id);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
          >
            <XCircle size={14} />
            Clôturer
          </button>
        )}
        {!isActive && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CheckCircle2 size={14} />
            Terminé
          </div>
        )}
        <Link
          href={`/bandes/${bande.id}`}
          className="ml-auto flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Détails <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
