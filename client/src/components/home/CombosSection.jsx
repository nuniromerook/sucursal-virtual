// src/components/home/CombosSection.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { getSocket } from "@/utils/socket";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { API_URL } from "@/config/api";
import {
  ShoppingCart,
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  RotateCw,
  Package,
} from "lucide-react";
import { ComboDetailModal } from "@/components/modals/ComboDetailModal";

const getTagColor = (badge = "") => {
  if (/parrilla/i.test(badge))
    return "bg-red-50 text-valette-red border-red-200/80";
  if (/familiar|comida|semanal/i.test(badge))
    return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
  if (/gourmet|especial/i.test(badge))
    return "bg-amber-50 text-amber-900 border-amber-200/80";
  return "bg-slate-100 text-slate-700 border-slate-200/80";
};

export const CombosSection = ({ searchQuery = "" }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [combos, setCombos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const scrollRef = useRef(null);

  const fetchCombosRequest = useCallback(async () => {
    const res = await fetch(`${API_URL}/combos`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, []);

  const handleRetry = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const data = await fetchCombosRequest();
      setCombos(data);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar combos reales desde PostgreSQL y sincronizar en tiempo real vía Socket singleton
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchCombosRequest();
        if (isMounted) {
          setCombos(data);
          setHasError(false);
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    const socket = getSocket();
    const handleUpdate = () => {
      load();
    };

    socket.on("catalogo_actualizado", handleUpdate);

    return () => {
      isMounted = false;
      socket.off("catalogo_actualizado", handleUpdate);
    };
  }, [fetchCombosRequest]);

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return combos;
    const q = searchQuery.toLowerCase().trim();
    return combos.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(q) ||
        c.descripcion?.toLowerCase().includes(q) ||
        (Array.isArray(c.items) &&
          c.items.some(
            (it) =>
              it.nombre?.toLowerCase().includes(q) ||
              it.categoria?.toLowerCase().includes(q),
          )),
    );
  }, [combos, searchQuery]);

  if (!isLoading && !hasError && filteredCombos.length === 0) return null;

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 360;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleAddCombo = (combo) => {
    const items = Array.isArray(combo.items) ? combo.items : [];
    const mainImg =
      combo.imagen_url ||
      combo.imagenUrl ||
      items[0]?.imagen_url ||
      items[0]?.imagenUrl ||
      "";

    addToCart(
      {
        id: `combo-${combo.id}`,
        catalogo_id: items[0]?.catalogo_id || combo.id,
        es_combo: true,
        combo_id: combo.id,
        nombre: combo.nombre,
        slug: combo.slug,
        precio: Number(combo.precio) || 0,
        unidad_medida: "u",
        puntos: Number(combo.puntos) || 50,
        imagen_url: mainImg,
      },
      1,
      {
        corte: "Combo preparado de cortes surtidos",
        envasado: "Envasado con cadena de frío",
        kilos: Number(combo.kilos) || 0,
        items_combo: items
          .map((i) => `${i.cantidad_o_peso || i.peso} de ${i.nombre}`)
          .join(", "),
      },
    );
    showToast(`Sumaste ${combo.nombre} al pedido 🥩`);
  };

  return (
    <section id="seccion-combos" className="scroll-mt-36 md:scroll-mt-32 mb-8">
      {/* Cabecera de Sección con Flechas Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3 px-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 mt-4 sm:mt-6">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Combos esenciales
            </h2>
            {!isLoading && !hasError && (
              <span className="text-[11px] font-bold ml-auto lg:ml-0 text-valette-red bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full font-num whitespace-nowrap shadow-2xs">
                {filteredCombos.length} combos
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Paquetes armados para cada gusto y necesidad.
          </p>
        </div>

        {/* Flechas de navegación en Desktop */}
        {!isLoading && !hasError && filteredCombos.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="size-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Ver anteriores"
              aria-label="Ver anteriores"
            >
              <ChevronLeft className="size-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="size-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Ver siguientes"
              aria-label="Ver siguientes"
            >
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

      {/* Estado de Error (sin fallbacks falsos) */}
      {hasError ? (
        <div className="px-4 sm:px-6">
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                  No pudimos cargar los combos
                </p>
                <p className="text-xs text-slate-500">
                  Revisá tu conexión e intentá nuevamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
            >
              <RotateCw className="size-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* Skeleton limpio mientras carga desde PostgreSQL */
        <div className="flex gap-4 overflow-x-hidden pb-4 pt-1 px-4 sm:px-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[80vw] sm:w-[350px] md:w-[360px] shrink-0 bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-video rounded-xl bg-slate-200/80" />
              <div className="h-4 w-2/3 rounded bg-slate-200/80" />
              <div className="h-8 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        /* Contenedor con Scroll Horizontal de Tarjetas de Combos */
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6"
        >
          {filteredCombos.map((combo) => {
            const tagColorClass = combo.tagColor || getTagColor(combo.badge);

            const precio = Number(combo.precio) || 0;
            const precioAnterior =
              Number(combo.precio_anterior) ||
              Number(combo.precioAnterior) ||
              Number(combo.precio_regular_calculado) ||
              precio;

            const comboImg = combo.imagen_url || combo.imagenUrl || "";

            return (
              <article
                key={combo.id}
                onClick={() => setSelectedCombo(combo)}
                className="w-[80vw] sm:w-[350px] md:w-[360px] shrink-0 snap-start last:snap-end bg-white border border-slate-200/90 rounded-2xl p-4 shadow-native flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer"
              >
                <div>
                  {/* 1. Imagen Única Custom del Combo */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3.5">
                    <div className="absolute top-2.5 right-2.5 z-10 hidden sm:flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#003366] text-[10px] font-black uppercase tracking-tight shadow-xs flex items-center gap-1">
                        <Eye className="size-2.5" />
                        <span>Ver detalle</span>
                      </span>
                    </div>

                    {comboImg ? (
                      <img
                        src={comboImg}
                        alt={combo.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                        <Package className="size-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>

                  {/* 2. Badges de Ahorro y Puntos */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${tagColorClass}`}
                    >
                      {combo.badge || "Combo Ahorro"}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                      <Sparkles className="size-2.5 text-amber-600" />+
                      {combo.puntos || 50} pts Club
                    </span>
                  </div>

                  {/* 3. Título */}
                  <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[#003366] transition-colors flex items-center justify-between">
                    <span>{combo.nombre}</span>
                    <ChevronRight className="size-4 text-slate-300 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </h3>
                </div>

                {/* 4. Precios y Botón de Acción en la Base */}
                <footer className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-900 font-num">
                      {formatPrecio(precio)}
                    </span>
                    {precioAnterior > precio && (
                      <span className="text-[11px] text-slate-400 line-through font-num">
                        {formatPrecio(precioAnterior)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddCombo(combo);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-valette-dark text-white font-extrabold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-2xs cursor-pointer shrink-0"
                  >
                    <ShoppingCart className="size-3.5" />
                    <span>Sumar</span>
                  </button>
                </footer>
              </article>
            );
          })}
          {/* Spacer de cierre */}
          <div
            className="shrink-0 w-1 sm:w-3 select-none pointer-events-none"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Modal / Bottom Sheet para Visualizar el Combo */}
      <ComboDetailModal
        key={selectedCombo?.id || "combo-detail-modal"}
        isOpen={Boolean(selectedCombo)}
        onClose={() => setSelectedCombo(null)}
        combo={selectedCombo}
      />
    </section>
  );
};

export default CombosSection;
