// src/components/modals/ProfileModal.jsx
import { useState, useRef, useEffect } from "react";
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
  Ticket,
  Truck,
  Mail,
  ShoppingBag,
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
import { uploadAvatarToCloudinary } from "@/utils/cloudinary";
import {
  parseAddressParts,
  composeAddress,
  buildStructuredAddress,
} from "@/utils/address";

function isOrderTerminal(estadoRaw) {
  const est = String(estadoRaw || "").toLowerCase();
  return (
    est.includes("entregado") ||
    est.includes("completado") ||
    est.includes("cancelado") ||
    est.includes("rechazado")
  );
}

const AUTH_ONLY_VIEWS = new Set([
  "edit-profile",
  "security",
  "onboarding-address",
]);

export const ProfileModal = ({
  isOpen,
  initialView = "main",
  originView = "main",
  pendingCheckout = false,
  onAuthFlowComplete,
  resetToken = "",
  onClearResetToken,
  onBack,
  onClose,
  onOpenTrackingModal,
  onOpenBranchModal,
  onOpenNotificationsModal,
  onOpenProduct,
}) => {
  const { showToast } = useToast();
  const {
    selectedBranch,
    deliveryMode,
    customerAddress,
    updateCustomerAddress,
  } = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { productos } = useCatalogo();
  const { unreadCount } = useNotifications();
  const {
    user,
    isAuthenticated,
    puntosHistorial,
    pedidosHistorial,
    canjesHistorial,
    recompensas,
    login,
    register,
    updateProfile,
    changePassword,
    requestPasswordReset,
    confirmPasswordReset,
    validateReferralCode,
    redeemReward,
    logout,
  } = useAuth();
  const { activeOrderId, setActiveOrderId } = useCart();

  // Vista interna: "main" | "auth" | "forgot-password" | "reset-password" | "edit-profile" | "points" | "orders" | "favorites" | "security" | "support"
  const [activeView, setActiveView] = useState(() =>
    !isAuthenticated && AUTH_ONLY_VIEWS.has(initialView) ? "auth" : initialView,
  );
  const currentView =
    !isAuthenticated && AUTH_ONLY_VIEWS.has(activeView) ? "auth" : activeView;
  const [authTab, setAuthTab] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [redeemingId, setRedeemingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const avatarInputRef = useRef(null);
  const onboardingHeadingRef = useRef(null);

  // Mover el foco al encabezado del paso "Por último" al transicionar dinámicamente
  useEffect(() => {
    if (isOpen && currentView === "onboarding-address") {
      onboardingHeadingRef.current?.focus();
    }
  }, [isOpen, currentView]);

  // Estado formulario paso "Por último" (dirección de entrega post-registro)
  const [onboardingAddress, setOnboardingAddress] = useState(() =>
    parseAddressParts(customerAddress || "", user?.direccion_datos || null),
  );

  // Estado formulario Login
  const [loginForm, setLoginForm] = useState({
    identificador: "",
    password: "",
  });

  // Estado recuperación de contraseña
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Estado formulario Registro + validación en vivo de referido
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    usuario: "",
    password: "",
    codigo_referido: "",
  });
  const [referralStatus, setReferralStatus] = useState(null); // null | { checking } | { valido, nombre, usuario }

  // Formulario de edición de perfil
  const [formState, setFormState] = useState(() => {
    const addr = parseAddressParts(
      user?.direccion_default || customerAddress || "",
      user?.direccion_datos || null,
    );
    return {
      nombre: user?.nombre || "",
      email: user?.email || "",
      usuario: user?.usuario || "",
      telefono: user?.telefono || "",
      calle: addr.calle,
      altura: addr.altura,
      piso: addr.piso,
      depto: addr.depto,
      localidad: addr.localidad,
      codigo_postal: addr.codigo_postal,
      referencias: addr.referencias,
      avatar_url: user?.avatar_url || "",
    };
  });

  // Preferencias operativas
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

  const handleBackModal = () => {
    setFormError(null);
    if (activeView !== "main" && activeView !== originView) {
      setActiveView("main");
    } else if (onBack) {
      setActiveView("main");
      onBack();
    } else if (activeView !== "main") {
      setActiveView("main");
    } else {
      handleCloseModal();
    }
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleBackModal,
  );

  if (!isOpen) return null;

  const activeOrderFromHistory = isAuthenticated
    ? pedidosHistorial.find(
        (p) => !isOrderTerminal(p?.estado_local || p?.estado),
      ) || null
    : null;

  const activeOrderMatch = activeOrderId
    ? pedidosHistorial.find((p) => Number(p.id) === Number(activeOrderId))
    : null;

  const resolvedPedidoActivoId =
    activeOrderId &&
    !(
      activeOrderMatch &&
      isOrderTerminal(activeOrderMatch.estado_local || activeOrderMatch.estado)
    )
      ? activeOrderId
      : activeOrderFromHistory?.id || null;

  const profileData = {
    nombre: user?.nombre || "Invitado Valette",
    email: user?.email || "Para sumar puntos Club Valette",
    usuario: user?.usuario || "",
    telefono: user?.telefono || "",
    puntos: Number(user?.puntos || 0),
    equivalenciaPesos: Number(user?.equivalenciaPesos || 0),
    codigoReferido: user?.codigoReferido || "VALETTE",
    pedidoActivoId: resolvedPedidoActivoId,
  };

  const favoriteProducts = productos.filter((p) =>
    favorites.includes(Number(p.id)),
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
        `¡Código ${profileData.codigoReferido} copiado al portapapeles! 🎁`,
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
    setFormSuccess(null);
    if (!isAuthenticated) {
      setActiveView("auth");
      return;
    }
    const addr = parseAddressParts(
      user?.direccion_default || customerAddress || "",
      user?.direccion_datos || null,
    );
    setFormState({
      nombre: user?.nombre || "",
      email: user?.email || "",
      usuario: user?.usuario || "",
      telefono: user?.telefono || "",
      calle: addr.calle,
      altura: addr.altura,
      piso: addr.piso,
      depto: addr.depto,
      localidad: addr.localidad,
      codigo_postal: addr.codigo_postal,
      referencias: addr.referencias,
      avatar_url: user?.avatar_url || "",
    });
    setActiveView("edit-profile");
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setFormError(null);
    try {
      const uploadedUrl = await uploadAvatarToCloudinary(file);
      setFormState((s) => ({ ...s, avatar_url: uploadedUrl }));
      const composedAddr = composeAddress(formState);
      await updateProfile({
        nombre: formState.nombre || user?.nombre || undefined,
        usuario: formState.usuario || user?.usuario || undefined,
        telefono: formState.telefono || user?.telefono || undefined,
        direccion_default: composedAddr || user?.direccion_default || undefined,
        avatar_url: uploadedUrl,
      });
      showToast("¡Foto de perfil actualizada! 📸");
    } catch (err) {
      setFormError(err.message || "No se pudo subir la imagen.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (isUploadingAvatar) return;
    setIsUploadingAvatar(true);
    setFormError(null);
    try {
      setFormState((s) => ({ ...s, avatar_url: "" }));
      await updateProfile({ avatar_url: "" });
      showToast("Foto de perfil quitada", "info");
    } catch (err) {
      setFormError(err.message || "No se pudo quitar la foto.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleValidateReferral = async (rawCode) => {
    const clean = String(rawCode || "")
      .trim()
      .toUpperCase();
    if (clean.length < 3) {
      setReferralStatus(null);
      return;
    }
    setReferralStatus({ checking: true });
    try {
      const data = await validateReferralCode(clean);
      setReferralStatus(data);
    } catch {
      setReferralStatus({ valido: false });
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isBusy || !forgotEmail.trim()) return;
    setIsBusy(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const data = await requestPasswordReset(forgotEmail.trim());
      setFormSuccess(
        data.message ||
          "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
      showToast("Revisá tu correo electrónico 📧");
    } catch (err) {
      setFormError(err.message || "Error al solicitar la recuperación.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmResetSubmit = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    if (resetForm.newPassword.length < 6) {
      setFormError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    setIsBusy(true);
    setFormError(null);
    try {
      const data = await confirmPasswordReset({
        token: resetToken,
        newPassword: resetForm.newPassword,
      });
      showToast(data.message || "Contraseña restablecida con éxito");
      setResetForm({ newPassword: "", confirmPassword: "" });
      onClearResetToken?.();
      if (onAuthFlowComplete?.()) return;
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "El enlace expiró o es inválido.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRedeemReward = async (rew) => {
    if (!isAuthenticated) {
      setActiveView("auth");
      showToast(
        "Iniciá sesión para canjear tus puntos del Club Valette ⭐",
        "info",
      );
      return;
    }
    if (redeemingId) return;
    setRedeemingId(rew.id);
    setFormError(null);
    try {
      const res = await redeemReward(rew.id);
      showToast(res.message || `¡Canjeaste "${rew.titulo}" con éxito! 🎉`);
    } catch (err) {
      setFormError(err.message || "No se pudo completar el canje.");
    } finally {
      setRedeemingId(null);
    }
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
      if (data.user?.direccion_default && !customerAddress) {
        updateCustomerAddress(data.user.direccion_default);
      }
      setLoginForm({ identificador: "", password: "" });
      if (onAuthFlowComplete?.()) return;
      showToast(`Bienvenido, ${data.user?.nombre || "a Valette"}`);
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
      showToast(data.message || "¡Cuenta creada! Cargá tu dirección de envío.");
      setRegisterForm({
        nombre: "",
        email: "",
        telefono: "",
        usuario: "",
        password: "",
        codigo_referido: "",
      });
      setOnboardingAddress(parseAddressParts(customerAddress || "", null));
      setActiveView("onboarding-address");
    } catch (err) {
      setFormError(err.message || "Error al crear la cuenta.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveOnboardingAddress = async (e) => {
    e.preventDefault();
    if (isBusy) return;
    if (
      !onboardingAddress.calle.trim() ||
      !onboardingAddress.altura.trim() ||
      !onboardingAddress.localidad.trim()
    ) {
      setFormError(
        "Completá calle, altura y localidad para guardar tu dirección.",
      );
      return;
    }
    setIsBusy(true);
    setFormError(null);
    try {
      const direccionFormateada = composeAddress(onboardingAddress);
      const direccionDatos = buildStructuredAddress(onboardingAddress);
      await updateProfile({
        direccion_default: direccionFormateada,
        direccion_datos: direccionDatos,
      });
      if (direccionFormateada) {
        updateCustomerAddress(direccionFormateada);
      }
      if (onAuthFlowComplete?.()) return;
      showToast("Dirección de entrega guardada");
      setActiveView("main");
    } catch (err) {
      setFormError(err.message || "No pudimos guardar tu dirección.");
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
      const direccionFormateada = composeAddress(formState);
      const direccionDatos = buildStructuredAddress(formState);
      const res = await updateProfile({
        nombre: formState.nombre.trim(),
        usuario: formState.usuario.trim(),
        telefono: formState.telefono.trim(),
        direccion_default: direccionFormateada,
        direccion_datos: direccionDatos,
        avatar_url: formState.avatar_url,
      });
      if (direccionFormateada) {
        updateCustomerAddress(direccionFormateada);
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
      "",
    );
    const fullPhone = rawPhone.startsWith("54") ? rawPhone : `549${rawPhone}`;
    const sucursalNombre = selectedBranch?.nombre || "Luis Guillón";
    const texto = encodeURIComponent(
      `Hola Abastecedora Valette (Sucursal ${sucursalNombre})! Soy ${profileData.nombre} y me contacto desde la Sucursal Virtual por: ${motivo}.`,
    );
    window.open(`https://wa.me/${fullPhone}?text=${texto}`, "_blank");
  };

  const viewTitles = {
    main: "Mi Perfil",
    auth: authTab === "login" ? "Iniciar Sesión" : "Crear Cuenta Club Valette",
    "onboarding-address": "Por último",
    "forgot-password": "Recuperar Contraseña",
    "reset-password": "Nueva Contraseña",
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
        className="bg-[#F6F8FA] w-full sm:max-w-md rounded-t-4xl sm:rounded-3xl shadow-2xl h-[86dvh] sm:max-h-[88dvh] overflow-hidden flex flex-col p-0 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 overscroll-contain"
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
              onClick={handleBackModal}
              className="size-8 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold cursor-pointer shadow-2xs transition-colors"
              aria-label="Volver"
              title="Volver"
            >
              <ChevronLeft className="size-4 stroke-[2.25]" />
            </button>

            <h3 className="text-[15px] font-extrabold text-slate-900 tracking-tight">
              {viewTitles[currentView] || "Mi Perfil"}
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
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-5 overscroll-contain">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              <span>{formSuccess}</span>
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
                  <div className="relative size-18 rounded-full bg-[#E4E6EB] flex items-center justify-center shrink-0 shadow-xs border border-slate-200/90">
                    {isAuthenticated && user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={profileData.nombre}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="size-full rounded-full overflow-hidden bg-[#E4E6EB] flex items-end justify-center">
                        <svg
                          viewBox="0 0 35 30"
                          fill="none"
                          aria-hidden="true"
                          className="size-full text-[#65676B]"
                        >
                          <circle cx="18" cy="13.5" r="6" fill="currentColor" />
                          <path
                            d="M6.5 34C6.5 26.8203 11.6487 22 18 22C24.3513 22 29.5 26.8203 29.5 34"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    )}
                    {isAuthenticated && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                        <span className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                          <Camera
                            className="size-3 text-[#003366]"
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[15px] font-extrabold text-slate-900 leading-snug truncate">
                      {isAuthenticated
                        ? profileData.nombre
                        : "Ingresá a tu cuenta"}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {profileData.email}
                    </p>
                    {!isAuthenticated && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full bg-[#003366] text-white text-[10px] font-bold">
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
                    onClick={() => onOpenTrackingModal?.(activeView)}
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
                          #{String(profileData.pedidoActivoId).padStart(4, "0")}{" "}
                          · Activo
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Sin pedido
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

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setActiveView("security");
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
                  )}
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
                    onClick={() => onOpenBranchModal?.(activeView)}
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
                    onClick={() => onOpenNotificationsModal?.(activeView)}
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
                          : "consulta desde la Sucursal Virtual",
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
                      setActiveOrderId(null);
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
          {currentView === "auth" && (
            <div className="space-y-4 pb-6">
              {pendingCheckout && (
                <div className="p-3 rounded-2xl bg-[#EFF4F9] border border-[#003366]/15 text-[#003366] text-xs font-bold flex items-center gap-2.5">
                  <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
                  <span>
                    Tu carrito quedó guardado. Ingresá o creá tu cuenta para
                    retomar tu compra.
                  </span>
                </div>
              )}

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

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setFormSuccess(null);
                        setForgotEmail(
                          loginForm.identificador.includes("@")
                            ? loginForm.identificador
                            : "",
                        );
                        setActiveView("forgot-password");
                      }}
                      className="text-xs font-bold text-[#003366] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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
                      <div className="flex gap-2">
                        <input
                          id="signup-referral"
                          name="referral_code"
                          type="text"
                          spellCheck={false}
                          enterKeyHint="done"
                          value={registerForm.codigo_referido}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRegisterForm((s) => ({
                              ...s,
                              codigo_referido: val,
                            }));
                            setReferralStatus(null);
                          }}
                          onBlur={(e) => handleValidateReferral(e.target.value)}
                          placeholder="Ej: 48291"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num uppercase"
                        />
                        {registerForm.codigo_referido.trim().length >= 3 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleValidateReferral(
                                registerForm.codigo_referido,
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer shrink-0"
                          >
                            Validar
                          </button>
                        )}
                      </div>
                      {referralStatus?.checking && (
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">
                          Verificando código...
                        </p>
                      )}
                      {referralStatus && !referralStatus.checking && (
                        <p
                          className={`text-[11px] mt-1 font-bold ${
                            referralStatus.valido
                              ? "text-emerald-700"
                              : "text-rose-600"
                          }`}
                        >
                          {referralStatus.valido
                            ? `✓ Código válido · Invitado por ${referralStatus.nombre || referralStatus.usuario} (+50 pts)`
                            : "Código de invitación no encontrado."}
                        </p>
                      )}
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
                      <span>Crear Cuenta y Continuar</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* SUB-VISTA: PASO 2 POST-REGISTRO ("POR ÚLTIMO" — DIRECCIÓN DE ENVÍO) */}
          {currentView === "onboarding-address" && (
            <form
              onSubmit={handleSaveOnboardingAddress}
              aria-labelledby="onboarding-address-heading"
              className="space-y-4 pb-6"
            >
              {/* Indicador compacto de progreso (2 pasos) */}
              <nav aria-label="Progreso del registro">
                <ol className="flex items-center gap-2 text-[11px] font-bold">
                  <li className="flex items-center gap-1.5 text-emerald-700">
                    <span className="size-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="size-3 stroke-[3]" aria-hidden="true" />
                    </span>
                    <span>Cuenta</span>
                  </li>
                  <li className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                  <li
                    aria-current="step"
                    className="flex items-center gap-1.5 text-[#003366]"
                  >
                    <span className="size-5 rounded-full bg-[#003366] text-white flex items-center justify-center text-[10px] font-black font-num shrink-0">
                      2
                    </span>
                    <span>Dirección de envío</span>
                  </li>
                </ol>
              </nav>

              {/* Encabezado limpio estilo design-criteria.md */}
              <div className="flex items-start gap-3">
                <div
                  className="size-10 rounded-2xl bg-[#EFF4F9] text-[#003366] flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <MapPin className="size-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4
                    id="onboarding-address-heading"
                    ref={onboardingHeadingRef}
                    tabIndex={-1}
                    className="text-base font-black text-slate-900 tracking-tight leading-snug outline-none"
                  >
                    Por último, ¿dónde te enviamos?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Cargá tu dirección estándar una sola vez para agilizar tus
                    envíos.
                  </p>
                </div>
              </div>

              {/* Formulario estructurado estándar para integraciones de envíos */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label
                      htmlFor="onboarding-calle"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Calle *
                    </label>
                    <input
                      id="onboarding-calle"
                      name="address-line1"
                      type="text"
                      required
                      autoComplete="shipping address-line1"
                      enterKeyHint="next"
                      value={onboardingAddress.calle}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          calle: e.target.value,
                        }))
                      }
                      placeholder="Ej: Av. Luciano Valette"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="onboarding-altura"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Altura / N° *
                    </label>
                    <input
                      id="onboarding-altura"
                      name="street-number"
                      type="text"
                      required
                      inputMode="numeric"
                      enterKeyHint="next"
                      value={onboardingAddress.altura}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          altura: e.target.value,
                        }))
                      }
                      placeholder="Ej: 1696"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="onboarding-piso"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Piso{" "}
                      <span className="normal-case font-medium text-slate-400">
                        (opc.)
                      </span>
                    </label>
                    <input
                      id="onboarding-piso"
                      name="floor"
                      type="text"
                      enterKeyHint="next"
                      value={onboardingAddress.piso}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          piso: e.target.value,
                        }))
                      }
                      placeholder="Ej: 2 / PB"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="onboarding-depto"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Depto / Timbre{" "}
                      <span className="normal-case font-medium text-slate-400">
                        (opc.)
                      </span>
                    </label>
                    <input
                      id="onboarding-depto"
                      name="address-line2"
                      type="text"
                      autoComplete="shipping address-line2"
                      enterKeyHint="next"
                      value={onboardingAddress.depto}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          depto: e.target.value,
                        }))
                      }
                      placeholder="Ej: B / Casa 4"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label
                      htmlFor="onboarding-localidad"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Localidad *
                    </label>
                    <input
                      id="onboarding-localidad"
                      name="address-level2"
                      type="text"
                      required
                      autoComplete="shipping address-level2"
                      enterKeyHint="next"
                      value={onboardingAddress.localidad}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          localidad: e.target.value,
                        }))
                      }
                      placeholder="Ej: Luis Guillón, Monte Grande..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="onboarding-cp"
                      className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                    >
                      Cód. Postal
                    </label>
                    <input
                      id="onboarding-cp"
                      name="postal-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      autoComplete="shipping postal-code"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      value={onboardingAddress.codigo_postal}
                      onChange={(e) =>
                        setOnboardingAddress((s) => ({
                          ...s,
                          codigo_postal: e.target.value,
                        }))
                      }
                      placeholder="Ej: 1838"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="onboarding-referencias"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Entre calles o referencias{" "}
                    <span className="normal-case font-medium text-slate-400">
                      (opcional)
                    </span>
                  </label>
                  <input
                    id="onboarding-referencias"
                    name="address-notes"
                    type="text"
                    enterKeyHint="done"
                    value={onboardingAddress.referencias}
                    onChange={(e) =>
                      setOnboardingAddress((s) => ({
                        ...s,
                        referencias: e.target.value,
                      }))
                    }
                    placeholder="Ej: Portón negro, entre Rojas y Santamarina"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                  Zona de cobertura actual: Provincia de Buenos Aires,
                  Argentina.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white font-extrabold text-xs shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando dirección...</span>
                    </>
                  ) : (
                    <span>Guardar dirección y finalizar</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    if (onAuthFlowComplete?.()) return;
                    setActiveView("main");
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  {pendingCheckout
                    ? "Continuar al pedido sin cargar dirección"
                    : "Completar más tarde"}
                </button>
              </div>
            </form>
          )}

          {/* SUB-VISTA: SOLICITAR RECUPERACIÓN DE CONTRASEÑA */}
          {activeView === "forgot-password" && (
            <form
              onSubmit={handleForgotPasswordSubmit}
              className="space-y-4 pb-6"
            >
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <Mail className="size-4 text-[#003366]" />
                  <span className="text-xs font-bold text-slate-700">
                    Te enviaremos un enlace seguro a tu correo (válido por 15
                    min)
                  </span>
                </div>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Correo Electrónico Registrado
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
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
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <span>Enviar Enlace de Recuperación</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setFormSuccess(null);
                  setActiveView("auth");
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </form>
          )}

          {/* SUB-VISTA: RESTABLECER CONTRASEÑA CON TOKEN */}
          {activeView === "reset-password" && (
            <form
              onSubmit={handleConfirmResetSubmit}
              className="space-y-4 pb-6"
            >
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">
                    Definí tu nueva contraseña para ingresar a Club Valette
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Nueva Contraseña
                  </label>
                  <input
                    id="reset-new-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={resetForm.newPassword}
                    onChange={(e) =>
                      setResetForm((s) => ({
                        ...s,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
                  >
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={resetForm.confirmPassword}
                    onChange={(e) =>
                      setResetForm((s) => ({
                        ...s,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Repetí tu nueva contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
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
                    <span>Guardando contraseña...</span>
                  </>
                ) : (
                  <span>Guardar Nueva Contraseña</span>
                )}
              </button>
            </form>
          )}

          {/* SUB-VISTA: GESTIONAR PERFIL */}
          {currentView === "edit-profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pb-6">
              {/* Selector y subida de Foto de Perfil con Cloudinary */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-4">
                <div className="relative size-18 rounded-full bg-[#E4E6EB] flex items-center justify-center shrink-0 border border-slate-200/90 overflow-hidden">
                  {formState.avatar_url ? (
                    <img
                      src={formState.avatar_url}
                      alt={formState.nombre || "Avatar"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 36 36"
                      fill="none"
                      aria-hidden="true"
                      className="size-full text-[#65676B]"
                    >
                      <circle cx="18" cy="13.5" r="6" fill="currentColor" />
                      <path
                        d="M6.5 34C6.5 26.8203 11.6487 22 18 22C24.3513 22 29.5 26.8203 29.5 34"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                      <Loader2 className="size-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs font-extrabold text-slate-900">
                    Foto de Perfil
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#003366] hover:bg-valette-dark disabled:opacity-60 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Camera className="size-3.5" />
                      <span>
                        {isUploadingAvatar
                          ? "Subiendo..."
                          : formState.avatar_url
                            ? "Cambiar foto"
                            : "Subir foto"}
                      </span>
                    </button>
                    {formState.avatar_url && (
                      <button
                        type="button"
                        disabled={isUploadingAvatar}
                        onClick={handleRemoveAvatar}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

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

                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Dirección de Entrega Habitual
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Provincia de Buenos Aires, Argentina.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2">
                      <label
                        htmlFor="profile-calle"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Calle
                      </label>
                      <input
                        id="profile-calle"
                        name="address-line1"
                        type="text"
                        autoComplete="shipping address-line1"
                        value={formState.calle}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            calle: e.target.value,
                          }))
                        }
                        placeholder="Ej: Av. Luciano Valette"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-altura"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Altura / N°
                      </label>
                      <input
                        id="profile-altura"
                        name="street-number"
                        type="text"
                        inputMode="numeric"
                        value={formState.altura}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            altura: e.target.value,
                          }))
                        }
                        placeholder="Ej: 1696"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="profile-piso"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Piso (opcional)
                      </label>
                      <input
                        id="profile-piso"
                        name="floor"
                        type="text"
                        value={formState.piso}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            piso: e.target.value,
                          }))
                        }
                        placeholder="Ej: 2 / PB"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-depto"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Depto / Timbre (opcional)
                      </label>
                      <input
                        id="profile-depto"
                        name="address-line2"
                        type="text"
                        autoComplete="shipping address-line2"
                        value={formState.depto}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            depto: e.target.value,
                          }))
                        }
                        placeholder="Ej: B / Casa 4"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2">
                      <label
                        htmlFor="profile-localidad"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Localidad
                      </label>
                      <input
                        id="profile-localidad"
                        name="address-level2"
                        type="text"
                        autoComplete="shipping address-level2"
                        value={formState.localidad}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            localidad: e.target.value,
                          }))
                        }
                        placeholder="Ej: Luis Guillón, Monte Grande..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="profile-cp"
                        className="block text-[10px] font-bold text-slate-500 mb-1"
                      >
                        Cód. Postal
                      </label>
                      <input
                        id="profile-cp"
                        name="postal-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        autoComplete="shipping postal-code"
                        autoCorrect="off"
                        spellCheck={false}
                        value={formState.codigo_postal}
                        onChange={(e) =>
                          setFormState((s) => ({
                            ...s,
                            codigo_postal: e.target.value,
                          }))
                        }
                        placeholder="Ej: 1838"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none font-num uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-referencias"
                      className="block text-[10px] font-bold text-slate-500 mb-1"
                    >
                      Entre calles o referencias (opcional)
                    </label>
                    <input
                      id="profile-referencias"
                      name="address-notes"
                      type="text"
                      value={formState.referencias}
                      onChange={(e) =>
                        setFormState((s) => ({
                          ...s,
                          referencias: e.target.value,
                        }))
                      }
                      placeholder="Ej: Portón negro, entre Rojas y Santamarina"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>
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
              <div className="bg-[#003366] text-white rounded-2xl drop-shadow-lg drop-shadow-black/60 relative overflow-hidden">
                <div className="flex items-center mb-2 px-5 pt-5">
                  <span className="text-[12px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-amber-300">
                    Club Valette
                  </span>
                  <p className="text-[13px] font-bold font-num text-blue-100 ml-auto">
                    {isAuthenticated
                      ? `ID Cliente: ${profileData.codigoReferido}`
                      : "No hay usuario logueado"}
                  </p>
                </div>
                <div className="text-3xl font-black font-num tracking-tight px-5">
                  {profileData.puntos.toLocaleString("es-AR")} puntos
                </div>
                <p className="text-xs text-blue-100 px-5 mt-1">
                  Canjeá tus puntos por premios, cortes gratis, envíos
                  bonificados y beneficios exclusivos de la casa.
                </p>

                <div className="flex w-full h-10 bg-black my-4" />
              </div>

              {/* Tarjeta de Código de Referido */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Tu ID de Cliente y Código de Invitación
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Decí este número en caja para sumar puntos en mostrador.
                    Además, tus amigos <b>reciben 50 pts al registrarse</b> con
                    tu código <b>y vos sumás 100 pts extra.</b>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 font-black text-xs text-[#003366] tracking-wider font-num text-center">
                    {isAuthenticated
                      ? profileData.codigoReferido
                      : "INGRESÁ PARA VER"}
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

              {/* Catálogo de Premios Canjeables Club Valette */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Catálogo de Recompensas
                </span>
                {recompensas.length === 0 ? (
                  <div className="bg-white border border-slate-200/70 rounded-2xl p-5 text-center text-xs text-slate-500">
                    Próximamente publicaremos nuevos premios y sorteos del Club
                    Valette.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recompensas.map((rew) => {
                      const costo = Number(rew.puntos_requeridos) || 0;
                      const alcanza =
                        isAuthenticated && profileData.puntos >= costo;
                      const sinStock =
                        rew.stock_disponible !== null &&
                        Number(rew.stock_disponible) <= 0;
                      const tipo = String(rew.tipo || "producto").toLowerCase();
                      const tipoBadge =
                        tipo === "sorteo"
                          ? {
                              label: "Sorteo",
                              cls: "bg-purple-50 text-purple-700 border-purple-200",
                              Icon: Ticket,
                            }
                          : tipo === "envio"
                            ? {
                                label: "Envío Gratis",
                                cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                Icon: Truck,
                              }
                            : tipo === "descuento"
                              ? {
                                  label: "Beneficio",
                                  cls: "bg-blue-50 text-[#003366] border-blue-200",
                                  Icon: Sparkles,
                                }
                              : {
                                  label: "Corte / Producto",
                                  cls: "bg-amber-50 text-amber-800 border-amber-200",
                                  Icon: Gift,
                                };
                      const BadgeIcon = tipoBadge.Icon;

                      return (
                        <div
                          key={rew.id}
                          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border mb-1.5 ${tipoBadge.cls}`}
                              >
                                <BadgeIcon className="size-3" />
                                <span>{tipoBadge.label}</span>
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                                {rew.titulo}
                              </h4>
                              {rew.descripcion && (
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                  {rew.descripcion}
                                </p>
                              )}
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-black font-num shrink-0">
                              {costo} pts
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400">
                              {sinStock
                                ? "Agotado temporalmente"
                                : rew.stock_disponible !== null
                                  ? `Quedan ${rew.stock_disponible} disponibles`
                                  : "Disponible para canje inmediato"}
                            </span>
                            <button
                              type="button"
                              disabled={
                                sinStock ||
                                redeemingId === rew.id ||
                                (isAuthenticated && !alcanza)
                              }
                              onClick={() => handleRedeemReward(rew)}
                              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                sinStock
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : !isAuthenticated
                                    ? "bg-[#003366] text-white hover:bg-valette-dark"
                                    : alcanza
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                      : "bg-slate-100 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              {redeemingId === rew.id ? (
                                <>
                                  <Loader2 className="size-3 animate-spin" />
                                  <span>Canjeando...</span>
                                </>
                              ) : !isAuthenticated ? (
                                <span>Ingresar para canjear</span>
                              ) : alcanza ? (
                                <span>Canjear ahora</span>
                              ) : (
                                <span>
                                  Te faltan {costo - profileData.puntos} pts
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mis Canjes y Vouchers activos */}
              {isAuthenticated && canjesHistorial.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                    Mis Códigos de Canje
                  </span>
                  <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-2xs text-xs">
                    {canjesHistorial.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {c.titulo_recompensa}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-[#003366]/10 text-[#003366] font-black font-num text-[11px]">
                              {c.codigo_canje}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.estado === "entregado"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : c.estado === "cancelado"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {c.estado}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                c.codigo_canje,
                              );
                              showToast(`Código ${c.codigo_canje} copiado`);
                            } catch {
                              showToast(`Tu código: ${c.codigo_canje}`, "info");
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0"
                          title="Copiar código"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                                  "es-AR",
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
                          onOpenTrackingModal?.(ped.id);
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
                                  "es-AR",
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
                        onClick={() => onOpenProduct?.(prod, activeView)}
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
                            prod.nombre || prod.nombre_producto,
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
          {currentView === "security" && (
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
                        `consulta sobre el pesaje o corte del pedido #${profileData.pedidoActivoId || ""}`,
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
                        `seguimiento de entrega de mi pedido #${profileData.pedidoActivoId || ""}`,
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
                          Coordinar tu entrega con la sucursal
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
