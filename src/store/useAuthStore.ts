"use client";

import { create } from "zustand";

export interface FarmProfile {
  id?: string;
  email?: string;
  nom_ferme: string;
  localite: string;
  ville: string;
  pays: string;
  contact: string;
  activite_principale: string;
  objectif_utilisateur: string;
}

interface AuthState {
  isAuthenticated: boolean;
  farmProfile: FarmProfile | null;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: FarmProfile & { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (profile: FarmProfile) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  farmProfile: null,
  isLoading: true,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const profile: FarmProfile = await res.json();
        set({ isAuthenticated: true, farmProfile: profile, isLoading: false });
      } else {
        set({ isAuthenticated: false, farmProfile: null, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, farmProfile: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ isAuthenticated: true, farmProfile: data, isLoading: false });
        return { ok: true };
      } else {
        set({ isLoading: false });
        return { ok: false, error: data.error ?? "Identifiants incorrects." };
      }
    } catch {
      set({ isLoading: false });
      return { ok: false, error: "Impossible de contacter le serveur." };
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        set({ isAuthenticated: true, farmProfile: data, isLoading: false });
        return { ok: true };
      } else {
        set({ isLoading: false });
        return { ok: false, error: data.error ?? "Erreur lors de la création du compte." };
      }
    } catch {
      set({ isLoading: false });
      return { ok: false, error: "Impossible de contacter le serveur." };
    }
  },

  updateProfile: async (profile) => {
    // Profile update can be added later via /api/auth/profile
    set({ farmProfile: profile });
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    set({ isAuthenticated: false, farmProfile: null });
  },
}));
