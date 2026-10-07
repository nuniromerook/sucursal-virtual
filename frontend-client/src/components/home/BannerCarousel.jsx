// src/components/home/BannerCarousel.jsx
import React, { useState, useEffect } from "react";

const BANNERS = [
  {
    id: 1,
    tag: "🔥 OFERTA DE FIN DE SEMANA",
    tagColor: "bg-red-500/30 border-red-400/40 text-red-200",
    titulo: "Asado Criollo & Vacío con 15% de Ahorro",
    descripcion:
      "Llevando 3 kg o más congelás precio promocional exclusivo. Además sumás 50 puntos extra en tu cuenta Club.",
    botonTexto: "Aprovechar Promo",
    subtexto: "Hasta agotar stock",
    categoria: "asado",
    bgClass: "from-[#002244] via-[#003366] to-slate-900",
    btnClass: "bg-white text-[#003366] hover:bg-slate-100",
    imagenUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600",
  },
  {
    id: 2,
    tag: "📦 COMBO - LLENÁ EL FREEZER",
    tagColor: "bg-emerald-500/30 border-emerald-400/40 text-emerald-200",
    titulo: "Combo Familiar 5 Kilos Surtidos",
    descripcion:
      "Milanesas, picada especial, bola de lomo y pechuga con envío refrigerado gratis incluido.",
    botonTexto: "Ver Combo",
    subtexto: "Ideal para la semana",
    categoria: "combos",
    bgClass: "from-emerald-950 via-teal-900 to-slate-900",
    btnClass: "bg-emerald-400 text-emerald-950 hover:bg-emerald-300",
    imagenUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600",
  },
];

export const BannerCarousel = ({ onSelectCategory }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[currentSlide];

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-native mb-8 text-white">
      <div
        className={`relative flex flex-col sm:flex-row-reverse items-center justify-between bg-gradient-to-r ${banner.bgClass} transition-all duration-500 pb-4 sm:pb-0`}
      >
        <img
          src={banner.imagenUrl}
          alt={banner.titulo}
          className="w-full sm:w-60 sm:aspect-4/5 lg:aspect-video lg:w-2xl object-cover aspect-video"
        />

        <div className="max-w-md z-10 p-6 sm:p-8">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-2 ${banner.tagColor}`}
          >
            <span>{banner.tag}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            {banner.titulo}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 min-h-[3lh]">
            {banner.descripcion}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectCategory(banner.categoria)}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors whitespace-nowrap shadow-sm cursor-pointer ${banner.btnClass}`}
            >
              {banner.botonTexto} →
            </button>
            <span className="text-[11px] text-slate-300">
              {banner.subtexto}
            </span>
          </div>
        </div>
      </div>

      {/* Indicadores de Navegación del Carrusel */}
      <div className="absolute bottom-3 left-6 flex items-center gap-1.5 z-20">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`size-3 rounded-full transition-all cursor-pointer ${
              idx === currentSlide ? "bg-white w-6" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
