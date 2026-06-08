"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera, Upload, FileImage, Trash2, Eye, X,
  Receipt, Calendar, Tag, Bird, AlertTriangle, RefreshCw, Download, FileText,
} from "lucide-react";
import { useBandesStore } from "@/store/useBandesStore";
import { useDocumentsStore } from "@/store/useDocumentsStore";
import { processFileForUpload } from "@/lib/image";
import { formatDate } from "@/lib/kpi";
import type { Document, DocumentType } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  "facture": "bg-brand-100 text-brand-800",
  "reçu": "bg-blue-100 text-blue-800",
  "fiche vétérinaire": "bg-purple-100 text-purple-800",
  "autre": "bg-gray-100 text-gray-700",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferExtension(dataUrl: string): string {
  const mime = dataUrl.match(/^data:([^;]+);/)?.[1] ?? "";
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function downloadDoc(item: Document) {
  const a = document.createElement("a");
  a.href = item.data_url;
  const safeName = item.nom.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "document";
  a.download = `${safeName}.${inferExtension(item.data_url)}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const PAGE_SIZE = 12;

export default function DocumentsPage() {
  const { bandes } = useBandesStore();
  const { documents, isLoading, isInitialized, fetchDocuments, addDocument, deleteDocument } = useDocumentsStore();
  const [filterBande, setFilterBande] = useState("tous");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    bande_id: "",
    type: "facture" as DocumentType,
    nom: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processed, setProcessed] = useState<{ dataUrl: string; size: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isInitialized) fetchDocuments();
  }, [isInitialized, fetchDocuments]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterBande]);

  function resetForm() {
    setShowForm(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessed(null);
    setError(null);
    setForm({ bande_id: "", type: "facture", nom: "", date: new Date().toISOString().split("T")[0] });
  }

  const filtered = documents.filter(
    (d) => filterBande === "tous" || d.bande_id === filterBande
  );

  function getBandeName(id: string) {
    return bandes.find((b) => b.id === id)?.nom_lot ?? "—";
  }

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Format non supporté. Utilisez une image (JPG, PNG) ou un PDF.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setProcessing(true);
    if (!form.nom) {
      setForm((prev) => ({ ...prev, nom: file.name.replace(/\.[^.]+$/, "") }));
    }
    try {
      const result = await processFileForUpload(file);
      setProcessed(result);
      setPreviewUrl(result.dataUrl.startsWith("data:image") ? result.dataUrl : null);
      if (result.size > 3 * 1024 * 1024) {
        setError("Fichier encore trop volumineux après compression (max ~3 Mo). Choisissez un fichier plus léger.");
      }
    } catch {
      setError("Impossible de traiter ce fichier.");
      setProcessed(null);
      setPreviewUrl(null);
    } finally {
      setProcessing(false);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!processed || !form.bande_id || !form.nom) return;
    if (processed.size > 3 * 1024 * 1024) {
      setError("Fichier trop volumineux (max ~3 Mo).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await addDocument({
        bande_id: form.bande_id,
        nom: form.nom,
        type: form.type,
        date: form.date,
        data_url: processed.dataUrl,
        taille: processed.size,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id: string) {
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Factures, reçus et fiches vétérinaires — {documents.length} fichier{documents.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Upload size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Ajouter un document</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="px-4 lg:px-8 space-y-4 pb-8">
        {showForm && (
          <div className="card p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Téléverser un document</h2>
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-brand-400 bg-brand-50" : "border-gray-300 hover:border-brand-300 hover:bg-gray-50"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {processing ? (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <RefreshCw size={32} className="animate-spin text-brand-500" strokeWidth={2} />
                    <p className="text-sm font-medium">Compression en cours…</p>
                  </div>
                ) : previewUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={previewUrl} alt="Aperçu" className="max-h-40 rounded-lg object-contain border border-gray-200 shadow-sm" />
                    <p className="text-xs text-gray-500">{selectedFile?.name} · {formatSize(selectedFile?.size ?? 0)} → {processed ? formatSize(processed.size) : ""}</p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileImage size={40} className="text-gray-400" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{processed ? formatSize(processed.size) : formatSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera size={36} className="text-gray-300" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Glisser une photo ou cliquer</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, PDF acceptés</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg flex items-center gap-2 text-xs font-bold">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={15} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Bande *</label>
                  <select
                    value={form.bande_id}
                    onChange={(e) => setForm((p) => ({ ...p, bande_id: e.target.value }))}
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="">— Sélectionner —</option>
                    {bandes.map((b) => (
                      <option key={b.id} value={b.id}>{b.nom_lot}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Type de document</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as DocumentType }))}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  >
                    <option value="facture">Facture</option>
                    <option value="reçu">Reçu</option>
                    <option value="fiche vétérinaire">Fiche vétérinaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Nom du document *</label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    placeholder="Ex: Facture aliment mai"
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button type="submit" disabled={!processed || processing || uploading || !form.bande_id || !form.nom}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium"
                >
                  {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploading ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setFilterBande("tous")} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterBande === "tous" ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            Tous
          </button>
          {bandes.map((b) => (
            <button key={b.id} onClick={() => setFilterBande(b.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterBande === b.id ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {b.nom_lot}
            </button>
          ))}
        </div>

        {isLoading && !isInitialized ? (
          <div className="card p-12 text-center">
            <RefreshCw size={32} className="text-brand-500 mx-auto mb-3 animate-spin" strokeWidth={2} />
            <p className="text-gray-500 font-medium">Chargement des documents…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Receipt size={40} className="text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium">Aucun document archivé</p>
            <p className="text-sm text-gray-400 mb-4">Prenez en photo vos factures, reçus et fiches vétérinaires.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Camera size={15} />
              Téléverser un document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.slice(0, visibleCount).map((doc) => (
              <div key={doc.id} className="card overflow-hidden group">
                <div className="relative bg-gray-100 h-36 flex items-center justify-center">
                  {doc.data_url.startsWith("data:image") ? (
                    <img src={doc.data_url} alt={doc.nom} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <FileText size={44} strokeWidth={1.5} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">PDF</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button onClick={() => setPreviewDoc(doc)} title="Aperçu" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                      <Eye size={14} className="text-gray-700" />
                    </button>
                    <button onClick={() => downloadDoc(doc)} title="Télécharger" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                      <Download size={14} className="text-gray-700" />
                    </button>
                    <button onClick={() => deleteDoc(doc.id)} title="Supprimer" className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.nom}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[doc.type]}`}>{doc.type}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar size={9} />{formatDate(doc.date)}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Bird size={9} />{getBandeName(doc.bande_id)}</span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">{formatSize(doc.taille)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm"
            >
              Afficher plus ({filtered.length - visibleCount} restant{filtered.length - visibleCount > 1 ? "s" : ""})
            </button>
          </div>
        )}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">{previewDoc.nom}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[previewDoc.type]}`}>{previewDoc.type}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Tag size={10} />{getBandeName(previewDoc.bande_id)}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10} />{formatDate(previewDoc.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadDoc(previewDoc)} title="Télécharger" className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center hover:bg-brand-100">
                  <Download size={15} className="text-brand-600" />
                </button>
                <button onClick={() => setPreviewDoc(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                  <X size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-50 min-h-64">
              {previewDoc.data_url.startsWith("data:image") ? (
                <img src={previewDoc.data_url} alt={previewDoc.nom} className="max-h-[60vh] object-contain rounded-lg" />
              ) : previewDoc.data_url.startsWith("data:application/pdf") ? (
                <object data={previewDoc.data_url} type="application/pdf" className="w-full h-[60vh] rounded-lg">
                  <div className="text-center py-8">
                    <FileText size={64} className="text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-gray-500 mb-3">Aperçu PDF non pris en charge par ce navigateur.</p>
                    <button onClick={() => downloadDoc(previewDoc)} className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      <Download size={15} /> Télécharger le PDF
                    </button>
                  </div>
                </object>
              ) : (
                <div className="text-center">
                  <FileImage size={64} className="text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-gray-500">Aperçu non disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
