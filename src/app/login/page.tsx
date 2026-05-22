"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bird, Lock, Mail, Home, MapPin, Building2, Globe, Phone,
  Target, Activity, Sparkles, LogIn, UserPlus, Eye, EyeOff, ShieldCheck
} from "lucide-react";
import { useAuthStore, FarmProfile } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, initialize } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [farmForm, setFarmForm] = useState<FarmProfile & { email: string; password: string }>({
    nom_ferme: "",
    localite: "",
    ville: "",
    pays: "Côte d'Ivoire",
    contact: "",
    activite_principale: "Élevage de poulets de chair (Cobb 500)",
    objectif_utilisateur: "Optimisation de l'Indice de Consommation (FCR) et maximisation de la rentabilité",
    email: "",
    password: "",
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs de connexion.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Identifiants incorrects.");
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { nom_ferme, localite, ville, pays, contact, email: regEmail, password: regPassword } = farmForm;

    if (!nom_ferme || !localite || !ville || !pays || !contact || !regEmail || !regPassword) {
      setError("Veuillez remplir tous les champs marqués d'un astérisque (*).");
      return;
    }
    if (regPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await register(farmForm);
    setLoading(false);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Erreur lors de la création du compte.");
    }
  }

  const inputClass = "w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold placeholder:text-slate-600";
  const smallInputClass = "w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold placeholder:text-slate-600";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">

        {/* Header */}
        <div className="p-8 pb-5 text-center border-b border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-900/20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30 mb-4 animate-bounce">
            <Bird size={32} className="text-slate-950" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Poulet-Tech <span className="text-xs bg-brand-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">PRO</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Plateforme Avicole de Gestion Intelligente</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-emerald-400 font-semibold">
            <ShieldCheck size={11} />
            Données isolées et sécurisées par ferme
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/20 p-2 gap-1.5">
          <button
            onClick={() => { setActiveTab("login"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${
              activeTab === "login"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <LogIn size={14} />
            Se connecter
          </button>
          <button
            onClick={() => { setActiveTab("register"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-300 cursor-pointer ${
              activeTab === "register"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <UserPlus size={14} />
            Créer ma ferme
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="m-6 mb-0 p-3.5 bg-red-950/40 border border-red-900/60 rounded-2xl text-xs font-semibold text-red-400">
            ⚠️ {error}
          </div>
        )}

        <div className="p-8">
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adresse Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="votre@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mot de passe *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-11`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} strokeWidth={2.5} />
                    Accéder à ma ferme
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-500 font-semibold">
                Pas encore de compte ?{" "}
                <button type="button" onClick={() => { setActiveTab("register"); setError(null); }} className="text-brand-400 hover:text-brand-300 font-black cursor-pointer">
                  Créer ma ferme →
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">
                Informations de votre ferme
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nom ferme */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Nom de la ferme *</label>
                  <div className="relative">
                    <Home size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required placeholder="Ex: Ferme Avicole Bénie" value={farmForm.nom_ferme}
                      onChange={(e) => setFarmForm({ ...farmForm, nom_ferme: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Localité */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Localité *</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required placeholder="Quartier / Village" value={farmForm.localite}
                      onChange={(e) => setFarmForm({ ...farmForm, localite: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Ville */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Ville *</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required placeholder="Ex: Abidjan" value={farmForm.ville}
                      onChange={(e) => setFarmForm({ ...farmForm, ville: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Pays */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Pays *</label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required placeholder="Ex: Côte d'Ivoire" value={farmForm.pays}
                      onChange={(e) => setFarmForm({ ...farmForm, pays: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Contact (Tél.) *</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required placeholder="+225 07 08 09 10 11" value={farmForm.contact}
                      onChange={(e) => setFarmForm({ ...farmForm, contact: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Activité */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Activité principale</label>
                  <div className="relative">
                    <Activity size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Ex: Élevage poulets de chair" value={farmForm.activite_principale}
                      onChange={(e) => setFarmForm({ ...farmForm, activite_principale: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>

                {/* Objectif */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Objectif principal</label>
                  <div className="relative">
                    <Target size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Ex: Optimisation FCR" value={farmForm.objectif_utilisateur}
                      onChange={(e) => setFarmForm({ ...farmForm, objectif_utilisateur: e.target.value })}
                      className={smallInputClass} />
                  </div>
                </div>
              </div>

              {/* Auth section */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identifiants de connexion</p>
                <div className="space-y-3">
                  {/* Email */}
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" required placeholder="Email de connexion *" value={farmForm.email}
                      onChange={(e) => setFarmForm({ ...farmForm, email: e.target.value })}
                      className={smallInputClass}
                      autoComplete="email" />
                  </div>
                  {/* Password */}
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      placeholder="Mot de passe * (min. 6 caractères)"
                      value={farmForm.password}
                      onChange={(e) => setFarmForm({ ...farmForm, password: e.target.value })}
                      className={`${smallInputClass} pr-10`}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer">
                      {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-500" />
                  Vos données sont chiffrées et isolées de toutes les autres fermes.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={15} strokeWidth={2.5} />
                    Créer mon compte ferme
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-500 font-semibold">
                Déjà un compte ?{" "}
                <button type="button" onClick={() => { setActiveTab("login"); setError(null); }} className="text-brand-400 hover:text-brand-300 font-black cursor-pointer">
                  Se connecter →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
