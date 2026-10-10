// src/pages/Catalogo.jsx
import React, { useEffect } from "react";
import { Home } from "@/pages/Home";
export {
  CATEGORY_SECTIONS,
  CategoryHorizontalShelf,
} from "@/components/products/CategoryHorizontalShelf";

/**
 * Catalogo Page: Ahora integrado 100% en la experiencia unificada de Home.
 * Si se monta de forma aislada, renderiza Home y asegura el scroll hacia las secciones de catálogo.
 */
export const Catalogo = (props) => {
  useEffect(() => {
    const target =
      document.getElementById("seccion-combos") ||
      document.getElementById("secciones-catalogo");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return <Home {...props} />;
};

export default Catalogo;
