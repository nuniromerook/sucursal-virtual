// admin/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { VITE_API_URL } from "../config/api";

const AuthContext = createContext(null);
const ADMIN_STORAGE_KEY = "valette_admin_auth";
const MANAGER_ROLES = ["propietario", "admin", "encargado"];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed?.token || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed?.user || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }, []);

  // Validar sesión contra el backend
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const verifySession = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/empleados/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          const freshUser = await res.json();
          setUser(freshUser);
          localStorage.setItem(
            ADMIN_STORAGE_KEY,
            JSON.stringify({ token, user: freshUser })
          );
        } else {
          logout();
        }
      } catch (err) {
        console.error("Error validando sesión de empleado:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    const res = await fetch(`${VITE_API_URL}/empleados/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Credenciales incorrectas.");
    }

    setToken(data.token);
    setUser(data.user);
    setIsLoading(false);
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ token: data.token, user: data.user })
    );

    return data.user;
  };

  const recoverWithMasterPin = async ({ email, masterPin, newPassword }) => {
    const res = await fetch(`${VITE_API_URL}/empleados/recuperar-maestro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, masterPin, newPassword }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "No se pudo restablecer la contraseña.");
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      setIsLoading(false);
      localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify({ token: data.token, user: data.user })
      );
    }

    return data;
  };

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const userRol = String(user?.rol || "").toLowerCase();
  const isManager = MANAGER_ROLES.includes(userRol);
  const isCortador = userRol === "cortador";

  const value = {
    user,
    token,
    isLoading,
    login,
    recoverWithMasterPin,
    logout,
    authHeaders,
    isAuthenticated: Boolean(token),
    isManager,
    isCortador,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
