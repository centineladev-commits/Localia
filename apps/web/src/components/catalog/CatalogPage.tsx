"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, ChevronDown } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { SearchFilters, type Filters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { useLocationStore } from "@/store/location.store";
import { useCityStore } from "@/store/city.store";
import type { CatalogProduct } from "@/app/api/catalog/route";
import type { SearchResponse } from "@/app/api/search/route";

const LIMIT = 20;

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3 border-l-[3px] border-slate-100 space-y-2.5">
        <div className="h-3.5 bg-slate-100 rounded-full w-4/5" />
        <div className="h-3 bg-slate-100 rounded-full w-2/5" />
        <div className="h-5 bg-slate-100 rounded-full w-1/3" />
        <div className="h-3 bg-slate-100 rounded-full w-3/5" />
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
      <svg
        className="w-48 h-48 mb-6 text-slate-200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="90" fill="currentColor" />
        <path d="M65 80h70l-8 65H73L65 80z" fill="white" opacity="0.9" />
        <path d="M82 80c0-10 6-20 18-20s18 10 18 20" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <circle cx="138" cy="62" r="20" stroke="#6366f1" strokeWidth="5" fill="white" />
        <line x1="152" y1="76" x2="163" y2="87" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
        <text x="131" y="68" fontSize="18" fontWeight="bold" fill="#6366f1">?</text>
      </svg>
      <p className="text-xl font-black text-slate-800 mb-1">Sin resultados</p>
      <p className="text-sm text-slate-400 text-center max-w-xs mb-6">
        No encontramos productos en esta ciudad con esos filtros. Prueba otros términos o amplía la búsqueda.
      </p>
      <button onClick={onReset} className="btn-primary">
        Ver todos los productos
      </button>
    </div>
  );
}

interface ProductSection {
  products: CatalogProduct[];
  total: number;
}

export function CatalogPage() {
  const searchParams                = useSearchParams();
  const { location, openModal }     = useLocationStore();
  const { activeCity, openModal: openCityModal } = useCityStore();

  const [filters, setFilters] = useState<Filters>({
    q:        searchParams.get("q")    ?? "",
    category: searchParams.get("cat") ?? "",
    priceMin: searchParams.get("pmin") ?? "",
    priceMax: searchParams.get("pmax") ?? "",
    sort:     searchParams.get("sort") ?? "newest",
    radius:   5,
  });

  const [local, setLocal]             = useState<ProductSection>({ products: [], total: 0 });
  const [national, setNational]       = useState<ProductSection>({ products: [], total: 0 });
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showNational, setShowNational] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchData, setSearchData]   = useState<SearchResponse | null>(null);
  const [searchOpen, setSearchOpen]   = useState(false);
  const inputRef                      = useRef<HTMLInputElement>(null);
  const searchDebounce                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback((f: Filters, p: number) => {
    const params = new URLSearchParams();
    if (f.q)        params.set("q", f.q);
    if (f.category) params.set("category", f.category);
    if (f.priceMin) params.set("price_min", f.priceMin);
    if (f.priceMax) params.set("price_max", f.priceMax);
    if (f.sort !== "newest") params.set("sort", f.sort);
    if (activeCity?.id) params.set("city_id", activeCity.id);
    params.set("page", String(p));
    params.set("limit", String(LIMIT));
    return params;
  }, [activeCity]);

  const fetchProducts = useCallback(async (f: Filters, p: number, append = false) => {
    if (!append) setLoading(true); else setLoadingMore(true);

    try {
      const localParams = buildParams(f, p);
      const res = await fetch(`/api/catalog?${localParams}`);
      const data = await res.json();
      const products: CatalogProduct[] = data.products ?? [];
      const total: number = data.total ?? 0;

      setLocal((prev) => ({
        products: append ? [...prev.products, ...products] : products,
        total,
      }));

      // Fetch national section only on first load when a city is selected and there are local results
      if (!append && activeCity?.id) {
        const natParams = buildParams(f, 1);
        natParams.set("national", "1");
        natParams.set("limit", "8");
        const natRes = await fetch(`/api/catalog?${natParams}`);
        const natData = await natRes.json();
        setNational({ products: natData.products ?? [], total: natData.total ?? 0 });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCity, buildParams]);

  useEffect(() => {
    setPage(1);
    setShowNational(false);
    fetchProducts(filters, 1);
  }, [filters, fetchProducts]);

  function handleFilter(partial: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const val = inputRef.current?.value ?? "";
    setSearchOpen(false);
    setSearchData(null);
    handleFilter({ q: val });
  }

  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (val.length < 2) { setSearchData(null); setSearchOpen(false); return; }
    searchDebounce.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: val });
      if (activeCity?.id) params.set("city_id", activeCity.id);
      const res = await fetch(`/api/search?${params}`);
      const data: SearchResponse = await res.json();
      if (data.shops.length > 0 || data.products.length > 0) {
        setSearchData(data);
        setSearchOpen(true);
      } else {
        setSearchData(null);
        setSearchOpen(false);
      }
    }, 320);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchProducts(filters, next, true);
  }

  const hasMore = local.products.length < local.total;
  const cityLabel = activeCity?.name ?? location?.shortLabel;

  return (
    <div className="min-h-full bg-slate-50">

      {/* Search + location bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              defaultValue={filters.q}
              placeholder="Busca productos, tiendas..."
              onChange={handleSearchInput}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onFocus={() => searchData && setSearchOpen(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchOpen && searchData && (
              <SearchResults data={searchData} query={inputRef.current?.value ?? ""} />
            )}
          </form>

          {/* Ciudad activa */}
          <button
            onClick={openCityModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100/80 rounded-full text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shrink-0 whitespace-nowrap group"
          >
            <MapPin className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="max-w-[90px] truncate">{cityLabel ?? "Ciudad"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5">


        <SearchFilters
          filters={filters}
          onChange={handleFilter}
          total={local.total}
          mobileOpen={filtersOpen}
          onMobileClose={() => setFiltersOpen(false)}
        />

        {/* Resultados locales */}
        <div className="mt-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : local.products.length === 0 ? (
            <EmptyState onReset={() => handleFilter({ q: "", category: "", priceMin: "", priceMax: "" })} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {local.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="btn-secondary disabled:opacity-60 disabled:cursor-not-allowed px-8 py-3"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Cargando...
                      </span>
                    ) : `Cargar más · ${local.total - local.products.length} restantes`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Seccion de contingencia: productos de otras ciudades */}
        {activeCity && national.products.length > 0 && !loading && (
          <div className="mt-12">
            <button
              onClick={() => setShowNational((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-left hover:border-slate-300 transition-colors group"
            >
              <div>
                <p className="text-sm font-bold text-slate-700">Disponible en otras ciudades</p>
                <p className="text-xs text-slate-400 mt-0.5">{national.total} producto{national.total !== 1 ? "s" : ""} fuera de {activeCity.name}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${showNational ? "rotate-180" : ""}`}
              />
            </button>

            {showNational && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {national.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
