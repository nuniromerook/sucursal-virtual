// src/hooks/useModalBehavior.js
import { useEffect } from "react";

/**
 * Hook para estandarizar el comportamiento de todos los modales/bottom sheets:
 * - Bloqueo de scroll del body mientras el modal está abierto.
 * - Cierre accesible con la tecla Escape.
 * - Cierre al hacer click en el backdrop / fondo exterior.
 */
export const useModalBehavior = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    // Bloquear scroll de la página
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
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return { handleBackdropClick };
};

export default useModalBehavior;
