"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Bande,
  BandeFormData,
  ConsommationAliment,
  ConsommationFormData,
  SanteHygiene,
  SanteFormData,
  Sortie,
  SortieFormData,
} from "@/types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MOCK_BANDES: Bande[] = [
  {
    id: "bande-001",
    nom_lot: "Lot Mai 2026",
    date_debut: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    objectif: "engraissement",
    nbr_poussins: 500,
    prix_achat_global: 125000,
    race: "Cobb 500",
    fournisseur: "Agri-Poussin SARL",
    contact_fournisseur: "+225 07 00 00 01",
    statut: "actif",
  },
  {
    id: "bande-002",
    nom_lot: "Lot Hiver 2024",
    date_debut: "2024-11-15",
    objectif: "engraissement",
    nbr_poussins: 300,
    prix_achat_global: 75000,
    race: "Ross 308",
    fournisseur: "Ferme Centrale",
    contact_fournisseur: "+225 05 00 00 02",
    statut: "cloture",
  },
];

const MOCK_CONSOMMATIONS: ConsommationAliment[] = [
  { id: "c-001", bande_id: "bande-001", date: new Date(Date.now() - 17 * 86400000).toISOString().split("T")[0], type_aliment: "Démarrage", conditionnement: "Sac (50 kg)", quantite_kg: 50, montant: 18000 },
  { id: "c-002", bande_id: "bande-001", date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0], type_aliment: "Démarrage", conditionnement: "Sac (50 kg)", quantite_kg: 100, montant: 36000 },
  { id: "c-003", bande_id: "bande-001", date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0], type_aliment: "Croissance", conditionnement: "Sac (50 kg)", quantite_kg: 150, montant: 51000 },
];

const MOCK_SANTE: SanteHygiene[] = [
  { id: "s-001", bande_id: "bande-001", date: new Date(Date.now() - 16 * 86400000).toISOString().split("T")[0], type_op: "Vitamines", medicament: "Vitamine C + Électrolytes", maladie_cible: "Stress de transport", montant: 5000 },
  { id: "s-002", bande_id: "bande-001", date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0], type_op: "Vaccination", medicament: "Hitchner B1", maladie_cible: "Newcastle", montant: 8500 },
];

const MOCK_SORTIES: Sortie[] = [
  { id: "so-001", bande_id: "bande-001", date: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0], motif: "décès", cause_deces: "Stress de transport", quantite: 8, prix_unitaire: 0, montant_total: 0 },
  { id: "so-002", bande_id: "bande-001", date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0], motif: "décès", cause_deces: "Chaleur", quantite: 3, prix_unitaire: 0, montant_total: 0 },
];

interface BandesState {
  bandes: Bande[];
  consommations: ConsommationAliment[];
  santeOps: SanteHygiene[];
  sorties: Sortie[];

  addBande: (data: BandeFormData) => Bande;
  updateBande: (id: string, data: Partial<BandeFormData>) => void;
  deleteBande: (id: string) => void;
  cloturerBande: (id: string) => void;

  addConsommation: (data: ConsommationFormData) => void;
  addSanteOp: (data: SanteFormData) => void;
  addSortie: (data: SortieFormData) => void;

  getBandeById: (id: string) => Bande | undefined;
  getConsommationsByBande: (bandeId: string) => ConsommationAliment[];
  getSanteByBande: (bandeId: string) => SanteHygiene[];
  getSortiesByBande: (bandeId: string) => Sortie[];
}

export const useBandesStore = create<BandesState>()(
  persist(
    (set, get) => ({
      bandes: MOCK_BANDES,
      consommations: MOCK_CONSOMMATIONS,
      santeOps: MOCK_SANTE,
      sorties: MOCK_SORTIES,

      addBande: (data) => {
        const newBande: Bande = { id: generateId(), ...data };
        set((state) => ({ bandes: [...state.bandes, newBande] }));
        return newBande;
      },

      updateBande: (id, data) =>
        set((state) => ({
          bandes: state.bandes.map((b) =>
            b.id === id ? { ...b, ...data } : b
          ),
        })),

      deleteBande: (id) =>
        set((state) => ({
          bandes: state.bandes.filter((b) => b.id !== id),
        })),

      cloturerBande: (id) =>
        set((state) => ({
          bandes: state.bandes.map((b) =>
            b.id === id ? { ...b, statut: "cloture" } : b
          ),
        })),

      addConsommation: (data) =>
        set((state) => ({
          consommations: [
            ...state.consommations,
            { id: generateId(), ...data },
          ],
        })),

      addSanteOp: (data) =>
        set((state) => ({
          santeOps: [...state.santeOps, { id: generateId(), ...data }],
        })),

      addSortie: (data) =>
        set((state) => ({
          sorties: [...state.sorties, { id: generateId(), ...data }],
        })),

      getBandeById: (id) => get().bandes.find((b) => b.id === id),

      getConsommationsByBande: (bandeId) =>
        get().consommations.filter((c) => c.bande_id === bandeId),

      getSanteByBande: (bandeId) =>
        get().santeOps.filter((s) => s.bande_id === bandeId),

      getSortiesByBande: (bandeId) =>
        get().sorties.filter((s) => s.bande_id === bandeId),
    }),
    {
      name: "poulet-tech-storage",
    }
  )
);
