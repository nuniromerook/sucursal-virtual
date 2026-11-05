// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { API_URL } from "@/config/api";

const AuthContext = createContext(null);

function normalizeUser(raw) {
  if (!raw) return null;
  const puntos = Number(raw.puntos_acumulados ?? raw.puntos ?? 0);
  return {
    id: raw.id,
    nombre: raw.nombre || "Cliente Valette",
    email: raw.email || "",
    usuario: raw.usuario
      ? raw.usuario.startsWith("@")
        ? raw.usuario
        : `@${raw.usuario}`
      : "",
    telefono: raw.telefono || "",
    direccion_default: raw.direccion_default || "",
    puntos,
    puntos_acumulados: puntos,
    equivalenciaPesos: Math.round(puntos * 5),
    codigoReferido: raw.referral_code || raw.codigoReferido || "VALETTE",
    referral_code: raw.referral_code || raw.codigoReferido || "VALETTE",
    perfil_completo: Boolean(raw.perfil_completo),
    avatar_url: raw.avatar_url || null,
    referidos_count: Number(raw.referidos_count || 0),
  };
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("valette_token") || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("valette_user");
      if (saved) {
        return normalizeUser(JSON.parse(saved));
      }
    } catch {}
    return null;
  });

  const [puntosHistorial, setPuntosHistorial] = useState([]);
  const [pedidosHistorial, setPedidosHistorial] = useState([]);

  const persistSession = useCallback((nextToken, nextUser) => {
    const normalized = normalizeUser(nextUser);
    setToken(nextToken || null);
    setUser(normalized);
    try {
      if (nextToken && normalized) {
        localStorage.setItem("valette_token", nextToken);
        localStorage.setItem("valette_user", JSON.stringify(normalized));
        localStorage.setItem("valette_user_profile", JSON.stringify(normalized));
      } else {
        localStorage.removeItem("valette_token");
        localStorage.removeItem("valette_user");
        localStorage.removeItem("valette_user_profile");
      }
    } catch {}
  }, []);

  const refreshProfile = useCallback(
    async (overrideToken) => {
      const activeToken = overrideToken ?? token;
      if (!activeToken) return null;

      try {
        const headers = { Authorization: `Bearer ${activeToken}` };
        const [perfilRes, puntosRes, pedidosRes] = await Promise.all([
          fetch(`${API_URL}/clientes/perfil`, { headers }),
          fetch(`${API_URL}/clientes/puntos/historial`, { headers }),
          fetch(`${API_URL}/clientes/pedidos`, { headers }),
        ]);

        if (perfilRes.status === 401) {
          persistSession(null, null);
          setPuntosHistorial([]);
          setPedidosHistorial([]);
          return null;
        }

        let updatedUser = null;
        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          updatedUser = normalizeUser(perfilData);
          persistSession(activeToken, updatedUser);
        }

        if (puntosRes.ok) {
          const ptsData = await puntosRes.json();
          if (Array.isArray(ptsData)) {
            setPuntosHistorial(ptsData);
          }
        }

        if (pedidosRes.ok) {
          const pedData = await pedidosRes.json();
          if (Array.isArray(pedData)) {
            setPedidosHistorial(pedData);
          }
        }

        return updatedUser;
      } catch {
        return null;
      }
    },
    [token, persistSession]
  );

  // Hidratar perfil real, puntos y pedidos desde PostgreSQL al iniciar con token
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadInitial = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [perfilRes, puntosRes, pedidosRes] = await Promise.all([
          fetch(`${API_URL}/clientes/perfil`, { headers }),
          fetch(`${API_URL}/clientes/puntos/historial`, { headers }),
          fetch(`${API_URL}/clientes/pedidos`, { headers }),
        ]);

        if (!isMounted) return;

        if (perfilRes.status === 401) {
          persistSession(null, null);
          return;
        }

        if (perfilRes.ok) {
          const perfilData = await perfilRes.json();
          if (isMounted) {
            persistSession(token, perfilData);
          }
        }

        if (puntosRes.ok) {
          const ptsData = await puntosRes.json();
          if (isMounted && Array.isArray(ptsData)) {
            setPuntosHistorial(ptsData);
          }
        }

        if (pedidosRes.ok) {
          const pedData = await pedidosRes.json();
          if (isMounted && Array.isArray(pedData)) {
            setPedidosHistorial(pedData);
          }
        }
      } catch {}
    };

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [token, persistSession]);

  const login = async ({ identificador, password }) => {
    const res = await fetch(`${API_URL}/clientes/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identificador, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Credenciales incorrectas.");
    }

    persistSession(data.token, data.user);
    await refreshProfile(data.token);
    return data;
  };

  const register = async ({
    nombre,
    email,
    password,
    telefono,
    usuario,
    codigo_referido,
  }) => {
    const res = await fetch(`${API_URL}/clientes/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        email,
        password,
        telefono,
        usuario,
        codigo_referido,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "No se pudo completar el registro.");
    }

    persistSession(data.token, data.user);
    await refreshProfile(data.token);
    return data;
  };

  const updateProfile = async ({
    nombre,
    usuario,
    telefono,
    direccion_default,
  }) => {
    if (!token) {
      throw new Error("Iniciá sesión para guardar cambios en tu perfil.");
    }

    const res = await fetch(`${API_URL}/clientes/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nombre,
        usuario,
        telefono,
        direccion_default,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Error al actualizar el perfil.");
    }

    persistSession(token, data.user);
    if (data.puntosGanados > 0) {
      await refreshProfile(token);
    }
    return data;
  };

  const changePassword = async ({ password_actual, password_nueva }) => {
    if (!token) {
      throw new Error("Iniciá sesión para cambiar tu contraseña.");
    }

    const res = await fetch(`${API_URL}/clientes/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password_actual, password_nueva }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Error al actualizar la contraseña.");
    }
    return data;
  };

  const logout = useCallback(() => {
    persistSession(null, null);
    setPuntosHistorial([]);
    setPedidosHistorial([]);
  }, [persistSession]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        puntosHistorial,
        pedidosHistorial,
        login,
        register,
        updateProfile,
        changePassword,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe ser usado dentro de AuthProvider");
  return ctx;
};
