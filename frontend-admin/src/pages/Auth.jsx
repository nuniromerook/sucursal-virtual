// frontend-admin/src/pages/Auth.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import ButtonLoader from "../components/ui/ButtonLoader";
import { AlertCircle, KeyRound, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login"); // 'login' | 'recovery'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPin, setMasterPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const { login, recuperarConMasterPin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Por favor completá tu correo/usuario y contraseña.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error al iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!email || !masterPin || !newPassword) {
      setErrorMessage("Por favor completá todos los campos requeridos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await recuperarConMasterPin(email, masterPin, newPassword);
      setSuccessMessage("¡Contraseña restablecida exitosamente! Ingresando al panel...");
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Error al restablecer contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Abastecedora Valette"
          src="/favicon.svg"
          className="mx-auto h-24 sm:h-28 w-auto aspect-square drop-shadow"
        />
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
          {mode === "login" ? "Panel de Administración" : "Rescate de Cuenta Admin"}
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-neutral-500 font-medium">
          {mode === "login"
            ? "Acceso exclusivo para el personal y administradores de Valette"
            : "Restablecimiento de contraseña exclusivo mediante PIN Maestro"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-neutral-200/80 shadow-lg space-y-6">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Correo electrónico o Usuario"
                id="email"
                inputName="email"
                inputType="text"
                autoComplete="username"
                placeholder="admin@valette.com"
                isRequired={true}
                value={email}
                setOnChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-900"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("recovery");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-bold text-main-blue hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <ButtonLoader
                  value="Ingresar al Panel"
                  loadingValue="Autenticando..."
                  isLoading={isLoading}
                  classNames="w-full py-2.5 bg-main-blue hover:bg-main-blue/90 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                />
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecovery} className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldAlert className="size-4 text-amber-600 shrink-0" />
                <span>Ingresá tu PIN Maestro secreto para crear una nueva contraseña.</span>
              </div>

              <Input
                label="Correo del Administrador"
                id="recovery-email"
                inputName="recovery-email"
                inputType="text"
                placeholder="admin@valette.com"
                isRequired={true}
                value={email}
                setOnChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1">
                  PIN Maestro Secreto
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="PIN secreto configurado en el servidor"
                    value={masterPin}
                    onChange={(e) => setMasterPin(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repetí la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-main-blue focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <ButtonLoader
                  value="Restablecer e Ingresar"
                  loadingValue="Restableciendo..."
                  isLoading={isLoading}
                  classNames="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
                />

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Volver al inicio de sesión habitual</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
