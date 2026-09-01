// frontend-admin/src/pages/sucursales/sucursal-data/NotificacionesSucursal.jsx
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bell,
  Send,
  Megaphone,
  Flame,
  Sparkles,
  AlertTriangle,
  Tag,
  Truck,
  Info,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import { VITE_API_URL } from "../../../config/api";

const ICONOS_DISPONIBLES = [
  { value: "bell", label: "Campana", icon: Bell },
  { value: "megaphone", label: "Megáfono", icon: Megaphone },
  { value: "flame", label: "Fuego / Oferta", icon: Flame },
  { value: "sparkles", label: "Puntos / Premio", icon: Sparkles },
  { value: "alert", label: "Alerta / Urgente", icon: AlertTriangle },
  { value: "tag", label: "Etiqueta", icon: Tag },
  { value: "truck", label: "Envíos", icon: Truck },
  { value: "info", label: "Información", icon: Info },
];

const TIPOS_NOTIFICACION = [
  { value: "sistema", label: "Aviso del Sistema / Institucional" },
  { value: "promocion", label: "Promoción & Oferta" },
  { value: "alerta", label: "Alerta Operativa" },
  { value: "puntos", label: "Beneficios & Puntos" },
];

export default function NotificacionesSucursal() {
  const { sucursal } = useOutletContext();

  const [notificaciones, setNotificaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    titulo: "",
    mensaje: "",
    tipo: "sistema",
    icono: "megaphone",
    enlace: "/ofertas",
    alcance: "broadcast", // 'broadcast' | 'sucursal'
  });

  const loadNotificaciones = async () => {
    if (!sucursal?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${VITE_API_URL}/notificaciones?sucursal_id=${sucursal.id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(
          Array.isArray(data.notificaciones) ? data.notificaciones : [],
        );
      }
    } catch (err) {
      console.error("Error al cargar historial de notificaciones:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotificaciones();
  }, [sucursal?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    setIsSending(true);

    try {
      const payload = {
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        tipo: form.tipo,
        icono: form.icono,
        enlace: form.enlace.trim(),
        sucursal_id: form.alcance === "sucursal" ? sucursal.id : null,
      };

      const res = await fetch(`${VITE_API_URL}/notificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al emitir notificación.");
      }

      setFeedback({
        type: "success",
        message: "¡Notificación emitida con éxito a los clientes en vivo!",
      });

      setForm({
        titulo: "",
        mensaje: "",
        tipo: "sistema",
        icono: "megaphone",
        enlace: "/ofertas",
        alcance: "broadcast",
      });

      loadNotificaciones();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "No se pudo emitir la notificación.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Encabezado del Módulo ─── */}
      <div className="bg-white rounded-lg p-5 border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-main-blue/10 flex items-center justify-center text-main-blue font-black shrink-0">
            <Bell className="size-5" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg text-neutral-900 tracking-tight">
              Gestión de Notificaciones & Anuncios
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Emití comunicados, avisos de stock y promociones en tiempo real a
              los clientes de {sucursal?.nombre}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Formulario de Creación (Columna Izquierda) ─── */}
        <div className="lg:col-span-5 bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="font-bold text-sm text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="size-4 text-main-blue" />
              <span>Emitir Nueva Notificación</span>
            </h2>
          </div>

          {feedback.message && (
            <div
              className={`p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alcance */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Destinatarios / Alcance
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, alcance: "broadcast" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    form.alcance === "broadcast"
                      ? "border-main-blue bg-blue-50 text-main-blue shadow-2xs"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  📢 Todos (Broadcast)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, alcance: "sucursal" })}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    form.alcance === "sucursal"
                      ? "border-main-blue bg-blue-50 text-main-blue shadow-2xs"
                      : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  🏪 Solo esta sucursal
                </button>
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Categoría del Anuncio
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-800 bg-white focus:outline-none focus:border-main-blue"
              >
                {TIPOS_NOTIFICACION.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ícono Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Ícono Visual
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ICONOS_DISPONIBLES.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = form.icono === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm({ ...form, icono: item.value })}
                      title={item.label}
                      className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "border-main-blue bg-main-blue text-white shadow-2xs"
                          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <IconComp className="size-4" />
                      <span className="text-[10px] truncate max-w-full font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Título del Anuncio
              </label>
              <input
                type="text"
                required
                placeholder="Ej. ¡Llegó asado fresco para el finde!"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-main-blue"
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Descripción / Contenido
              </label>
              <textarea
                rows={3}
                required
                placeholder="Ej. Aprovechá cortes seleccionados en oferta por tiempo limitado."
                value={form.mensaje}
                onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-main-blue resize-none"
              />
            </div>

            {/* Enlace de destino */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Enlace de Redirección (Al hacer clic)
              </label>
              <input
                type="text"
                placeholder="Ej. /vacuno o /ofertas"
                value={form.enlace}
                onChange={(e) => setForm({ ...form, enlace: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-main-blue"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 rounded-lg bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="size-3.5" />
              <span>
                {isSending
                  ? "Emitiendo en tiempo real..."
                  : "Emitir Notificación en Vivo"}
              </span>
            </button>
          </form>
        </div>

        {/* ─── Historial de Notificaciones (Columna Derecha) ─── */}
        <div className="lg:col-span-7 bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
              Historial de Avisos Emitidos ({notificaciones.length})
            </h2>
            <button
              type="button"
              onClick={loadNotificaciones}
              className="text-xs font-bold text-main-blue hover:underline cursor-pointer"
            >
              Actualizar
            </button>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-xs text-neutral-400 text-center py-10 animate-pulse">
                Cargando historial de notificaciones...
              </p>
            ) : notificaciones.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Bell className="size-10 mx-auto mb-2 stroke-1 opacity-50" />
                <p className="text-xs font-medium">
                  No se han emitido notificaciones aún.
                </p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id} className="py-3.5 flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-700 mt-0.5">
                    <Megaphone className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">
                        {n.titulo}
                      </h4>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {new Date(n.creada_en).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-neutral-500">
                      <span className="bg-neutral-100 px-2 py-0.5 rounded font-bold capitalize">
                        {n.tipo}
                      </span>
                      {n.enlace && (
                        <span className="text-main-blue font-bold flex items-center gap-0.5">
                          Destino: {n.enlace}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
