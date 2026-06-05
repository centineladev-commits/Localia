"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getPublicClient } from "@/lib/db";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conv {
  id: string;
  user_id: string;
  shop_id: string;
  product_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_user: number;
  shops: { name: string; slug: string } | null;
  products: { name: string; images: string[] } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "shop";
  body: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Icons (SVG)
// ---------------------------------------------------------------------------

function IconArrowLeft({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function IconSend({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconSearch({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconInfo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconLock({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconStore({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

// Genera color determinista por nombre de tienda
function avatarColor(name: string): string {
  const colors = [
    "bg-violet-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({
  name,
  imageSrc,
  size = "md",
}: {
  name: string;
  imageSrc?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-sm", lg: "w-12 h-12 text-base" };
  const initial = name.charAt(0).toUpperCase();
  const color = avatarColor(name);

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold text-white ${imageSrc ? "" : color}`}>
      {imageSrc ? (
        <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conv;
  isActive: boolean;
  onClick: () => void;
}) {
  const shopName = conv.shops?.name ?? "Tienda";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 relative ${
        isActive
          ? "bg-indigo-50"
          : "hover:bg-gray-50/80"
      }`}
    >
      {/* Indicador activo */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-600 rounded-r-full" />
      )}

      {/* Avatar */}
      <Avatar
        name={shopName}
        imageSrc={conv.products?.images?.[0]}
        size="md"
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
            {shopName}
          </p>
          <span className={`text-[11px] shrink-0 tabular-nums ${conv.unread_user > 0 ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
            {formatDate(conv.last_message_at)}
          </span>
        </div>
        {conv.products?.name && (
          <p className="text-[11px] text-indigo-500 truncate font-medium mb-0.5">{conv.products.name}</p>
        )}
        <p className={`text-xs truncate ${conv.unread_user > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
          {conv.last_message ?? "Inicia la conversacion"}
        </p>
      </div>

      {/* Unread badge */}
      {conv.unread_user > 0 && (
        <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
          {conv.unread_user > 9 ? "9+" : conv.unread_user}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1.5 group`}>
      <div
        className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed ${
          isOwn
            ? "bg-indigo-600 text-white rounded-2xl rounded-br-md shadow-sm shadow-indigo-200/50"
            : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        <p className={`text-[10px] mt-1.5 select-none ${isOwn ? "text-indigo-300" : "text-gray-400"} text-right`}>
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50/50 select-none">
      {/* Ilustración SVG */}
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
        <circle cx="60" cy="60" r="56" fill="#EEF2FF" />
        <rect x="28" y="42" width="50" height="38" rx="8" fill="#C7D2FE" />
        <rect x="32" y="46" width="42" height="30" rx="6" fill="#818CF8" />
        <rect x="38" y="53" width="28" height="3" rx="1.5" fill="#E0E7FF" />
        <rect x="38" y="60" width="20" height="3" rx="1.5" fill="#E0E7FF" opacity="0.7" />
        <circle cx="84" cy="42" r="14" fill="#6366F1" />
        <path d="M78 42h12M84 36v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-700 mb-1">Selecciona una conversacion</p>
        <p className="text-sm text-gray-400 max-w-xs">Elige una conversacion de la lista para empezar a chatear</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const { user, openAuthModal } = useAuthStore();

  // Conversations
  const [convs, setConvs] = useState<Conv[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);

  // Search
  const [search, setSearch] = useState("");

  // Active conversation
  const [activeConv, setActiveConv] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // Input
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // Typing indicator (cosmetic)
  const [typing, setTyping] = useState(false);

  // Mobile: "list" | "chat"
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Scroll ref
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const realtimeRef = useRef<ReturnType<ReturnType<typeof getPublicClient>["channel"]> | null>(null);

  // Filtered conversations
  const filteredConvs = convs.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.shops?.name?.toLowerCase().includes(q) ||
      c.products?.name?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  });

  // ---------------------------------------------------------------------------
  // Load conversations
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) { setConvsLoading(false); return; }
    const supabase = getPublicClient();
    supabase
      .from("conversations")
      .select("id, user_id, shop_id, product_id, last_message, last_message_at, unread_user, shops(name, slug), products(name, images)")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .then(({ data }) => {
        setConvs((data as unknown as Conv[]) ?? []);
        setConvsLoading(false);
      });
  }, [user]);

  // ---------------------------------------------------------------------------
  // Load messages + realtime
  // ---------------------------------------------------------------------------

  const loadMessages = useCallback(async (conv: Conv) => {
    setMsgsLoading(true);
    const supabase = getPublicClient();

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setMsgsLoading(false);

    // Mark as read
    if (conv.unread_user > 0) {
      await supabase
        .from("conversations")
        .update({ unread_user: 0 })
        .eq("id", conv.id);
      setConvs((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_user: 0 } : c))
      );
    }
  }, []);

  useEffect(() => {
    // Unsubscribe previous channel
    if (realtimeRef.current) {
      getPublicClient().removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }

    if (!activeConv) return;

    loadMessages(activeConv);

    // Realtime subscription
    const supabase = getPublicClient();
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Typing indicator flash
          if (msg.sender_type === "shop") {
            setTyping(false);
          }
          // Update conversation preview
          setConvs((prev) =>
            prev.map((c) =>
              c.id === activeConv.id
                ? { ...c, last_message: msg.body, last_message_at: msg.created_at }
                : c
            )
          );
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConv?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Auto-scroll
  // ---------------------------------------------------------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ---------------------------------------------------------------------------
  // Auto-resize textarea
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [body]);

  // ---------------------------------------------------------------------------
  // Select conversation
  // ---------------------------------------------------------------------------

  const selectConv = (conv: Conv) => {
    setActiveConv(conv);
    setMobileView("chat");
    setBody("");
    setTyping(false);
  };

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  const sendMessage = async () => {
    if (!body.trim() || !activeConv || !user || sending) return;
    const text = body.trim();
    setBody("");
    setSending(true);

    const supabase = getPublicClient();

    const { data: inserted } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        sender_type: "user",
        body: text,
      })
      .select()
      .single();

    if (inserted) {
      // Optimistic update (realtime will also fire but we deduplicate)
      setMessages((prev) => {
        if (prev.find((m) => m.id === (inserted as Message).id)) return prev;
        return [...prev, inserted as Message];
      });
    }

    await supabase
      .from("conversations")
      .update({
        last_message: text,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", activeConv.id);

    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---------------------------------------------------------------------------
  // Not logged in
  // ---------------------------------------------------------------------------

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-20 bg-gradient-to-b from-slate-50 to-white min-h-[60vh]">
        {/* Gradiente decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative flex flex-col items-center gap-5 text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3">
            <IconLock className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tus mensajes, privados</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
              Inicia sesion para ver y responder tus conversaciones con tiendas locales
            </p>
          </div>
          <button
            onClick={() => openAuthModal("login")}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
          >
            Iniciar sesion
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white">

      {/* ------------------------------------------------------------------ */}
      {/* LEFT PANEL — conversation list                                       */}
      {/* ------------------------------------------------------------------ */}
      <aside
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 bg-white shrink-0 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
            {convs.filter((c) => c.unread_user > 0).length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {convs.filter((c) => c.unread_user > 0).length} nuevo{convs.filter((c) => c.unread_user > 0).length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Cargando mensajes...</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-16 px-6">
              {search ? (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-3">
                    <IconSearch className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm mb-1">Sin resultados</p>
                  <p className="text-xs text-gray-400">Intenta con otras palabras</p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-4 rotate-3">
                    <IconStore className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-gray-800 text-sm mb-1.5">Sin mensajes aun</p>
                  <p className="text-xs text-gray-400 mb-5 leading-relaxed">Pregunta a cualquier tienda desde la pagina de un producto</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-200"
                  >
                    Explorar catalogo
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="py-1">
              {filteredConvs.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeConv?.id === conv.id}
                  onClick={() => selectConv(conv)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL — chat window                                            */}
      {/* ------------------------------------------------------------------ */}
      <main
        className={`flex-1 flex flex-col min-w-0 ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {!activeConv ? (
          <EmptyConversationState />
        ) : (
          <>
            {/* ---- Chat header ---- */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-white shadow-sm z-10">
              {/* Back button (mobile) */}
              <button
                className="md:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileView("list")}
                aria-label="Volver a conversaciones"
              >
                <IconArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <Avatar
                name={activeConv.shops?.name ?? "Tienda"}
                imageSrc={activeConv.products?.images?.[0]}
                size="md"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
                  {activeConv.shops?.name ?? "Tienda"}
                </p>
                {activeConv.products?.name ? (
                  <p className="text-xs text-indigo-500 truncate font-medium mt-0.5">
                    {activeConv.products.name}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-500 font-medium mt-0.5">En linea</p>
                )}
              </div>

              {/* Info button */}
              <button
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Informacion de la tienda"
              >
                <IconInfo className="w-5 h-5" />
              </button>
            </div>

            {/* ---- Messages area ---- */}
            <div className="flex-1 overflow-y-auto bg-gray-50/60 px-4 sm:px-6 py-5">
              {msgsLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-400">Cargando mensajes...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                    <Avatar name={activeConv.shops?.name ?? "Tienda"} size="sm" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Conversacion con {activeConv.shops?.name ?? "la tienda"}
                    </p>
                    <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                      Escribe tu primer mensaje. La tienda recibira una notificacion y te respondera pronto.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {messages.map((msg, idx) => {
                    const prev = messages[idx - 1];
                    const showDateSep =
                      !prev ||
                      new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();

                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                              {new Date(msg.created_at).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
                            </span>
                            <div className="flex-1 h-px bg-gray-200" />
                          </div>
                        )}
                        <MessageBubble msg={msg} isOwn={msg.sender_type === "user"} />
                      </div>
                    );
                  })}
                  {typing && <TypingIndicator />}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* ---- Input bar ---- */}
            <div className="px-4 sm:px-5 py-3.5 bg-white border-t border-gray-100">
              <div className="flex items-end gap-2.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none leading-relaxed min-h-[22px] max-h-32"
                />
                <button
                  onClick={sendMessage}
                  disabled={!body.trim() || sending}
                  className={`p-2 rounded-xl transition-all shrink-0 ${
                    body.trim() && !sending
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  aria-label="Enviar mensaje"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IconSend className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 text-center select-none">
                Shift + Enter para nueva linea
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
