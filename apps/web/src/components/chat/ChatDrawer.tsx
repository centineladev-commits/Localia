"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, MessageCircle, ArrowUp } from "lucide-react";
import { getPublicClient } from "@/lib/db";
import type { Shop, Product } from "@/lib/types";

interface Message { id: string; body: string; sender_type: "user" | "shop"; created_at: string; }
interface Props { shop: Shop; product?: Product; userId: string; onClose: () => void; }

const POLL_INTERVAL_MS = 5000;

export function ChatDrawer({ shop, product, userId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState("");
  const [convId,   setConvId]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Polling: trae sólo mensajes nuevos desde el último id conocido
  const pollMessages = useCallback(async (cId: string) => {
    const supabase = getPublicClient();
    let q = supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", cId)
      .order("created_at");
    if (latestIdRef.current) {
      q = q.gt("id", latestIdRef.current);
    }
    const { data } = await q;
    if (data && data.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newOnes = data.filter((m: Message) => !existingIds.has(m.id));
        if (newOnes.length === 0) return prev;
        latestIdRef.current = newOnes[newOnes.length - 1].id;
        return [...prev, ...newOnes];
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = getPublicClient();
      let { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .eq("shop_id", shop.id)
        .eq("product_id", product?.id ?? null)
        .maybeSingle();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ user_id: userId, shop_id: shop.id, product_id: product?.id ?? null })
          .select("id")
          .single();
        conv = newConv;
      }

      if (conv?.id) {
        setConvId(conv.id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at");
        const list: Message[] = msgs ?? [];
        setMessages(list);
        if (list.length > 0) latestIdRef.current = list[list.length - 1].id;

        // Iniciar polling
        pollRef.current = setInterval(() => pollMessages(conv!.id), POLL_INTERVAL_MS);
      }
      setLoading(false);
    })();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !convId) return;
    setSending(true);
    const supabase = getPublicClient();
    const { data } = await supabase
      .from("messages")
      .insert({ conversation_id: convId, sender_id: userId, sender_type: "user", body: text.trim() })
      .select("*")
      .single();
    if (data) {
      setMessages((prev) => [...prev, data]);
      latestIdRef.current = data.id;
    }
    await supabase.from("conversations")
      .update({ last_message: text.trim(), last_message_at: new Date().toISOString() })
      .eq("id", convId);
    setText("");
    setSending(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {shop.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{shop.name}</p>
            {product && <p className="text-xs text-slate-400 truncate">Sobre: {product.name}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Referencia al producto */}
        {product && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            {product.images[0] && (
              <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{product.name}</p>
              <p className="text-xs font-bold text-indigo-600">{product.price.toFixed(2)} €</p>
            </div>
          </div>
        )}

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Inicia la conversación</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">El comercio responderá en breve</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  msg.sender_type === "user"
                    ? "bg-slate-900 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}>
                  <p className="leading-relaxed">{msg.body}</p>
                  <p className="text-[10px] mt-1 opacity-50">
                    {new Date(msg.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 py-3 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
