import type { Bande, ConsommationAliment, SanteHygiene, Sortie, BandeKPIs } from "@/types";

const MARGE_GROS_DISCOUNT = 0.05; // 5% de remise pour vente en gros

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

  const volaillesActuelles = Math.max(0, bande.nbr_poussins - totalDeces - totalVendus);
  const survivants = Math.max(0, bande.nbr_poussins - totalDeces);

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
  const totalQuantiteKg = consommations.reduce((acc, c) => acc + c.quantite_kg, 0);

  const totalDepenses = bande.prix_achat_global + totalAliment + totalSante;

  const coutParPoussinInitial =
    bande.nbr_poussins > 0 ? bande.prix_achat_global / bande.nbr_poussins : 0;

  const seuilVenteParSujet =
    survivants > 0 ? totalDepenses / survivants : (bande.nbr_poussins > 0 ? totalDepenses / bande.nbr_poussins : 0);

  const prixRecommande20 = Math.ceil(seuilVenteParSujet * 1.2);
  const prixRecommande30 = Math.ceil(seuilVenteParSujet * 1.3);

  const prixGrosMarge20 = Math.ceil(prixRecommande20 * (1 - MARGE_GROS_DISCOUNT));
  const prixGrosMarge30 = Math.ceil(prixRecommande30 * (1 - MARGE_GROS_DISCOUNT));

  const beneficePotentiel20 = prixRecommande20 * volaillesActuelles - totalDepenses;
  const beneficePotentiel30 = prixRecommande30 * volaillesActuelles - totalDepenses;

  const revenuGenere = sorties
    .filter((s) => s.motif === "vente")
    .reduce((acc, s) => acc + s.montant_total, 0);

  const marge = revenuGenere - totalDepenses;

  const tauxMargeActuel =
    totalDepenses > 0 && revenuGenere > 0
      ? ((revenuGenere - totalDepenses) / totalDepenses) * 100
      : 0;

  const coutParKgEstime = totalQuantiteKg > 0 ? totalDepenses / totalQuantiteKg : 0;

  return {
    volaillesActuelles,
    survivants,
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
    coutParPoussinInitial,
    prixRecommande20,
    prixRecommande30,
    prixGrosMarge20,
    prixGrosMarge30,
    beneficePotentiel20,
    beneficePotentiel30,
    tauxMargeActuel,
    totalQuantiteKg,
    coutParKgEstime,
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
