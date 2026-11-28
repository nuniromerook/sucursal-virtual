// admin/src/pages/ContenidoInicioPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutTemplate,
  Save,
  RefreshCw,
  Clock,
  Sparkles,
  Megaphone,
  Eye,
  X,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";

const DEFAULT_HOME_CONFIG = {
  saludo_dinamico: true,
  saludo_manana: "Buen día",
  saludo_tarde: "Buenas tardes",
  saludo_noche: "Buenas noches",
  saludo_fijo: "Hola",
  mensaje_abierto_semana: "Qué vas a pedir hoy?",
  mensaje_abierto_finde: "Qué vas a pedir hoy?",
  mensaje_cerrado_hoy:
    "Todavía no abrimos, pero ya podés dejar tu pedido para hoy.",
  mensaje_cerrado_manana:
    "Ahora estamos cerrados, pero podés dejar tu pedido para mañana.",
  mensaje_manual_activo: false,
  mensaje_manual: "",
  mensaje_manual_expira: null,
  mensaje_manual_sobre_cerrado: false,
};

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(val) {
  if (!val || !val.trim()) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function getPreviewGreeting(form, slot, withUser) {
  let base = form.saludo_fijo || "Hola";
  if (form.saludo_dinamico) {
    if (slot === "manana") base = form.saludo_manana || "Buen día";
    else if (slot === "tarde") base = form.saludo_tarde || "Buenas tardes";
    else base = form.saludo_noche || "Buenas noches";
  }
  const clean = base.replace(/[!¡]+$/g, "").trim() || "Hola";
  return withUser ? `${clean}, Sofía!` : `${clean}!`;
}

function getPreviewSubtitle(form, statusMode, nowMs) {
  const expiraMs = form.mensaje_manual_expira
    ? new Date(form.mensaje_manual_expira).getTime()
    : null;
  const isManualValid =
    form.mensaje_manual_activo &&
    Boolean(form.mensaje_manual?.trim()) &&
    (!expiraMs || Number.isNaN(expiraMs) || expiraMs > nowMs);

  if (statusMode === "abierto_semana") {
    return isManualValid
      ? form.mensaje_manual.trim()
      : form.mensaje_abierto_semana || "Qué vas a pedir hoy?";
  }
  if (statusMode === "abierto_finde") {
    return isManualValid
      ? form.mensaje_manual.trim()
      : form.mensaje_abierto_finde || "Qué vas a pedir hoy?";
  }
  if (statusMode === "cerrado_hoy") {
    if (isManualValid && form.mensaje_manual_sobre_cerrado) {
      return form.mensaje_manual.trim();
    }
    return (
      form.mensaje_cerrado_hoy ||
      "Todavía no abrimos, pero ya podés dejar tu pedido para hoy."
    );
  }
  if (isManualValid && form.mensaje_manual_sobre_cerrado) {
    return form.mensaje_manual.trim();
  }
  return (
    form.mensaje_cerrado_manana ||
    "Ahora estamos cerrados, pero podés dejar tu pedido para mañana."
  );
}

export default function ContenidoInicioPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [form, setForm] = useState(DEFAULT_HOME_CONFIG);
  const [expiraInput, setExpiraInput] = useState("");

  // Controles de vista previa en vivo
  const [previewSlot, setPreviewSlot] = useState("manana");
  const [previewMode, setPreviewMode] = useState("abierto_semana");
  const [previewLoggedIn, setPreviewLoggedIn] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const hydrate = useCallback((data) => {
    const val =
      data && typeof data.valor === "object" && data.valor !== null
        ? { ...DEFAULT_HOME_CONFIG, ...data.valor }
        : DEFAULT_HOME_CONFIG;
    setForm(val);
    setExpiraInput(isoToDatetimeLocal(val.mensaje_manual_expira));
    setUpdatedAt(data?.updated_at || null);
  }, []);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${VITE_API_URL}/configuracion/home`);
      if (!res.ok) throw new Error("No se pudo cargar la configuración");
      const data = await res.json();
      hydrate(data);
    } catch {
      showToast("Error al cargar el contenido de inicio", "error");
    } finally {
      setIsLoading(false);
    }
  }, [hydrate, showToast]);

  useEffect(() => {
    let mounted = true;
    fetch(`${VITE_API_URL}/configuracion/home`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data) hydrate(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [hydrate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        mensaje_manual_expira: datetimeLocalToIso(expiraInput),
      };
      const res = await fetch(`${VITE_API_URL}/configuracion/home`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ valor: payload }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo guardar la configuración");
      }

      const saved = await res.json();
      hydrate(saved);
      showToast("Contenido de inicio guardado y sincronizado en la tienda", "success");
    } catch (err) {
      showToast(err.message || "Error al guardar los cambios", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const previewTitle = useMemo(
    () => getPreviewGreeting(form, previewSlot, previewLoggedIn),
    [form, previewSlot, previewLoggedIn],
  );

  const previewSubtitle = useMemo(
    () =>
      getPreviewSubtitle(
        {
          ...form,
          mensaje_manual_expira: datetimeLocalToIso(expiraInput),
        },
        previewMode,
        nowMs,
      ),
    [form, expiraInput, previewMode, nowMs],
  );

  const manualExpired = useMemo(() => {
    const iso = datetimeLocalToIso(expiraInput);
    if (!iso) return false;
    return new Date(iso).getTime() <= nowMs;
  }, [expiraInput, nowMs]);

  return (
    <div className="space-y-4">
      {/* Encabezado compacto Valette OS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Contenido / Inicio
          </h1>
          <p className="text-xs text-slate-500">
            Editá el saludo y los mensajes dinámicos de la portada según horario, día y apertura del local.
            {updatedAt
              ? ` · Actualizado ${new Date(updatedAt).toLocaleString("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadConfig}
            disabled={isLoading}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors disabled:opacity-60"
            title="Recargar configuración"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            type="submit"
            form="contenido-inicio-form"
            disabled={isSaving}
            className="px-3.5 py-2 rounded-lg bg-[#002244] hover:bg-[#1e3b6c] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Guardando..." : "Guardar cambios"}</span>
          </button>
        </div>
      </div>

      {/* Selector de sección (escalable a futuros bloques) */}
      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
        <span className="px-3 py-1 rounded-md bg-[#002244] text-white text-[11px] font-bold inline-flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5" />
          Saludo y Portada
        </span>
      </div>

      {/* Vista previa en vivo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-[#c53030]" />
            <span>Vista previa en la tienda</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "manana", label: "Mañana" },
              { id: "tarde", label: "Tarde" },
              { id: "noche", label: "Noche" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPreviewSlot(s.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  previewSlot === s.id
                    ? "bg-[#002244] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}

            <span className="w-px h-4 bg-slate-200 mx-0.5" />

            {[
              { id: "abierto_semana", label: "Abierto (sem.)" },
              { id: "abierto_finde", label: "Abierto (finde)" },
              { id: "cerrado_hoy", label: "Antes de abrir" },
              { id: "cerrado_manana", label: "Cerrado" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPreviewMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  previewMode === m.id
                    ? "bg-[#c53030] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPreviewLoggedIn((v) => !v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                previewLoggedIn
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {previewLoggedIn ? "Con sesión (Sofía)" : "Sin sesión"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F6F8FA] border border-slate-200/80 px-5 py-4">
          <p className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            {previewTitle}
          </p>
          <p className="text-sm font-medium text-slate-600 mt-1">
            {previewSubtitle}
          </p>
        </div>
      </div>

      {/* Formulario principal */}
      <form
        id="contenido-inicio-form"
        onSubmit={handleSave}
        className="space-y-5"
      >
        {/* 1. Saludo principal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#002244]" />
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Saludo principal
                </h2>
                <p className="text-xs text-slate-500">
                  Si la persona inició sesión se suma su nombre (ej. &quot;Buen día, Sofía!&quot;). Sin sesión queda neutro.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.saludo_dinamico}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    saludo_dinamico: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[#c53030] rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                Saludo dinámico por horario
              </span>
            </label>
          </div>

          {form.saludo_dinamico ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Mañana (05:00 a 12:59)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={form.saludo_manana}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      saludo_manana: e.target.value,
                    }))
                  }
                  placeholder="Buen día"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tarde (13:00 a 19:59)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={form.saludo_tarde}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      saludo_tarde: e.target.value,
                    }))
                  }
                  placeholder="Buenas tardes"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Noche (20:00 a 04:59)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={form.saludo_noche}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      saludo_noche: e.target.value,
                    }))
                  }
                  placeholder="Buenas noches"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-sm">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Saludo fijo
              </label>
              <input
                type="text"
                maxLength={60}
                value={form.saludo_fijo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, saludo_fijo: e.target.value }))
                }
                placeholder="Hola"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>
          )}
        </div>

        {/* 2. Mensaje destacado manual (override del día) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#c53030]" />
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Mensaje destacado del día (opcional)
                </h2>
                <p className="text-xs text-slate-500">
                  Activá un texto puntual para hoy (ej. feriado, día de lluvia o mercadería recién bajada) sin perder tus textos base.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.mensaje_manual_activo}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_manual_activo: e.target.checked,
                  }))
                }
                className="w-4 h-4 accent-[#c53030] rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                Activar mensaje manual
              </span>
            </label>
          </div>

          <div
            className={`space-y-3 transition-opacity ${
              form.mensaje_manual_activo ? "opacity-100" : "opacity-60"
            }`}
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Texto del mensaje
              </label>
              <input
                type="text"
                maxLength={180}
                value={form.mensaje_manual}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_manual: e.target.value,
                  }))
                }
                placeholder="Ej: Hoy feriado trabajamos hasta las 13hs. Dejá tu pedido!"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Vence automáticamente (opcional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    value={expiraInput}
                    onChange={(e) => setExpiraInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
                  />
                  {expiraInput && (
                    <button
                      type="button"
                      onClick={() => setExpiraInput("")}
                      aria-label="Quitar vencimiento"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {manualExpired && form.mensaje_manual_activo && (
                  <p className="text-[11px] font-semibold text-amber-600 mt-1">
                    Esta fecha ya pasó: la tienda va a mostrar el mensaje automático hasta que actualices o quites el vencimiento.
                  </p>
                )}
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none py-2">
                <input
                  type="checkbox"
                  checked={form.mensaje_manual_sobre_cerrado}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      mensaje_manual_sobre_cerrado: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-[#c53030] rounded cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Mostrar también cuando el local esté cerrado
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Mensajes automáticos según apertura y día */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#002244]" />
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Mensajes automáticos según horario y estado del local
              </h2>
              <p className="text-xs text-slate-500">
                Se sincronizan en vivo con los horarios configurados en Sucursal &amp; Horarios (hora Argentina).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Local abierto — Lunes a viernes
              </label>
              <input
                type="text"
                maxLength={160}
                value={form.mensaje_abierto_semana}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_abierto_semana: e.target.value,
                  }))
                }
                placeholder="Qué vas a pedir hoy?"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Local abierto — Sábados y domingos
              </label>
              <input
                type="text"
                maxLength={160}
                value={form.mensaje_abierto_finde}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_abierto_finde: e.target.value,
                  }))
                }
                placeholder="Qué vas a pedir hoy?"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Local cerrado — Todavía no abrimos hoy (madrugada)
              </label>
              <input
                type="text"
                maxLength={160}
                value={form.mensaje_cerrado_hoy}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_cerrado_hoy: e.target.value,
                  }))
                }
                placeholder="Todavía no abrimos, pero ya podés dejar tu pedido para hoy."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Local cerrado — Después del cierre (para mañana)
              </label>
              <input
                type="text"
                maxLength={160}
                value={form.mensaje_cerrado_manana}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mensaje_cerrado_manana: e.target.value,
                  }))
                }
                placeholder="Ahora estamos cerrados, pero podés dejar tu pedido para mañana."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
