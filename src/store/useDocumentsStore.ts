"use client";

import { create } from "zustand";
import type { Document, DocumentFormData } from "@/types";

interface DocumentsState {
  documents: Document[];
  isLoading: boolean;
  isInitialized: boolean;

  fetchDocuments: () => Promise<void>;
  addDocument: (data: DocumentFormData) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>()((set) => ({
  documents: [],
  isLoading: false,
  isInitialized: false,

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      set({ documents: Array.isArray(data) ? data : [], isInitialized: true });
    } catch (err) {
      console.error("fetchDocuments error", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addDocument: async (data) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Erreur lors de l'enregistrement du document");
    }
    const newDoc: Document = await res.json();
    set((state) => ({ documents: [newDoc, ...state.documents] }));
  },

  deleteDocument: async (id) => {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erreur lors de la suppression");
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },
}));
