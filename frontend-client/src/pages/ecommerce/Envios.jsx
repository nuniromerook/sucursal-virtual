// frontend-client/src/pages/ecommerce/Envios.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Package,
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Store,
} from "lucide-react";
import { useLocationCoverage } from "../../context/LocationContext";

export default function Envios() {
  const {
    coords,
    distanceKm,
    isInCoverage,
    detectLocation,
    isDetecting,
    detectError,
    RADIO_COBERTURA_KM,
    sucursalCentral,
  } = useLocationCoverage();

  return (
    <div className="w-full bg-neutral-50/60 min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {/* Breadcrumb */}
        <nav aria-label="Navegación secundaria" className="mb-4">
          <ol className="flex items-center flex-wrap gap-y-1 text-sm lg:text-base">
            <li className="flex items-center">
              <Link to="/" className="hover:text-main-blue transition-colors">
                Inicio
              </Link>
              <ChevronRight className="size-4 shrink-0 text-gray-400 mx-1" />
            </li>
            <li className="text-neutral-900 font-bold capitalize">Envíos & Logística</li>
          </ol>
        </nav>

        {/* Banner Header Estilo CategoryPage */}
        <div className="mb-8 rounded-2xl bg-white border border-neutral-200/80 p-5 sm:p-7 shadow-2xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-main-blue/10 text-main-blue text-xs font-black uppercase tracking-wider mb-2">
            <Truck className="size-3.5" />
            <span>Envíos a Domicilio</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight">
            Información de Envíos & Cobertura
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Llevamos los mejores cortes frescos y envasados al vacío directo a tu casa, manteniendo la cadena de frío y con entregas en franjas programadas.
          </p>
        </div>

        {/* Verificador de Cobertura Interactivo */}
        <div className="mb-8 bg-linear-to-br from-main-blue to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Compass className="size-4" />
              <span>Verificador de Cobertura en Vivo</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black mb-2">
              Radio de entrega de {RADIO_COBERTURA_KM} km desde Luis Guillón
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-6">
              Entregamos en Luis Guillón, Monte Grande, Llavallol, Adrogué, Temperley, Turdera, Ezeiza y alrededores. Tocá el botón para comprobar al instante si tu ubicación está dentro del área de entrega.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetecting}
                className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-main-blue font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Compass className={`size-4 ${isDetecting ? "animate-spin" : ""}`} />
                <span>{isDetecting ? "Comprobando..." : "Comprobar mi ubicación ahora"}</span>
              </button>

              {coords && (
                <div
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    isInCoverage
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-100"
                      : "bg-amber-500/20 border-amber-400 text-amber-100"
                  }`}
                >
                  {isInCoverage ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                      <span>
                        ¡Estás a {distanceKm} km! Tu domicilio está dentro del área de entrega.
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="size-4 text-amber-300 shrink-0" />
                      <span>
                        Estás a {distanceKm} km (fuera del radio de {RADIO_COBERTURA_KM} km). ¡Podés elegir Retiro en Sucursal!
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {detectError && (
              <p className="mt-3 text-xs text-red-200 font-semibold flex items-center gap-1.5">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{detectError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Pilares de Logística */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-2xs">
            <div className="size-11 rounded-xl bg-blue-50 border border-blue-200 text-main-blue flex items-center justify-center mb-4">
              <Clock className="size-5" />
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-1.5">
              Horarios de Envío
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Realizamos entregas de <strong>Lunes a Sábados de 07:00 a 14:30 hs</strong>. Podés elegir franjas horarias al programar tu compra en el checkout.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-2xs">
            <div className="size-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-1.5">
              Cadena de Frío Segura
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Los cortes se fraccionan en el momento del despacho y viajan en bolsas térmicas precintadas para conservar su máxima frescura y calidad original.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-2xs">
            <div className="size-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mb-4">
              <Store className="size-5" />
            </div>
            <h3 className="font-extrabold text-base text-neutral-900 mb-1.5">
              Retiro sin Costo en Sucursal
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Si estás fuera de la zona o preferís no esperar el envío, seleccioná <strong>Retiro en Sucursal</strong> en Luis Guillón y retirá tu paquete listo y pesado.
            </p>
          </div>
        </div>

        {/* Preguntas Frecuentes (FAQ) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="size-5 text-main-blue" />
            <h3 className="font-extrabold text-lg text-neutral-900">
              Preguntas Frecuentes sobre Envíos
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 text-xs sm:text-sm">
            <div className="py-4">
              <p className="font-bold text-neutral-900 mb-1">
                ¿Qué pasa si mi pedido se prepara después de las 14:30 hs?
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Nuestra carnicería abre de 07:00 a 15:00 hs, pero cerramos la toma de pedidos y envíos a las 14:30 hs para asegurar que el último pedido llegue a destino dentro del horario de atención. Cualquier pedido posterior se programa para la mañana del día siguiente.
              </p>
            </div>

            <div className="py-4">
              <p className="font-bold text-neutral-900 mb-1">
                ¿Cómo se calcula el peso real de los cortes?
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Al comprar ves un precio estimado por kilo. En mostrador, el cortador pesa con balanza digital calibrada. Vos pagás exactamente lo acordado en la orden al momento de la compra.
              </p>
            </div>

            <div className="py-4">
              <p className="font-bold text-neutral-900 mb-1">
                ¿Qué hago si vivo a más de 10 km de la sucursal?
              </p>
              <p className="text-neutral-600 leading-relaxed">
                Podés realizar tu pedido en la web eligiendo la opción de <strong>Retiro en Sucursal</strong> (Av. Luciano Valette 3910, Luis Guillón). Lo dejamos empaquetado y listo para que lo retires en pocos minutos.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-neutral-500">
              ¿Tenés dudas sobre tu zona o pedido?
            </span>
            <Link
              to="/sucursales"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-main-blue text-white text-xs font-bold hover:bg-main-blue/90 transition-colors shadow-2xs"
            >
              <span>Ver sucursal y mapa</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
