// admin/src/pages/AjustesSucursalPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Store, Clock, Save, RefreshCw } from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";

const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const DEFAULT_HORARIOS = {
  lunes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  martes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  miercoles: { abierto: true, apertura: "07:00", cierre: "15:00" },
  jueves: { abierto: true, apertura: "07:00", cierre: "15:00" },
  viernes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  sabado: { abierto: true, apertura: "07:00", cierre: "15:00" },
  domingo: { abierto: true, apertura: "08:00", cierre: "13:00" },
};

export default function AjustesSucursalPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: "Luis Guillón (Casa Central)",
    direccion: "Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires",
    ciudad: "Luis Guillón",
    telefono: "1135534033",
    horario_atencion:
      "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs",
    activa: true,
    horarios_apertura: DEFAULT_HORARIOS,
  });

  const fetchSucursalData = useCallback(async () => {
    const res = await fetch(`${VITE_API_URL}/sucursales`);
    if (!res.ok) return null;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.find((s) => Number(s.id) === 1) || list[0];
  }, []);

  const hydrateForm = (suc) => {
    if (!suc) return;
    setForm({
      nombre: suc.nombre || "Luis Guillón (Casa Central)",
      direccion: suc.direccion || "",
      ciudad: suc.ciudad || "Luis Guillón",
      telefono: suc.telefono || "",
      horario_atencion: suc.horario_atencion || "",
      activa: suc.activa !== false,
      horarios_apertura: {
        ...DEFAULT_HORARIOS,
        ...(suc.horarios_apertura && typeof suc.horarios_apertura === "object"
          ? suc.horarios_apertura
          : {}),
      },
    });
  };

  const loadSucursal = async () => {
    setIsLoading(true);
    try {
      const suc = await fetchSucursalData();
      hydrateForm(suc);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchSucursalData()
      .then((suc) => {
        if (isMounted && suc) hydrateForm(suc);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchSucursalData]);

  const updateDay = (dayKey, field, value) => {
    setForm((prev) => ({
      ...prev,
      horarios_apertura: {
        ...prev.horarios_apertura,
        [dayKey]: {
          ...prev.horarios_apertura[dayKey],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${VITE_API_URL}/sucursales/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar los ajustes.");
      showToast("Datos y horarios de sucursal actualizados en vivo.");
    } catch (err) {
      showToast(err.message || "Error al guardar ajustes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Sucursal y Horarios de Atención
          </h1>
          <p className="text-xs text-slate-500">
            Controlan en tiempo real el estado Abierto / Cerrado y los mensajes dinámicos del inicio (hora Argentina).
          </p>
        </div>

        <button
          type="button"
          onClick={loadSucursal}
          disabled={isLoading}
          className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer self-start sm:self-auto"
          title="Recargar datos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        {/* Datos Generales */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-native space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Store className="w-4 h-4 text-[#002244]" />
            <h2 className="font-black text-slate-900 text-sm">
              Información Casa Central
            </h2>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre Comercial de la Sucursal
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dirección Pública
            </label>
            <input
              type="text"
              required
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Localidad / Ciudad
              </label>
              <input
                type="text"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Teléfono / WhatsApp Mostrador
              </label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono outline-none focus:bg-white focus:border-[#002244]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Texto Resumen de Horarios (visible en ficha)
            </label>
            <input
              type="text"
              value={form.horario_atencion}
              onChange={(e) =>
                setForm({ ...form, horario_atencion: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
            />
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <span className="font-bold text-slate-900 block">
                Sucursal Abierta / Operativa
              </span>
              <span className="text-[11px] text-slate-500">
                Desactivalo solo si cerrás excepcionalmente (ej: feriado extraordinario)
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="size-4 rounded"
            />
          </label>
        </div>

        {/* Grilla semanal de Horarios */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-native space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-[#002244]" />
            <h2 className="font-bold text-slate-900 text-sm">
              Horarios por día (hora Argentina)
            </h2>
          </div>

          <div className="space-y-2">
            {DAYS.map(({ key, label }) => {
              const cfg = form.horarios_apertura[key] || {
                abierto: true,
                apertura: "07:00",
                cierre: "15:00",
              };
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <label className="flex items-center gap-2 font-bold text-slate-800 w-28 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(cfg.abierto)}
                      onChange={(e) => updateDay(key, "abierto", e.target.checked)}
                      className="rounded"
                    />
                    <span>{label}</span>
                  </label>

                  {cfg.abierto ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={cfg.apertura}
                        onChange={(e) => updateDay(key, "apertura", e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-800 outline-none"
                      />
                      <span className="text-slate-400 font-bold">a</span>
                      <input
                        type="time"
                        value={cfg.cierre}
                        onChange={(e) => updateDay(key, "cierre", e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-800 outline-none"
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-600 px-2">
                      Cerrado todo el día
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full mt-2 py-2.5 rounded-lg bg-[#002244] hover:bg-[#1e3b6c] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Guardando cambios..." : "Guardar ajustes de sucursal"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
