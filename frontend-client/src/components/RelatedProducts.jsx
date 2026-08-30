// frontend-client/src/components/RelatedProducts.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Sparkles, Flame, ChefHat, ArrowRight } from "lucide-react";
import { API_URL } from "../config/api";
import ProductCard from "./ProductCard";

const PARRILLA_KEYWORDS = [
  "asado",
  "vacio",
  "vacío",
  "entraña",
  "entrana",
  "matambre",
  "costilla",
  "bife",
  "tapa",
  "colita",
  "pechito",
  "bondiola",
  "chorizo",
  "morcilla",
  "chinchulin",
  "molleja",
  "achura",
];

const MILANESA_KEYWORDS = [
  "milanesa",
  "nalga",
  "peceto",
  "bola de lomo",
  "cuadrada",
  "lomo",
  "suprema",
  "pechuga",
  "rebozador",
];

const GUISO_KEYWORDS = [
  "osobuco",
  "roast beef",
  "paleta",
  "tortuguita",
  "falda",
  "estofado",
  "guiso",
];

function calculateAffinityScore(target, candidate) {
  if (!target || !candidate || target.id === candidate.id) return -1;

  let score = 0;

  const targetName = (target.nombre_producto || "").toLowerCase();
  const targetDesc = (target.descripcion || "").toLowerCase();
  const targetEsp = (target.especie || "").toLowerCase();
  const targetCat = (target.categoria || "").toLowerCase();

  const candName = (candidate.nombre_producto || "").toLowerCase();
  const candDesc = (candidate.descripcion || "").toLowerCase();
  const candEsp = (candidate.especie || "").toLowerCase();
  const candCat = (candidate.categoria || "").toLowerCase();

  // 1. Misma especie (ej: ambos vacuno, ambos cerdo, ambos pollo)
  if (targetEsp && candEsp && targetEsp === candEsp) {
    score += 50;
  }

  // 2. Misma categoría
  if (targetCat && candCat && targetCat === candCat) {
    score += 30;
  }

  // 3. Afinidad de Asado / Parrilla
  const isTargetParrilla = PARRILLA_KEYWORDS.some(
    (kw) => targetName.includes(kw) || targetDesc.includes(kw)
  );
  const isCandParrilla = PARRILLA_KEYWORDS.some(
    (kw) => candName.includes(kw) || candDesc.includes(kw)
  );
  if (isTargetParrilla && isCandParrilla) {
    score += 45;
  }

  // 4. Afinidad de Milanesas / Minutas
  const isTargetMilanesa = MILANESA_KEYWORDS.some(
    (kw) => targetName.includes(kw) || targetDesc.includes(kw)
  );
  const isCandMilanesa = MILANESA_KEYWORDS.some(
    (kw) => candName.includes(kw) || candDesc.includes(kw)
  );
  if (isTargetMilanesa && isCandMilanesa) {
    score += 40;
  }

  // 5. Afinidad de Guisos / Horno
  const isTargetGuiso = GUISO_KEYWORDS.some(
    (kw) => targetName.includes(kw) || targetDesc.includes(kw)
  );
  const isCandGuiso = GUISO_KEYWORDS.some(
    (kw) => candName.includes(kw) || candDesc.includes(kw)
  );
  if (isTargetGuiso && isCandGuiso) {
    score += 35;
  }

  // 6. Si es producto en oferta o destacado
  if (candidate.destacar) score += 10;
  if (Number(candidate.precio_anterior) > Number(candidate.precio)) score += 15;

  return score;
}

export default function RelatedProducts({ currentProduct }) {
  const [catalogo, setCatalogo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${API_URL}/catalogo?activo=true`);
        if (res.ok) {
          const data = await res.json();
          setCatalogo(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error al cargar productos recomendados:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const related = useMemo(() => {
    if (!currentProduct || catalogo.length === 0) return [];

    const scored = catalogo
      .filter((p) => p.id !== currentProduct.id && p.activo !== false)
      .map((p) => ({
        product: p,
        score: calculateAffinityScore(currentProduct, p),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map((item) => item.product);
  }, [currentProduct, catalogo]);

  if (isLoading || related.length === 0) return null;

  // Título contextual según el producto
  const targetName = (currentProduct.nombre_producto || "").toLowerCase();
  const isParrilla = PARRILLA_KEYWORDS.some((kw) => targetName.includes(kw));

  return (
    <section className="w-full mt-14 pt-10 border-t border-neutral-200/80 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2 text-main-blue text-xs font-black uppercase tracking-wider mb-1">
            {isParrilla ? (
              <>
                <Flame className="size-4 text-main-red" />
                <span>Recomendados para tu Parrilla</span>
              </>
            ) : (
              <>
                <ChefHat className="size-4 text-main-blue" />
                <span>Cortes y Productos Sugeridos</span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            También te puede interesar
          </h2>
        </div>
        <p className="text-xs text-neutral-500 font-medium hidden sm:block">
          Selección ideal para acompañar tu compra
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {related.map((prod) => (
          <div
            key={prod.id}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}
