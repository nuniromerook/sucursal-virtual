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
  Camera,
  Copy,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  Scale,
  Clock,
  Trash2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useLocation } from "@/context/LocationContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useCatalogo } from "@/context/CatalogoContext";
import { useNotifications } from "@/context/NotificationContext";
import { formatPrecio } from "@/utils/formatters";
import { useModalBehavior } from "@/hooks/useModalBehavior";

const PROFILE_STORAGE_KEY = "valette_user_profile";

const DEFAULT_PROFILE = {
  nombre: "Juan Pérez del Carmen",
  email: "juan.perez@gmail.com",
  usuario: "@nuniromerook",
  telefono: "11 3553-4033",
  puntos: 14120,
  equivalenciaPesos: 2800,
  codigoReferido: "VALETTE-JUAN42",
  pedidoActivoId: "0259",
  pedidoActivoEstado: "En preparación",
};

export const ProfileModal = ({
  isOpen,
  onClose,
  onOpenTrackingModal,
  onOpenBranchModal,
  onOpenNotificationsModal,
  onOpenProduct,
}) => {
  const { showToast } = useToast();
  const { selectedBranch, deliveryMode, customerAddress, setCustomerAddress } =
    useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const { productos } = useCatalogo();
  const { unreadCount } = useNotifications();

  // Vista interna del modal: "main" | "edit-profile" | "points" | "favorites" | "security" | "support"
  const [activeView, setActiveView] = useState("main");

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
      }
    } catch {
      // Ignorar errores de lectura de localStorage
    }
    return DEFAULT_PROFILE;
  });

  // Formulario de edición de perfil
  const [formState, setFormState] = useState({
    nombre: profile.nombre,
    email: profile.email,
    usuario: profile.usuario,
    telefono: profile.telefono,
    direccion: customerAddress || "J. Tarulli 1474 (Guillón)",
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
    onClose();
  };

  const { handleBackdropClick, modalRef, dragHandleProps } = useModalBehavior(
    isOpen,
    handleCloseModal,
  );

  if (!isOpen) return null;

  const favoriteProducts = productos.filter((p) => favorites.includes(p.id));

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(profile.codigoReferido);
      setCopiedCode(true);
      showToast(
        `¡Código ${profile.codigoReferido} copiado al portapapeles! 🎁`,
      );
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      showToast(`Tu código es: ${profile.codigoReferido}`, "info");
    }
  };

  const handleShareReferral = async () => {
    const shareText = `¡Pedí en Abastecedora Valette con mi código ${profile.codigoReferido} y sumá 500 puntos de regalo en tu primera compra! 🥩🔥`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Club Valette — Invitar Amigos",
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fallback a copiar si cancela el share nativo
      }
    }
    handleCopyReferral();
  };

  const handleOpenEditProfile = () => {
    setFormState({
      nombre: profile.nombre,
      email: profile.email,
      usuario: profile.usuario,
      telefono: profile.telefono,
      direccion: customerAddress || "",
    });
    setActiveView("edit-profile");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      nombre: formState.nombre.trim() || profile.nombre,
      email: formState.email.trim() || profile.email,
      usuario: formState.usuario.trim() || profile.usuario,
      telefono: formState.telefono.trim() || profile.telefono,
    };
    setProfile(updated);
    if (formState.direccion.trim()) {
      setCustomerAddress(formState.direccion.trim());
    }
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar error de almacenamiento
    }
    showToast("Datos de perfil actualizados correctamente");
    setActiveView("main");
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (!securityForm.nueva || securityForm.nueva.length < 6) {
      showToast("La nueva contraseña debe tener al menos 6 caracteres", "info");
      return;
    }
    if (securityForm.nueva !== securityForm.confirmar) {
      showToast("Las contraseñas no coinciden", "info");
      return;
    }
    setSecurityForm({ actual: "", nueva: "", confirmar: "" });
    showToast("Contraseña actualizada con éxito 🔒");
    setActiveView("main");
  };

  const openWhatsAppSupport = (motivo = "consulta general") => {
    const rawPhone = (selectedBranch?.telefono || "1135534033").replace(
      /\D/g,
      "",
    );
    const fullPhone = rawPhone.startsWith("54") ? rawPhone : `549${rawPhone}`;
    const sucursalNombre = selectedBranch?.nombre || "Luis Guillón";
    const texto = encodeURIComponent(
      `Hola Abastecedora Valette (Sucursal ${sucursalNombre})! Soy ${profile.nombre} y me contacto desde la Sucursal Virtual por: ${motivo}.`,
    );
    window.open(`https://wa.me/${fullPhone}?text=${texto}`, "_blank");
  };

  const viewTitles = {
    main: "Mi Perfil",
    "edit-profile": "Gestionar Perfil",
    points: "Club Valette",
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
              onClick={() =>
                activeView === "main"
                  ? handleCloseModal()
                  : setActiveView("main")
              }
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
          {activeView === "main" && (
            <>
              {/* 1. Tarjeta Superior de Perfil (Estilo limpio inspirado en referencia) */}
              <div
                onClick={handleOpenEditProfile}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3.5 cursor-pointer hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative size-15 rounded-full bg-[#003366] text-white flex items-center justify-center shrink-0 shadow-xs border-2 border-slate-100">
                    <img
                      src="/favicon.svg"
                      alt={profile.nombre}
                      className="size-full rounded-full object-cover"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <Camera className="size-3 text-[#003366]" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[15px] font-extrabold text-slate-900 leading-snug truncate">
                      {profile.nombre}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {profile.email}
                    </p>
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
                        Gestionar Perfil
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
                        Seguir Pedido
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-extrabold font-num">
                        #{profile.pedidoActivoId} · En curso
                      </span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>

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
                    onClick={() => setActiveView("security")}
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
                        {profile.puntos.toLocaleString("es-AR")} pts
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
                        +500 pts
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
                          "info",
                        );
                      }}
                      className="accent-[#003366] size-4 cursor-pointer rounded"
                    />
                  </label>
                </div>
              </div>

              {/* 5. Sección: Soporte y Ayuda (Funcional y directo) */}
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
                        Centro de Ayuda y Reclamos
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
                        `consulta sobre mi pedido #${profile.pedidoActivoId}`,
                      )
                    }
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="size-[18px] text-emerald-600 stroke-[1.75]" />
                      <span className="text-[13px] font-semibold text-slate-800">
                        WhatsApp Sucursal {selectedBranch?.nombre || "Guillón"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[10px] font-extrabold">
                        En línea
                      </span>
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Botón Cerrar Sesión */}
              <div className="pt-1 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseModal();
                    showToast("Sesión cerrada correctamente", "info");
                  }}
                  className="w-full py-3.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <LogOut className="size-3.5 stroke-[2.25]" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}

          {/* SUB-VISTA: GESTIONAR PERFIL */}
          {activeView === "edit-profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pb-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.nombre}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, nombre: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={formState.usuario}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, usuario: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Teléfono WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
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
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Dirección de Entrega Habitual
                  </label>
                  <input
                    type="text"
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
                className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Guardar Cambios
              </button>
            </form>
          )}

          {/* SUB-VISTA: CLUB VALETTE & PUNTOS */}
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
                  {profile.puntos.toLocaleString("es-AR")} pts
                </div>
                <p className="text-xs text-blue-100 mt-1">
                  Equivalen a{" "}
                  <strong className="text-white font-num">
                    {formatPrecio(profile.equivalenciaPesos)}
                  </strong>{" "}
                  disponibles para descontar en tu próximo pedido.
                </p>
              </div>

              {/* Tarjeta de Código de Referido */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Tu Código de Invitación
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tus amigos reciben 500 pts y vos sumás 500 pts con su
                      primera compra.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 font-black text-xs text-[#003366] tracking-wider font-num text-center">
                    {profile.codigoReferido}
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

              {/* Historial reciente de puntos */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Movimientos recientes
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 shadow-2xs text-xs">
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        Compra Pedido #VAL-0259
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sucursal Luis Guillón
                      </p>
                    </div>
                    <span className="font-extrabold text-emerald-700 font-num">
                      +120 pts
                    </span>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">
                        Bono por Referido Completado
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Invitación aceptada
                      </p>
                    </div>
                    <span className="font-extrabold text-emerald-700 font-num">
                      +500 pts
                    </span>
                  </div>
                </div>
              </div>
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
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.actual}
                    onChange={(e) =>
                      setSecurityForm((s) => ({ ...s, actual: e.target.value }))
                    }
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={securityForm.nueva}
                    onChange={(e) =>
                      setSecurityForm((s) => ({ ...s, nueva: e.target.value }))
                    }
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#003366] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
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
                className="w-full py-3.5 rounded-2xl bg-[#003366] hover:bg-valette-dark text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Actualizar Contraseña
              </button>
            </form>
          )}

          {/* SUB-VISTA: CENTRO DE SOPORTE Y ATENCIÓN */}
          {activeView === "support" && (
            <div className="space-y-4 pb-6">
              {/* Acciones directas y útiles */}
              <div>
                <span className="text-xs font-semibold text-slate-400 mb-2 pl-1 block">
                  Canales de resolución rápida
                </span>
                <div className="bg-white border border-slate-200/70 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() =>
                      openWhatsAppSupport(
                        `consulta sobre el pesaje o corte del pedido #${profile.pedidoActivoId}`,
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
                        `seguimiento de entrega de mi pedido #${profile.pedidoActivoId}`,
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
                          Sucursal {selectedBranch?.nombre || "Luis Guillón"} ·{" "}
                          {selectedBranch?.horario || "Lun a Sáb 07 a 15 hs"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Preguntas frecuentes útiles del negocio */}
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
