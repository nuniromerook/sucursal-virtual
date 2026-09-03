// frontend-client/src/pages/ecommerce/RestablecerPassword.jsx
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { restablecerPassword, isLoading } = useAuth();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const inputClassnames =
    "w-full pl-10 pr-10 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-main-blue/30 focus:border-main-blue text-sm";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!token) {
      setErrorMsg("El enlace de recuperación es inválido o no contiene un token.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas ingresadas no coinciden.");
      return;
    }

    try {
      const res = await restablecerPassword(token, password);
      setSuccessMsg(res.message || "¡Contraseña restablecida con éxito!");
      toast.success("¡Contraseña actualizada con éxito!");
      setTimeout(() => {
        navigate("/perfil", { replace: true });
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || "Error al restablecer la contraseña.");
      toast.error(err.message || "Error al restablecer contraseña.");
    }
  };

  return (
    <div className="w-full min-h-[80vh] bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xl space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block mb-3">
            <img
              src="/favicon.svg"
              alt="Abastecedora Valette"
              className="size-20 mx-auto drop-shadow"
            />
          </Link>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Restablecer Contraseña
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Ingresá tu nueva contraseña para acceder a tu cuenta
          </p>
        </div>

        {!token ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>Token no encontrado</span>
            </div>
            <p>
              El enlace no es válido. Por favor volvé a solicitar la recuperación de contraseña.
            </p>
            <Link
              to="/ingresar"
              className="inline-flex items-center gap-1.5 font-bold text-main-blue hover:underline"
            >
              <span>Ir a Iniciar Sesión</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-start gap-2.5 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMsg} Redirigiendo a tu cuenta...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClassnames}
                  />
                  <Lock className="size-4 text-neutral-400 absolute left-3 inset-y-0 my-auto" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 inset-y-0 my-auto text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repetí la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClassnames}
                  />
                  <Lock className="size-4 text-neutral-400 absolute left-3 inset-y-0 my-auto" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-main-blue hover:bg-main-blue/95 text-white font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Restableciendo..." : "Guardar Nueva Contraseña"}</span>
                <ArrowRight className="size-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/ingresar"
                  className="text-xs font-bold text-neutral-500 hover:text-main-blue transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
