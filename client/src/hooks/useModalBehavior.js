// src/hooks/useModalBehavior.js
import { useEffect, useRef, useCallback } from "react";

/**
 * Hook para estandarizar el comportamiento de todos los modales/bottom sheets:
 * - Bloqueo de scroll del body mientras el modal está abierto.
 * - Cierre accesible con la tecla Escape.
 * - Cierre al hacer click en el backdrop / fondo exterior.
 * - Gesto nativo de arrastre hacia abajo (swipe/drag to dismiss) desde la barra táctil y cabecera.
 */
export const useModalBehavior = (isOpen, onClose) => {
  const modalRef = useRef(null);
  const startY = useRef(0);
  const currentDeltaY = useRef(0);
  const isDragging = useRef(false);
  const animationTimer = useRef(null);

  // 1. Manejo de overflow del body y tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || "";
      window.removeEventListener("keydown", handleKeyDown);
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [isOpen, onClose]);

  // 2. Resetear transform al abrir/cerrar
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.style.transform = "";
      modalRef.current.style.transition = "";
    }
    isDragging.current = false;
    currentDeltaY.current = 0;
  }, [isOpen]);

  // 3. Cierre por click en backdrop
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && onClose) {
        onClose();
      }
    },
    [onClose],
  );

  // 4. Lógica de arrastre táctil (Swipe Down to Dismiss)
  const handleTouchStart = useCallback((e) => {
    // Si el toque fue sobre un botón interactivo (ej: X, volver), ignorar arrastre
    if (e.target.closest("button, a, input, textarea, select")) {
      return;
    }

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    currentDeltaY.current = 0;
    isDragging.current = true;

    if (modalRef.current) {
      modalRef.current.style.transition = "none";
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const diff = clientY - startY.current;

    // Resistencia si arrastra hacia arriba (efecto elástico)
    const deltaY = diff < 0 ? Math.max(-15, diff * 0.15) : diff;
    currentDeltaY.current = deltaY;

    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 200; // Umbral en píxeles para confirmar el cierre

    if (currentDeltaY.current > threshold) {
      // Animar salida hacia abajo y cerrar
      if (modalRef.current) {
        modalRef.current.style.transition =
          "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        modalRef.current.style.transform = "translateY(100%)";
      }

      animationTimer.current = setTimeout(() => {
        if (onClose) onClose();
      }, 200);
    } else {
      // Rebotar elásticamente a la posición original
      if (modalRef.current) {
        modalRef.current.style.transition =
          "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)";
        modalRef.current.style.transform = "translateY(0)";
      }

      animationTimer.current = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.style.transform = "";
          modalRef.current.style.transition = "";
        }
      }, 200);
    }

    currentDeltaY.current = 0;
  }, [onClose]);

  const dragHandleProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
    style: { touchAction: "none" },
  };

  return {
    handleBackdropClick,
    modalRef,
    dragHandleProps,
  };
};

export default useModalBehavior;
