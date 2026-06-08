"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, MapPin, Building2, Globe, Phone, Target, 
  Activity, Sparkles, Save, CheckCircle2, RefreshCw,
  Lock, Eye, EyeOff, ShieldCheck, Trash2, AlertTriangle
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function ParametresPage() {
  const router = useRouter();
  const { farmProfile, updateProfile, changePassword, deleteAccount, initialize } = useAuthStore();
  
  const [form, setForm] = useState({
    nom_ferme: "",
    localite: "",
    ville: "",
    pays: "",
    contact: "",
    activite_principale: "",
    objectif_utilisateur: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mot de passe
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // Suppression de compte
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (farmProfile) {
      setForm({
        nom_ferme: farmProfile.nom_ferme || "",
        localite: farmProfile.localite || "",
        ville: farmProfile.ville || "",
        pays: farmProfile.pays || "",
        contact: farmProfile.contact || "",
        activite_principale: farmProfile.activite_principale || "",
        objectif_utilisateur: farmProfile.objectif_utilisateur || "",
      });
    }
  }, [farmProfile]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(false);
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const result = await updateProfile(form);
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setError(result.error ?? "Erreur lors de l'enregistrement.");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (pwForm.newPassword.length < 6) {
      setPwError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setPwLoading(true);
    const result = await changePassword(pwForm.currentPassword, pwForm.newPassword);
    setPwLoading(false);

    if (result.ok) {
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwSuccess(false), 4000);
    } else {
      setPwError(result.error ?? "Erreur lors du changement de mot de passe.");
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);
    const result = await deleteAccount(deletePassword);
    setDeleteLoading(false);

    if (result.ok) {
      router.replace("/login");
    } else {
      setDeleteError(result.error ?? "Erreur lors de la suppression du compte.");
    }
  }

  const pwInputClass = "w-full bg-white border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm";

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Page header */}
      <div className="page-header border-b border-gray-150/80 bg-white/50 backdrop-blur-md pb-6 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={13} className="animate-spin-slow" />
            Configuration globale
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight lg:text-3xl">
            Paramètres de la Ferme
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Personnalisez l'identité de votre exploitation avicole et vos objectifs de rotation.
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 space-y-6">
        {/* Success Alert */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-black shadow-sm animate-bounce">
            <CheckCircle2 className="text-emerald-500 flex-shrink-0 animate-pulse" size={18} />
            <div>
              <p className="text-emerald-950 font-black">Paramètres enregistrés avec succès !</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">L'identité de votre ferme et vos objectifs ont été mis à jour instantanément.</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-black shadow-sm">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
            <p className="text-red-900 font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Main Form Settings (8 columns) */}
          <div className="md:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <Home size={16} className="text-brand-500" />
                Identité de l'Exploitation
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nom de la ferme *</label>
                  <div className="relative">
                    <Home size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="nom_ferme"
                      required
                      value={form.nom_ferme}
                      onChange={handleChange}
                      placeholder="Ex: Ferme Avicole Bénie"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Localité (Quartier) *</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="localite"
                      required
                      value={form.localite}
                      onChange={handleChange}
                      placeholder="Ex: Niangon Sud"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ville *</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="ville"
                      required
                      value={form.ville}
                      onChange={handleChange}
                      placeholder="Ex: Abidjan"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pays *</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="pays"
                      required
                      value={form.pays}
                      onChange={handleChange}
                      placeholder="Ex: Côte d'Ivoire"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Contact (Téléphone) *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="contact"
                      required
                      value={form.contact}
                      onChange={handleChange}
                      placeholder="Ex: +225 07 08 09 10 11"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <Target size={16} className="text-brand-500" />
                Vocation & Stratégie
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Activité Principale</label>
                  <div className="relative">
                    <Activity size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="activite_principale"
                      value={form.activite_principale}
                      onChange={handleChange}
                      placeholder="Ex: Élevage de poulets de chair (Cobb 500)"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Objectif de l'utilisateur</label>
                  <div className="relative">
                    <Target size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="objectif_utilisateur"
                      value={form.objectif_utilisateur}
                      onChange={handleChange}
                      placeholder="Ex: Optimisation FCR et rentabilité des rotations rapides"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-300 shadow-md shadow-brand-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={14} strokeWidth={2.5} />
                    Sauvegarder les modifications
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Carte: Changement de mot de passe ── */}
          <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center gap-2">
              <Lock size={16} className="text-brand-500" />
              Sécurité — Mot de passe
            </h2>

            {pwSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2 text-xs font-black">
                <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
                Mot de passe mis à jour avec succès.
              </div>
            )}
            {pwError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                {pwError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mot de passe actuel *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={pwForm.currentPassword}
                  onChange={(e) => { setPwForm((p) => ({ ...p, currentPassword: e.target.value })); setPwError(null); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={pwInputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Nouveau mot de passe *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={pwForm.newPassword}
                    onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwError(null); }}
                    placeholder="Min. 6 caractères"
                    autoComplete="new-password"
                    className={pwInputClass}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Confirmer *</label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={pwForm.confirmPassword}
                    onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwError(null); }}
                    placeholder="Répéter le mot de passe"
                    autoComplete="new-password"
                    className={pwInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-300 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {pwLoading ? (
                  <><RefreshCw size={14} className="animate-spin" /> Mise à jour...</>
                ) : (
                  <><Lock size={14} strokeWidth={2.5} /> Changer le mot de passe</>
                )}
              </button>
            </div>
          </form>

          {/* ── Carte: Zone de danger ── */}
          <div className="card p-6 space-y-4 border border-red-200 bg-red-50/30">
            <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider border-b border-red-100 pb-2.5 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Zone de danger
            </h2>
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              La suppression de votre compte est <span className="font-black text-red-600">définitive</span>. Toutes vos bandes, consommations, opérations sanitaires et sorties seront irréversiblement effacées.
            </p>

            {!deleteOpen ? (
              <button
                type="button"
                onClick={() => { setDeleteOpen(true); setDeleteError(null); }}
                className="inline-flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 size={14} /> Supprimer mon compte
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-3 bg-white border border-red-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-700">Confirmez avec votre mot de passe pour supprimer définitivement le compte :</p>
                {deleteError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-lg flex items-center gap-2 text-xs font-bold">
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={15} />
                    {deleteError}
                  </div>
                )}
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-400 transition-all shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setDeleteOpen(false); setDeletePassword(""); setDeleteError(null); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <><RefreshCw size={14} className="animate-spin" /> Suppression...</>
                    ) : (
                      <><Trash2 size={14} /> Supprimer définitivement</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          </div>

          {/* Sidebar Explanatory Panel (4 columns) */}
          <div className="md:col-span-4 space-y-4">
            <div className="card p-5 bg-gradient-to-br from-brand-50/50 to-white border border-brand-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-brand-500 animate-pulse" />
                <h3 className="text-xs font-black text-brand-900 uppercase tracking-wider">Note de l'Expert Cobb 500</h3>
              </div>
              <p className="text-xs text-brand-850 font-semibold leading-relaxed">
                Les caractéristiques de votre ferme servent à **personnaliser automatiquement** l'en-tête de votre Tableau de Bord intelligent ainsi que les rapports de synthèse et fichiers PDF générés pour vos investisseurs ou vétérinaires.
              </p>
              <p className="text-xs text-brand-850 font-semibold leading-relaxed mt-2">
                Un objectif clair (comme la maîtrise du FCR en 45 jours maximum) aide notre algorithme à cibler les notifications de stress bioclimatique.
              </p>
            </div>

            <div className="card p-5 bg-gray-50/50 border border-gray-200">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Résumé Session</h4>
              <div className="space-y-2 text-xs text-gray-500 font-semibold">
                <div className="flex justify-between">
                  <span>Exploitation :</span>
                  <span className="text-gray-800 font-bold">{farmProfile?.nom_ferme || "Configuration en cours"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Localisation :</span>
                  <span className="text-gray-800 font-bold">{farmProfile?.ville || "Abidjan"}, {farmProfile?.pays || "Côte d'Ivoire"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plateforme :</span>
                  <span className="text-gray-800 font-bold">Poulet-Tech Pro v1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
