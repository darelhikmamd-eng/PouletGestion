import type { Bande, ConsommationAliment, SanteHygiene, Sortie, BandeKPIs } from "@/types";

export function computeKPIs(
  bande: Bande,
  consommations: ConsommationAliment[],
  santeOps: SanteHygiene[],
  sorties: Sortie[]
): BandeKPIs {
  const totalDeces = sorties
    .filter((s) => s.motif === "décès")
    .reduce((acc, s) => acc + s.quantite, 0);

  const totalVendus = sorties
    .filter((s) => s.motif === "vente")
    .reduce((acc, s) => acc + s.quantite, 0);

  const volaillesActuelles = bande.nbr_poussins - totalDeces - totalVendus;

  const tauxMortalite =
    bande.nbr_poussins > 0 ? (totalDeces / bande.nbr_poussins) * 100 : 0;

  const today = new Date();
  const debut = new Date(bande.date_debut);
  const ageBande = Math.max(
    0,
    Math.floor((today.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalAliment = consommations.reduce((acc, c) => acc + c.montant, 0);
  const totalSante = santeOps.reduce((acc, s) => acc + s.montant, 0);

  const totalDepenses =
    bande.prix_achat_global + totalAliment + totalSante;

  const seuilVenteParSujet =
    volaillesActuelles > 0 ? totalDepenses / volaillesActuelles : 0;

  const revenuGenere = sorties
    .filter((s) => s.motif === "vente")
    .reduce((acc, s) => acc + s.montant_total, 0);

  const marge = revenuGenere - totalDepenses;

  return {
    volaillesActuelles,
    tauxMortalite,
    ageBande,
    totalDepenses,
    seuilVenteParSujet,
    revenuGenere,
    marge,
    totalDeces,
    totalVendus,
    totalAliment,
    totalSante,
  };
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(montant);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateLong(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}
