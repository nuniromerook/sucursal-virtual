// admin/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { VITE_API_URL } from "../config/api";

const AuthContext = createContext(null);
const ADMIN_STORAGE_KEY = "valette_admin_auth";

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

  const [isLoading, setIsLoading] = useState(true);

  // Validar sesión contra el backend
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${VITE_API_URL}/empleados/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
        setIsLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${VITE_API_URL}/empleados/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Credenciales incorrectas.");
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ token: data.token, user: data.user })
    );

    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    authHeaders,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
