// src/components/layout/PullToRefresh.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Check, Loader2 } from "lucide-react";

const THRESHOLD = 72; // px visuales para habilitar el refetch al soltar
const MAX_PULL = 112; // límite máximo de arrastre amortiguado
const RESISTANCE = 0.48; // resistencia elástica estilo iOS / Instagram

function triggerHaptic(pattern) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Dispositivo o navegador sin soporte háptico
  }
}

/**
 * Indicador circular discreto 2026 de Pull-to-Refresh que emerge suavemente
 * debajo de la Navbar fija (solo ícono circular, sin texto visible, 60fps).
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
    updatePull(52);

    const startedAt = Date.now();
    try {
      await onRefresh?.();
    } catch {
      // Silencioso: cada contexto maneja su propio estado de error
    }

    const elapsed = Date.now() - startedAt;
    if (elapsed < 550) {
      await new Promise((r) => setTimeout(r, 550 - elapsed));
    }

    updatePhase("done");
    triggerHaptic(10);
    setTimeout(() => {
      updatePull(0);
      setTimeout(() => {
        updatePhase("idle");
      }, 220);
    }, 600);
  }, [onRefresh, updatePhase, updatePull]);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e) => {
      if (phaseRef.current === "refreshing" || phaseRef.current === "done") {
        return;
      }
      if (e.touches.length !== 1) return;
      if (window.scrollY > 2) return;

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

      if (
        deltaY <= 0 ||
        (Math.abs(deltaX) > Math.abs(deltaY) && pullRef.current === 0)
      ) {
        if (pullRef.current > 0) {
          updatePull(0);
          updatePhase("idle");
        }
        isPullingRef.current = false;
        return;
      }

      if (deltaY > 6 && e.cancelable) {
        e.preventDefault();
      }

      const damped = Math.min(
        MAX_PULL,
        Math.round(
          deltaY * RESISTANCE -
            Math.max(0, deltaY * RESISTANCE - THRESHOLD) * 0.35,
        ),
      );
      updatePull(damped);

      if (damped >= THRESHOLD) {
        if (phaseRef.current !== "ready") {
          updatePhase("ready");
          if (!armedHapticRef.current) {
            armedHapticRef.current = true;
            triggerHaptic(18);
          }
        }
      } else {
        if (damped < THRESHOLD - 10) {
          armedHapticRef.current = false;
        }
        if (damped > 8 && phaseRef.current !== "pulling") {
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

  // Progreso circular SVG (r = 9.5 -> circunferencia ~ 59.69)
  const circumference = 2 * Math.PI * 9.5;
  const strokeOffset = circumference * (1 - progress);

  // Desplazamiento vertical suave emergiendo desde detrás de la Navbar fija
  const translateY = isVisible ? Math.max(-44, pullDistance - 44) : -52;

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
          transform: `scale(${
            phase === "ready"
              ? 1.08
              : phase === "done"
                ? 1.04
                : 0.9 + progress * 0.1
          })`,
        }}
        className={`size-10 rounded-full border shadow-lg flex items-center justify-center transition-colors duration-200 ${
          phase === "done"
            ? "bg-emerald-600 border-emerald-500 text-white"
            : phase === "ready"
              ? "bg-[#003366] border-[#003366] text-white"
              : "bg-white border-slate-200/90 text-[#003366]"
        }`}
      >
        <span className="relative size-6 flex items-center justify-center shrink-0">
          {phase === "refreshing" ? (
            <Loader2
              className="size-4.5 text-[#003366] ptr-spin stroke-[2.5]"
              aria-hidden="true"
            />
          ) : phase === "done" ? (
            <Check
              className="size-4.5 text-white stroke-[3]"
              aria-hidden="true"
            />
          ) : (
            <>
              <svg
                className="size-6 -rotate-90"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className={
                    phase === "ready" ? "opacity-25" : "text-slate-200"
                  }
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className={
                    phase === "ready" ? "text-white" : "text-[#003366]"
                  }
                />
              </svg>
              <ArrowDown
                style={{
                  transform: `rotate(${phase === "ready" ? 180 : Math.round(progress * 180)}deg)`,
                }}
                className={`size-3 absolute stroke-[2.75] transition-transform duration-150 ${
                  phase === "ready" ? "text-white" : "text-[#003366]"
                }`}
                aria-hidden="true"
              />
            </>
          )}
        </span>

        {/* Texto oculto visualmente para accesibilidad */}
        <span className="sr-only">
          {phase === "refreshing"
            ? "Actualizando contenido"
            : phase === "done"
              ? "Contenido actualizado"
              : phase === "ready"
                ? "Soltá para actualizar"
                : ""}
        </span>
      </div>
    </div>
  );
};

export default PullToRefresh;
