// src/components/modals/ProfileModal.jsx
import { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Lock,
  Bell,
  MapPin,
  Package,
  Star,
  Gift,
  Heart,
  HelpCircle,
  MessageCircle,
  LogOut,
  LogIn,
  UserPlus,
  Camera,
  Copy,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  Scale,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useLocation } from "@/context/LocationContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useCatalogo } from "@/context/CatalogoContext";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

export const ProfileModal = ({
  isOpen,
  initialView = "main",
  onClose,
  onOpenTrackingModal,
  onOpenBranchModal,
  onOpenNotificationsModal,
  onOpenProduct,
}) => {
  const { showToast } = useToast();
  const { selectedBranch, deliveryMode, customerAddress, updateCustomerAddress } =
    useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { productos } = useCatalogo();
  const { unreadCount } = useNotifications();
  const {
    user,
    isAuthenticated,
    puntosHistorial,
    pedidosHistorial,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
  } = useAuth();
  const { activeOrderId, setActiveOrderId } = useCart();

  // Vista interna: "main" | "auth" | "edit-profile" | "points" | "orders" | "favorites" | "security" | "support"
  const [activeView, setActiveView] = useState(initialView);
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  // Estado formulario Login
  const [loginForm, setLoginForm] = useState({
    identificador: "",
    password: "",
  });

  // Estado formulario Registro
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    usuario: "",
    password: "",
    codigo_referido: "",
  });

  // Formulario de edición de perfil
  const [formState, setFormState] = useState({
    nombre: user?.nombre || "",
    email: user?.email || "",
    usuario: user?.usuario || "",
    telefono: user?.telefono || "",
    direccion: user?.direccion_default || customerAddress || "",
  });

  // Preferencias operativas
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);

  // Estado para cambio de contraseña
  const [securityForm, setSecurityForm] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const handleCloseModal = () => {
    setActiveView("main");
    setFormError(null);
    onClose();
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleCloseModal
  );

  if (!isOpen) return null;

  const profileData = {
    nombre: user?.nombre || "Invitado Valette",
    email: user?.email || "Iniciá sesión para sumar puntos Club Valette",
    usuario: user?.usuario || "",
    telefono: user?.telefono || "",
    puntos: Number(user?.puntos || 0),
    equivalenciaPesos: Number(user?.equivalenciaPesos || 0),
    codigoReferido: user?.codigoReferido || "VALETTE",
    pedidoActivoId:
      activeOrderId ||
      (pedidosHistorial[0]?.id ? pedidosHistorial[0].id : null),
  };

  const favoriteProducts = productos.filter((p) =>
    favorites.includes(Number(p.id))
  );

  const handleCopyReferral = async () => {
    if (!isAuthenticated) {
      setActiveView("auth");
      return;
    }
    try {
      await navigator.clipboard.writeText(profileData.codigoReferido);
      setCopiedCode(true);
      showToast(
        `¡Código ${profileData.codigoReferido} copiado al portapapeles! 🎁`
      );
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast(`Tu código es: ${profileData.codigoReferido}`, "info");
    }
  };

  const handleShareReferral = async () => {
    if (!isAuthenticated) {
      setActiveView("auth");
      showToast("Iniciá sesión para obtener tu código de referido 🎁", "info");
      return;
    }
    const shareText = `¡Pedí en Abastecedora Valette con mi código ${profileData.codigoReferido} y sumá puntos de regalo en tu compra! 🥩🔥`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Club Valette — Invitar Amigos",
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fallback a copiar
      }
    }
    handleCopyReferral();
  };

  const handleOpenEditProfile = () => {
    setFormError(null);
    if (!isAuthenticated) {
      setActiveView("auth");
      return;
    }
    setFormState({
      nombre: user?.nombre || "",
      email: user?.email || "",
      usuario: user?.usuario || "",
      telefono: user?.telefono || "",
      direccion: user?.direccion_default || customerAddress || "",
    });
    setActiveView("edit-profile");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setFormError(null);
    try {
      const data = await login({
        identificador: loginForm.identificador,
        password: loginForm.password,
      });
      showToast(`¡Bienvenido, ${data.user?.nombre || "a Valette"}! 🥩`);
      setLoginForm({ identificador: "", password: "" });
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "Error al iniciar sesión.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    if (registerForm.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setIsBusy(true);
    setFormError(null);
    try {
      const data = await register(registerForm);
      showToast(data.message || "¡Cuenta creada con éxito! 🎉");
      setRegisterForm({
        nombre: "",
        email: "",
        telefono: "",
        usuario: "",
        password: "",
        codigo_referido: "",
      });
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "Error al crear la cuenta.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setFormError(null);
    try {
      const res = await updateProfile({
        nombre: formState.nombre.trim(),
        usuario: formState.usuario.trim(),
        telefono: formState.telefono.trim(),
        direccion_default: formState.direccion.trim(),
      });
      if (formState.direccion.trim()) {
        updateCustomerAddress(formState.direccion.trim());
      }
      showToast(res.message || "Datos de perfil actualizados correctamente");
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "Error al guardar el perfil.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    if (!securityForm.nueva || securityForm.nueva.length < 6) {
      setFormError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (securityForm.nueva !== securityForm.confirmar) {
      setFormError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setIsBusy(true);
    setFormError(null);
    try {
      await changePassword({
        password_actual: securityForm.actual,
        password_nueva: securityForm.nueva,
      });
      setSecurityForm({ actual: "", nueva: "", confirmar: "" });
      showToast("Contraseña actualizada con éxito 🔒");
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setIsBusy(false);
    }
  };

  const openWhatsAppSupport = (motivo = "consulta general") => {
    const rawPhone = (selectedBranch?.telefono || "1135534033").replace(
      /\D/g,
      ""
    );
    const fullPhone = rawPhone.startsWith("54") ? rawPhone : `549${rawPhone}`;
    const sucursalNombre = selectedBranch?.nombre || "Luis Guillón";
    const texto = encodeURIComponent(
      `Hola Abastecedora Valette (Sucursal ${sucursalNombre})! Soy ${profileData.nombre} y me contacto desde la Sucursal Virtual por: ${motivo}.`
    );
    window.open(`https://wa.me/${fullPhone}?text=${texto}`, "_blank");
  };

  const viewTitles = {
    main: "Mi Perfil",
    auth: authTab === "login" ? "Iniciar Sesión" : "Crear Cuenta Club Valette",
    "edit-profile": "Gestionar Perfil",
    points: "Club Valette",
    orders: "Mis Pedidos",
    favorites: "Mis Favoritos",
    security: "Contraseña y Seguridad",
    support: "Centro de Soporte",
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[#F6F8FA] w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl h-[86vh] sm:max-h-[88vh] overflow-hidden flex flex-col p-0 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Cabecera deslizable y barra táctil */}
        <div
          {...dragHandleProps}
          className="touch-none select-none sticky top-0 bg-[#F6F8FA] z-10 shrink-0 px-6 pt-3.5 pb-3 border-b border-slate-200/60"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden shrink-0 cursor-grab active:cursor-grabbing" />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                if (activeView === "main") {
                  handleCloseModal();
                } else {
                  setActiveView("main");
                }
              }}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>

            <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              {viewTitles[activeView] || "Mi Perfil"}
            </h3>

            <button
              type="button"
              onClick={handleCloseModal}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Cerrar"
            >
              <X className="size-4 stroke-[2.25]" />
            </button>
          </div>
        </div>

        {/* Contenido dinámico con scroll limpio */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {activeView === "main" && (
            <>
              {/* 1. Tarjeta Superior de Perfil */}
              <div
                onClick={handleOpenEditProfile}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3.5 cursor-pointer hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative size-15 rounded-full bg-[#003366] text-white flex items-center justify-center shrink-0 shadow-xs border-2 border-slate-100">
                    <img
                      src={user?.avatar_url || "/favicon.svg"}
                      alt={profileData.nombre}
                      className="size-full rounded-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      {isAuthenticated ? (
                        <Camera className="size-3 text-[#003366]" />
                      ) : (
                        <LogIn className="size-3 text-[#003366]" />
                      )}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[15px] font-extrabold text-slate-900 leading-snug truncate">
                      {isAuthenticated
                        ? profileData.nombre
                        : "Ingresar a mi cuenta"}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {profileData.email}
                    </p>
                    {!isAuthenticated && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-[#003366] text-white text-[10px] font-bold">
                        <span>Iniciar sesión o registrarme</span>
                        <ChevronRight className="size-3" />
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="size-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
              </div>

              {/* 2. Sección: Cuenta */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Cuenta
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <User className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        {isAuthenticated
                          ? "Gestionar Perfil"
                          : "Iniciar Sesión / Crear Cuenta"}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onOpenTrackingModal?.();
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Package className="size-4.5 text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Seguir Pedido en Vivo
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {profileData.pedidoActivoId ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-extrabold font-num">
                          #{String(profileData.pedidoActivoId).padStart(4, "0")} · Activo
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Consultar
                        </span>
                      )}
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => setActiveView("orders")}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                    >
                      <span className="flex items-center gap-3">
                        <ClipboardList className="size-[18px] text-slate-600 stroke-[1.75]" />
                        <span className="text-[13px] font-semibold text-slate-800">
                          Historial de Compras
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold font-num">
                          {pedidosHistorial.length}
                        </span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveView("favorites")}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Mis Cortes Favoritos
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold font-num">
                        {favorites.length}
                      </span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setActiveView(isAuthenticated ? "security" : "auth");
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Lock className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Contraseña y Seguridad
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* 3. Sección: Club Valette & Beneficios */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Club Valette
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveView("points")}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Star className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Puntos Acumulados
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300/80 text-amber-800 text-[11px] font-extrabold font-num">
                        {profileData.puntos.toLocaleString("es-AR")} pts
                      </span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareReferral}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Gift className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Invitar Amigos
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#003366]/10 border border-[#003366]/15 text-[#003366] text-[11px] font-extrabold font-num">
                        +100 pts
                      </span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>
                </div>
              </div>

              {/* 4. Sección: Preferencias */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Preferencias
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onOpenBranchModal?.();
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <MapPin className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Sucursal y Entrega
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <span className="truncate max-w-34">
                        {selectedBranch?.nombre || "Luis Guillón"} (
                        {deliveryMode === "delivery" ? "Envío" : "Retiro"})
                      </span>
                      <ChevronRight className="size-4 text-slate-400 shrink-0" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onOpenNotificationsModal?.();
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <Bell className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Centro de Notificaciones
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {unreadCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-valette-red text-[11px] font-extrabold font-num">
                          {unreadCount} nuevas
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          Al día
                        </span>
                      )}
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

                  <label className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
                    <span className="flex items-center gap-3">
                      <MessageCircle className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Avisos de comanda por WhatsApp
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => {
                        setWhatsappAlerts(e.target.checked);
                        showToast(
                          e.target.checked
                            ? "Avisos por WhatsApp activados"
                            : "Avisos por WhatsApp silenciados",
                          "info"
                        );
                      }}
                      className="accent-[#003366] size-4 cursor-pointer rounded"
                    />
                  </label>
                </div>
              </div>

              {/* 5. Sección: Soporte y Ayuda */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Soporte
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveView("support")}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="size-[18px] text-slate-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        Ayuda y Reclamos
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <span>Atención directa</span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppSupport(
                        profileData.pedidoActivoId
                          ? `consulta sobre mi pedido #${profileData.pedidoActivoId}`
                          : "consulta desde la Sucursal Virtual"
                      )
                    }
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="size-[18px] text-emerald-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        WhatsApp Casa Central (Luis Guillón)
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Botón Iniciar / Cerrar Sesión */}
              <div className="pt-1 pb-6">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      handleCloseModal();
                      showToast("Sesión cerrada correctamente", "info");
                    }}
                    className="w-full py-3.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <LogOut className="size-3.5 stroke-[2.25]" />
                    <span>Cerrar Sesión</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveView("auth")}
                    className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogIn className="size-3.5 stroke-[2.25]" />
                    <span>Iniciar Sesión / Crear Cuenta</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* SUB-VISTA: AUTENTICACIÓN REAL (LOGIN / REGISTRO) */}
          {activeView === "auth" && (
            <div className="space-y-4 pb-6">
              {/* Selector Login vs Registro */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setFormError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authTab === "login"
                      ? "bg-white text-[#003366] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LogIn className="size-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setFormError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authTab === "register"
                      ? "bg-white text-[#003366] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="size-3.5" />
                  <span>Crear Cuenta</span>
                </button>
              </div>

              {authTab === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                    <div>
                      <label
                        htmlFor="login-identificador"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Email, Usuario o Teléfono
                      </label>
                      <input
                        id="login-identificador"
                        name="username"
                        type="text"
                        required
                        autoComplete="username"
                        spellCheck={false}
                        autoCapitalize="none"
                        autoCorrect="off"
                        enterKeyHint="next"
                        value={loginForm.identificador}
                        onChange={(e) =>
                          setLoginForm((s) => ({
                            ...s,
                            identificador: e.target.value,
                          }))
                        }
                        placeholder="tu@email.com o @usuario"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="login-password"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          name="password"
                          type={showPass ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          enterKeyHint="done"
                          value={loginForm.password}
                          onChange={(e) =>
                            setLoginForm((s) => ({
                              ...s,
                              password: e.target.value,
                            }))
                          }
                          placeholder="••••••••"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          aria-label={
                            showPass
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPass ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Ingresando...</span>
                      </>
                    ) : (
                      <span>Iniciar Sesión</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-600 shrink-0" />
                    <span>
                      Completá tu usuario y WhatsApp al registrarte para ganar{" "}
                      <b>+50 puntos Club Valette</b> de bienvenida.
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                    <div>
                      <label
                        htmlFor="signup-name"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Nombre y Apellido *
                      </label>
                      <input
                        id="signup-name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        enterKeyHint="next"
                        value={registerForm.nombre}
                        onChange={(e) =>
                          setRegisterForm((s) => ({
                            ...s,
                            nombre: e.target.value,
                          }))
                        }
                        placeholder="Ej: Juan Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Correo Electrónico *
                      </label>
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        spellCheck={false}
                        enterKeyHint="next"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm((s) => ({
                            ...s,
                            email: e.target.value,
                          }))
                        }
                        placeholder="tu@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label
                          htmlFor="signup-tel"
                          className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                        >
                          WhatsApp
                        </label>
                        <input
                          id="signup-tel"
                          name="tel"
                          type="tel"
                          autoComplete="tel"
                          enterKeyHint="next"
                          value={registerForm.telefono}
                          onChange={(e) =>
                            setRegisterForm((s) => ({
                              ...s,
                              telefono: e.target.value,
                            }))
                          }
                          placeholder="11 3553-4033"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="signup-username"
                          className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                        >
                          Usuario
                        </label>
                        <input
                          id="signup-username"
                          name="nickname"
                          type="text"
                          spellCheck={false}
                          autoCapitalize="none"
                          autoCorrect="off"
                          enterKeyHint="next"
                          value={registerForm.usuario}
                          onChange={(e) =>
                            setRegisterForm((s) => ({
                              ...s,
                              usuario: e.target.value,
                            }))
                          }
                          placeholder="@juanperez"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-password"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          id="signup-password"
                          name="new-password"
                          type={showPass ? "text" : "password"}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          enterKeyHint="next"
                          value={registerForm.password}
                          onChange={(e) =>
                            setRegisterForm((s) => ({
                              ...s,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          aria-label={
                            showPass
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPass ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="signup-referral"
                        className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                      >
                        Código de Invitación (Opcional · +50 pts)
                      </label>
                      <input
                        id="signup-referral"
                        name="referral_code"
                        type="text"
                        spellCheck={false}
                        enterKeyHint="done"
                        value={registerForm.codigo_referido}
                        onChange={(e) =>
                          setRegisterForm((s) => ({
                            ...s,
                            codigo_referido: e.target.value,
                          }))
                        }
                        placeholder="Ej: 48291"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Creando cuenta...</span>
                      </>
                    ) : (
                      <span>Crear Cuenta y Sumarme al Club</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SUB-VISTA: GESTIONAR PERFIL */}
          {activeView === "edit-profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pb-6">
              {!user?.perfil_completo && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-600 shrink-0" />
                  <span>
                    ¡Completá tu usuario y teléfono WhatsApp para recibir{" "}
                    <b>+50 puntos de regalo</b>!
                  </span>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Nombre y Apellido
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formState.nombre}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, nombre: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Correo Electrónico
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    value={formState.email}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="profile-usuario"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Usuario
                    </label>
                    <input
                      id="profile-usuario"
                      type="text"
                      spellCheck={false}
                      value={formState.usuario}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, usuario: e.target.value }))
                      }
                      placeholder="@usuario"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-tel"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Teléfono WhatsApp
                    </label>
                    <input
                      id="profile-tel"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={formState.telefono}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          telefono: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-address"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Dirección de Entrega Habitual
                  </label>
                  <input
                    id="profile-address"
                    type="text"
                    autoComplete="street-address"
                    value={formState.direccion}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        direccion: e.target.value,
                      }))
                    }
                    placeholder="Calle, altura y localidad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {isBusy ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>
          )}

          {/* SUB-VISTA: CLUB VALETTE & PUNTOS REALES */}
          {activeView === "points" && (
            <div className="space-y-4 pb-6">
              <div className="bg-[#003366] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-amber-300">
                    Club Valette Oficial
                  </span>
                  <Sparkles className="size-4 text-amber-300" />
                </div>
                <div className="text-3xl font-black font-num tracking-tight">
                  {profileData.puntos.toLocaleString("es-AR")} pts
                </div>
                <p className="text-xs text-blue-100 mt-1">
                  Equivalen a{" "}
                  <strong className="text-white font-num">
                    {formatPrecio(profileData.equivalenciaPesos)}
                  </strong>{" "}
                  acumulados en tu cuenta Club Valette.
                </p>
              </div>

              {/* Tarjeta de Código de Referido */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Tu Código de Invitación
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tus amigos reciben 50 pts al registrarse con tu código y vos
                    sumás 100 pts extra.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 font-black text-xs text-[#003366] tracking-wider font-num text-center">
                    {isAuthenticated ? profileData.codigoReferido : "INGRESÁ PARA VER"}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReferral}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedCode ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedCode ? "Copiado" : "Copiar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareReferral}
                    className="px-3.5 py-2.5 rounded-xl bg-[#003366] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-valette-dark transition-colors"
                  >
                    <Share2 className="size-3.5" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>

              {/* Historial real de puntos desde PostgreSQL */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Movimientos recientes
                </span>
                {puntosHistorial.length === 0 ? (
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-6 text-center shadow-2xs text-xs text-slate-500">
                    {isAuthenticated
                      ? "Todavía no registrás movimientos de puntos. ¡Sumás puntos con cada pedido!"
                      : "Iniciá sesión para consultar tu historial de puntos Club Valette."}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-2xs text-xs">
                    {puntosHistorial.map((mov) => (
                      <div
                        key={mov.id}
                        className="p-3.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {mov.descripcion || `Movimiento (${mov.tipo})`}
                          </p>
                          <p className="text-[11px] text-slate-400 font-num">
                            {mov.creado_en
                              ? new Date(mov.creado_en).toLocaleDateString(
                                  "es-AR"
                                )
                              : "Sucursal Luis Guillón"}
                          </p>
                        </div>
                        <span
                          className={`font-extrabold font-num shrink-0 ${
                            Number(mov.puntos) >= 0
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {Number(mov.puntos) >= 0
                            ? `+${mov.puntos} pts`
                            : `${mov.puntos} pts`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VISTA: HISTORIAL REAL DE PEDIDOS */}
          {activeView === "orders" && (
            <div className="space-y-3 pb-6">
              {pedidosHistorial.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs">
                  <Package className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    Todavía no tenés pedidos registrados
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tus compras en la Sucursal Virtual aparecerán acá con su
                    ticket de balanza.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pedidosHistorial.map((ped) => {
                    const totalPed =
                      Number(ped.monto_total_final) ||
                      Number(ped.monto_total_estimado) ||
                      0;
                    return (
                      <div
                        key={ped.id}
                        onClick={() => {
                          setActiveOrderId(ped.id);
                          handleCloseModal();
                          onOpenTrackingModal?.();
                        }}
                        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 font-num">
                              Pedido #{String(ped.id).padStart(4, "0")}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                              {ped.estado_local || "solicitado"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-num">
                            {ped.creado_en
                              ? new Date(ped.creado_en).toLocaleDateString(
                                  "es-AR"
                                )
                              : "Luis Guillón"}{" "}
                            ·{" "}
                            {Array.isArray(ped.items)
                              ? `${ped.items.length} cortes`
                              : "Sucursal Luis Guillón"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-sm text-[#003366] font-num">
                            {formatPrecio(totalPed)}
                          </span>
                          <ChevronRight className="size-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-VISTA: MIS CORTES FAVORITOS */}
          {activeView === "favorites" && (
            <div className="space-y-3 pb-6">
              {favoriteProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs">
                  <Heart className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    Todavía no guardaste cortes favoritos
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tocá el corazón en cualquier corte del catálogo para tenerlo
                    siempre a mano.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  {favoriteProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        onClick={() => {
                          handleCloseModal();
                          onOpenProduct?.(prod);
                        }}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre || prod.nombre_producto}
                          className="size-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/60"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {prod.nombre || prod.nombre_producto}
                          </h4>
                          <p className="text-xs font-black text-[#003366] font-num mt-0.5">
                            {formatPrecio(prod.precio)}{" "}
                            <span className="text-[10px] font-normal text-slate-400">
                              /{prod.unidad_medida || "kg"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite(
                            prod.id,
                            prod.nombre || prod.nombre_producto
                          )
                        }
                        className="size-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                        title="Quitar de favoritos"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VISTA: CONTRASEÑA Y SEGURIDAD */}
          {activeView === "security" && (
            <form onSubmit={handleSaveSecurity} className="space-y-4 pb-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">
                    Tu sesión se encuentra protegida con cifrado activo
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="sec-current-password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Contraseña Actual
                  </label>
                  <input
                    id="sec-current-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={securityForm.actual}
                    onChange={(e) =>
                      setSecurityForm((s) => ({ ...s, actual: e.target.value }))
                    }
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sec-new-password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Nueva Contraseña
                  </label>
                  <input
                    id="sec-new-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={securityForm.nueva}
                    onChange={(e) =>
                      setSecurityForm((s) => ({ ...s, nueva: e.target.value }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sec-confirm-password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    id="sec-confirm-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={securityForm.confirmar}
                    onChange={(e) =>
                      setSecurityForm((s) => ({
                        ...s,
                        confirmar: e.target.value,
                      }))
                    }
                    placeholder="Repetí la nueva contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                {isBusy ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </form>
          )}

          {/* SUB-VISTA: CENTRO DE SOPORTE Y ATENCIÓN */}
          {activeView === "support" && (
            <div className="space-y-4 pb-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Canales de resolución rápida
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppSupport(
                        `consulta sobre el pesaje o corte del pedido #${profileData.pedidoActivoId || ""}`
                      )
                    }
                    className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
                        <Scale className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Consulta sobre Pesaje o Fraccionado
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Comunicarse directo con el mostrador de corte
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppSupport(
                        `seguimiento de entrega de mi pedido #${profileData.pedidoActivoId || ""}`
                      )
                    }
                    className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-9 rounded-xl bg-blue-50 border border-blue-200/80 text-[#003366] flex items-center justify-center shrink-0">
                        <Clock className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Demora o Cambio de Horario de Entrega
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Coordinar franja horaria con logística de sucursal
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppSupport("atención al cliente general")
                    }
                    className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="size-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
                        <MessageCircle className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          Hablar con un Encargado por WhatsApp
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Casa Central Luis Guillón ·{" "}
                          {selectedBranch?.horario ||
                            "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Información importante de compra
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 p-4 space-y-3 shadow-2xs text-xs">
                  <div>
                    <h5 className="font-extrabold text-slate-800">
                      ¿Por qué el total es estimado al confirmar?
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Al tratarse de cortes frescos a cuchillo, el peso exacto
                      se confirma en balanza cuando el cortador prepara tu
                      pedido. Recibirás el ticket final exacto antes de abonar.
                    </p>
                  </div>
                  <div className="pt-3">
                    <h5 className="font-extrabold text-slate-800">
                      ¿Cómo funcionan los descuentos por volumen?
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Superando el mínimo de kilos indicado en cada corte (ej. 3
                      kg), el carrito aplica el precio promocional por kilo de
                      forma automática.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
