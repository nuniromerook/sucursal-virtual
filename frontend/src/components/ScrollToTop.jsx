// frontend/src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollToTop Component
 * - Al abrir una NUEVA página (navegación tipo PUSH / REPLACE), resetea el scroll al inicio (top: 0).
 * - Al volver atrás o ir hacia adelante con el botón del navegador (tipo POP), respeta la posición previa de scroll.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Solo reseteamos cuando NO es navegación de historial hacia atrás/adelante (POP)
    if (navType !== "POP") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }
  }, [pathname, navType]);

  return null;
}
