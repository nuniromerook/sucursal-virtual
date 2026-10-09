// src/components/home/CombosSection.jsx
import React from "react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrecio } from "@/utils/formatters";
import { Scale, ShoppingCart, Sparkles, Flame, Check } from "lucide-react";

const COMBOS = [
  {
    id: 101,
    nombre: "Combo Asado Familiar (5 kg)",
    slug: "combo-asado-familiar",
    badge: "🔥 Especial Parrilla",
    tagColor: "bg-red-50 text-[#c53030] border-red-200/80",
    kilos: 5,
    rinde: "6 a 8 personas",
    ahorro: 5200,
    puntos: 45,
    precio: 38900,
    precioAnterior: 44100,
    items: [
      {
        nombre: "Asado Criollo de Centro",
        peso: "2 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400",
      },
      {
        nombre: "Vacío Especial de Novillito",
        peso: "2 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400",
      },
      {
        nombre: "Chorizo Artesanal Puro Cerdo",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=400",
      },
    ],
  },
  {
    id: 102,
    nombre: "Combo Llená el Freezer Semanal (6 kg)",
    slug: "combo-llena-el-freezer",
    badge: "📦 Rinde 20+ Comidas",
    tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    kilos: 6,
    rinde: "Almuerzos y cenas de la semana",
    ahorro: 6800,
    puntos: 60,
    precio: 42500,
    precioAnterior: 49300,
    items: [
      {
        nombre: "Milanesas de Nalga Fileteadas",
        peso: "2 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=400",
      },
      {
        nombre: "Carne Picada Especial Magra",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=400",
      },
      {
        nombre: "Supremas de Pollo Desgrasadas",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=400",
      },
      {
        nombre: "Bife Ancho Seleccionado",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=400",
      },
      {
        nombre: "Hamburguesas Caseras de Pollo",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400",
      },
    ],
  },
  {
    id: 103,
    nombre: "Combo Mix Parrilla & Cerdo (5 kg)",
    slug: "combo-mix-parrilla-cerdo",
    badge: "🥩 Vacuno + Cerdo",
    tagColor: "bg-amber-50 text-amber-900 border-amber-200/80",
    kilos: 5,
    rinde: "5 a 7 personas",
    ahorro: 4500,
    puntos: 40,
    precio: 35900,
    precioAnterior: 40400,
    items: [
      {
        nombre: "Pechito de Cerdo con Manta",
        peso: "2 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400",
      },
      {
        nombre: "Bondiola Fresca de Cerdo",
        peso: "1 kg",
        imagenUrl:
          "https://res.cloudinary.com/ylrkjlsv/image/upload/f_auto,q_auto/v1788422423/nwcd2bvbh1gcfkbehsv5.webp",
      },
      {
        nombre: "Asado Criollo de Centro",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400",
      },
      {
        nombre: "Chorizo Artesanal Puro Cerdo",
        peso: "1 kg",
        imagenUrl:
          "https://images.unsplash.com/photo-1587593810167-a84920ea0781?q=80&w=400",
      },
    ],
  },
];

export const CombosSection = ({ onSelectCategory }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

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
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400",
      },
      1,
      {
        corte: "Combo preparado de cortes surtidos",
        envasado: "Envasado con cadena de frío",
        kilos: combo.kilos,
        items_combo: combo.items.map((i) => `${i.peso} de ${i.nombre}`).join(", "),
      }
    );
    showToast(`Sumaste ${combo.nombre} al pedido 🥩`);
  };

  return (
    <div className="mb-10">
      {/* Cabecera de Sección */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Combos de Frigorífico Ahorro
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Paquetes armados por nuestros carniceros con descuentos por volumen y más puntos.
          </p>
        </div>
      </div>

      {/* Grilla de Tarjetas de Combos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COMBOS.map((combo) => {
          const totalCortes = combo.items.length;
          const extraCortes = Math.max(0, totalCortes - 2);

          return (
            <div
              key={combo.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-native flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              <div>
                {/* 1. Tira de 3 Miniaturas de los Cortes del Combo */}
                <div className="relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-2xs mb-3.5">
                  {/* Badge flotante de Kilos Totales sobre las fotos */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-[10px] font-black uppercase tracking-wide shadow-xs flex items-center gap-1">
                      <Scale className="size-3" />
                      <span>{combo.kilos} kg en total</span>
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

                    {/* Miniatura 3 (con overlay indicador si hay más cortes) */}
                    <div className="relative h-full w-full overflow-hidden">
                      <img
                        src={combo.items[2]?.imagenUrl}
                        alt={combo.items[2]?.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {totalCortes > 3 && (
                        <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center text-white transition-opacity group-hover:bg-slate-950/70 p-1 text-center">
                          <span className="text-base sm:text-lg font-black leading-none drop-shadow-sm">
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
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${combo.tagColor}`}>
                    {combo.badge}
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="size-2.5 text-amber-600" />
                    +{combo.puntos} pts Club
                  </span>
                </div>

                {/* 3. Título y Rinde */}
                <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-[#003366] transition-colors">
                  {combo.nombre}
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
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
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
              </div>

              {/* 5. Precios y Botón de Acción en la Base */}
              <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-slate-900">
                      {formatPrecio(combo.precio)}
                    </span>
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatPrecio(combo.precioAnterior)}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-[#c53030] block">
                    Ahorrás {formatPrecio(combo.ahorro)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddCombo(combo)}
                  className="px-4 py-2.5 rounded-xl bg-[#003366] hover:bg-valette-dark text-white font-extrabold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-2xs cursor-pointer shrink-0"
                >
                  <ShoppingCart className="size-3.5" />
                  <span>Sumar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
