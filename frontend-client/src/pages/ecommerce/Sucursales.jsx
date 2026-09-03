// frontend-client/src/pages/ecommerce/Sucursales.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Store,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  Compass,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { VITE_API_URL } from "../../config/api";
import { useLocationCoverage } from "../../context/LocationContext";
import { calcularDistanciaKm } from "../../utils/geolocation";

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export default function Sucursales() {
  const { coords, detectLocation, isDetecting, detectError } = useLocationCoverage();
  const [sucursales, setSucursales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState("");

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/sucursales`);
        if (!res.ok) throw new Error("Error al obtener sucursales");
        const data = await res.json();
        setSucursales(data);
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
        setError("No pudimos cargar las sucursales. Intenta recargar la página.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSucursales();
  }, []);

  const handleDetectarUbicacion = async () => {
    setLocationSuccessMsg("");
    try {
      const loc = await detectLocation();
      if (loc) {
        setLocationSuccessMsg("¡Ubicación detectada con éxito! Te mostramos la distancia a cada sucursal.");
      }
    } catch {
      // Manejado en detectError
    }
  };

  const obtenerEstadoAtencion = (horarios) => {
    if (!horarios) return { abierto: false, texto: "Horarios no especificados", color: "text-neutral-500 bg-neutral-100 border-neutral-200" };

    const ahora = new Date();
    const diaHoy = DIAS_SEMANA[ahora.getDay()];
    const horarioHoy = horarios[diaHoy];

    if (!horarioHoy || !horarioHoy.abierto) {
      return { abierto: false, texto: "Cerrado hoy", color: "text-neutral-500 bg-neutral-100 border-neutral-200" };
    }

    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const [hAp, mAp] = (horarioHoy.apertura || "07:00").split(":").map(Number);
    const [hCi, mCi] = (horarioHoy.cierre || "14:30").split(":").map(Number);
    const minApertura = hAp * 60 + mAp;
    const minCierre = hCi * 60 + mCi;

    if (horaActual >= minApertura && horaActual < minCierre) {
      return {
        abierto: true,
        texto: `Abierto ahora · Cierra a las ${horarioHoy.cierre} hs`,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    } else if (horaActual < minApertura) {
      return {
        abierto: false,
        texto: `Cerrado · Abre a las ${horarioHoy.apertura} hs`,
        color: "text-amber-800 bg-amber-50 border-amber-200",
      };
    } else {
      return {
        abierto: false,
        texto: `Cerrado · Abrió hasta las ${horarioHoy.cierre} hs`,
        color: "text-neutral-600 bg-neutral-100 border-neutral-200",
      };
    }
  };

  const sucursalesConDistancia = useMemo(() => {
    return sucursales.map((s) => {
      const dist = coords && s.latitud && s.longitud
        ? calcularDistanciaKm(coords.lat, coords.lng, s.latitud, s.longitud)
        : null;
      return { ...s, distanciaKm: dist };
    }).sort((a, b) => {
      if (a.distanciaKm !== null && b.distanciaKm !== null) return a.distanciaKm - b.distanciaKm;
      return 0;
    });
  }, [sucursales, coords]);

  const diaActualIndex = new Date().getDay();
  const nombreDiaActual = DIAS_SEMANA[diaActualIndex];

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
            <li className="text-neutral-900 font-bold capitalize">Sucursales</li>
          </ol>
        </nav>

        {/* Banner Header Estilo CategoryPage */}
        <div className="mb-6 rounded-2xl bg-white border border-neutral-200/80 p-5 sm:p-7 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-main-blue/10 text-main-blue text-xs font-black uppercase tracking-wider mb-2">
                <Store className="size-3.5" />
                <span>Puntos de Venta</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight">
                Nuestras Sucursales
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
                Conocé nuestras carnicerías, visitá el mostrador tradicional, consultá los horarios de atención en vivo o pedí online para retirar sin demoras.
              </p>
            </div>

            {/* Botón Detectar Sucursal más Cercana */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
              <button
                type="button"
                onClick={handleDetectarUbicacion}
                disabled={isDetecting}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-main-blue hover:bg-main-blue/90 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Compass className={`size-4 ${isDetecting ? "animate-spin" : ""}`} />
                <span>
                  {isDetecting ? "Detectando ubicación..." : "Detectar sucursal más cercana"}
                </span>
              </button>

              {coords && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="size-3" />
                  <span>Ubicación activa</span>
                </span>
              )}
            </div>
          </div>

          {detectError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{detectError}</span>
            </div>
          )}

          {locationSuccessMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{locationSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Grid de Sucursales */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white border border-neutral-200/80 rounded-2xl h-80 w-full"
              />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-8 text-center border border-red-200/80 shadow-2xs max-w-md mx-auto">
            <p className="text-sm font-bold text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-main-blue text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sucursalesConDistancia.map((sucursal) => {
              const estadoAtencion = obtenerEstadoAtencion(sucursal.horarios_apertura);
              const lat = sucursal.latitud || -34.7926481;
              const lng = sucursal.longitud || -58.4569658;
              const telefonoLimpio = sucursal.telefono || "1135534033";
              const whatsappLink = `https://wa.me/549${telefonoLimpio}?text=${encodeURIComponent(
                `¡Hola Abastecedora Valette! Quería hacer una consulta sobre la sucursal ${sucursal.nombre}.`
              )}`;
              const googleMapsRouteLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

              return (
                <div
                  key={sucursal.id}
                  className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden hover:shadow-xs transition-all"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Información */}
                    <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between">
                      <div>
                        {/* Cabecera */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                              Sucursal {sucursal.nombre}
                            </h2>
                            {sucursal.id === 1 && (
                              <span className="bg-main-blue/10 text-main-blue font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                                Casa Central
                              </span>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estadoAtencion.color}`}
                          >
                            <span
                              className={`size-2 rounded-full ${
                                estadoAtencion.abierto
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-neutral-400"
                              }`}
                            />
                            <span>{estadoAtencion.texto}</span>
                          </span>
                        </div>

                        {sucursal.distanciaKm !== null && (
                          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-main-blue text-xs font-bold">
                            <Sparkles className="size-3.5" />
                            <span>A solo {sucursal.distanciaKm} km de tu ubicación</span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-neutral-600 mb-6">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="size-4.5 text-main-red shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-neutral-900">
                                {sucursal.direccion}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {sucursal.ciudad || "Provincia de Buenos Aires"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <Phone className="size-4 text-neutral-400 shrink-0" />
                            <a
                              href={`tel:${telefonoLimpio}`}
                              className="font-medium text-neutral-700 hover:text-main-blue transition-colors"
                            >
                              {telefonoLimpio}
                            </a>
                          </div>
                        </div>

                        {/* Horarios Detallados */}
                        <div className="border border-neutral-100 bg-neutral-50/70 rounded-xl p-3.5 mb-6">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 mb-2.5">
                            <Clock className="size-3.5 text-main-blue" />
                            <span>Horarios de atención de mostrador</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                            {sucursal.horarios_apertura ? (
                              Object.entries(sucursal.horarios_apertura).map(([dia, h]) => {
                                const esHoy = dia.toLowerCase() === nombreDiaActual;
                                return (
                                  <div
                                    key={dia}
                                    className={`flex items-center justify-between py-1 px-2 rounded ${
                                      esHoy
                                        ? "bg-white font-extrabold text-main-blue border border-main-blue/20 shadow-2xs"
                                        : "text-neutral-600"
                                    }`}
                                  >
                                    <span className="capitalize">{dia}:</span>
                                    <span>
                                      {h.abierto
                                        ? `${h.apertura || "07:00"} a ${h.cierre || "14:30"} hs`
                                        : "Cerrado"}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-xs text-neutral-500">
                                Lunes a Sábados de 07:00 a 14:30 hs. Domingos cerrado.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-neutral-100">
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                        >
                          <MessageCircle className="size-4" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={googleMapsRouteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                        >
                          <Navigation className="size-4" />
                          <span>Cómo llegar</span>
                        </a>

                        <a
                          href={`tel:${telefonoLimpio}`}
                          className="px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-main-blue hover:text-main-blue text-neutral-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Phone className="size-3.5" />
                          <span>Llamar</span>
                        </a>
                      </div>
                    </div>

                    {/* Mapa Iframe */}
                    <div className="lg:col-span-5 h-64 sm:h-80 lg:h-auto min-h-[260px] bg-neutral-100 border-t lg:border-t-0 lg:border-l border-neutral-200/80 relative">
                      <iframe
                        title={`Mapa de sucursal ${sucursal.nombre}`}
                        src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                        className="w-full h-full border-0 absolute inset-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
