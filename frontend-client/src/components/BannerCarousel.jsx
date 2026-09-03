// frontend-client/src/components/BannerCarousel.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VITE_API_URL } from "../config/api";

const BADGE_COLORS = {
  rojo: "bg-main-red text-white border-red-400/50 shadow-red-900/30",
  dorado: "bg-amber-500 text-white border-amber-300/50 shadow-amber-900/30",
  amarillo: "bg-amber-400 text-neutral-900 border-amber-200/50 font-black",
  azul: "bg-main-blue text-white border-blue-300/50 shadow-blue-900/30",
  verde:
    "bg-emerald-600 text-white border-emerald-400/50 shadow-emerald-900/30",
  morado: "bg-purple-600 text-white border-purple-400/50 shadow-purple-900/30",
  negro: "bg-neutral-900 text-white border-neutral-700/50 shadow-black/40",
};

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Control estricto de impresiones: solo 1 impresión por banner por sesión
  const viewedBannersRef = useRef(new Set());

  // Para swipe en mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Cargar banners desde la API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/banners`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.error("Error al cargar banners:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleNext = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-play cada 6 segundos
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length, handleNext]);

  // REGISTRO DE IMPRESIÓN PRECISO: Solo cuenta cuando el banner está visible en pantalla y 1 vez por sesión
  useEffect(() => {
    if (banners.length === 0) return;
    const currentBanner = banners[currentIndex];
    if (!currentBanner) return;

    const sessionKey = `valette_banner_seen_${currentBanner.id}`;
    if (!viewedBannersRef.current.has(currentBanner.id)) {
      try {
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
          fetch(`${VITE_API_URL}/banners/${currentBanner.id}/impresion`, {
            method: "POST",
          }).catch(() => {});
        }
      } catch {
        // Fallback si sessionStorage está deshabilitado
        fetch(`${VITE_API_URL}/banners/${currentBanner.id}/impresion`, {
          method: "POST",
        }).catch(() => {});
      }
      viewedBannersRef.current.add(currentBanner.id);
    }
  }, [currentIndex, banners]);

  // Manejo de clicks en banner
  const handleBannerClick = (banner) => {
    if (!banner) return;
    // Registrar clic en el backend
    fetch(`${VITE_API_URL}/banners/${banner.id}/click`, {
      method: "POST",
    }).catch(() => {});

    if (banner.enlace_url) {
      if (banner.enlace_url.startsWith("http")) {
        window.open(banner.enlace_url, "_blank");
      } else {
        navigate(banner.enlace_url);
      }
    }
  };

  // Touch swipe para mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext(); // swipe izquierda
    if (diff < -50) handlePrev(); // swipe derecha
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-video md:aspect-[348/110] max-h-[460px] bg-neutral-200 animate-pulse rounded-2xl mb-8" />
    );
  }

  if (banners.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl group select-none mb-8 bg-neutral-900 shadow-md border border-neutral-200/60"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor de Slides */}
      <div
        className="flex transition-transform duration-500 ease-out h-full transform-gpu will-change-transform"
        style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)` }}
      >
        {banners.map((banner, index) => {
          const badgeClass =
            BADGE_COLORS[banner.badge_color?.toLowerCase()] ||
            BADGE_COLORS.rojo;
          const isFirst = index === 0;

          return (
            <div
              key={banner.id}
              onClick={() => handleBannerClick(banner)}
              className="w-full shrink-0 relative cursor-pointer aspect-video md:aspect-[348/110] max-h-[460px] flex items-end overflow-hidden"
            >
              {/* Imagen Desktop (3480w x 1100h) */}
              <img
                src={banner.imagen_desktop_url}
                alt={banner.titulo || "Promoción Valette"}
                className="hidden md:block w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                loading={isFirst ? "eager" : "lazy"}
                fetchpriority={isFirst ? "high" : "low"}
              />
              {/* Imagen Mobile (aspect-video) */}
              <img
                src={banner.imagen_mobile_url || banner.imagen_desktop_url}
                alt={banner.titulo || "Promoción Valette"}
                className="block md:hidden w-full h-full object-cover"
                loading={isFirst ? "eager" : "lazy"}
                fetchpriority={isFirst ? "high" : "low"}
              />

              {/* Sombra y Gradientes elegantes para legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 flex flex-col justify-end p-4 sm:p-7 md:p-9">
                <div className="max-w-2xl flex flex-col items-start gap-2 sm:gap-2.5">
                  {/* Badge Personalizado Dinámico */}
                  {banner.badge_texto && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider border shadow-md ${badgeClass}`}
                    >
                      <Sparkles className="size-3 shrink-0" />
                      <span>{banner.badge_texto}</span>
                    </span>
                  )}

                  {/* Título Principal */}
                  {banner.titulo && (
                    <h3 className="text-white font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl leading-tight drop-shadow-md">
                      {banner.titulo}
                    </h3>
                  )}

                  {/* Subtítulo Descriptivo */}
                  {banner.subtitulo && (
                    <p className="text-neutral-200 text-xs sm:text-sm md:text-base line-clamp-2 max-w-xl leading-relaxed drop-shadow">
                      {banner.subtitulo}
                    </p>
                  )}

                  {/* Botón de Acción Call to Action */}
                  <div className="mt-1 sm:mt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-extrabold text-xs sm:text-sm shadow-md transition-transform active:scale-95">
                      <span>{banner.boton_texto || "Ver más"}</span>
                      <ArrowRight className="size-3.5 sm:size-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flechas de Navegación */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Anterior banner"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg z-20"
          >
            <ChevronLeft className="size-6 sm:size-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Siguiente banner"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg z-20"
          >
            <ChevronRight className="size-6 sm:size-6" />
          </button>
        </>
      )}

      {/* Indicadores / Puntos de Paginación */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 sm:bottom-5 sm:right-7 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1.5 rounded-full">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
