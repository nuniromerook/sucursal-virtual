// frontend/src/components/BannerCarousel.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Para swipe en mobile
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Cargar banners desde la API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch(`${API_URL}/banners`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
          // Registrar impresiones de los banners cargados
          data.forEach((b) => {
            fetch(`${API_URL}/banners/${b.id}/impresion`, { method: "POST" }).catch(() => {});
          });
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

  // Auto-play cada 5 segundos
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length, handleNext]);

  // Manejo de clicks en banner
  const handleBannerClick = (banner) => {
    if (!banner) return;
    // Registrar clic
    fetch(`${API_URL}/banners/${banner.id}/click`, { method: "POST" }).catch(() => {});

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
      <div className="w-full aspect-video md:aspect-[348/100] max-h-[440px] bg-neutral-200 animate-pulse rounded-2xl mb-8" />
    );
  }

  if (banners.length === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl group select-none mb-8 bg-neutral-900 shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor de Slides */}
      <div
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            onClick={() => handleBannerClick(banner)}
            className="w-full shrink-0 relative cursor-pointer aspect-video md:aspect-[348/100] max-h-[440px]"
          >
            {/* Imagen Desktop (3480w x 1000h) */}
            <img
              src={banner.imagen_desktop_url}
              alt={banner.titulo || "Promoción Valette"}
              className="hidden md:block w-full h-full object-cover"
              loading="lazy"
            />
            {/* Imagen Mobile (aspect-video) */}
            <img
              src={banner.imagen_mobile_url || banner.imagen_desktop_url}
              alt={banner.titulo || "Promoción Valette"}
              className="block md:hidden w-full h-full object-cover"
              loading="lazy"
            />

            {/* Sombra / Gradiente elegante */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5 sm:p-8">
              {banner.titulo && (
                <div className="max-w-xl">
                  <h3 className="text-white font-black text-base sm:text-2xl md:text-3xl drop-shadow-md">
                    {banner.titulo}
                  </h3>
                </div>
              )}
            </div>
          </div>
        ))}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronLeft className="size-5 sm:size-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Siguiente banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 size-9 sm:size-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
          >
            <ChevronRight className="size-5 sm:size-6" />
          </button>
        </>
      )}

      {/* Indicadores / Puntos */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Ir al banner ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? "w-6 bg-white shadow-xs"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
