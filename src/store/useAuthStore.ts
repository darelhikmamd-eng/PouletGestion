"use client";

import { create } from "zustand";

export interface FarmProfile {
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
  
  initialize: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  setupFarm: (profile: FarmProfile) => Promise<void>;
  updateProfile: (profile: FarmProfile) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  farmProfile: null,
  isLoading: true,

  initialize: () => {
    if (typeof window === "undefined") return;
    try {
      const isAuth = localStorage.getItem("poulet_tech_auth") === "true";
      const profileStr = localStorage.getItem("poulet_tech_profile");
      const farmProfile = profileStr ? JSON.parse(profileStr) : null;
      
      set({
        isAuthenticated: isAuth,
        farmProfile: farmProfile,
        isLoading: false,
      });
    } catch (e) {
      console.error("Failed to initialize auth store", e);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    // Simple demo validation
    // Allows logging in with any user, but defaults to elevage@poulet.com / poulet123
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email.trim() && password.length >= 4) {
          localStorage.setItem("poulet_tech_auth", "true");
          // If no profile exists, let's create a default one to avoid crashes
          let profile = null;
          const profileStr = localStorage.getItem("poulet_tech_profile");
          if (profileStr) {
            profile = JSON.parse(profileStr);
          } else {
            profile = {
              nom_ferme: "Ma Ferme Avicole",
              localite: "Quartier Central",
              ville: "Abidjan",
              pays: "Côte d'Ivoire",
              contact: "+225 07 00 00 00 00",
              activite_principale: "Élevage de poulets de chair (Cobb 500)",
              objectif_utilisateur: "Optimisation de l'Indice de Consommation (FCR) et maximisation des profits de rotation",
            };
            localStorage.setItem("poulet_tech_profile", JSON.stringify(profile));
          }
          
          set({
            isAuthenticated: true,
            farmProfile: profile,
            isLoading: false,
          });
          resolve(true);
        } else {
          set({ isLoading: false });
          resolve(false);
        }
      }, 800);
    });
  },

  setupFarm: async (profile) => {
    set({ isLoading: true });
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem("poulet_tech_auth", "true");
        localStorage.setItem("poulet_tech_profile", JSON.stringify(profile));
        set({
          isAuthenticated: true,
          farmProfile: profile,
          isLoading: false,
        });
        resolve();
      }, 1000);
    });
  },

  updateProfile: async (profile) => {
    set({ isLoading: true });
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem("poulet_tech_profile", JSON.stringify(profile));
        set({
          farmProfile: profile,
          isLoading: false,
        });
        resolve();
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem("poulet_tech_auth");
    set({
      isAuthenticated: false,
      farmProfile: null,
    });
  },
}));
