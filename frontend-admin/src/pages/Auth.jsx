// frontend-admin/src/pages/Auth.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import ButtonLoader from "../components/ui/ButtonLoader";
import { AlertCircle, Lock } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Por favor completá tu correo y contraseña.");
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

  return (
    <div className="flex min-h-screen flex-col justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          alt="Abastecedora Valette"
          src="/favicon.svg"
          className="mx-auto h-24 sm:h-28 w-auto aspect-square drop-shadow"
        />
        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
          Panel de Administración
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-neutral-500 font-medium">
          Acceso exclusivo para el personal y administradores de Valette
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico o Usuario"
              id="email"
              inputName="email"
              inputType="text"
              autoComplete="username"
              placeholder="tu-email@valette.com"
              isRequired={true}
              value={email}
              setOnChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-900 mb-1"
              >
                Contraseña
              </label>
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
        </div>
      </div>
    </div>
  );
}
