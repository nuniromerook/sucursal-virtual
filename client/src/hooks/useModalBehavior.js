// src/hooks/useModalBehavior.js
import { useEffect, useRef, useCallback, useId } from "react";

// Pila global de modales abiertos para soportar apilamiento real en el DOM:
// - Asigna z-index incremental automático al modal superior.
// - Mantiene bloqueado el scroll del body hasta que se cierra el último modal de la pila.
// - Garantiza que la tecla Escape solo cierre el modal que está arriba de todo.
let activeModalStack = [];
let zIndexCounter = 50;

/**
 * Hook para estandarizar el comportamiento de todos los modales/bottom sheets:
 * - Apilamiento real sin desmontar el modal inferior (z-index dinámico).
 * - Bloqueo de scroll del body mientras haya al menos un modal abierto.
 * - Cierre accesible con la tecla Escape (solo para el modal en la cima de la pila).
 * - Cierre al hacer click en el backdrop / fondo exterior.
 * - Gesto nativo de arrastre hacia abajo (swipe/drag to dismiss) desde la barra táctil y cabecera.
 */
export const useModalBehavior = (isOpen, onClose) => {
  const modalRef = useRef(null);
  const instanceId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const startY = useRef(0);
  const currentDeltaY = useRef(0);
  const isDragging = useRef(false);
  const animationTimer = useRef(null);

  // 1. Registro en la pila de modales, z-index incremental, overflow del body y tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    zIndexCounter += 2;
    const assignedZIndex = zIndexCounter;

    activeModalStack.push({ id: instanceId, zIndex: assignedZIndex });
    document.body.style.overflow = "hidden";

    if (modalRef.current?.parentElement) {
      modalRef.current.parentElement.style.zIndex = String(assignedZIndex);
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const topModal = activeModalStack[activeModalStack.length - 1];
        if (topModal && topModal.id === instanceId && onCloseRef.current) {
          e.stopPropagation();
          onCloseRef.current();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      activeModalStack = activeModalStack.filter((m) => m.id !== instanceId);
      if (activeModalStack.length === 0) {
        document.body.style.overflow = "";
        zIndexCounter = 50;
      }
      window.removeEventListener("keydown", handleKeyDown);
      if (animationTimer.current) {
        clearTimeout(animationTimer.current);
      }
    };
  }, [isOpen, instanceId]);

  // 2. Resetear transform al abrir/cerrar
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.style.transform = "";
      modalRef.current.style.transition = "";
    }
    isDragging.current = false;
    currentDeltaY.current = 0;
  }, [isOpen]);

  // 3. Cierre por click en backdrop (cierra únicamente este modal superior)
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget && onCloseRef.current) {
      onCloseRef.current();
    }
  }, []);

  // 4. Lógica de arrastre táctil (Swipe Down to Dismiss)
  const handleTouchStart = useCallback((e) => {
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

    const deltaY = diff < 0 ? Math.max(-15, diff * 0.15) : diff;
    currentDeltaY.current = deltaY;

    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 200;

    if (currentDeltaY.current > threshold) {
      if (modalRef.current) {
        modalRef.current.style.transition =
          "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        modalRef.current.style.transform = "translateY(100%)";
      }

      animationTimer.current = setTimeout(() => {
        if (onCloseRef.current) onCloseRef.current();
      }, 200);
    } else {
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
  }, []);

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
