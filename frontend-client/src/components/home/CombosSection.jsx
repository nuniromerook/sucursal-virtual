// src/components/home/CombosSection.jsx
import React, { useState, useRef, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import {
  Scale,
  ShoppingCart,
  Sparkles,
  Eye,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { ComboDetailModal } from "@/components/modals/ComboDetailModal";

export const COMBOS = [
  {
    id: 101,
    nombre: "Combo Asado Parrillero Tradición (5 kg)",
    slug: "combo-asado-parrillero",
    badge: "🔥 Parrilla Tradición",
    tagColor: "bg-red-50 text-[#c53030] border-red-200/80",
    kilos: 5,
    rinde: "6 a 8 personas",
    ahorro: 5900,
    puntos: 50,
    precio: 45900,
    precioAnterior: 51800,
    descripcion:
      "La selección parrillera definitiva con novillito seleccionado, cerdo crocante y chorizo puro cerdo. Todo lo indispensable para lucirse frente a las brasas.",
    items: [
      {
        nombre: "Asado Criollo de Centro",
        peso: "2 kg",
        descripcion:
          "Costillar de novillito con hueso plano y veteado parejo. Clásico para hacer a la cruz o sobre brasas lentas.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526423/uyz2flzrr4d0g97jveqn.avif",
      },
      {
        nombre: "Pechito de Cerdo con Manta",
        peso: "2 kg",
        descripcion:
          "Costillar porcino con abundante manta de carne y hueso fino. Dorado parejo y textura crocante al fuego.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788424319/e94tqmvv5ouclrbwh6vr.jpg",
      },
      {
        nombre: "Chorizo Artesanal Puro Cerdo",
        peso: "1 kg (6 u.)",
        descripcion:
          "Embutido parrillero fresco elaborado con receta tradicional en tripa natural. Jugoso y especiado en su punto exacto.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422712/cmtm6r0ahmlpfni0hp2t.jpg",
      },
    ],
  },
  {
    id: 102,
    nombre: "Combo Familiar Semanal (6 kg)",
    slug: "combo-familiar-semanal",
    badge: "📦 Rinde 20+ Comidas",
    tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    kilos: 6,
    rinde: "Almuerzos y cenas de la semana",
    ahorro: 6700,
    puntos: 60,
    precio: 52900,
    precioAnterior: 59600,
    descripcion:
      "Paquete completo y versátil para resolver las comidas cotidianas con proteínas magras y cortes rendidores: supremas frescas, roast beef y hamburguesas caseras de pollo.",
    items: [
      {
        nombre: "Supremas de Pollo Desgrasadas",
        peso: "2 kg",
        descripcion:
          "Pechuga de pollo desgrasada y sin piel, 100% pulpa limpia. Proteína magra lista para la plancha o rebozar.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788423106/g5fm0mszttcxua4lohoh.jpg",
      },
      {
        nombre: "Roast Beef Seleccionado",
        peso: "2 kg",
        descripcion:
          "Corte vacuno sabroso con vetas de colágeno que funden en guisos, empanadas al cuchillo o estofados.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422116/jlpysradtx1tkv5ulvi1.png",
      },
      {
        nombre: "Hamburguesas Caseras de Pollo",
        peso: "2 kg",
        descripcion:
          "Medallones caseros elaborados con pechuga de pollo magra y hierbas seleccionadas, listos para cocinar.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526554/vnyy97p93eg6hncyux34.jpg",
      },
    ],
  },
  {
    id: 103,
    nombre: "Combo Cortes Especiales & Cerdo (5 kg)",
    slug: "combo-cortes-especiales-cerdo",
    badge: "🥩 Selección Gourmet",
    tagColor: "bg-amber-50 text-amber-900 border-amber-200/80",
    kilos: 5,
    rinde: "6 a 8 personas",
    ahorro: 7000,
    puntos: 55,
    precio: 52500,
    precioAnterior: 59500,
    descripcion:
      "Cortes tiernos y selectos para los amantes del buen comer: bifes anchos con ojo de bife veteado, bondiola jugosa de cerdo y matambre vacuno tierno.",
    items: [
      {
        nombre: "Bife Ancho Seleccionado",
        peso: "2 kg",
        descripcion:
          "Corte vacuno con el clásico ojo central y veteado parrillero. Jugosidad intensa y sellado perfecto a la plancha o a las brasas.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526517/iuxf6wqw6cybgob7n4jf.jpg",
      },
      {
        nombre: "Bondiola Fresca de Cerdo",
        peso: "2 kg",
        descripcion:
          "Corte de cerdo premium con grasa intramuscular. Se dora crocante por fuera y queda tierna y jugosa al brasear o en bifes.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422423/nwcd2bvbh1gcfkbehsv5.webp",
      },
      {
        nombre: "Matambre Vacuno Tierno",
        peso: "1 kg",
        descripcion:
          "Corte delgado y tierno entre el cuero y el costillar. Clásico para tiernizar a la pizza, arrollar o hacer a la parrilla.",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526373/geg0ezk3acs5xrhd0jmf.webp",
      },
    ],
  },
];

export const CombosSection = ({ searchQuery = "" }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedCombo, setSelectedCombo] = useState(null);
  const scrollRef = useRef(null);

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return COMBOS;
    const q = searchQuery.toLowerCase().trim();
    return COMBOS.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.items.some((it) => it.nombre.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  if (filteredCombos.length === 0) return null;

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
    addToCart(
      {
        id: combo.id,
        nombre: combo.nombre,
        slug: combo.slug,
        precio: combo.precio,
        puntos: combo.puntos,
        imagen_url:
          combo.items[0]?.imagenUrl ||
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1791526423/uyz2flzrr4d0g97jveqn.avif",
      },
      1,
      {
        corte: "Combo preparado de cortes surtidos",
        envasado: "Envasado con cadena de frío",
        kilos: combo.kilos,
        items_combo: combo.items
          .map((i) => `${i.peso} de ${i.nombre}`)
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
            <span className="text-xl">📦</span>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Combos esenciales
            </h2>
            <span className="text-[11px] font-bold ml-auto lg:ml-0 text-[#c53030] bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full font-num whitespace-nowrap shadow-2xs">
              {filteredCombos.length} combos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Paquetes armados por nuestros carniceros con descuentos por volumen
            y más puntos.
          </p>
        </div>

        {/* Flechas de navegación en Desktop */}
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
      </div>

      {/* Contenedor con Scroll Horizontal de Tarjetas de Combos */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 px-4 sm:px-6 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 sm:scroll-pl-6 sm:scroll-pr-6"
      >
        {filteredCombos.map((combo) => {
          const totalCortes = combo.items.length;
          const extraCortes = Math.max(0, totalCortes - 2);

          return (
            <div
              key={combo.id}
              className="w-[85vw] sm:w-[350px] md:w-[360px] shrink-0 flex flex-col snap-start last:snap-end"
            >
              <div
                onClick={() => setSelectedCombo(combo)}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-native flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all group cursor-pointer h-full"
              >
                <div>
                  {/* 1. Tira de 3 Miniaturas de los Cortes del Combo */}
                  <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs mb-3.5">
                    {/* Badge flotante de Kilos Totales sobre las fotos */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1 font-num">
                        <Scale className="size-3" />
                        <span>{combo.kilos} kg en total</span>
                      </span>
                    </div>

                    {/* Badge flotante "Ver fotos" en esquina derecha */}
                    <div className="absolute top-2.5 right-2.5 z-10 hidden sm:flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[#003366] text-[10px] font-black uppercase tracking-tight shadow-xs flex items-center gap-1">
                        <Eye className="size-2.5" />
                        <span>Ver fotos</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 w-full aspect-16/7 divide-x divide-white/80">
                      {/* Miniatura 1 */}
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[0]?.imagenUrl}
                          alt={combo.items[0]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Miniatura 2 */}
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[1]?.imagenUrl}
                          alt={combo.items[1]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Miniatura 3 */}
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={combo.items[2]?.imagenUrl}
                          alt={combo.items[2]?.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {totalCortes > 3 && (
                          <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white transition-opacity group-hover:bg-slate-950/70 p-1 text-center">
                            <span className="text-base sm:text-lg font-black leading-none drop-shadow-sm font-num">
                              +{extraCortes}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-tight text-slate-200 mt-0.5">
                              cortes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Badges de Ahorro y Puntos */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${combo.tagColor}`}
                    >
                      {combo.badge}
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1 font-num">
                      <Sparkles className="size-2.5 text-amber-600" />+
                      {combo.puntos} pts Club
                    </span>
                  </div>

                  {/* 3. Título y Rinde */}
                  <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[#003366] transition-colors flex items-center justify-between">
                    <span>{combo.nombre}</span>
                    <ChevronRight className="size-4 text-slate-300 group-hover:text-[#003366] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Rinde estimado: {combo.rinde}
                  </p>

                  {/* 4. Desglose Escaneable de Cortes Incluidos */}
                  <div className="my-3 space-y-1.5 w-full">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
                      <span>Incluye en el paquete:</span>
                      <span className="text-[#003366] font-black">
                        {totalCortes} variedades
                      </span>
                    </div>

                    <div className="space-y-1">
                      {combo.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200/70 group-hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="size-1.5 rounded-full bg-[#003366] shrink-0" />
                            <span className="font-semibold text-slate-800 truncate text-[11px] sm:text-xs">
                              {item.nombre}
                            </span>
                          </div>
                          <span className="font-black text-[#003366] text-[10px] sm:text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0 ml-2 shadow-2xs font-num">
                            {item.peso}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enlace sutil para abrir el modal */}
                  <div className="mb-1 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#003366] group-hover:underline">
                      <Eye className="size-3" />
                      <span>Ver fotos y detalle de cada corte</span>
                    </span>
                  </div>
                </div>

                {/* 5. Precios y Botón de Acción en la Base */}
                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900 font-num">
                        {formatPrecio(combo.precio)}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through font-num">
                        {formatPrecio(combo.precioAnterior)}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#c53030] block">
                      Ahorrás {formatPrecio(combo.ahorro)}
                    </span>
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
                </div>
              </div>
            </div>
          );
        })}
        {/* Spacer de cierre */}
        <div
          className="shrink-0 w-1 sm:w-3 select-none pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Modal / Bottom Sheet para Visualizar el Combo con foto de cada corte */}
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
