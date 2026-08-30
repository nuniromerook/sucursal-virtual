// frontend-admin/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50 gap-3">
        <Loader2 className="size-8 animate-spin text-main-blue" />
        <p className="text-xs font-bold text-neutral-500">Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ingresar" state={{ from: location }} replace />;
  }

  return children;
}
