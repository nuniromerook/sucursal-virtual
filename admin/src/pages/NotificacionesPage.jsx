// admin/src/pages/NotificacionesPage.jsx
import { useState, useEffect, useCallback } from "react";
import { BellRing, Send, RefreshCw, Flame, Sparkles, Megaphone, Clock } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/formatters";

export default function NotificacionesPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    mensaje: "",
    tipo: "promo",
    enlace: "/#seccion-combos",
  });

  const fetchNotifs = useCallback(async () => {
    const res = await fetch(`${VITE_API_URL}/notificaciones`, {
      headers: authHeaders,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.notificaciones) ? data.notificaciones : [];
  }, [authHeaders]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const list = await fetchNotifs();
      setHistory(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchNotifs()
      .then((list) => {
        if (isMounted) setHistory(list);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchNotifs]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.mensaje.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`${VITE_API_URL}/notificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          titulo: form.titulo.trim(),
          mensaje: form.mensaje.trim(),
          tipo: form.tipo,
          icono: form.tipo === "puntos" ? "sparkles" : form.tipo === "promo" ? "flame" : "bell",
          enlace: form.enlace,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al emitir aviso.");

      showToast("¡Aviso difundido en vivo por WebSocket y Web Push (VAPID)!");
      setForm({
        titulo: "",
        mensaje: "",
        tipo: "promo",
        enlace: "/#seccion-combos",
      });
      await loadHistory();
    } catch (err) {
      showToast(err.message || "Error al enviar notificación.", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Difusión Push & Avisos a Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enviá alertas de ofertas relámpago, reposición de cortes o novedades del
            Club Valette en tiempo real y por Web Push al celular.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          disabled={isLoading}
          className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs self-start sm:self-auto"
          title="Actualizar historial"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulario Compositor */}
        <form
          onSubmit={handleSend}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BellRing className="w-4 h-4 text-[#c53030]" />
            <h2 className="font-black text-slate-900 text-sm">
              Nuevo Aviso Masivo (Broadcast Global)
            </h2>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Título de la Notificación *
            </label>
            <input
              type="text"
              required
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="ej: 🔥 ¡Llegó Asado de Centro Fresco para el finde!"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Mensaje Detallado *
            </label>
            <textarea
              rows={3}
              required
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              placeholder="ej: Llevando 3 kg o más accedés al precio promocional mayorista hasta agotar stock."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tipo de Aviso
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
              >
                <option value="promo">Oferta / Promoción</option>
                <option value="puntos">Club Valette / Sorteo</option>
                <option value="sistema">Aviso de Sucursal / Horarios</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Sección de Destino al Tocar
              </label>
              <select
                value={form.enlace}
                onChange={(e) => setForm({ ...form, enlace: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
              >
                <option value="/#seccion-combos">Combos Esenciales</option>
                <option value="/#seccion-asado">Sector Asado</option>
                <option value="/#seccion-vacuno">Carne Vacuna</option>
                <option value="/#seccion-cerdo">Cerdo</option>
                <option value="/#seccion-pollo">Pollo & Granja</option>
                <option value="/#seccion-preparados">Preparados Caseros</option>
                <option value="/perfil?tab=puntos">Club Valette (Premios)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3 rounded-xl bg-[#c53030] hover:bg-[#a82525] text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending ? "Enviando difusión..." : "Enviar Push & Aviso en Vivo"}
            </span>
          </button>
        </form>

        {/* Historial reciente */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="font-black text-slate-900 text-sm">
              Últimos Avisos Globales Emitidos ({history.length})
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Todavía no se emitieron difusiones masivas.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {history.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                >
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.tipo === "puntos"
                        ? "bg-amber-100 text-amber-800"
                        : n.tipo === "promo"
                          ? "bg-red-100 text-[#c53030]"
                          : "bg-blue-100 text-[#002244]"
                    }`}
                  >
                    {n.tipo === "puntos" ? (
                      <Sparkles className="w-4 h-4" />
                    ) : n.tipo === "promo" ? (
                      <Flame className="w-4 h-4" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 truncate">
                        {n.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {n.creada_en ? formatDate(n.creada_en) : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {n.mensaje}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
