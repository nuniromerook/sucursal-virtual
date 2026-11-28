// src/components/home/BannerCarousel.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
} from "lucide-react";
import { useCatalogo } from "@/context/CatalogoContext";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/config/api";
import {
  DEFAULT_AMBIENT_PALETTE,
  extractBannerAmbient,
  getCachedBannerAmbient,
} from "@/utils/bannerAmbient";

function resolveBannerAction(banner) {
  const rawType = String(banner?.accion_tipo || "").trim().toLowerCase();
  const rawLink = String(banner?.enlace_url || "").trim();
  const lowerLink = rawLink.toLowerCase();

  if (
    rawType === "externo" ||
    rawType === "whatsapp" ||
    rawType === "app" ||
    /^https?:\/\//i.test(rawLink) ||
    /^(tel:|mailto:)/i.test(rawLink)
  ) {
    const isDirectAppScheme = /^(tel:|mailto:)/i.test(rawLink);
    return {
      type: isDirectAppScheme ? "app_scheme" : "external",
      url: rawLink,
      isExternalVisual: true,
    };
  }

  if (rawType === "modal" || lowerLink.includes("club-valette")) {
    const target = rawLink
      .replace(/^\/+/, "")
      .replace(/^club-valette$/i, "club")
      .toLowerCase();
    return { type: "modal", target: target || "club", isExternalVisual: false };
  }

  if (rawType === "busqueda" || lowerLink.includes("?q=")) {
    let query = rawLink;
    if (lowerLink.includes("?q=")) {
      try {
        query = new URLSearchParams(rawLink.split("?")[1] || "").get("q") || "";
      } catch {
        query = rawLink.split("?q=")[1] || "";
      }
    }
    return {
      type: "busqueda",
      query: query.trim(),
      isExternalVisual: false,
    };
  }

  // Categoría interna (soporta "combos", "/#seccion-combos", "/vacuno", etc.)
  const cleanedCat =
    banner?.categoria ||
    rawLink
      .replace(/^\/?#?seccion-/i, "")
      .replace(/^\//, "")
      .split(/[?#]/)[0]
      .trim()
      .toLowerCase();

  const knownCats = [
    "combos",
    "asado",
    "vacuno",
    "cerdo",
    "pollo",
    "embutidos",
    "preparados",
    "achuras",
    "almacen",
  ];
  const matchedCat =
    knownCats.find((c) => cleanedCat === c || lowerLink.includes(c)) ||
    "combos";

  return { type: "categoria", category: matchedCat, isExternalVisual: false };
}

const AUTOPLAY_MS = 7000;

export const BannerCarousel = ({ onSelectCategory, onBannerAction }) => {
  const { banners, isLoadingBanners } = useCatalogo();
  const { sesionId } = useCart();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedBannerIds, setFailedBannerIds] = useState(() => new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 640px)").matches
      : false,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [ambientPalettes, setAmbientPalettes] = useState({});

  const trackRef = useRef(null);
  const touchEndTimerRef = useRef(null);
  const pendingTargetRef = useRef(null);
  const settledSlideRef = useRef(0);
  const trackedImpressionsRef = useRef(new Set());

  // Filtrar banners válidos excluyendo los que hayan fallado al cargar su imagen
  const validBanners = useMemo(() => {
    if (!Array.isArray(banners)) return [];
    return banners.filter((b) => {
      if (!b || b.activo === false) return false;
      const key = String(b.id ?? b.titulo ?? "");
      if (failedBannerIds.has(key)) return false;
      const hasImg = Boolean(
        b.imagen_desktop_url || b.imagenUrl || b.imagen_mobile_url,
      );
      return hasImg;
    });
  }, [banners, failedBannerIds]);

  const totalSlides = validBanners.length;
  const safeIndex = totalSlides > 0 ? Math.min(currentSlide, totalSlides - 1) : 0;
  const activeBanner = validBanners[safeIndex] || null;
  const activeBannerId = activeBanner?.id || null;

  const markBannerFailed = useCallback((banner) => {
    const key = String(banner?.id ?? banner?.titulo ?? "");
    if (!key) return;
    setFailedBannerIds((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  // Scroll fluido a un índice de diapositiva respetando prefers-reduced-motion
  const scrollToSlide = useCallback(
    (index, announceChange = false) => {
      const track = trackRef.current;
      if (!track || totalSlides === 0) return;
      const bounded = ((index % totalSlides) + totalSlides) % totalSlides;
      const slideWidth = track.clientWidth;
      if (!slideWidth) return;

      pendingTargetRef.current = bounded;
      setCurrentSlide(bounded);

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      track.scrollTo({
        left: bounded * slideWidth,
        behavior: prefersReduced ? "auto" : "smooth",
      });

      if (announceChange) {
        settledSlideRef.current = bounded;
        setAnnouncement(`Banner ${bounded + 1} de ${totalSlides}`);
      }
    },
    [totalSlides],
  );

  // Registrar impresión única por dispositivo cuando un banner se vuelve activo
  useEffect(() => {
    if (!activeBannerId) return;
    if (trackedImpressionsRef.current.has(activeBannerId)) return;
    trackedImpressionsRef.current.add(activeBannerId);

    fetch(`${API_URL}/banners/${activeBannerId}/impresion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: sesionId || "anon" }),
    }).catch(() => {});
  }, [activeBannerId, sesionId]);

  // Sincronizar indicador activo en vivo con rAF y settle en scrollend (con fallback debounced)
  useEffect(() => {
    const track = trackRef.current;
    if (!track || totalSlides <= 1) return;

    let rafId = null;
    let settleTimer = null;
    const supportsScrollEnd = "onscrollend" in window;

    const computeNearestIndex = () => {
      const width = track.clientWidth;
      if (!width) return 0;
      return Math.max(
        0,
        Math.min(totalSlides - 1, Math.round(track.scrollLeft / width)),
      );
    };

    const handleSettle = () => {
      const settled = computeNearestIndex();
      pendingTargetRef.current = null;
      setCurrentSlide((prev) => (prev === settled ? prev : settled));
      if (settled !== settledSlideRef.current) {
        settledSlideRef.current = settled;
        setAnnouncement(`Banner ${settled + 1} de ${totalSlides}`);
      }
    };

    const handleScroll = () => {
      if (pendingTargetRef.current === null && rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const nearest = computeNearestIndex();
          setCurrentSlide((prev) => (prev === nearest ? prev : nearest));
        });
      }

      if (!supportsScrollEnd) {
        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(handleSettle, 140);
      }
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener("scrollend", handleSettle, { passive: true });
    }

    return () => {
      track.removeEventListener("scroll", handleScroll);
      if (supportsScrollEnd) {
        track.removeEventListener("scrollend", handleSettle);
      }
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [totalSlides]);

  // Detectar viewport y preferencia de movimiento reducido
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqDesktop = window.matchMedia("(min-width: 640px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onDesktopChange = (e) => setIsDesktop(e.matches);
    const onMotionChange = (e) => setPrefersReducedMotion(e.matches);
    mqDesktop.addEventListener("change", onDesktopChange);
    mqMotion.addEventListener("change", onMotionChange);
    return () => {
      mqDesktop.removeEventListener("change", onDesktopChange);
      mqMotion.removeEventListener("change", onMotionChange);
      if (touchEndTimerRef.current) clearTimeout(touchEndTimerRef.current);
    };
  }, []);

  // Extraer colores ambientales de cada banner activo (mobile y desktop, < 1ms en canvas)
  useEffect(() => {
    if (validBanners.length === 0) return;
    let cancelled = false;

    const urls = Array.from(
      new Set(
        validBanners
          .map((b) =>
            isDesktop
              ? b.imagen_desktop_url || b.imagenUrl || b.imagen_mobile_url || ""
              : b.imagen_mobile_url || b.imagen_desktop_url || b.imagenUrl || "",
          )
          .filter(Boolean),
      ),
    );

    urls.forEach((url) => {
      if (getCachedBannerAmbient(url)) return;

      extractBannerAmbient(url).then((palette) => {
        if (cancelled) return;
        setAmbientPalettes((prev) =>
          prev[url] === palette ? prev : { ...prev, [url]: palette },
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isDesktop, validBanners]);

  const isAutoplayPaused = isPaused || isInteracting;

  // Fallback de auto-avance cuando prefers-reduced-motion desactiva la animación CSS de progreso
  useEffect(() => {
    if (totalSlides <= 1 || isAutoplayPaused || !prefersReducedMotion) return;
    const timer = setInterval(() => {
      scrollToSlide(safeIndex + 1, false);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [
    totalSlides,
    isAutoplayPaused,
    prefersReducedMotion,
    safeIndex,
    scrollToSlide,
  ]);

  // Skeleton limpio mientras cargan los banners reales desde PostgreSQL
  if (isLoadingBanners) {
    return (
      <div
        aria-label="Cargando promociones"
        className="relative rounded-3xl overflow-hidden bg-slate-200/80 border border-slate-200/70 mb-8 aspect-4/5 sm:aspect-auto sm:h-[315px] md:h-[345px] lg:h-[378px] animate-pulse"
      >
        <div className="absolute inset-x-5 bottom-6 sm:inset-y-8 sm:left-11 lg:left-14 sm:right-auto sm:w-80 flex flex-col justify-end sm:justify-center gap-3">
          <div className="h-5 w-28 rounded-full bg-slate-300/80" />
          <div className="h-7 w-64 rounded-xl bg-slate-300/80" />
          <div className="h-4 w-52 rounded-lg bg-slate-300/70" />
          <div className="h-10 w-32 rounded-xl bg-slate-300/80 mt-1" />
        </div>
      </div>
    );
  }

  // Si no hay banners activos o todos fallaron, ocultar el carrusel por completo
  if (totalSlides === 0) return null;

  const handleAction = (banner) => {
    if (banner?.id) {
      try {
        sessionStorage.setItem("valette_last_banner_id", String(banner.id));
      } catch {}
      fetch(`${API_URL}/banners/${banner.id}/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }

    const resolved = resolveBannerAction(banner);

    if (resolved.type === "app_scheme" && resolved.url) {
      window.location.href = resolved.url;
      return;
    }

    if (resolved.type === "external" && resolved.url) {
      window.open(resolved.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (resolved.type === "modal" || resolved.type === "busqueda") {
      onBannerAction?.(resolved);
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(resolved.category || "combos");
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Promociones destacadas"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setIsInteracting(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setIsInteracting(false);
      }}
      onTouchStart={() => {
        if (touchEndTimerRef.current) {
          clearTimeout(touchEndTimerRef.current);
          touchEndTimerRef.current = null;
        }
        setIsInteracting(true);
      }}
      onTouchEnd={() => {
        if (touchEndTimerRef.current) clearTimeout(touchEndTimerRef.current);
        touchEndTimerRef.current = setTimeout(() => {
          touchEndTimerRef.current = null;
          setIsInteracting(false);
        }, 400);
      }}
      onTouchCancel={() => {
        if (touchEndTimerRef.current) {
          clearTimeout(touchEndTimerRef.current);
          touchEndTimerRef.current = null;
        }
        setIsInteracting(false);
      }}
      className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-native mb-8 text-white select-none group"
    >
      {/* Controles Anterior / Siguiente en Desktop (antes del track en orden DOM) */}
      {totalSlides > 1 && (
        <div className="hidden sm:flex items-center justify-between absolute inset-y-0 inset-x-3 z-20 pointer-events-none">
          <button
            type="button"
            onClick={() => scrollToSlide(safeIndex - 1, true)}
            aria-label="Banner anterior"
            className="pointer-events-auto size-9 rounded-full bg-slate-950/65 hover:bg-slate-950/85 border border-white/20 text-white flex items-center justify-center shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="size-4.5 stroke-[2.5]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSlide(safeIndex + 1, true)}
            aria-label="Banner siguiente"
            className="pointer-events-auto size-9 rounded-full bg-slate-950/65 hover:bg-slate-950/85 border border-white/20 text-white flex items-center justify-center shadow-md transition-opacity opacity-0 group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer active:scale-95"
          >
            <ChevronRight className="size-4.5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Contador compacto en Mobile + Botón Pausa/Play accesible */}
      {totalSlides > 1 && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-20">
          <span className="px-2.5 py-1 rounded-full bg-slate-950/65 border border-white/20 text-[10px] font-black font-num text-white sm:hidden">
            {safeIndex + 1}/{totalSlides}
          </span>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? "Reanudar carrusel" : "Pausar carrusel"}
            title={isPaused ? "Reanudar" : "Pausar"}
            className="size-7 rounded-full bg-slate-950/65 hover:bg-slate-950/85 border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isPaused ? (
              <Play className="size-3 fill-white" aria-hidden="true" />
            ) : (
              <Pause className="size-3 fill-white" aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      {/* Track horizontal nativo con CSS scroll-snap fluido (60fps en touch y auto-avance) */}
      <div
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-label="Diapositivas de promociones"
        className="banner-carousel-track flex overflow-x-auto no-scrollbar snap-x snap-mandatory w-full outline-none"
      >
        {validBanners.map((banner, idx) => {
          const tagText = banner.badge_texto || banner.tag || "OFERTA VALETTE";
          const descText =
            banner.subtitulo ||
            banner.descripcion ||
            "Cortes seleccionados directo de frigorífico.";
          const btnText = banner.boton_texto || banner.botonTexto || "Ver oferta";
          const secondaryText = String(banner.texto_secundario || "").trim();
          const actionMeta = resolveBannerAction(banner);
          const desktopImg =
            banner.imagen_desktop_url ||
            banner.imagenUrl ||
            banner.imagen_mobile_url;
          const mobileImg =
            banner.imagen_mobile_url ||
            banner.imagen_desktop_url ||
            banner.imagenUrl;
          const activeSampleImg = isDesktop ? desktopImg : mobileImg;
          const ambient =
            ambientPalettes[activeSampleImg] ||
            getCachedBannerAmbient(activeSampleImg) ||
            DEFAULT_AMBIENT_PALETTE;
          const ambientVars = {
            "--banner-base": ambient.base,
            "--banner-edge": ambient.edge,
            "--banner-glow-top": ambient.glowTop,
            "--banner-glow-bottom": ambient.glowBottom,
          };

          return (
            <div
              key={banner.id ?? idx}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} de ${totalSlides}`}
              className="w-full shrink-0 snap-center snap-always aspect-4/5 sm:aspect-auto sm:h-[315px] md:h-[345px] lg:h-[378px]"
            >
              <div
                style={ambientVars}
                className="banner-immersive-slide relative w-full h-full flex flex-col sm:flex-row items-stretch overflow-hidden"
              >
                {/* Capa ambiental inmersiva en Desktop (colores reales de la imagen, sin blur pesado) */}
                <div
                  className={`banner-desktop-ambient hidden sm:block absolute inset-0 z-0 pointer-events-none ${
                    ambient.extracted ? "opacity-100" : "opacity-85"
                  }`}
                  aria-hidden="true"
                />

                {/* Imagen Mobile (4:5 completo) / Desktop (fundida suavemente por su borde izquierdo) */}
                <picture className="banner-desktop-photo absolute inset-0 w-full h-full sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[62%] md:w-[64%] lg:w-[66%] z-[1] block shrink-0">
                  {mobileImg && (
                    <source media="(max-width: 639px)" srcSet={mobileImg} />
                  )}
                  <img
                    src={desktopImg}
                    alt={banner.titulo || "Promoción Valette"}
                    fetchPriority={idx === 0 ? "high" : "auto"}
                    loading={idx === 0 ? "eager" : "lazy"}
                    onError={() => markBannerFailed(banner)}
                    className="w-full h-full object-cover"
                  />
                </picture>

                {/* Sombra inmersiva con tonos reales de la imagen (inferior en Mobile, lateral en Desktop) */}
                <div
                  className="banner-immersive-scrim absolute inset-0 z-[2] pointer-events-none"
                  aria-hidden="true"
                />

                {/* Contenido / Info */}
                <div className="absolute inset-0 sm:relative sm:inset-auto flex flex-col justify-end sm:justify-center p-5 pb-12 sm:pl-11 sm:pr-6 sm:py-8 sm:pb-11 lg:pl-14 lg:pr-6 lg:py-9 sm:max-w-[56%] md:max-w-[50%] lg:max-w-[46%] z-10">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-2.5 w-fit ${
                      banner.tagColor ||
                      "bg-white/14 border-white/25 text-white/95"
                    }`}
                  >
                    <span>{tagText}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                    {banner.titulo}
                  </h2>

                  <p className="text-xs sm:text-sm text-white/85 mt-2 line-clamp-3 sm:line-clamp-none sm:min-h-[3lh]">
                    {descText}
                  </p>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAction(banner)}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-transform active:scale-95 whitespace-nowrap shadow-sm cursor-pointer inline-flex items-center gap-1.5 ${
                        banner.btnClass ||
                        "bg-white text-slate-950 hover:bg-slate-100"
                      }`}
                    >
                      <span>{btnText}</span>
                      {actionMeta.isExternalVisual ? (
                        <ExternalLink
                          className="size-3.5 stroke-[2.4]"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowRight
                          className="size-3.5 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    {secondaryText && (
                      <span className="text-[11px] text-white/75 font-medium">
                        {secondaryText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Región de estado accesible para lectores de pantalla */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Marcadores de navegación con progreso tipo Instagram Stories (global: mobile y desktop) */}
      {totalSlides > 1 && (
        <nav
          aria-label="Elegir banner"
          className="absolute bottom-2 left-4 sm:left-10 lg:left-12 flex items-center gap-0.5 z-20"
        >
          {validBanners.map((b, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={b.id ?? idx}
                type="button"
                onClick={() => scrollToSlide(idx, true)}
                aria-label={`Ir al banner ${idx + 1}`}
                aria-current={isActive ? "true" : undefined}
                className="min-w-6 min-h-6 flex items-center justify-center cursor-pointer group/dot"
              >
                <span
                  className={`relative block h-2 rounded-full overflow-hidden transition-[width,background-color] duration-300 ${
                    isActive
                      ? "w-7 bg-white/30"
                      : "w-2 bg-white/35 group-hover/dot:bg-white/65"
                  }`}
                >
                  {isActive && (
                    <span
                      key={`progress-${safeIndex}`}
                      style={{
                        "--banner-autoplay-ms": `${AUTOPLAY_MS}ms`,
                        animationPlayState: isAutoplayPaused
                          ? "paused"
                          : "running",
                      }}
                      onAnimationEnd={() => {
                        if (!isAutoplayPaused && !prefersReducedMotion) {
                          scrollToSlide(safeIndex + 1, false);
                        }
                      }}
                      className="banner-dot-progress-fill absolute inset-0 bg-white"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </section>
  );
};
