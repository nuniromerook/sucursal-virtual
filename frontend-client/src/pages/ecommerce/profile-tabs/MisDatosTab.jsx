// frontend-client/src/pages/ecommerce/profile-tabs/MisDatosTab.jsx
import React, { useState, useEffect } from "react";
import {
  AtSign,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Navigation,
  Compass,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { VITE_API_URL } from "../../../config/api";

const PROVINCIAS_ARG = ["Provincia de Buenos Aires"];

export default function MisDatosTab() {
  const { user, token, updateProfile } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    telefono: "",
  });

  // Dirección estructurada
  const [direccionForm, setDireccionForm] = useState({
    calleNumero: "",
    pisoDepto: "",
    localidad: "Luis Guillón",
    provincia: "Provincia de Buenos Aires",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Formulario Cambio de Contraseña
  const [passwordForm, setPasswordForm] = useState({
    password_actual: "",
    password_nueva: "",
    password_confirmar: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({
    type: "",
    message: "",
  });

  const inputLabel =
    "block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5";
  const inputClassnames =
    "w-full px-3.5 py-2 rounded-lg border border-neutral-300 text-base sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-main-blue/20 focus:border-main-blue transition-colors";
  const inputWithIconClassnames =
    "w-full pl-10 pr-3.5 py-2 rounded-lg border border-neutral-300 text-base sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-main-blue/20 focus:border-main-blue transition-colors";
  const iconClassnames = "size-4 text-neutral-400 absolute inset-y-0 my-auto";
  const inputHelpText = "text-[11px] text-neutral-400 mt-1";

  // Cargar y desagregar datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre
          ? user.nombre.replace(/\s*\(@[^)]+\)/g, "").trim()
          : "",
        usuario: user.usuario ? user.usuario.replace(/^@/, "") : "",
        telefono: user.telefono || "",
      });

      if (user.direccion_default) {
        const parts = user.direccion_default.split(",").map((s) => s.trim());
        if (parts.length >= 4) {
          setDireccionForm({
            calleNumero: parts[0] || "",
            pisoDepto: parts[1] || "",
            localidad: parts[2] || "Luis Guillón",
            provincia: parts[3] || "Provincia de Buenos Aires",
          });
        } else if (parts.length === 3) {
          setDireccionForm({
            calleNumero: parts[0] || "",
            pisoDepto: "",
            localidad: parts[1] || "Luis Guillón",
            provincia: parts[2] || "Provincia de Buenos Aires",
          });
        } else if (parts.length === 2) {
          setDireccionForm({
            calleNumero: parts[0] || "",
            pisoDepto: "",
            localidad: parts[1] || "Luis Guillón",
            provincia: "Provincia de Buenos Aires",
          });
        } else {
          setDireccionForm((prev) => ({
            ...prev,
            calleNumero: user.direccion_default,
          }));
        }
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    setIsUpdating(true);

    try {
      // Unir partes de la dirección de forma limpia
      const partesDireccion = [
        direccionForm.calleNumero.trim(),
        direccionForm.pisoDepto.trim(),
        direccionForm.localidad.trim(),
        direccionForm.provincia.trim(),
      ].filter(Boolean);

      const direccionCompleta = partesDireccion.join(", ");

      const payload = {
        nombre: formData.nombre.trim(),
        usuario: formData.usuario.trim().replace(/^@/, ""),
        telefono: formData.telefono.trim(),
        direccion_default: direccionCompleta,
      };

      const res = await updateProfile(payload);

      // Sincronizar en localStorage para el navbar y checkout
      if (direccionCompleta) {
        localStorage.setItem(
          "valette_direccion_seleccionada",
          direccionCompleta,
        );
        window.dispatchEvent(new Event("valette_direccion_changed"));
      }

      setFeedback({
        type: "success",
        message: res.message || "Datos y dirección actualizados correctamente.",
      });
      toast.success(
        res.message || "Datos y dirección actualizados correctamente.",
      );
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: "", message: "" });

    if (passwordForm.password_nueva.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (passwordForm.password_nueva !== passwordForm.password_confirmar) {
      setPasswordFeedback({
        type: "error",
        message: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${VITE_API_URL}/clientes/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_actual: passwordForm.password_actual,
          password_nueva: passwordForm.password_nueva,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar contraseña.");
      }

      setPasswordFeedback({
        type: "success",
        message: "¡Contraseña actualizada con éxito!",
      });
      toast.success("Contraseña actualizada con éxito.");
      setPasswordForm({
        password_actual: "",
        password_nueva: "",
        password_confirmar: "",
      });
    } catch (err) {
      setPasswordFeedback({
        type: "error",
        message: err.message || "Error al actualizar contraseña.",
      });
      toast.error(err.message || "Error al actualizar contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Formulario 1: Datos Personales & Dirección Dividida */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="border-b border-neutral-100 pb-4 mb-5">
          <h2 className="font-black text-base sm:text-lg text-neutral-900">
            Información Personal & Dirección de Entrega
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Mantené tus datos de contacto y entrega estructurados para evitar
            demoras en tus pedidos.
          </p>
        </div>

        {feedback.message && (
          <div
            className={`mb-5 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
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

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          {/* Subsección: Datos Personales */}
          <div className="space-y-4">
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
                placeholder="Juan Nuñez"
              />
            </div>

            <div>
              <label className={inputLabel}>
                Correo Electrónico (No editable)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2 rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 text-base sm:text-sm font-medium cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={inputLabel}>@Usuario / Identificador</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="nuniromerook"
                    value={formData.usuario}
                    onChange={(e) =>
                      setFormData({ ...formData, usuario: e.target.value })
                    }
                    className={inputWithIconClassnames}
                  />
                  <AtSign className={`${iconClassnames} left-3`} />
                </div>
                <p className={inputHelpText}>
                  Tu identificador para compras y beneficios.
                </p>
              </div>

              <div>
                <label className={inputLabel}>
                  WhatsApp / Teléfono de Contacto
                </label>
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
                  Para avisos de corte y confirmación de pesaje exacto.
                </p>
              </div>
            </div>
          </div>

          {/* Subsección: Dirección Dividida e Intuitiva */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-main-blue" />
              <h3 className="font-bold text-sm text-neutral-900 uppercase tracking-wider">
                Dirección Predeterminada para Envíos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Calle y Altura */}
              <div className="sm:col-span-2">
                <label className={inputLabel}>Calle y Altura / Número</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. Luciano Valette 3910"
                    value={direccionForm.calleNumero}
                    onChange={(e) =>
                      setDireccionForm({
                        ...direccionForm,
                        calleNumero: e.target.value,
                      })
                    }
                    className={inputWithIconClassnames}
                  />
                  <MapPin className={`${iconClassnames} left-3`} />
                </div>
              </div>

              {/* Piso / Depto / Timbre (Opcional) */}
              <div>
                <label className={inputLabel}>Piso / Depto (Opcional)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Ej. Piso 2 Depto B"
                    value={direccionForm.pisoDepto}
                    onChange={(e) =>
                      setDireccionForm({
                        ...direccionForm,
                        pisoDepto: e.target.value,
                      })
                    }
                    className={inputWithIconClassnames}
                  />
                  <Building2 className={`${iconClassnames} left-3`} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Localidad / Barrio */}
              <div>
                <label className={inputLabel}>Localidad / Barrio</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="Ej. Luis Guillón, Monte Grande, Ezeiza..."
                    value={direccionForm.localidad}
                    onChange={(e) =>
                      setDireccionForm({
                        ...direccionForm,
                        localidad: e.target.value,
                      })
                    }
                    className={inputWithIconClassnames}
                  />
                  <Navigation className={`${iconClassnames} left-3`} />
                </div>
              </div>

              {/* Provincia / Jurisdicción */}
              <div>
                <label className={inputLabel}>Provincia / Jurisdicción</label>
                <div className="relative flex items-center">
                  <select
                    value={direccionForm.provincia}
                    onChange={(e) =>
                      setDireccionForm({
                        ...direccionForm,
                        provincia: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-3.5 py-2 rounded-lg border border-neutral-300 text-base sm:text-sm font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-main-blue/20 focus:border-main-blue transition-colors cursor-pointer"
                  >
                    {PROVINCIAS_ARG.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  <Compass className={`${iconClassnames} left-3`} />
                </div>
              </div>
            </div>

            {/* Vista previa de dirección completa */}
            {direccionForm.calleNumero && (
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center gap-2 text-xs text-neutral-700">
                <span className="font-bold text-main-blue shrink-0">
                  Vista previa:
                </span>
                <span className="truncate">
                  {[
                    direccionForm.calleNumero,
                    direccionForm.pisoDepto,
                    direccionForm.localidad,
                    direccionForm.provincia,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2.5 rounded-lg bg-main-blue hover:bg-main-blue/90 text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isUpdating
                ? "Guardando cambios..."
                : "Guardar Datos y Dirección"}
            </button>
          </div>
        </form>
      </div>

      {/* Formulario 2: Actualizar Contraseña */}
      <div className="bg-white rounded-lg p-5 sm:p-6 border border-neutral-200/80 shadow-2xs">
        <div className="border-b border-neutral-100 pb-4 mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="size-4.5 text-main-blue" />
              <h2 className="font-black text-base sm:text-lg text-neutral-900">
                Cambiar Contraseña
              </h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Modificá tu clave de acceso para mayor seguridad.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="text-xs font-bold text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
          >
            {showPasswords ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            <span>{showPasswords ? "Ocultar" : "Mostrar"}</span>
          </button>
        </div>

        {passwordFeedback.message && (
          <div
            className={`mb-5 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              passwordFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {passwordFeedback.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-red-600" />
            )}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className={inputLabel}>Contraseña Actual</label>
            <div className="relative flex items-center">
              <input
                type={showPasswords ? "text" : "password"}
                required
                placeholder="Ingresá tu contraseña actual"
                value={passwordForm.password_actual}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    password_actual: e.target.value,
                  })
                }
                className={inputWithIconClassnames}
              />
              <Lock className={`${iconClassnames} left-3`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={inputLabel}>Nueva Contraseña</label>
              <div className="relative flex items-center">
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={passwordForm.password_nueva}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      password_nueva: e.target.value,
                    })
                  }
                  className={inputWithIconClassnames}
                />
                <Lock className={`${iconClassnames} left-3`} />
              </div>
            </div>

            <div>
              <label className={inputLabel}>Confirmar Nueva Contraseña</label>
              <div className="relative flex items-center">
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  placeholder="Repetí la nueva contraseña"
                  value={passwordForm.password_confirmar}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      password_confirmar: e.target.value,
                    })
                  }
                  className={inputWithIconClassnames}
                />
                <Lock className={`${iconClassnames} left-3`} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isUpdatingPassword
                ? "Actualizando contraseña..."
                : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
