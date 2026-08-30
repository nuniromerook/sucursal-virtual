// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "../config/api";

export const AuthContext = createContext();

const AUTH_STORAGE_KEY = "valette_auth";

export function AuthContextProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          user: parsed.user || null,
          token: parsed.token || null,
          isAuthenticated: Boolean(parsed.token),
        };
      }
    } catch (e) {
      console.error("Error reading auth from localStorage:", e);
    }
    return { user: null, token: null, isAuthenticated: false };
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar en localStorage
  useEffect(() => {
    try {
      if (authState.token && authState.user) {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            token: authState.token,
            user: authState.user,
          })
        );
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Error saving auth to localStorage:", e);
    }
  }, [authState]);

  /**
   * Refresca los datos del perfil desde el backend
   */
  const refreshUser = useCallback(async () => {
    if (!authState.token) return null;

    try {
      const res = await fetch(`${API_URL}/clientes/perfil`, {
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        setAuthState((prev) => ({
          ...prev,
          user: userData,
        }));
        return userData;
      }
    } catch (error) {
      console.error("Error al refrescar usuario:", error);
    }
    return null;
  }, [authState.token]);

  // Al montar, refrescar datos del perfil si hay token
  useEffect(() => {
    if (authState.token) {
      refreshUser();
    }
  }, []);

  /**
   * Iniciar sesión con email o usuario
   */
  const login = async (identificador, password) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });

      return { success: true, user: data.user };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registro tradicional de cliente
   */
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar cuenta");
      }

      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });

      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Inicio de sesión / Registro con Google
   */
  const loginWithGoogle = async (googlePayload) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googlePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al autenticar con Google");
      }

      setAuthState({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
      });

      return {
        success: true,
        user: data.user,
        isNew: data.isNew,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualizar datos del perfil
   */
  const updateProfile = async (profileData) => {
    if (!authState.token) throw new Error("No autenticado");

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/clientes/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar perfil");
      }

      setAuthState((prev) => ({
        ...prev,
        user: data.user,
      }));

      return {
        success: true,
        user: data.user,
        message: data.message,
        puntosGanados: data.puntosGanados,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthContextProvider");
  }
  return context;
};
