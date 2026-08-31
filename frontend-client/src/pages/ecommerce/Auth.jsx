// frontend/src/pages/ecommerce/Auth.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  AtSign,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Gift,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Recuperación de Contraseña
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingForgot, setIsSendingForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Formulario Login
  const [loginData, setLoginData] = useState({
    identificador: "",
    password: "",
  });

  // Formulario Registro
  const [regData, setRegData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    usuario: "",
  });

  // Código de referido
  const [showReferral, setShowReferral] = useState(false);
  const [codigoReferido, setCodigoReferido] = useState("");
  const [referralStatus, setReferralStatus] = useState(null); // null | { valido, nombre, usuario }
  const [checkingReferral, setCheckingReferral] = useState(false);
  const referralTimerRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRegister, setShowPasswordRegister] = useState(false);
  const iconClassnames = "size-5 text-neutral-400 absolute inset-y-0 my-auto";
  const inputClassnames =
    "w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue";
  const inputLabel = "block text-sm font-semibold text-neutral-700 mb-1";

  // Validar código de referido con debounce
  useEffect(() => {
    if (!codigoReferido || codigoReferido.length < 3) {
      setReferralStatus(null);
      return;
    }
    clearTimeout(referralTimerRef.current);
    setCheckingReferral(true);
    referralTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/clientes/referido/validar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo: codigoReferido }),
        });
        const data = await res.json();
        setReferralStatus(data);
      } catch {
        setReferralStatus(null);
      } finally {
        setCheckingReferral(false);
      }
    }, 600);
    return () => clearTimeout(referralTimerRef.current);
  }, [codigoReferido]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await login(loginData.identificador, loginData.password);
      toast.success(`¡Bienvenido de nuevo${res.user?.nombre ? `, ${res.user.nombre}` : ""}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
      toast.error(err.message || "Error al iniciar sesión.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const cleanRef = codigoReferido.trim();
      const payload = {
        ...regData,
        ...(cleanRef ? { codigo_referido: cleanRef } : {}),
      };
      const res = await register(payload);
      setSuccessMsg(res.message || "¡Cuenta creada exitosamente!");
      toast.success(res.message || "¡Cuenta creada exitosamente!");
      setTimeout(() => {
        navigate("/perfil", { replace: true });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Error al registrarse.");
      toast.error(err.message || "Error al registrarse.");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg("Por favor ingresá tu correo electrónico.");
      return;
    }

    setIsSendingForgot(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${API_URL}/clientes/solicitar-recuperacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al solicitar recuperación.");

      setForgotSent(true);
      setSuccessMsg(data.message || "Te enviamos un correo con las instrucciones.");
      toast.success("Correo enviado exitosamente.");
    } catch (err) {
      setErrorMsg(err.message || "Error al enviar correo de recuperación.");
      toast.error(err.message || "Error al enviar correo.");
    } finally {
      setIsSendingForgot(false);
    }
  };

  // Autenticación con Google (Pre-configurada para integración directa)
  const handleGoogleAuth = async () => {
    setErrorMsg("");
    try {
      // Simulación de Google Identity / OAuth payload mientras se configuran las credenciales en producción
      const googleMock = {
        google_id: `g_${Date.now()}`,
        email: "usuario.valette@gmail.com",
        nombre: "Cliente Valette",
        avatar_url:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
      };

      const res = await loginWithGoogle(googleMock);
      if (res.isNew) {
        navigate("/perfil", { state: { showOnboarding: true } });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || "Error al autenticar con Google.");
    }
  };

  return (
    <div className="w-full min-h-[85vh] bg-neutral-50 flex items-center justify-center py-2 px-4 sm:px-6 bg-white">
      <div className="w-full max-w-md rounded-3xl p-6 sm:p-8">
        {/* Logo y Encabezado */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-3">
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="size-40 mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900">
            {mode === "login"
              ? "Hola de nuevo!"
              : mode === "register"
              ? "Creá tu cuenta"
              : "Recuperar Contraseña"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {mode === "login"
              ? "Ingresá a tu cuenta para gestionar pedidos y sumar puntos"
              : mode === "register"
              ? "Registrate en Abastecedora Valette y sumá puntos con tus compras"
              : "Ingresá tu correo para recibir un enlace de recuperación seguro"}
          </p>
        </div>

        {/* Pestañas Login / Registro */}
        {mode !== "forgot" ? (
          <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl mb-6 font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-main-blue shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-main-blue shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        ) : null}

        {/* Mensajes de feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-xs">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario FORGOT PASSWORD */}
        {mode === "forgot" ? (
          <form onSubmit={handleForgotSubmit} className="space-y-4 animate-in fade-in">
            <div>
              <label className={inputLabel}>
                Tu correo electrónico registrado
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="tu-email@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputClassnames}
                />
                <Mail className={`${iconClassnames} left-3`} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingForgot}
              className="w-full py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isSendingForgot ? "Enviando enlace..." : "Enviar Enlace de Recuperación"}</span>
              <ArrowRight className="size-3.5" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-xs font-bold text-neutral-600 hover:text-main-blue transition-colors cursor-pointer"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : mode === "login" ? (
          /* Formulario LOGIN */
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className={inputLabel}>
                Correo electrónico o @Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="juan@email.com o @usuario"
                  value={loginData.identificador}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      identificador: e.target.value,
                    })
                  }
                  className={inputClassnames}
                />
                <Mail className={`${iconClassnames} left-3`} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={inputLabel}>Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-sm text-main-blue hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className={`${inputClassnames} pr-10`}
                />
                <Lock className={`${iconClassnames} left-3`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 inset-y-0 my-auto"
                >
                  {showPassword ? (
                    <EyeOff className={`${iconClassnames} right-3`} />
                  ) : (
                    <Eye className={`${iconClassnames} right-3`} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Iniciando..." : "Ingresar"}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        ) : (
          /* Formulario REGISTRO */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className={inputLabel}>
                Nombre y Apellido <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={regData.nombre}
                  onChange={(e) =>
                    setRegData({ ...regData, nombre: e.target.value })
                  }
                  className={`${inputClassnames}`}
                />
                <User className={`${iconClassnames} left-3`} />
              </div>
            </div>

            <div>
              <label className={inputLabel}>
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="juan@email.com"
                  value={regData.email}
                  onChange={(e) =>
                    setRegData({ ...regData, email: e.target.value })
                  }
                  className={`${inputClassnames}`}
                />
                <Mail className={`${iconClassnames} left-3`} />
              </div>
            </div>

            <div>
              <label className={inputLabel}>
                Contraseña <span className="text-red-500">* </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={regData.password}
                  onChange={(e) =>
                    setRegData({ ...regData, password: e.target.value })
                  }
                  className={`${inputClassnames} pr-10`}
                />
                <Lock className={`${iconClassnames} left-3`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 inset-y-0 my-auto"
                >
                  {showPassword ? (
                    <EyeOff className={`${iconClassnames} right-3`} />
                  ) : (
                    <Eye className={`${iconClassnames} right-3`} />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={inputLabel}>WhatsApp / Tel.</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="11 2345-6789"
                    value={regData.telefono}
                    onChange={(e) =>
                      setRegData({ ...regData, telefono: e.target.value })
                    }
                    className={`${inputClassnames}`}
                  />
                  <Phone className={`${iconClassnames} left-3`} />
                </div>
              </div>

              <div>
                <label className={inputLabel}>@Usuario (Redes)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="juan_valette"
                    value={regData.usuario}
                    onChange={(e) =>
                      setRegData({ ...regData, usuario: e.target.value })
                    }
                    className={`${inputClassnames}`}
                  />
                  <AtSign className={`${iconClassnames} left-3`} />
                </div>
              </div>
            </div>

            {/* Banner de recompensa */}
            <div className="p-2.5 bg-amber-50 border border-amber-200/70 rounded-lg flex items-center gap-2 text-sm text-amber-900">
              <Sparkles className="size-4 text-amber-600 shrink-0" />
              <span>
                Completá tu <strong>WhatsApp y @Usuario</strong> para ganar{" "}
                <strong>+50 puntos</strong> de regalo.
              </span>
            </div>

            {/* Campo código de referido (colapsable) */}
            <div>
              <button
                type="button"
                onClick={() => setShowReferral(!showReferral)}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-main-blue transition-colors cursor-pointer"
              >
                <Gift className="size-4" />
                <span>¿Tenés un código de referido? (opcional)</span>
                <ChevronDown
                  className={`size-4 transition-transform ${showReferral ? "rotate-180" : ""}`}
                />
              </button>

              {showReferral && (
                <div className="mt-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Ej. 12345"
                    value={codigoReferido}
                    onChange={(e) =>
                      setCodigoReferido(e.target.value.toUpperCase())
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue tracking-widest"
                  />
                  {checkingReferral && (
                    <p className="text-[11px] text-neutral-400 mt-1 animate-pulse">
                      Verificando código...
                    </p>
                  )}
                  {!checkingReferral && referralStatus?.valido && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="size-3.5" />
                      <span>
                        Código de{" "}
                        {referralStatus.usuario
                          ? `@${referralStatus.usuario}`
                          : referralStatus.nombre}{" "}
                        aplicado — Vas a ganar +50 puntos
                      </span>
                    </div>
                  )}
                  {!checkingReferral &&
                    codigoReferido.length >= 3 &&
                    referralStatus &&
                    !referralStatus.valido && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                        <AlertCircle className="size-4" />
                        <span>Código no encontrado</span>
                      </div>
                    )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Creando cuenta..." : "Crear mi Cuenta"}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs font-medium text-neutral-400">
            Otras alternativas
          </span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold flex items-center justify-center gap-2.5 transition-all shadow-2xs mb-5 cursor-pointer disabled:opacity-60"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>
    </div>
  );
}
