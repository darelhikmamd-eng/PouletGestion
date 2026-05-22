export type BandeStatut = "actif" | "cloture";

export type TypeAliment = "Démarrage" | "Croissance" | "Finition";

export type TypeConditionnement = "Sac (50 kg)" | "Détail (kg)";

export type TypeOperation = "Vaccination" | "Traitement Curatif" | "Vitamines";

export type MotifSortie = "vente" | "décès";

export type RacePoussin = "Cobb 500" | "Hubbard" | "Ross 308" | "Arbor Acres" | "Autre";

export const MALADIES_CIBLES = [
  "Gumboro",
  "Newcastle",
  "Coccidiose",
  "Bronchite Infectieuse",
  "Stress de transport",
  "Marek",
  "Mycoplasme",
  "Autre",
] as const;

export type MaladieCible = (typeof MALADIES_CIBLES)[number];

export interface Bande {
  id: string;
  nom_lot: string;
  date_debut: string;
  objectif: string;
  nbr_poussins: number;
  prix_achat_global: number;
  race: RacePoussin | string;
  fournisseur: string;
  contact_fournisseur: string;
  statut: BandeStatut;
}

export interface ConsommationAliment {
  id: string;
  bande_id: string;
  date: string;
  type_aliment: TypeAliment;
  conditionnement: TypeConditionnement;
  quantite_kg: number;
  montant: number;
}

export interface SanteHygiene {
  id: string;
  bande_id: string;
  date: string;
  type_op: TypeOperation;
  medicament: string;
  maladie_cible: string;
  montant: number;
}

export interface Sortie {
  id: string;
  bande_id: string;
  date: string;
  motif: MotifSortie;
  cause_deces?: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
}

export type BandeFormData = Omit<Bande, "id">;
export type ConsommationFormData = Omit<ConsommationAliment, "id">;
export type SanteFormData = Omit<SanteHygiene, "id">;
export type SortieFormData = Omit<Sortie, "id">;

export interface BandeKPIs {
  volaillesActuelles: number;
  survivants: number;
  tauxMortalite: number;
  ageBande: number;
  totalDepenses: number;
  seuilVenteParSujet: number;
  revenuGenere: number;
  marge: number;
  totalDeces: number;
  totalVendus: number;
  totalAliment: number;
  totalSante: number;
  coutParPoussinInitial: number;
  prixRecommande20: number;
  prixRecommande30: number;
  prixGrosMarge20: number;
  prixGrosMarge30: number;
  beneficePotentiel20: number;
  beneficePotentiel30: number;
  tauxMargeActuel: number;
  totalQuantiteKg: number;
  coutParKgEstime: number;
  poidsMoyenEstime?: number;
  fcr?: number;
}
