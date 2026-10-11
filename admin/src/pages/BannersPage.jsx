// admin/src/pages/BannersPage.jsx
import React, { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Check, Eye } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";

export default function BannersPage() {
  const { selectedSucursal, showToast } = useAdmin();
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      } else {
        setBanners([
          {
            id: 1,
            titulo: "Promo Asado Familiar Fin de Semana",
            subtitulo: "Llevando 3 kg o más tenés 15% de descuento en mostrador",
            activo: true,
            orden: 1,
            imagen_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200",
          },
          {
            id: 2,
            titulo: "Cortes de Cerdo Seleccionados",
            subtitulo: "Calidad premium directa de campo",
            activo: true,
            orden: 2,
            imagen_url: "https://images.unsplash.com/photo-1514944298352-78d1232876b5?q=80&w=1200",
          },
        ]);
      }
    } catch {
      setBanners([
        {
          id: 1,
          titulo: "Promo Asado Familiar Fin de Semana",
          subtitulo: "Llevando 3 kg o más tenés 15% de descuento en mostrador",
          activo: true,
          orden: 1,
          imagen_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [selectedSucursal]);

  const toggleBannerActivo = (id) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, activo: !b.activo } : b))
    );
    showToast("Estado del banner actualizado.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Banners del Carrusel Superior
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de imágenes promocionales en la portada de la app cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast("Subida de nuevo banner")}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Subir Nuevo Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col"
          >
            <div className="h-44 bg-slate-100 overflow-hidden relative">
              <img
                src={b.imagen_url || b.img}
                alt={b.titulo}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 left-2.5 bg-[#002244] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                Orden #{b.orden}
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900 text-sm">{b.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{b.subtitulo}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleBannerActivo(b.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-95 ${
                    b.activo
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {b.activo ? "Visible" : "Pausado"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
