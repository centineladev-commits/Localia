"use client";

import { useEffect } from "react";
import { useCityStore, SUPPORTED_CITIES, type City } from "@/store/city.store";

export function CityModal() {
  const { activeCity, modalOpen, setCity, openModal, closeModal } = useCityStore();

  // Abrir automáticamente si no hay ciudad seleccionada
  useEffect(() => {
    if (!activeCity) openModal();
  }, [activeCity, openModal]);

  if (!modalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Cabecera */}
          <div className="bg-emerald-600 px-6 py-5 text-white">
            <h2 className="text-xl font-bold">¿Dónde estás?</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Solo verás comercios y productos de tu ciudad
            </p>
          </div>

          {/* Lista de ciudades */}
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {SUPPORTED_CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => setCity(city)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  text-left transition-all border-2
                  ${
                    activeCity?.id === city.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="font-medium">{city.name}</span>
                </div>
                {activeCity?.id === city.id && (
                  <span className="text-emerald-500 font-bold">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              🔒 Tu ubicación no se comparte con terceros
            </p>
            {activeCity && (
              <button
                onClick={closeModal}
                className="mt-3 w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Explorar {activeCity.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
