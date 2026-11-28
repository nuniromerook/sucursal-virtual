// admin/src/pages/LoginPage.jsx
import { useState } from "react";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, recoverWithMasterPin } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "master-pin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterPin, setMasterPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Credenciales incorrectas.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterRecover = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await recoverWithMasterPin({
        email,
        masterPin,
        newPassword,
      });
      setSuccessMsg(res.message || "Contraseña restablecida.");
    } catch (err) {
      setError(err.message || "No se pudo restablecer la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#002244] text-white flex items-center justify-center font-black text-sm tracking-tight">
            AV
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">
              VALETTE OS
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Abastecedora Valette · Gestión Interna
            </p>
          </div>
        </div>

        <div className="bg-white py-7 px-6 shadow-native rounded-2xl border border-slate-200/90 text-xs">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {mode === "login" ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo o usuario
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-white bg-[#002244] hover:bg-[#1e3b6c] transition-colors disabled:opacity-60 cursor-pointer text-xs"
                >
                  <span>{isLoading ? "Ingresando..." : "Ingresar al sistema"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode("master-pin");
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#002244] cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Olvidaste tu contraseña? Recuperar con PIN Maestro</span>
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleMasterRecover}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#002244]" />
                  Recuperación con PIN Maestro
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Correo del empleado o propietario
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@abastecedoravalette.digital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN Maestro del servidor
                </label>
                <input
                  type="password"
                  required
                  value={masterPin}
                  onChange={(e) => setMasterPin(e.target.value)}
                  placeholder="Ingresá el PIN Maestro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#002244] outline-none font-medium text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-white bg-[#002244] hover:bg-[#1e3b6c] transition-colors disabled:opacity-60 cursor-pointer text-xs"
              >
                <span>
                  {isLoading ? "Restableciendo..." : "Restablecer e ingresar"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
            Uso exclusivo para personal de mostrador y administración.
          </div>
        </div>
      </div>
    </div>
  );
}
