"use client";

import { create } from "zustand";
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

interface BandesState {
  bandes: Bande[];
  consommations: ConsommationAliment[];
  santeOps: SanteHygiene[];
  sorties: Sortie[];
  isLoading: boolean;
  isInitialized: boolean;

  fetchAll: () => Promise<void>;

  addBande: (data: BandeFormData) => Promise<Bande>;
  cloturerBande: (id: string) => Promise<void>;
  deleteBande: (id: string) => Promise<void>;

  addConsommation: (data: ConsommationFormData) => Promise<void>;
  deleteConsommation: (id: string) => Promise<void>;
  addSanteOp: (data: SanteFormData) => Promise<void>;
  deleteSanteOp: (id: string) => Promise<void>;
  addSortie: (data: SortieFormData) => Promise<void>;
  deleteSortie: (id: string) => Promise<void>;

  getBandeById: (id: string) => Bande | undefined;
  getConsommationsByBande: (bandeId: string) => ConsommationAliment[];
  getSanteByBande: (bandeId: string) => SanteHygiene[];
  getSortiesByBande: (bandeId: string) => Sortie[];
}

export const useBandesStore = create<BandesState>()((set, get) => ({
  bandes: [],
  consommations: [],
  santeOps: [],
  sorties: [],
  isLoading: false,
  isInitialized: false,

  fetchAll: async () => {
    set({ isLoading: true });
    try {
      const [b, c, s, so] = await Promise.all([
        fetch("/api/bandes").then((r) => r.json()),
        fetch("/api/consommations").then((r) => r.json()),
        fetch("/api/sante").then((r) => r.json()),
        fetch("/api/sorties").then((r) => r.json()),
      ]);
      set({
        bandes: Array.isArray(b) ? b : [],
        consommations: Array.isArray(c) ? c : [],
        santeOps: Array.isArray(s) ? s : [],
        sorties: Array.isArray(so) ? so : [],
        isInitialized: true,
      });
    } catch (err) {
      console.error("fetchAll error", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addBande: async (data) => {
    const res = await fetch("/api/bandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur lors de la création de la bande");
    }
    const newBande: Bande = await res.json();
    set((state) => ({ bandes: [...state.bandes, newBande] }));
    return newBande;
  },

  cloturerBande: async (id) => {
    const bande = get().bandes.find((b) => b.id === id);
    if (bande) {
      const today = new Date();
      const debut = new Date(bande.date_debut);
      const ageJours = Math.max(
        0,
        Math.floor((today.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
      );
      if (ageJours < 45) {
        alert(`Impossible de clôturer la bande "${bande.nom_lot}". Le nombre de jours minimum requis est de 45 jours. L'âge actuel de ce lot est de ${ageJours} jour(s).`);
        return;
      }
    }

    const res = await fetch(`/api/bandes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "cloture" }),
    });
    if (!res.ok) throw new Error("Erreur lors de la clôture");
    set((state) => ({
      bandes: state.bandes.map((b) =>
        b.id === id ? { ...b, statut: "cloture" } : b
      ),
    }));
  },

  deleteBande: async (id) => {
    await fetch(`/api/bandes/${id}`, { method: "DELETE" });
    set((state) => ({
      bandes: state.bandes.filter((b) => b.id !== id),
    }));
  },

  addConsommation: async (data) => {
    const res = await fetch("/api/consommations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
    const newEntry: ConsommationAliment = await res.json();
    set((state) => ({ consommations: [...state.consommations, newEntry] }));
  },

  deleteConsommation: async (id) => {
    const res = await fetch(`/api/consommations/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors de la suppression");
    set((state) => ({ consommations: state.consommations.filter((c) => c.id !== id) }));
  },

  addSanteOp: async (data) => {
    const res = await fetch("/api/sante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
    const newEntry: SanteHygiene = await res.json();
    set((state) => ({ santeOps: [...state.santeOps, newEntry] }));
  },

  deleteSanteOp: async (id) => {
    const res = await fetch(`/api/sante/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors de la suppression");
    set((state) => ({ santeOps: state.santeOps.filter((s) => s.id !== id) }));
  },

  addSortie: async (data) => {
    const res = await fetch("/api/sorties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
    const newEntry: Sortie = await res.json();
    set((state) => ({ sorties: [...state.sorties, newEntry] }));
  },

  deleteSortie: async (id) => {
    const res = await fetch(`/api/sorties/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors de la suppression");
    set((state) => ({ sorties: state.sorties.filter((s) => s.id !== id) }));
  },

  getBandeById: (id) => get().bandes.find((b) => b.id === id),
  getConsommationsByBande: (bandeId) =>
    get().consommations.filter((c) => c.bande_id === bandeId),
  getSanteByBande: (bandeId) =>
    get().santeOps.filter((s) => s.bande_id === bandeId),
  getSortiesByBande: (bandeId) =>
    get().sorties.filter((s) => s.bande_id === bandeId),
}));
