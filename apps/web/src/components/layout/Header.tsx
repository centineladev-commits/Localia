"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User,
  Package,
  Heart,
  Bookmark,
  Store,
  MessageCircle,
  LogOut,
  ShoppingBag,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { CartButton } from "@/components/cart/CartButton";
import { getPublicClient } from "@/lib/db";

const NAV_ITEMS = [
  { href: "/",        label: "Catálogo"  },
  { href: "/mapa",    label: "Mapa"      },
  { href: "/nosotros",label: "Nosotros"  },
  { href: "/contacto",label: "Contacto"  },
];

const USER_MENU = [
  { href: "/perfil",             icon: User,          label: "Mi perfil"       },
  { href: "/mis-pedidos",        icon: Package,       label: "Mis pedidos"     },
  { href: "/wishlist",           icon: Heart,         label: "Lista de deseos" },
  { href: "/reservas",           icon: Bookmark,      label: "Mis reservas"    },
  { href: "/dashboard/comercio", icon: Store,         label: "Panel comercio"  },
  { href: "/chat",               icon: MessageCircle, label: "Mensajes"        },
];

export function Header() {
  const { user, loading, openAuthModal } = useAuthStore();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    getPublicClient()
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user]);

  async function handleSignOut() {
    await getPublicClient().auth.signOut();
  }

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "Tú";
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="relative shrink-0 bg-white border-b border-slate-200 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-indigo-600">Localia</span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1 text-sm ml-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3.5 py-2 rounded-full font-semibold transition-colors ${
                pathname === href
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <CartButton />

          {!loading && (
            user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarUrl(null)}
                      />
                    ) : initials}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[80px] truncate">
                    {displayName}
                  </span>
                </button>

                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cuenta</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{user.email}</p>
                  </div>

                  {USER_MENU.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                      {label}
                    </Link>
                  ))}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-t border-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal("login")}
                  className="text-sm font-semibold text-slate-700 px-3.5 py-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => openAuthModal("register")}
                  className="hidden sm:block text-sm font-bold text-white bg-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Registro
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
