import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Truck,
  Store,
  ShieldCheck,
  CreditCard,
  Banknote,
  Sparkles,
} from "lucide-react";
import icons from "../assets/icons/icons";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-200/80 text-neutral-600">
      {/* ─── 1. Franja Superior de Beneficios / Compromiso ─── */}
      <div className="border-b border-neutral-100 bg-neutral-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 text-main-blue flex items-center justify-center shrink-0">
                <Truck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                  Envíos en 10 km
                </p>
                <p className="text-[11px] text-neutral-500">
                  Cadena de frío y empaque al vacío
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                  Retiro en Sucursal
                </p>
                <p className="text-[11px] text-neutral-500">
                  Listo para retirar sin filas ni esperas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                  Puntos & Descuentos
                </p>
                <p className="text-[11px] text-neutral-500">
                  Acumulá en cada compra o con referidos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                  Calidad de Mostrador
                </p>
                <p className="text-[11px] text-neutral-500">
                  Cortes seleccionados de novillo y ternera
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Cuerpo Principal del Footer ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Columna 1: Marca y Logo (El fondo blanco funde el círculo blanco del SVG de forma limpia) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <Link to="/" className="inline-block mb-3 group">
              <img
                src="/favicon.svg"
                alt="Abastecedora Valette"
                className="size-28 sm:size-32 aspect-square object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mb-4">
              Tradición, frescura y cortes seleccionados directamente desde nuestro mostrador a tu mesa. Envíos programados en el día o retiro express en sucursal.
            </p>

            {/* Redes Sociales */}
            <div className="flex items-center gap-3 mt-1">
              <a
                href="#"
                aria-label="Facebook de Abastecedora Valette"
                className="size-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <img src={icons.facebook} alt="Facebook" className="size-4.5" />
              </a>
              <a
                href="#"
                aria-label="Instagram de Abastecedora Valette"
                className="size-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <img src={icons.instagram} alt="Instagram" className="size-4.5" />
              </a>
              <a
                href="#"
                aria-label="TikTok de Abastecedora Valette"
                className="size-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              >
                <img src={icons.tiktok} alt="TikTok" className="size-4.5" />
              </a>
            </div>
          </div>

          {/* Columna 2: Categorías de Carnicería */}
          <div className="lg:col-span-2 sm:col-span-1">
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-3.5">
              Cortes & Productos
            </h3>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link to="/productos" className="hover:text-main-blue transition-colors">
                  Todos los Cortes
                </Link>
              </li>
              <li>
                <Link to="/vacuno" className="hover:text-main-blue transition-colors">
                  Carne Vacuna
                </Link>
              </li>
              <li>
                <Link to="/cerdo" className="hover:text-main-blue transition-colors">
                  Cortes de Cerdo
                </Link>
              </li>
              <li>
                <Link to="/pollo" className="hover:text-main-blue transition-colors">
                  Pollo & Granja
                </Link>
              </li>
              <li>
                <Link to="/embutidos" className="hover:text-main-blue transition-colors">
                  Embutidos & Achuras
                </Link>
              </li>
              <li>
                <Link to="/combos" className="hover:text-main-blue transition-colors">
                  Combos de Ahorro
                </Link>
              </li>
              <li>
                <Link to="/ofertas" className="hover:text-main-blue text-main-red font-bold transition-colors">
                  Ofertas Especiales
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información & Servicios */}
          <div className="lg:col-span-3 sm:col-span-1">
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-3.5">
              Información & Envíos
            </h3>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link to="/sucursales" className="hover:text-main-blue transition-colors flex items-center gap-1.5">
                  <Store className="size-3.5 text-main-blue" />
                  <span>Nuestras Sucursales</span>
                </Link>
              </li>
              <li>
                <Link to="/envios" className="hover:text-main-blue transition-colors flex items-center gap-1.5">
                  <Truck className="size-3.5 text-emerald-600" />
                  <span>Envíos & Cobertura 10 km</span>
                </Link>
              </li>
              <li>
                <Link to="/perfil" className="hover:text-main-blue transition-colors">
                  Mi Perfil & Compras
                </Link>
              </li>
              <li>
                <Link to="/perfil" className="hover:text-main-blue transition-colors">
                  Programa de Puntos Valette
                </Link>
              </li>
              <li>
                <Link to="/favoritos" className="hover:text-main-blue transition-colors">
                  Mis Favoritos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Sucursal & Horarios de Atención */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-3.5">
              Casa Central Luis Guillón
            </h3>
            <div className="flex flex-col gap-3 text-xs text-neutral-600">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-main-red shrink-0 mt-0.5" />
                <span>Av. Luciano Valette 3910, Luis Guillón, Buenos Aires</span>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="size-4 text-main-blue shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-800">
                    Lunes a Sábados: 07:00 a 15:00 hs
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Envíos y pedidos web hasta las 14:30 hs
                  </p>
                  <p className="text-[11px] text-neutral-400">Domingos: Cerrado</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Phone className="size-4 text-neutral-400 shrink-0" />
                <a
                  href="tel:1135534033"
                  className="font-bold text-neutral-800 hover:text-main-blue transition-colors"
                >
                  (011) 3553-4033
                </a>
              </div>

              <a
                href="https://wa.me/5491135534033?text=Hola%20Abastecedora%20Valette!%20Quería%20hacer%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs w-fit"
              >
                <MessageCircle className="size-3.5" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Barra Inferior Legal & Medios de Pago ─── */}
      <div className="border-t border-neutral-100 bg-neutral-50/80 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 text-center sm:text-left">
          <p>
            © 2026 <strong>Abastecedora Valette</strong> · Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-neutral-600">
              <Banknote className="size-3.5 text-emerald-600" />
              <span>Efectivo</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-neutral-600">
              <CreditCard className="size-3.5 text-main-blue" />
              <span>Débito / Crédito</span>
            </span>
            <span>•</span>
            <span className="font-semibold text-neutral-600">Transferencia / QR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
