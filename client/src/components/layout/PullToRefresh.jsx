// src/components/layout/PullToRefresh.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Check, Loader2 } from "lucide-react";

const THRESHOLD = 72; // px visuales para habilitar el refetch al soltar
const MAX_PULL = 112; // límite máximo de arrastre amortiguado
const RESISTANCE = 0.48; // resistencia elástica estilo iOS / Instagram

/**
 * Indicador nativo 2026 de Pull-to-Refresh que emerge suavemente debajo de la Navbar fija.
 * Solo anima `transform` y `opacity` (compositor 60fps, sin backdrop-blur).
 */
export const PullToRefresh = ({ onRefresh, disabled = false }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [phase, setPhase] = useState("idle"); // "idle" | "pulling" | "ready" | "refreshing" | "done"

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const armedHapticRef = useRef(false);
  const phaseRef = useRef("idle");
  const pullRef = useRef(0);

  const updatePhase = useCallback((nextPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const updatePull = useCallback((dist) => {
    pullRef.current = dist;
    setPullDistance(dist);
  }, []);

  const triggerRefresh = useCallback(async () => {
    updatePhase("refreshing");
    updatePull(54);

    const startedAt = Date.now();
    try {
      await onRefresh?.();
    } catch {
      // Silencioso: cada contexto maneja su propio estado de error
    }

    // Duración mínima cómoda para evitar parpadeos en conexiones ultra rápidas
    const elapsed = Date.now() - startedAt;
    if (elapsed < 550) {
      await new Promise((r) => setTimeout(r, 550 - elapsed));
    }

    updatePhase("done");
    setTimeout(() => {
      updatePull(0);
      setTimeout(() => {
        updatePhase("idle");
      }, 220);
    }, 650);
  }, [onRefresh, updatePhase, updatePull]);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e) => {
      if (phaseRef.current === "refreshing" || phaseRef.current === "done") {
        return;
      }
      if (e.touches.length !== 1) return;
      if (window.scrollY > 2) return;

      // Ignorar gestos iniciados sobre inputs o sliders horizontales
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [data-no-ptr]")
      ) {
        return;
      }

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = true;
      armedHapticRef.current = false;
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current) return;
      if (phaseRef.current === "refreshing" || phaseRef.current === "done") {
        return;
      }
      if (window.scrollY > 2) {
        isPullingRef.current = false;
        if (pullRef.current > 0) {
          updatePull(0);
          updatePhase("idle");
        }
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      // Si el gesto es hacia arriba o predominantemente horizontal, cancelar
      if (deltaY <= 0 || (Math.abs(deltaX) > Math.abs(deltaY) && pullRef.current === 0)) {
        if (pullRef.current > 0) {
          updatePull(0);
          updatePhase("idle");
        }
        isPullingRef.current = false;
        return;
      }

      // Evitar el rebote nativo del navegador mientras arrastramos hacia abajo
      if (deltaY > 6 && e.cancelable) {
        e.preventDefault();
      }

      // Amortiguación progresiva suave (rubber-band)
      const damped = Math.min(
        MAX_PULL,
        Math.round(deltaY * RESISTANCE - Math.max(0, deltaY * RESISTANCE - THRESHOLD) * 0.35),
      );
      updatePull(damped);

      if (damped >= THRESHOLD) {
        if (phaseRef.current !== "ready") {
          updatePhase("ready");
          if (!armedHapticRef.current && typeof navigator !== "undefined" && navigator.vibrate) {
            armedHapticRef.current = true;
            try {
              navigator.vibrate(12);
            } catch {}
          }
        }
      } else if (damped > 8) {
        if (phaseRef.current !== "pulling") {
          updatePhase("pulling");
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      if (phaseRef.current === "ready" && pullRef.current >= THRESHOLD) {
        triggerRefresh();
      } else {
        updatePull(0);
        updatePhase("idle");
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [disabled, triggerRefresh, updatePhase, updatePull]);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const isVisible = phase !== "idle" || pullDistance > 4;
  const isSettling = phase !== "pulling" && phase !== "ready";

  // Progreso circular SVG (r = 9 -> circunferencia ~ 56.55)
  const circumference = 2 * Math.PI * 9;
  const strokeOffset = circumference * (1 - progress);

  // Desplazamiento vertical suave emergiendo exactamente desde detrás de la Navbar fija
  const translateY = isVisible ? Math.max(-44, pullDistance - 44) : -56;

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        top: "var(--navbar-height, 96px)",
        transform: `translate3d(0, ${translateY}px, 0)`,
        opacity: isVisible ? Math.min(1, Math.max(0.15, progress * 1.25)) : 0,
      }}
      className={`fixed left-0 right-0 z-30 flex justify-center pointer-events-none select-none will-change-transform ${
        isSettling ? "transition-all duration-250 ease-out" : ""
      }`}
    >
      <div
        style={{
          transform: `scale(${phase === "ready" ? 1.04 : phase === "done" ? 1.02 : 0.94 + progress * 0.06})`,
        }}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-lg transition-colors duration-200 ${
          phase === "done"
            ? "bg-emerald-600 border-emerald-500 text-white"
            : phase === "ready"
              ? "bg-[#003366] border-[#003366] text-white"
              : "bg-white border-slate-200/90 text-slate-700"
        }`}
      >
        {/* Indicador circular de progreso / spinner / check */}
        <span className="relative size-5 flex items-center justify-center shrink-0">
          {phase === "refreshing" ? (
            <Loader2
              className="size-4 text-[#003366] ptr-spin stroke-[2.5]"
              aria-hidden="true"
            />
          ) : phase === "done" ? (
            <Check className="size-4 text-white stroke-[3]" aria-hidden="true" />
          ) : (
            <>
              <svg
                className="size-5 -rotate-90"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className={phase === "ready" ? "opacity-25" : "text-slate-200"}
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className={phase === "ready" ? "text-white" : "text-[#003366]"}
                />
              </svg>
              <ArrowDown
                style={{
                  transform: `rotate(${phase === "ready" ? 180 : Math.round(progress * 180)}deg)`,
                }}
                className={`size-2.5 absolute stroke-[2.75] transition-transform duration-150 ${
                  phase === "ready" ? "text-white" : "text-[#003366]"
                }`}
                aria-hidden="true"
              />
            </>
          )}
        </span>

        {/* Texto de estado compacto */}
        <span className="text-[11.5px] font-extrabold tracking-tight leading-none whitespace-nowrap">
          {phase === "refreshing"
            ? "Actualizando..."
            : phase === "done"
              ? "Actualizado"
              : phase === "ready"
                ? "Soltá para actualizar"
                : "Deslizá para actualizar"}
        </span>
      </div>
    </div>
  );
};

export default PullToRefresh;
