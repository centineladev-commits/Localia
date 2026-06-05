"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

export function AuthModal() {
  const { authModalOpen, authTab, closeAuthModal } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register" | "reset">(authTab as "login" | "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!authModalOpen) return null;

  function reset() {
    setError(null);
    setSuccess(null);
    setEmail("");
    setPassword("");
    setName("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getPublicClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : error.message);
    } else {
      closeAuthModal();
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getPublicClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/perfil`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Te hemos enviado un email para restablecer tu contraseña.");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError(null);
    const supabase = getPublicClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.user && !data.session) {
      setSuccess("¡Revisa tu email para confirmar tu cuenta!");
    } else {
      closeAuthModal();
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 pt-6 pb-8">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">L</span>
            </div>
            <span className="text-white font-black text-lg">Localia</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tab === "login" ? "Bienvenido de vuelta" : tab === "register" ? "Crea tu cuenta" : "Recuperar contraseña"}
          </h2>
          <p className="text-indigo-200 text-sm mt-1">
            {tab === "login" ? "Accede a tu cuenta Localia" : tab === "register" ? "Compra en el comercio local de tu ciudad" : "Te enviaremos un enlace por email"}
          </p>
        </div>

        {/* Tabs */}
        {tab !== "reset" && (
          <div className="flex border-b border-slate-100">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); reset(); }}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t === "login" ? "Entrar" : "Registrarse"}
              </button>
            ))}
          </div>
        )}
        {tab === "reset" && (
          <div className="flex border-b border-slate-100">
            <div className="flex-1 py-3 text-sm font-semibold text-center text-indigo-600 border-b-2 border-indigo-600">
              Recuperar contraseña
            </div>
          </div>
        )}

        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <p className="font-semibold text-gray-800">{success}</p>
              <button onClick={() => { reset(); setTab("login"); }} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={tab === "login" ? handleLogin : tab === "register" ? handleRegister : handleReset} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              {tab !== "reset" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={tab === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
              )}

              {error && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Cargando..." : tab === "login" ? "Entrar" : tab === "register" ? "Crear cuenta" : "Enviar enlace"}
              </button>

              {tab === "login" && (
                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={() => { setTab("register"); reset(); }} className="text-indigo-600 font-semibold hover:underline">
                    Regístrate gratis
                  </button>
                  <button type="button" onClick={() => { setTab("reset"); reset(); }} className="text-gray-400 hover:text-gray-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
              {tab === "reset" && (
                <button type="button" onClick={() => { setTab("login"); reset(); }} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 hover:underline">
                  Volver al inicio de sesión
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
