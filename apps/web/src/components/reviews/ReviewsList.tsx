"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users: { display_name: string | null; avatar_url: string | null } | null;
}

function StarRow({ value, interactive, onChange }: {
  value: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
        >
          <Star
            className={`w-5 h-5 transition-colors ${n <= display ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
          />
        </button>
      ))}
    </div>
  );
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function ReviewsList({ shopId }: { shopId: string }) {
  const { user } = useAuthStore();
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [average, setAverage]   = useState<number | null>(null);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [token, setToken]       = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    const res  = await fetch(`/api/reviews?shop_id=${shopId}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setAverage(data.average ?? null);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  useEffect(() => {
    if (user) {
      getPublicClient().auth.getSession().then(({ data }) => {
        setToken(data.session?.access_token ?? null);
      });
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shop_id: shopId, rating, comment }),
    });
    setShowForm(false);
    setComment("");
    setRating(5);
    await loadReviews();
    setSaving(false);
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">
            Reseñas
            {total > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({total})</span>}
          </h2>
          {average != null && (
            <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {average.toFixed(1)}
            </span>
          )}
        </div>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            + Escribir reseña
          </button>
        )}
        {!user && (
          <span className="text-xs text-slate-400">Inicia sesión para opinar</span>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Tu valoración</p>
            <StarRow value={rating} interactive onChange={setRating} />
          </div>
          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuenta tu experiencia con este comercio... (opcional)"
              rows={3}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Guardando..." : "Publicar reseña"}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium">Todavía no hay reseñas</p>
          <p className="text-xs mt-0.5">Sé el primero en opinar sobre este comercio</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                  {r.users?.avatar_url
                    ? <img src={r.users.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    : initials(r.users?.display_name)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">
                      {r.users?.display_name ?? "Usuario"}
                    </p>
                    <span className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <StarRow value={r.rating} />
                  {r.comment && (
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
