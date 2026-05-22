"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bird, Lock, Mail, Home, MapPin, Building2, Globe, Phone, 
  Target, Activity, Sparkles, LogIn, UserPlus 
} from "lucide-react";
import { useAuthStore, FarmProfile } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, setupFarm, isAuthenticated, initialize } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("elevage@poulet.com");
  const [password, setPassword] = useState("poulet123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register state
  const [farmForm, setFarmForm] = useState<FarmProfile & { email: string; mdps: string }>({
    nom_ferme: "",
    localite: "",
    ville: "",
    pays: "Côte d'Ivoire",
    contact: "",
    activite_principale: "Élevage de poulets de chair (Cobb 500)",
    objectif_utilisateur: "Optimisation de l'Indice de Consommation (FCR) et maximisation de la rentabilité",
    email: "",
    mdps: "",
  });

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
    try {
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Identifiants incorrects. Essayez n'importe quel email avec un mot de passe de plus de 4 caractères.");
      }
    } catch (err) {
      setError("Une erreur s'est produite lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { nom_ferme, localite, ville, pays, contact, activite_principale, objectif_utilisateur, email: regEmail, mdps } = farmForm;
    
    if (!nom_ferme || !localite || !ville || !pays || !contact || !regEmail || !mdps) {
      setError("Veuillez remplir tous les champs marqués d'un astérisque (*).");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await setupFarm({
        nom_ferme,
        localite,
        ville,
        pays,
        contact,
        activite_principale,
        objectif_utilisateur
      });
      router.push("/");
    } catch (err) {
      setError("Erreur lors de la configuration de la ferme.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for rich aesthetic glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10 transition-all duration-300">
        
        {/* Header decoration */}
        <div className="p-8 pb-4 text-center border-b border-slate-800 bg-slate-900/40">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25 mb-4 animate-bounce">
            <Bird size={30} className="text-slate-950 font-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Poulet-Tech <span className="text-xs bg-brand-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">PRO</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Platforme Avicole de Gestion Intelligente</p>
        </div>

        {/* Tab selection */}
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
            Créer ma ferme (Setup)
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-6 mb-0 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-xs font-semibold text-red-400 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Tab contents */}
        <div className="p-8">
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adresse Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
                    placeholder="elevage@poulet.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="bg-slate-950/30 border border-slate-800/80 p-3 rounded-xl text-[10px] text-slate-400 leading-normal font-semibold">
                💡 <strong>Astuce :</strong> Entrez les identifiants préremplis ci-dessus, ou n'importe quel e-mail avec un mot de passe de 4+ caractères pour vous connecter.
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
                    Accéder au tableau de bord
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">
                Configurez les paramètres de votre ferme pour démarrer
              </p>

              {/* 7 Handwritten Note Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Nom de la ferme *</label>
                  <div className="relative">
                    <Home size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ferme Avicole Bénie"
                      value={farmForm.nom_ferme}
                      onChange={(e) => setFarmForm({ ...farmForm, nom_ferme: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Localité (Quartier) *</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Niangon Sud"
                      value={farmForm.localite}
                      onChange={(e) => setFarmForm({ ...farmForm, localite: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Ville *</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Abidjan"
                      value={farmForm.ville}
                      onChange={(e) => setFarmForm({ ...farmForm, ville: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Pays *</label>
                  <div className="relative">
                    <Globe size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Côte d'Ivoire"
                      value={farmForm.pays}
                      onChange={(e) => setFarmForm({ ...farmForm, pays: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Contact (Téléphone) *</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: +225 07 08 09 10 11"
                      value={farmForm.contact}
                      onChange={(e) => setFarmForm({ ...farmForm, contact: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Activité Principale</label>
                  <div className="relative">
                    <Activity size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ex: Élevage de poulets de chair"
                      value={farmForm.activite_principale}
                      onChange={(e) => setFarmForm({ ...farmForm, activite_principale: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Objectif de l'utilisateur</label>
                  <div className="relative">
                    <Target size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ex: Optimisation FCR (Indice de Consommation)"
                      value={farmForm.objectif_utilisateur}
                      onChange={(e) => setFarmForm({ ...farmForm, objectif_utilisateur: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 my-4 pt-4 space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identifiants de connexion associés</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={farmForm.email}
                    onChange={(e) => setFarmForm({ ...farmForm, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Mot de passe *"
                    value={farmForm.mdps}
                    onChange={(e) => setFarmForm({ ...farmForm, mdps: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                  />
                </div>
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
                    Créer et configurer ma ferme
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
