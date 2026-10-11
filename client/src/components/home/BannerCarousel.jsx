// src/components/home/BannerCarousel.jsx
import React, { useState, useEffect, useRef } from "react";
import { useCatalogo } from "@/context/CatalogoContext";

export const BannerCarousel = ({ onSelectCategory }) => {
  const { banners } = useCatalogo();
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isHorizontalSwipe = useRef(null);

  const bannerList = banners && banners.length > 0 ? banners : [];

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerList.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [bannerList.length, currentSlide]);

  // Bloqueo direccional nativo: al deslizar horizontalmente se bloquea el scroll vertical de la página
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = null;
    };

    const onTouchMove = (e) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX.current;
      const diffY = currentY - touchStartY.current;

      // Determinamos el eje predominante una vez superado un umbral mínimo (6px)
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
          isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
        }
      }

      // Si el gesto es horizontal para cambiar banner, bloqueamos el scroll vertical de la ventana
      if (isHorizontalSwipe.current === true) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (
        isHorizontalSwipe.current === true &&
        Math.abs(diff) > 40 &&
        bannerList.length > 1
      ) {
        if (diff > 0) {
          // Deslizar izquierda -> siguiente
          setCurrentSlide((prev) => (prev + 1) % bannerList.length);
        } else {
          // Deslizar derecha -> anterior
          setCurrentSlide(
            (prev) => (prev - 1 + bannerList.length) % bannerList.length,
          );
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
      isHorizontalSwipe.current = null;
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [bannerList.length]);

  if (bannerList.length === 0) return null;

  const banner = bannerList[currentSlide] || bannerList[0];
  const tagText = banner.badge_texto || banner.tag || "OFERTA VALETTE";
  const descText =
    banner.subtitulo ||
    banner.descripcion ||
    "Carnes seleccionadas directas de frigorífico.";
  const btnText = banner.boton_texto || banner.botonTexto || "Ver oferta";

  const handleAction = () => {
    if (onSelectCategory) {
      if (banner.categoria) {
        onSelectCategory(banner.categoria);
      } else if (banner.enlace_url && banner.enlace_url.includes("asado")) {
        onSelectCategory("asado");
      } else if (banner.enlace_url && banner.enlace_url.includes("vacuno")) {
        onSelectCategory("vacuno");
      } else {
        onSelectCategory("todos");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-native mb-8 text-white aspect-4/5 sm:aspect-auto select-none"
    >
      <div
        className={`relative w-full h-full sm:h-auto flex flex-col sm:flex-row-reverse items-center justify-between sm:bg-linear-to-r ${
          banner.bgClass || "from-valette-dark via-[#003366] to-slate-900"
        } transition-all duration-500`}
      >
        {/* Imagen de Fondo en Mobile (4:5 Post) / Imagen Lateral en Desktop */}
        <img
          src={
            banner.imagen_desktop_url ||
            banner.imagenUrl ||
            banner.imagen_mobile_url
          }
          alt={banner.titulo}
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 w-full h-full sm:relative sm:inset-auto sm:w-60 md:w-80 lg:w-2xl sm:aspect-4/5 lg:aspect-video object-cover"
        />

        {/* Gradiente de contraste en Mobile: sin blur para 60fps en celulares */}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/65 to-black/25 sm:hidden pointer-events-none" />

        {/* Contador compacto estilo Instagram en Mobile (arriba a la derecha) */}
        {bannerList.length > 1 && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-slate-950/60 border border-white/20 text-[10px] font-black text-white sm:hidden z-20">
            {currentSlide + 1}/{bannerList.length}
          </div>
        )}

        {/* Contenido / Info en Absolute (Mobile) y Relative (Desktop) */}
        <div className="absolute inset-0 sm:relative sm:inset-auto flex flex-col justify-end sm:justify-center p-5 pb-11 sm:p-8 sm:max-w-md z-10">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-2.5 w-fit ${
              banner.tagColor || "bg-red-500/30 border-red-400/40 text-red-200"
            }`}
          >
            <span>{tagText}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
            {banner.titulo}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 sm:text-slate-300 mt-2 line-clamp-3 sm:line-clamp-none sm:min-h-[3lh]">
            {descText}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAction}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-transform active:scale-95 whitespace-nowrap shadow-sm cursor-pointer ${
                banner.btnClass || "bg-white text-[#003366] hover:bg-slate-100"
              }`}
            >
              {btnText} →
            </button>
            <span className="text-[11px] text-slate-300 font-medium">
              Hasta agotar stock
            </span>
          </div>
        </div>
      </div>

      {/* Indicadores de Navegación del Carrusel (Debajo a la izquierda) */}
      {bannerList.length > 1 && (
        <div className="absolute bottom-3.5 left-5 sm:left-8 flex items-center gap-1.5 z-20">
          {bannerList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`size-2.5 sm:size-3 rounded-full transition-all cursor-pointer ${
                idx === currentSlide ? "bg-white w-6" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
