// frontend-admin/src/pages/sucursales/sucursal-data/Empleados.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users,
  UserPlus,
  Scissors,
  DollarSign,
  Briefcase,
  Truck,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Sparkles,
  Award,
  Calendar,
  Layers,
  X,
} from "lucide-react";
import { API_URL } from "../../../config/api";
import BasicDropdown from "../../../components/ui/BasicDropdown";

const ROLES_DROPDOWN = [
  { value: "cortador", label: "🥩 Cortador / Fraccionador" },
  { value: "cajero", label: "💵 Cajera / Atención Mostrador" },
  { value: "encargado", label: "👔 Encargado de Sucursal" },
  { value: "repartidor", label: "🛵 Repartidor / Cadete" },
  { value: "admin", label: "👑 Administrador General" },
];

const ROL_TABS = [
  { key: "todos", label: "Todo el equipo" },
  { key: "cortador", label: "🥩 Cortadores" },
  { key: "cajero", label: "💵 Cajeras" },
  { key: "encargado", label: "👔 Encargados" },
  { key: "repartidor", label: "🛵 Repartidores" },
];

export default function Empleados() {
  const { sucursal } = useOutletContext();

  const [empleados, setEmpleados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("todos");

  // Modal de Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: "",
    apodo: "",
    rol: "cortador",
    email: "",
    password: "",
    telefono: "",
    activo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadEmpleados = async () => {
    if (!sucursal?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/sucursales/${sucursal.id}/empleados`);
      const data = await res.json();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar empleados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, [sucursal?.id]);

  const handleOpenCreate = () => {
    setEditingEmpleado(null);
    setFormValues({
      nombre: "",
      apodo: "",
      rol: "cortador",
      email: "",
      password: "",
      telefono: "",
      activo: true,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmpleado(emp);
    setFormValues({
      nombre: emp.nombre || "",
      apodo: emp.apodo || "",
      rol: emp.rol || "cortador",
      email: emp.email || "",
      password: "",
      telefono: emp.telefono || "",
      activo: emp.activo !== false,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.nombre.trim()) {
      setErrorMsg("El nombre del empleado es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const url = editingEmpleado
        ? `${API_URL}/empleados/${editingEmpleado.id}`
        : `${API_URL}/sucursales/${sucursal.id}/empleados`;
      const method = editingEmpleado ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar empleado");

      setModalOpen(false);
      loadEmpleados();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActivo = async (emp) => {
    try {
      const res = await fetch(`${API_URL}/empleados/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !emp.activo }),
      });
      if (res.ok) {
        setEmpleados((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, activo: !e.activo } : e))
        );
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const handleDelete = async (empId) => {
    if (!window.confirm("¿Seguro que deseás eliminar este integrante del equipo?")) return;
    try {
      const res = await fetch(`${API_URL}/empleados/${empId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEmpleados((prev) => prev.filter((e) => e.id !== empId));
      }
    } catch (err) {
      console.error("Error al eliminar empleado:", err);
    }
  };

  const empleadosFiltrados = useMemo(() => {
    if (filtroRol === "todos") return empleados;
    return empleados.filter((e) => e.rol === filtroRol);
  }, [empleados, filtroRol]);

  const rolMeta = (rol) => {
    const map = {
      cortador: { label: "Cortador", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Scissors },
      cajero: { label: "Cajera", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: DollarSign },
      encargado: { label: "Encargado", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Briefcase },
      repartidor: { label: "Repartidor", color: "bg-orange-50 text-orange-700 border-orange-200", icon: Truck },
      admin: { label: "Admin", color: "bg-neutral-800 text-white border-neutral-900", icon: Award },
    };
    return map[rol] || { label: rol, color: "bg-neutral-100 text-neutral-700 border-neutral-200", icon: Users };
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ─── Header de la Sección Equipo ─── */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0">
              <Users className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  Equipo de Trabajo: {sucursal?.nombre}
                </h1>
                <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-md border border-neutral-200">
                  {empleados.filter((e) => e.activo).length} activos
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Gestioná los cortadores para las comandas, cajeras, encargados y cadetes de la sucursal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <UserPlus className="size-4" />
            <span>Agregar Integrante</span>
          </button>
        </div>
      </div>

      {/* ─── Pestañas de Filtro por Rol ─── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {ROL_TABS.map((tab) => {
          const isSelected = filtroRol === tab.key;
          const count = tab.key === "todos"
            ? empleados.length
            : empleados.filter((e) => e.rol === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFiltroRol(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? "bg-purple-700 text-white shadow-2xs"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Grilla de Integrantes del Equipo ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-neutral-200 p-5 rounded-xl h-44" />
          ))}
        </div>
      ) : empleadosFiltrados.length === 0 ? (
        <div className="text-center py-16 rounded-xl border bg-white border-neutral-200/80 shadow-2xs">
          <Users className="size-12 mx-auto mb-3 opacity-40 stroke-1 text-purple-700" />
          <h3 className="font-bold text-base text-neutral-800">No hay integrantes en esta categoría</h3>
          <p className="text-xs opacity-60 mt-1">Hacé clic en "Agregar Integrante" para sumar personal a esta sucursal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleadosFiltrados.map((emp) => {
            const meta = rolMeta(emp.rol);
            const Icon = meta.icon;

            return (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 font-black text-sm shrink-0">
                        {emp.apodo ? emp.apodo.slice(0, 2).toUpperCase() : emp.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-neutral-900 truncate">
                            {emp.nombre}
                          </h3>
                        </div>
                        {emp.apodo && (
                          <p className="text-xs font-black text-purple-700 tracking-tight">
                            "{emp.apodo}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${meta.color}`}>
                      <Icon className="size-3" />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  {/* Datos de contacto y actividad */}
                  <div className="space-y-2 text-xs text-neutral-600 mb-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    {emp.telefono ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-neutral-500">
                          <Phone className="size-3.5" />
                          {emp.telefono}
                        </span>
                        <a
                          href={`https://wa.me/${emp.telefono.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]"
                        >
                          <MessageCircle className="size-3" /> WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-neutral-400 italic">Sin teléfono cargado</span>
                    )}

                    {/* Métrica de productividad para cortadores */}
                    {emp.rol === "cortador" && (
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                        <span className="text-neutral-500 font-medium">Fraccionados hoy:</span>
                        <span className="font-black text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded text-[11px]">
                          {emp.pedidos_hoy || 0} pedidos
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer de acciones */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActivo(emp)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                      emp.activo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                    }`}
                  >
                    {emp.activo ? <CheckCircle className="size-3.5" /> : <XCircle className="size-3.5" />}
                    <span>{emp.activo ? "Activo" : "Inactivo"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Editar empleado"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 rounded-lg border border-neutral-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                      title="Eliminar empleado"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Preview de Cimientos RRHH ─── */}
      <div className="bg-gradient-to-r from-purple-50 to-neutral-50 p-5 sm:p-6 rounded-xl border border-purple-200/60 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="size-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900">
              Módulo de Recursos Humanos (RRHH)
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Cimientos preparados para gestión de legajos digitales, adelantos de sueldo, ausencias y calendario de vacaciones.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider bg-purple-200/80 text-purple-900 px-3 py-1 rounded-full shrink-0">
          En Desarrollo
        </span>
      </div>

      {/* ─── Modal para Crear / Editar Empleado ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 text-neutral-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-purple-700">
                <Users className="size-5" />
                <h3 className="font-bold text-base text-neutral-900">
                  {editingEmpleado ? "Editar Integrante" : "Nuevo Integrante del Equipo"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Gómez"
                  value={formValues.nombre}
                  onChange={(e) => setFormValues({ ...formValues, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Apodo (para la botonera rápida de pedidos)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlitos"
                  value={formValues.apodo}
                  onChange={(e) => setFormValues({ ...formValues, apodo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Este apodo aparecerá en la botonera *"¿Quién fracciona este pedido?"*.
                </p>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Rol en la Sucursal *
                </label>
                <BasicDropdown
                  items={ROLES_DROPDOWN}
                  value={formValues.rol}
                  onChange={(val) => setFormValues({ ...formValues, rol: val })}
                  buttonClassName="py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Teléfono / WhatsApp de contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej: 11-4455-6677"
                  value={formValues.telefono}
                  onChange={(e) => setFormValues({ ...formValues, telefono: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {(formValues.rol === "encargado" || formValues.rol === "admin" || formValues.rol === "cajero") && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-3">
                  <div>
                    <label className="block font-bold text-purple-900 mb-1">
                      Correo Electrónico de Acceso (Usuario)
                    </label>
                    <input
                      type="email"
                      placeholder="encargado@valette.com"
                      value={formValues.email}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-purple-900 mb-1">
                      {editingEmpleado ? "Asignar / Cambiar Contraseña" : "Contraseña de Acceso"}
                    </label>
                    <input
                      type="password"
                      placeholder={editingEmpleado ? "Dejar en blanco para mantener la actual" : "Mínimo 4 caracteres"}
                      value={formValues.password}
                      onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="emp_activo"
                  checked={formValues.activo}
                  onChange={(e) => setFormValues({ ...formValues, activo: e.target.checked })}
                  className="size-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="emp_activo" className="font-bold text-neutral-800 cursor-pointer">
                  Empleado activo en turno
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-2xs"
                >
                  {isSubmitting ? "Guardando..." : editingEmpleado ? "Guardar Cambios" : "Crear Integrante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
