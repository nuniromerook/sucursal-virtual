// admin/src/pages/EquipoPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Edit2,
  Trash2,
  RefreshCw,
  Shield,
  Scissors,
  X,
  Check,
  Phone,
  Mail,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { id: "propietario", label: "Propietario", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "admin", label: "Administrador", cls: "bg-blue-100 text-[#002244] border-blue-200" },
  { id: "encargado", label: "Encargado de Mostrador", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "cortador", label: "Cortador (KDS & Stock)", cls: "bg-amber-100 text-amber-900 border-amber-200" },
];

const EMPTY_EMP = {
  id: null,
  nombre: "",
  apodo: "",
  rol: "cortador",
  email: "",
  password: "",
  telefono: "",
  activo: true,
};

export default function EquipoPage() {
  const { selectedSucursal, showToast } = useAdmin();
  const { authHeaders, user } = useAuth();
  const sucursalId = selectedSucursal?.id || 1;

  const [empleados, setEmpleados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EMP);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEquipo = useCallback(async () => {
    const res = await fetch(`${VITE_API_URL}/sucursales/${sucursalId}/empleados`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("No se pudo cargar el equipo.");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, [sucursalId, authHeaders]);

  const loadEquipo = async () => {
    setIsLoading(true);
    try {
      const list = await fetchEquipo();
      setEmpleados(list);
    } catch (err) {
      showToast(err.message || "Error al consultar empleados.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchEquipo()
      .then((list) => {
        if (isMounted) setEmpleados(list);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchEquipo]);

  const handleOpenNew = () => {
    setForm(EMPTY_EMP);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setForm({
      id: emp.id,
      nombre: emp.nombre || "",
      apodo: emp.apodo || "",
      rol: emp.rol || "cortador",
      email: emp.email || "",
      password: "",
      telefono: emp.telefono || "",
      activo: emp.activo !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    if (!form.id && !form.password.trim()) {
      showToast("Asigná una contraseña inicial para el nuevo miembro.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(form.id);
      const url = isEdit
        ? `${VITE_API_URL}/empleados/${form.id}`
        : `${VITE_API_URL}/sucursales/${sucursalId}/empleados`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        nombre: form.nombre.trim(),
        apodo: form.apodo.trim() || null,
        rol: form.rol,
        email: form.email.trim().toLowerCase() || null,
        telefono: form.telefono.trim() || null,
        activo: Boolean(form.activo),
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar empleado.");

      showToast(
        isEdit ? "Miembro del equipo actualizado." : "Nuevo miembro agregado al equipo."
      );
      setModalOpen(false);
      await loadEquipo();
    } catch (err) {
      showToast(err.message || "Error al guardar empleado.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (emp) => {
    if (Number(emp.id) === Number(user?.id)) {
      showToast("No podés eliminar tu propia cuenta activa.", "error");
      return;
    }
    if (!window.confirm(`Eliminar a "${emp.nombre}" del equipo?`)) return;
    try {
      const res = await fetch(`${VITE_API_URL}/empleados/${emp.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setEmpleados((prev) => prev.filter((item) => item.id !== emp.id));
      showToast("Empleado eliminado.");
    } catch {
      showToast("No se pudo eliminar el empleado.", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Equipo y Roles de Sucursal
          </h1>
          <p className="text-xs text-slate-500">
            Accesos por rol (Propietario, Admin, Encargado y Cortador) con privacidad de domicilios protegida.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadEquipo}
            disabled={isLoading}
            className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Recargar equipo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#002244] hover:bg-[#1e3b6c] text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Agregar miembro</span>
          </button>
        </div>
      </div>

      {/* Tabla ERP de Equipo */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-native overflow-hidden">
        {empleados.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No hay miembros cargados en el equipo.
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="equipo-table-caption"
            className="erp-table-wrapper"
          >
            <table className="erp-table min-w-[740px]">
              <caption id="equipo-table-caption" className="sr-only-live">
                Listado de empleados y roles
              </caption>
              <thead>
                <tr>
                  <th scope="col">Miembro</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Contacto</th>
                  <th scope="col">Actividad / Estado</th>
                  <th scope="col" className="text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp) => {
                  const roleMeta =
                    ROLE_OPTIONS.find((r) => r.id === emp.rol) || ROLE_OPTIONS[3];
                  const isMe = Number(emp.id) === Number(user?.id);

                  return (
                    <tr
                      key={emp.id}
                      className={emp.activo === false ? "opacity-60" : ""}
                    >
                      <th scope="row" className="whitespace-nowrap">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{emp.nombre}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                              Vos
                            </span>
                          )}
                        </div>
                        {emp.apodo && (
                          <div className="text-[11px] font-normal text-slate-400">
                            Apodo KDS: {emp.apodo}
                          </div>
                        )}
                      </th>
                      <td className="whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${roleMeta.cls}`}
                        >
                          {emp.rol}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{emp.email || "—"}</span>
                        </div>
                        {emp.telefono && (
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{emp.telefono}</span>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5">
                          {emp.rol === "cortador" ? (
                            <>
                              <Scissors className="w-3.5 h-3.5 text-amber-600" />
                              <span className="tabular-nums">
                                {emp.pedidos_hoy || 0} cortes hoy
                              </span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3.5 h-3.5 text-[#002244]" />
                              <span>
                                {emp.activo ? "Acceso activo" : "Desactivado"}
                              </span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => handleDelete(emp)}
                              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-[#c53030] cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Alta/Edición */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
          onClick={() => !isSaving && setModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                {form.id ? "Editar Miembro" : "Nuevo Miembro del Equipo"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="ej: Martín Gómez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Apodo (KDS)
                  </label>
                  <input
                    type="text"
                    value={form.apodo}
                    onChange={(e) => setForm({ ...form, apodo: e.target.value })}
                    placeholder="ej: Tincho"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Rol Operativo *
                  </label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Correo Electrónico (Login) *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="empleado@abastecedoravalette.digital"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="11 3553-4033"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {form.id ? "Nueva Contraseña (opcional)" : "Contraseña *"}
                  </label>
                  <input
                    type="password"
                    required={!form.id}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="rounded"
                />
                <span>Cuenta habilitada para iniciar sesión</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#c53030] hover:bg-[#a82525] text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Guardando..." : "Guardar Miembro"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
