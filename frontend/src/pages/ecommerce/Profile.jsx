// frontend/src/pages/ecommerce/Profile.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  Gift,
  Users,
  Copy,
  Share2,
  TrendingUp,
  ShoppingBag,
  Star,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";
import { formatPrecio, formatCantidad } from "../../utils/formatters";

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, logout, updateProfile, refreshUser } =
    useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("pedidos"); // "pedidos" | "datos" | "puntos"
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  // Estado para historial de puntos
  const [historialPuntos, setHistorialPuntos] = useState([]);
  const [loadingPuntos, setLoadingPuntos] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTCs, setShowTCs] = useState(false);

  // Formulario Mis Datos
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    telefono: "",
    direccion_default: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const inputLabel = "block text-sm font-semibold text-neutral-700 mb-1.5";
  const inputClassnames =
    "w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 text-base focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue";
  const inputWithIconClassnames =
    "w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-neutral-300 text-base focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue";
  const iconClassnames = "size-5 text-neutral-400 absolute inset-y-0 my-auto";
  const inputHelpText = "text-xs text-neutral-400 mt-1";

  // Si no está autenticado, redirigir a /ingresar
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/ingresar");
    } else if (!user?.referral_code) {
      refreshUser();
    }
  }, [isAuthenticated, user?.referral_code, navigate, refreshUser]);

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
      toast.success(res.message || "Datos actualizados correctamente.");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Error al actualizar perfil.",
      });
      toast.error(err.message || "Error al actualizar perfil.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Cargar historial de puntos al entrar a esa tab
  const fetchHistorialPuntos = useCallback(async () => {
    if (!token || historialPuntos.length > 0) return;
    setLoadingPuntos(true);
    try {
      const res = await fetch(`${API_URL}/clientes/puntos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistorialPuntos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar historial de puntos:", err);
    } finally {
      setLoadingPuntos(false);
    }
  }, [token, historialPuntos.length]);

  useEffect(() => {
    if (activeTab === "puntos") fetchHistorialPuntos();
  }, [activeTab, fetchHistorialPuntos]);

  const copyReferralCode = () => {
    if (!user?.referral_code) return;
    navigator.clipboard.writeText(user.referral_code).then(() => {
      setCopied(true);
      toast.success("¡Código copiado al portapapeles!", {
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const code = user?.referral_code || "";
    const text = encodeURIComponent(
      `¡Sumate a Abastecedora Valette y ganá 50 puntos! Usá mi código al registrarte: ${code} 🥩 ${window.location.origin}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!user) return null;

  const puntos = Number(user.puntos_acumulados) || 0;
  const perfilIncompleto = !user.perfil_completo;

  return (
    <div className="w-full bg-neutral-50/60 min-h-screen py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* ─── Cabecera del Perfil ─── */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="size-14 sm:size-16 rounded-xl bg-main-blue text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-2xs shrink-0 overflow-hidden ring-2 ring-main-blue/10">
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
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {user.nombre}
                </h1>
                {user.usuario && (
                  <span className="text-xs font-bold text-main-blue bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-200/60 font-mono">
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

          {/* Tarjeta de Puntos y Logout */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-3">
              <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Puntos Valette
                </p>
                <p className="text-xl font-black text-amber-950 leading-tight">
                  {puntos}{" "}
                  <span className="text-xs font-bold text-amber-700">pts</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-lg border border-neutral-200/80 hover:border-red-200 hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-all cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>

        {/* ─── Banner de Gamificación para completar perfil ─── */}
        {perfilIncompleto && (
          <div className="mb-5 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-main-blue to-blue-900 text-white shadow-2xs border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Sparkles className="size-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                  ¡Completá tu @Usuario y WhatsApp para ganar +50 puntos de
                  regalo!
                </h3>
                <p className="text-[11px] text-blue-100 mt-0.5">
                  Conectá tus redes y recibí avisos prioritarios de pesaje y
                  promociones exclusivas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("datos")}
              className="px-3.5 py-1.5 bg-white text-main-blue hover:bg-blue-50 font-bold text-xs rounded-lg shadow-2xs transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              Completar Perfil
            </button>
          </div>
        )}

        {/* ─── Navegación por pestañas ─── */}
        <div className="flex gap-1.5 border-b border-neutral-200 mb-5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("pedidos")}
            className={`pb-2.5 px-3 sm:px-4 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === "pedidos"
                ? "border-main-red text-main-red"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Package className="size-4" />
            <span>Compras ({pedidos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("datos")}
            className={`pb-2.5 px-3 sm:px-4 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === "datos"
                ? "border-main-red text-main-red"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <User className="size-4" />
            <span>Mis Datos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("puntos")}
            className={`pb-2.5 px-3 sm:px-4 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 shrink-0 whitespace-nowrap ${
              activeTab === "puntos"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Sparkles className="size-4" />
            <span>Puntos & Referidos</span>
          </button>
        </div>

        {/* ─── CONTENIDO PESTAÑA: MIS PEDIDOS ─── */}
        {activeTab === "pedidos" && (
          <div className="space-y-3.5">
            {loadingPedidos ? (
              <div className="text-center py-10 text-neutral-400 text-sm animate-pulse">
                Cargando tu historial de compras...
              </div>
            ) : pedidos.length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border border-neutral-200/80 shadow-2xs">
                <div className="size-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <Package className="size-7 stroke-1" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                  Aún no realizaste ningún pedido
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                  Tus pedidos de carnes vacunas, cerdo y pollo aparecerán acá
                  con su estado en tiempo real.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-main-blue text-white font-bold text-xs shadow-2xs hover:bg-main-blue/90 transition-all"
                >
                  <span>Explorar cortes en la tienda</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              pedidos.map((ped) => {
                const fecha = new Date(ped.creado_en).toLocaleDateString(
                  "es-AR",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <div
                    key={ped.id}
                    className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-3 hover:border-neutral-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-neutral-900">
                            Pedido #{ped.id}
                          </span>
                          <span
                            className={`text-sm font-bold px-1.5 py-0.5 rounded-md capitalize ${
                              ped.estado_local === "entregado"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : ped.estado_local === "listo"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {ped.estado_local}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Realizado el {fecha}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-sm text-neutral-500 block">
                          Total Estimado:
                        </span>
                        <span className="text-xl font-extrabold text-main-blue">
                          {formatPrecio(ped.monto_total_estimado)}
                        </span>
                      </div>
                    </div>

                    {/* Datos de Entrega */}
                    <div className="text-sm text-neutral-600 flex items-center gap-2">
                      {ped.tipo_entrega === "retiro_sucursal" ? (
                        <>
                          <Store className="size-4.5 text-main-blue shrink-0" />
                          <span>
                            Retiro en Sucursal{" "}
                            <strong>{ped.sucursal_nombre}</strong> (
                            {ped.sucursal_direccion})
                          </span>
                        </>
                      ) : (
                        <>
                          <Truck className="size-4.5 text-main-blue shrink-0" />
                          <span>
                            Envío a <strong>{ped.direccion_entrega}</strong> (
                            {ped.tipo_entrega === "pedidosya"
                              ? "PedidosYa Envíos"
                              : "Logística Valette"}
                            )
                          </span>
                        </>
                      )}
                    </div>

                    {/* Detalle de Cortes */}
                    <div className="bg-neutral-50 rounded-lg p-3 divide-y divide-neutral-200/60 text-sm">
                      {(ped.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0"
                        >
                          <span className="text-neutral-800 font-medium">
                            {item.nombre_producto} (
                            {formatCantidad(
                              item.cantidad_kg_solicitada,
                              item.unidad_medida || "kg",
                            )}
                            )
                          </span>
                          <span className="font-bold text-neutral-900">
                            {formatPrecio(item.precio_estimado)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-0.5">
                      <Link
                        to={`/pedido/${ped.id}/confirmacion`}
                        className="text-sm font-bold text-main-blue hover:text-blue-700 flex items-center gap-1"
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

        {/* ─── CONTENIDO PESTAÑA: MIS DATOS ─── */}
        {activeTab === "datos" && (
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
            <h2 className="text-base font-bold text-neutral-900 mb-1">
              Datos Personales
            </h2>
            <p className="text-xs text-neutral-500 mb-5">
              Mantené tu información de contacto actualizada para una mejor
              experiencia de entrega.
            </p>

            {feedback.message && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs font-semibold ${
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
                <label className={inputLabel}>Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className={inputClassnames}
                />
              </div>

              <div>
                <label className={inputLabel}>
                  Correo Electrónico (No editable)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 text-base cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={inputLabel}>@Usuario / Redes</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="juan_valette"
                      value={formData.usuario}
                      onChange={(e) =>
                        setFormData({ ...formData, usuario: e.target.value })
                      }
                      className={inputWithIconClassnames}
                    />
                    <AtSign className={`${iconClassnames} left-3`} />
                  </div>
                  <p className={inputHelpText}>
                    Tu nombre de usuario para dinámicas y sorteos.
                  </p>
                </div>

                <div>
                  <label className={inputLabel}>WhatsApp / Teléfono</label>
                  <div className="relative flex items-center">
                    <input
                      type="tel"
                      placeholder="11 2345-6789"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className={inputWithIconClassnames}
                    />
                    <Phone className={`${iconClassnames} left-3`} />
                  </div>
                  <p className={inputHelpText}>
                    Para avisos de corte y pesaje exacto.
                  </p>
                </div>
              </div>

              <div>
                <label className={inputLabel}>
                  Dirección Predeterminada para Envíos
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Ej. J. Tarulli 1474, Luis Guillón, Esteban Echeverría"
                    value={formData.direccion_default}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        direccion_default: e.target.value,
                      })
                    }
                    className={inputWithIconClassnames}
                  />
                  <MapPin className={`${iconClassnames} left-3`} />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-lg bg-main-blue hover:bg-main-blue/95 text-white font-bold text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {isUpdating ? "Guardando cambios..." : "Guardar Datos"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── PESTAÑA: PUNTOS & REFERIDOS ─── */}
        {activeTab === "puntos" && (
          <div className="space-y-5">
            {/* Saldo de puntos */}
            <div className="bg-white border border-amber-300/80 rounded-xl p-5 sm:p-6 shadow-2xs flex items-center gap-4 bg-gradient-to-r from-amber-500/5 to-transparent">
              <div className="size-12 sm:size-14 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                <Sparkles className="size-6 sm:size-7" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                  Tu saldo disponible
                </p>
                <p className="text-3xl sm:text-4xl font-black text-amber-950 leading-none">
                  {puntos}
                  <span className="text-base sm:text-lg font-bold text-amber-700 ml-1.5">
                    puntos Valette
                  </span>
                </p>
                <p className="text-xs text-amber-700/80 mt-1">
                  Próximamente podrás canjear tus puntos por cortes, promociones
                  y beneficios exclusivos ✨
                </p>
              </div>
            </div>

            {/* Historial de movimientos */}
            <div className="bg-white border border-neutral-200/80 rounded-xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2">
                <TrendingUp className="size-5 stroke-[2.5px] text-main-blue" />
                <h3 className="font-bold text-lg text-neutral-800">
                  Historial de movimientos
                </h3>
              </div>

              {loadingPuntos ? (
                <div className="py-8 text-center text-neutral-400 text-sm animate-pulse">
                  Cargando historial de puntos...
                </div>
              ) : historialPuntos.length === 0 ? (
                <div className="py-10 text-center text-neutral-400">
                  <Star className="size-7 mx-auto mb-2 opacity-30 stroke-1" />
                  <p className="text-sm font-medium">
                    Aún no tenés movimientos de puntos.
                  </p>
                  <p className="text-xs mt-0.5">
                    ¡Hacé tu primera compra para empezar a sumar!
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {historialPuntos.map((mov) => {
                    const esGanado = mov.puntos > 0;
                    const iconSize = "size-4";
                    const iconMap = {
                      compra: <ShoppingBag className={iconSize} />,
                      bienvenida: <Star className={iconSize} />,
                      perfil: <User className={iconSize} />,
                      referido_dado: <Users className={iconSize} />,
                      referido_recibido: <Gift className={iconSize} />,
                      canje: <Sparkles className={iconSize} />,
                      dinamica: <Star className={iconSize} />,
                      ajuste: <TrendingUp className={iconSize} />,
                    };
                    return (
                      <li
                        key={mov.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50/60 transition-colors"
                      >
                        <div
                          className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${esGanado ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}
                        >
                          {iconMap[mov.tipo] || <Star className={iconSize} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 leading-tight truncate">
                            {mov.descripcion || mov.tipo}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {new Date(mov.creado_en).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}{" "}
                          </p>
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-bold shrink-0 ${esGanado ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {esGanado ? "+" : ""}
                          {mov.puntos} pts
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Código de referido */}
            <div className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col lg:flex-row items-start lg:items-center mb-3.5">
                <div className="flex items-center gap-2">
                  <Users className="size-5 stroke-[2.5px]" />
                  <h3 className="font-bold text-neutral-800 text-lg">
                    Tu código de referido
                  </h3>
                </div>
                {user.referidos_count > 0 && (
                  <p className="lg:ml-auto text-sm font-bold text-emerald-600">
                    {user.referidos_count}{" "}
                    {user.referidos_count === 1
                      ? "persona usó"
                      : "personas usaron"}{" "}
                    tu código
                  </p>
                )}
              </div>

              {user.referral_code ? (
                <>
                  <div className="mb-4">
                    <div className="bg-neutral-50 border border-neutral-200/80 rounded-lg px-4 py-3.5 text-center mb-2.5">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-0.5">
                        Tu código exclusivo
                      </p>
                      <p className="text-2xl sm:text-3xl font-black tracking-[0.35em] text-neutral-900 font-mono">
                        {user.referral_code}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyReferralCode}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          copied
                            ? "bg-emerald-500 text-white"
                            : "bg-main-blue text-white hover:bg-main-blue/90"
                        }`}
                      >
                        {copied ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copied ? "¡Copiado!" : "Copiar código"}
                      </button>
                      <button
                        onClick={shareWhatsApp}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Share2 className="size-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-900">
                    <p className="font-bold mb-0.5">¿Cómo funciona?</p>
                    <p>
                      Compartí tu código. Quien se registre usando tu código
                      gana <strong>+50 puntos</strong> y vos ganás{" "}
                      <strong>+100 puntos</strong> automáticamente en tu cuenta.
                      🎉
                    </p>
                  </div>

                  {/* Bases y condiciones (acordeón) */}
                  <div className="mt-3.5 border border-neutral-200/80 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowTCs(!showTCs)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <span>Bases y condiciones del programa</span>
                      <ChevronDown
                        className={`size-3.5 transition-transform ${showTCs ? "rotate-180" : ""}`}
                      />
                    </button>
                    {showTCs && (
                      <div className="px-3.5 pb-3 text-[13px] text-neutral-500 space-y-1 border-t border-neutral-100 pt-2.5">
                        <p>• El código es único, personal e intransferible.</p>
                        <p>• Solo aplica para nuevas cuentas registradas.</p>
                        <p>
                          • El nuevo cliente recibe <strong>+50 puntos</strong>{" "}
                          al registrarse con el código.
                        </p>
                        <p>
                          • El referidor recibe <strong>+100 puntos</strong>{" "}
                          inmediatamente al registrarse el referido.
                        </p>
                        <p>• No se puede usar el propio código de referido.</p>
                        <p>• Los puntos no tienen fecha de vencimiento.</p>
                        <p>
                          • Valette se reserva el derecho de anular puntos
                          obtenidos fraudulentamente.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-5 text-neutral-400 text-xs">
                  Tu código de referido se genera automáticamente al iniciar
                  sesión.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
