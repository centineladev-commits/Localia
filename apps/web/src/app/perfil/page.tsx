"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";
import Link from "next/link";

interface Profile {
  display_name: string;
  bio: string;
  commercial_type: string;
  avatar_url: string;
  website: string;
  instagram: string;
  cover_url: string;
  // seller extra fields
  business_name: string;
  phone: string;
  address: string;
  nif: string;
}

/* ─── helpers ─────────────────────────────────────── */
const LABEL = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wide";
const INPUT =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition";
const CARD =
  "bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4";

function sellerCompleteness(profile: Profile): number {
  const fields = [
    profile.business_name,
    profile.phone,
    profile.address,
    profile.nif,
    profile.website,
    profile.instagram,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/* ─── icons ───────────────────────────────────────── */
function IconBuyer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  );
}
function IconSeller() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016 2.993 2.993 0 002.25-1.016 3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 mx-auto mb-2 text-slate-300" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ─── component ───────────────────────────────────── */
export default function PerfilPage() {
  const { user, openAuthModal } = useAuthStore();
  const [profile, setProfile] = useState<Profile>({
    display_name: "", bio: "", commercial_type: "buyer",
    avatar_url: "", website: "", instagram: "", cover_url: "",
    business_name: "", phone: "", address: "", nif: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = getPublicClient();
    (async () => {
      try {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
        if (data) setProfile({
          display_name: data.display_name ?? user.user_metadata?.display_name ?? "",
          bio: data.bio ?? "",
          commercial_type: data.commercial_type ?? "buyer",
          avatar_url: data.avatar_url ?? "",
          website: data.website ?? "",
          instagram: data.instagram ?? "",
          cover_url: data.cover_url ?? "",
          business_name: data.business_name ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          nif: data.nif ?? "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tamaño (5 MB máx)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La foto es demasiado grande. El tamaño máximo es 5 MB.");
      return;
    }
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setUploadError("El archivo debe ser una imagen (JPG, PNG o WEBP).");
      return;
    }

    setUploadError(null);
    setUploadingAvatar(true);
    try {
      const supabase = getPublicClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("public-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("public-images").getPublicUrl(path);
      const newUrl = urlData.publicUrl;
      setProfile((p) => ({ ...p, avatar_url: newUrl }));
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email!,
        avatar_url: newUrl,
        updated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setUploadError(
        err?.message?.includes("Bucket not found")
          ? "El bucket 'public-images' no existe en Supabase Storage. Créalo primero."
          : err?.message ?? "Error al subir la foto. Inténtalo de nuevo."
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDropFile(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !user) return;
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    await handleAvatarFile(fakeEvent);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const isSeller = profile.commercial_type !== "buyer";
    if (isSeller && (!profile.business_name || !profile.phone || !profile.address)) {
      alert("Para ser vendedor debes rellenar el nombre del negocio, teléfono y dirección.");
      return;
    }
    setSaving(true);
    const supabase = getPublicClient();
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email!,
      display_name: profile.display_name,
      bio: profile.bio,
      commercial_type: profile.commercial_type,
      avatar_url: profile.avatar_url,
      website: profile.website,
      instagram: profile.instagram,
      cover_url: profile.cover_url,
      business_name: profile.business_name,
      phone: profile.phone,
      address: profile.address,
      nif: profile.nif,
      updated_at: new Date().toISOString(),
    });
    await supabase.auth.updateUser({ data: { display_name: profile.display_name } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  /* ── unauthenticated ── */
  if (!user) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 py-20">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-indigo-400" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-lg font-black text-slate-800">Acceso restringido</p>
        <p className="text-sm text-slate-400 mt-1">Inicia sesión para ver y editar tu perfil</p>
      </div>
      <button
        onClick={() => openAuthModal("login")}
        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
      >
        Iniciar sesión
      </button>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = (profile.display_name || user.email || "?").slice(0, 2).toUpperCase();
  const isSeller = profile.commercial_type !== "buyer";
  const isVerified = isSeller && profile.business_name && profile.phone && profile.address && profile.nif;
  const completeness = isSeller ? sellerCompleteness(profile) : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">

      {/* ── Toast de guardado ── */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-full shadow-xl transition-all duration-300 ${
          saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <IconCheck />
        Cambios guardados correctamente
      </div>

      {/* ── Hero / Header ── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 h-48 overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-6 left-1/4 w-24 h-24 bg-purple-400/10 rounded-full" />
      </div>

      {/* ── Avatar + nombre (superpuesto al banner) ── */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="-mt-16 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              {uploadingAvatar ? (
                <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span className="text-white font-black text-3xl">{initials}</span>
              )}
            </div>
            {/* edit overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Cambiar foto"
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity disabled:cursor-not-allowed"
            >
              <IconCamera />
            </button>
            {/* edit badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Cambiar foto"
              className="absolute bottom-1 right-1 w-7 h-7 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              <IconCamera />
            </button>
          </div>

          {/* Nombre y email */}
          <div className="mt-3 text-center">
            <p className="text-xl font-black text-slate-900">
              {profile.display_name || "Sin nombre"}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
          </div>

          {/* Badge de tipo de cuenta */}
          <div className="mt-3 mb-6">
            {!isSeller ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
                Comprador
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                Vendedor Verificado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                Verificación pendiente
              </span>
            )}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSave} className="space-y-4 pb-28 md:pb-8">

          {/* Foto de perfil — drop zone */}
          <div className={CARD}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Foto de perfil</h2>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropFile}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
                dragOver
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
              }`}
            >
              {uploadingAvatar ? (
                <div className="flex flex-col items-center gap-2 text-indigo-600">
                  <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Subiendo foto...</span>
                </div>
              ) : (
                <>
                  <IconUpload />
                  <p className="text-sm font-semibold text-slate-500">
                    Arrastra tu foto aquí o <span className="text-indigo-600">haz clic para seleccionar</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-1">JPG, PNG o WEBP — máx. 5 MB</p>
                </>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-red-500 mt-2 font-medium">{uploadError}</p>
            )}
            <div>
              <label className={LABEL}>O pega una URL de imagen</label>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://ejemplo.com/mi-foto.jpg"
                className={INPUT + " text-xs"}
              />
            </div>
          </div>

          {/* Datos personales */}
          <div className={CARD}>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información personal</h2>
            <div>
              <label className={LABEL}>Nombre público <span className="text-indigo-500">*</span></label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="¿Cómo te llamas?"
                required
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Email</label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className={INPUT + " opacity-50 cursor-not-allowed bg-slate-50"}
              />
            </div>
            <div>
              <label className={LABEL}>Sobre mí</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Cuéntanos algo sobre ti..."
                rows={3}
                className={INPUT + " resize-none"}
              />
            </div>
          </div>

          {/* Tipo de cuenta — tarjetas con iconos SVG */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tipo de cuenta</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Comprador */}
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, commercial_type: "buyer" }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  profile.commercial_type === "buyer"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-500"
                }`}
              >
                <div className={`p-2 rounded-lg ${profile.commercial_type === "buyer" ? "bg-indigo-100" : "bg-slate-50"}`}>
                  <IconBuyer />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Comprador</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">Busco y compro productos locales</p>
                </div>
                {profile.commercial_type === "buyer" && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <IconCheck />
                  </div>
                )}
              </button>

              {/* Vendedor */}
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, commercial_type: "business" }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  profile.commercial_type === "business"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-500"
                }`}
              >
                <div className={`p-2 rounded-lg ${profile.commercial_type === "business" ? "bg-indigo-100" : "bg-slate-50"}`}>
                  <IconSeller />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Vendedor</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">Tengo un comercio local en Localia</p>
                </div>
                {profile.commercial_type === "business" && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <IconCheck />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Datos de negocio — solo si es vendedor */}
          {isSeller && (
            <div className={CARD}>
              {/* Banner de estado de verificación */}
              {isVerified ? (
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                    Tu negocio ha sido verificado. Tu perfil de vendedor está activo en Localia.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-bold">Verificación pendiente.</span> Rellena los datos de tu negocio y nuestro equipo los revisará en 24–48 h.
                  </p>
                </div>
              )}

              {/* Indicador de progreso de completitud */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del negocio</span>
                  <span className="text-xs font-bold text-indigo-600">{completeness}% completado</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* Nombre del negocio */}
              <div>
                <label className={LABEL}>Nombre del negocio <span className="text-indigo-500">*</span></label>
                <input
                  type="text"
                  value={profile.business_name}
                  onChange={(e) => setProfile((p) => ({ ...p, business_name: e.target.value }))}
                  placeholder="Ej: Panadería García"
                  required={isSeller}
                  className={INPUT}
                />
              </div>

              {/* Teléfono + NIF en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Teléfono <span className="text-indigo-500">*</span></label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+34 600 000 000"
                    required={isSeller}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>NIF / CIF</label>
                  <input
                    type="text"
                    value={profile.nif}
                    onChange={(e) => setProfile((p) => ({ ...p, nif: e.target.value }))}
                    placeholder="B12345678"
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className={LABEL}>Dirección del local <span className="text-indigo-500">*</span></label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Calle Mayor, 12, Madrid"
                  required={isSeller}
                  className={INPUT}
                />
              </div>

              {/* Web + Instagram en grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Web <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://mitienda.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Instagram <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">@</span>
                    <input
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))}
                      placeholder="micomercio"
                      className={INPUT + " pl-7"}
                    />
                  </div>
                </div>
              </div>

              {/* Imagen de cabecera de la tienda */}
              <div>
                <label className={LABEL}>
                  Imagen de cabecera de la tienda <span className="text-slate-300 font-normal normal-case">(opcional)</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">Se mostrará en el mapa y en tu escaparate.</p>
                <input
                  type="url"
                  value={profile.cover_url ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, cover_url: e.target.value }))}
                  placeholder="https://ejemplo.com/mi-tienda-foto.jpg"
                  className={INPUT}
                />
                {profile.cover_url && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200">
                    <img src={profile.cover_url} alt="preview portada" className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Botones de acción ── */}
          {/* Mobile: sticky bottom — Desktop: normal flow */}
          <div className="fixed bottom-0 left-0 right-0 z-40 md:static md:z-auto bg-white/95 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t border-slate-100 md:border-0 px-4 py-3 md:p-0 md:pt-2 flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 text-center border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 active:scale-95 transition-all text-sm"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 font-bold rounded-xl text-sm transition-all duration-200 shadow-md bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
