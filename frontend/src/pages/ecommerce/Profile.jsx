// frontend/src/pages/ecommerce/Profile.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Sparkles,
  Package,
  MapPin,
  Phone,
  Mail,
  AtSign,
  Calendar,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";
import { formatPrecio, formatCantidad } from "../../utils/formatters";

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState("pedidos"); // "pedidos" | "datos"
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  // Formulario Mis Datos
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    telefono: "",
    direccion_default: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Si no está autenticado, redirigir a /ingresar
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/ingresar");
    }
  }, [isAuthenticated, navigate]);

  // Cargar datos en el formulario cuando cambie user
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        usuario: user.usuario || "",
        telefono: user.telefono || "",
        direccion_default: user.direccion_default || "",
      });
    }
  }, [user]);

  // Cargar historial de pedidos
  useEffect(() => {
    const fetchHistorial = async () => {
      if (!token) return;
      setLoadingPedidos(true);
      try {
        const res = await fetch(`${API_URL}/clientes/pedidos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPedidos(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error al cargar historial de pedidos:", err);
      } finally {
        setLoadingPedidos(false);
      }
    };

    fetchHistorial();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    setIsUpdating(true);

    try {
      const res = await updateProfile(formData);
      setFeedback({
        type: "success",
        message: res.message || "Datos actualizados correctamente.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Error al actualizar perfil.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  const puntos = Number(user.puntos_acumulados) || 0;
  const perfilIncompleto = !user.perfil_completo;

  return (
    <div className="w-full bg-neutral-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Cabecera del Perfil */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-16 sm:size-20 rounded-full bg-main-blue text-white font-bold text-xl sm:text-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.nombre}
                  className="size-full object-cover"
                />
              ) : (
                user.nombre?.substring(0, 2).toUpperCase() || "AV"
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                  {user.nombre}
                </h1>
                {user.usuario && (
                  <span className="text-xs font-semibold text-main-blue bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    @{user.usuario}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
              {user.telefono && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  WhatsApp: {user.telefono}
                </p>
              )}
            </div>
          </div>

          {/* Tarjeta de Puntos */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Tus Puntos Valette
                </p>
                <p className="text-2xl font-extrabold text-amber-950 leading-tight">
                  {puntos}{" "}
                  <span className="text-xs font-semibold text-amber-700">pts</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-3 rounded-xl border border-neutral-200 hover:border-red-200 hover:bg-red-50 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>

        {/* Banner de Gamificación para completar perfil */}
        {perfilIncompleto && (
          <div className="mb-6 p-5 rounded-2xl bg-linear-to-r from-blue-900 to-main-blue text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="size-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  ¡Completá tu @Usuario y WhatsApp para ganar +50 puntos de regalo!
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Conectá tus redes y recibí avisos prioritarios de pesaje y promociones exclusivas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("datos")}
              className="px-4 py-2 bg-white text-main-blue hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              Completar Perfil
            </button>
          </div>
        )}

        {/* Navegación por pestañas */}
        <div className="flex gap-2 border-b border-neutral-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("pedidos")}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "pedidos"
                ? "border-main-blue text-main-blue"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Package className="size-4" />
            <span>Mis Compras ({pedidos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("datos")}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "datos"
                ? "border-main-blue text-main-blue"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <User className="size-4" />
            <span>Mis Datos Personales</span>
          </button>
        </div>

        {/* CONTENIDO PESTAÑA: MIS PEDIDOS */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            {loadingPedidos ? (
              <div className="text-center py-12 text-neutral-400 text-sm animate-pulse">
                Cargando tu historial de compras...
              </div>
            ) : pedidos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200">
                <div className="size-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <Package className="size-8 stroke-1" />
                </div>
                <h3 className="text-base font-bold text-neutral-800">
                  Aún no realizaste ningún pedido
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5">
                  Tus pedidos de carnes vacunas, cerdo y pollo aparecerán acá con su estado en tiempo real.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-main-blue text-white font-bold text-xs shadow hover:bg-main-blue/90 transition-all"
                >
                  <span>Explorar cortes en la tienda</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              pedidos.map((ped) => {
                const fecha = new Date(ped.creado_en).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={ped.id}
                    className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-2xs space-y-4 hover:border-neutral-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">
                            Pedido #{ped.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              ped.estado_local === "entregado"
                                ? "bg-emerald-100 text-emerald-800"
                                : ped.estado_local === "listo"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {ped.estado_local}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Realizado el {fecha}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-neutral-500 block">
                          Total Estimado:
                        </span>
                        <span className="text-base font-extrabold text-main-blue">
                          {formatPrecio(ped.monto_total_estimado)}
                        </span>
                      </div>
                    </div>

                    {/* Datos de Entrega */}
                    <div className="text-xs text-neutral-600 flex items-center gap-2">
                      {ped.tipo_entrega === "retiro_sucursal" ? (
                        <>
                          <Store className="size-4 text-main-blue shrink-0" />
                          <span>
                            Retiro en <strong>{ped.sucursal_nombre}</strong> ({ped.sucursal_direccion})
                          </span>
                        </>
                      ) : (
                        <>
                          <Truck className="size-4 text-main-blue shrink-0" />
                          <span>
                            Envío a <strong>{ped.direccion_entrega}</strong> ({ped.tipo_entrega === "pedidosya" ? "PedidosYa Envíos" : "Logística Valette"})
                          </span>
                        </>
                      )}
                    </div>

                    {/* Detalle de Cortes */}
                    <div className="bg-neutral-50 rounded-xl p-3 divide-y divide-neutral-200/60 text-xs">
                      {(ped.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0"
                        >
                          <span className="text-neutral-800 font-medium">
                            {item.nombre_producto} ({formatCantidad(item.cantidad_kg_solicitada, item.unidad_medida || "kg")})
                          </span>
                          <span className="font-bold text-neutral-900">
                            {formatPrecio(item.precio_estimado)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <Link
                        to={`/pedido/${ped.id}/confirmacion`}
                        className="text-xs font-bold text-main-blue hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>Ver confirmación y comprobante</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA: MIS DATOS */}
        {activeTab === "datos" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs">
            <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-5">
              Editar Información de Perfil
            </h2>

            {feedback.message && (
              <div
                className={`mb-5 p-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-red-600" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Correo Electrónico (No editable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 text-xs cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    @Usuario / Redes
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="juan_valette"
                      value={formData.usuario}
                      onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                    />
                    <AtSign className="size-3.5 text-neutral-400 absolute left-2.5 top-3" />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Tu nombre de usuario para dinámicas y sorteos.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    WhatsApp / Teléfono
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="11 2345-6789"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                    />
                    <Phone className="size-3.5 text-neutral-400 absolute left-2.5 top-3" />
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Para avisos de corte y pesaje exacto.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Dirección Predeterminada para Envíos
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. J. Tarulli 1474, Luis Guillón, Esteban Echeverría"
                    value={formData.direccion_default}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion_default: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                  />
                  <MapPin className="size-3.5 text-neutral-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUpdating ? "Guardando cambios..." : "Guardar Datos"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
