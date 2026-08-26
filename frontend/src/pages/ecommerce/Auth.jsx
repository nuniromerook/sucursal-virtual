// frontend/src/pages/ecommerce/Auth.jsx
import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { login, register, loginWithGoogle, isLoading } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await login(loginData.identificador, loginData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await register(regData);
      setSuccessMsg(res.message || "¡Cuenta creada exitosamente!");
      setTimeout(() => {
        navigate("/perfil", { replace: true });
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Error al registrar cuenta.");
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
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
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
    <div className="w-full min-h-[85vh] bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
        {/* Logo y Encabezado */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block mb-3">
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="size-16 mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900">
            {mode === "login" ? "Bienvenido de nuevo" : "Crear tu cuenta"}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {mode === "login"
              ? "Ingresá a tu cuenta para gestionar pedidos y sumar puntos"
              : "Registrate en Abastecedora Valette y sumá puntos con tus compras"}
          </p>
        </div>

        {/* Pestañas Login / Registro */}
        <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
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

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-2xs mb-5 cursor-pointer disabled:opacity-60"
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

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-[11px] font-medium text-neutral-400">o con email</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Formulario LOGIN */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Correo electrónico o @Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="juan@email.com o @usuario"
                  value={loginData.identificador}
                  onChange={(e) =>
                    setLoginData({ ...loginData, identificador: e.target.value })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
                <Mail className="size-4 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Para restablecer tu clave contactanos por WhatsApp.");
                  }}
                  className="text-[11px] text-main-blue hover:underline"
                >
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
                <Lock className="size-4 text-neutral-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Iniciando..." : "Ingresar"}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        ) : (
          /* Formulario REGISTRO */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Nombre y Apellido <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={regData.nombre}
                  onChange={(e) => setRegData({ ...regData, nombre: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
                <User className="size-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="juan@email.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
                <Mail className="size-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                />
                <Lock className="size-4 text-neutral-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  WhatsApp / Tel.
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="11 2345-6789"
                    value={regData.telefono}
                    onChange={(e) => setRegData({ ...regData, telefono: e.target.value })}
                    className="w-full pl-8 pr-2 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                  />
                  <Phone className="size-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  @Usuario (Redes)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="juan_valette"
                    value={regData.usuario}
                    onChange={(e) => setRegData({ ...regData, usuario: e.target.value })}
                    className="w-full pl-8 pr-2 py-2 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue"
                  />
                  <AtSign className="size-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Banner de recompensa */}
            <div className="p-2.5 bg-amber-50 border border-amber-200/70 rounded-lg flex items-center gap-2 text-[11px] text-amber-900">
              <Sparkles className="size-4 text-amber-600 shrink-0" />
              <span>
                Completá tu <strong>WhatsApp y @Usuario</strong> para ganar <strong>+50 puntos</strong> de regalo.
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Creando cuenta..." : "Crear mi Cuenta"}</span>
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
