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
  updateProfile: (profile: FarmProfile) => Promise<{ ok: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ ok: boolean; error?: string }>;
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
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (res.ok) {
        set({ farmProfile: data });
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Erreur lors de la mise à jour du profil." };
    } catch {
      return { ok: false, error: "Impossible de contacter le serveur." };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return { ok: true };
      return { ok: false, error: data.error ?? "Erreur lors du changement de mot de passe." };
    } catch {
      return { ok: false, error: "Impossible de contacter le serveur." };
    }
  },

  deleteAccount: async (password) => {
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        set({ isAuthenticated: false, farmProfile: null });
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Erreur lors de la suppression du compte." };
    } catch {
      return { ok: false, error: "Impossible de contacter le serveur." };
    }
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
