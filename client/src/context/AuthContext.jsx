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
    direccion_datos:
      raw.direccion_datos && typeof raw.direccion_datos === "object"
        ? raw.direccion_datos
        : null,
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
  const [canjesHistorial, setCanjesHistorial] = useState([]);
  const [recompensas, setRecompensas] = useState([]);

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

  const refreshRecompensas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/recompensas`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRecompensas(data);
        }
      }
    } catch {
      // Silencioso si no hay red
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRewards = async () => {
      try {
        const res = await fetch(`${API_URL}/recompensas`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRecompensas(data);
          }
        }
      } catch {}
    };
    loadRewards();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshProfile = useCallback(
    async (overrideToken) => {
      const activeToken = overrideToken ?? token;
      if (!activeToken) return null;

      try {
        const headers = { Authorization: `Bearer ${activeToken}` };
        const [perfilRes, puntosRes, pedidosRes, canjesRes] = await Promise.all([
          fetch(`${API_URL}/clientes/perfil`, { headers }),
          fetch(`${API_URL}/clientes/puntos/historial`, { headers }),
          fetch(`${API_URL}/clientes/pedidos`, { headers }),
          fetch(`${API_URL}/clientes/canjes`, { headers }),
        ]);

        if (perfilRes.status === 401) {
          persistSession(null, null);
          setPuntosHistorial([]);
          setPedidosHistorial([]);
          setCanjesHistorial([]);
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

        if (canjesRes.ok) {
          const canjesData = await canjesRes.json();
          if (Array.isArray(canjesData)) {
            setCanjesHistorial(canjesData);
          }
        }

        return updatedUser;
      } catch {
        return null;
      }
    },
    [token, persistSession]
  );

  // Hidratar perfil real, puntos, canjes y pedidos desde PostgreSQL al iniciar con token
  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadInitial = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [perfilRes, puntosRes, pedidosRes, canjesRes] = await Promise.all([
          fetch(`${API_URL}/clientes/perfil`, { headers }),
          fetch(`${API_URL}/clientes/puntos/historial`, { headers }),
          fetch(`${API_URL}/clientes/pedidos`, { headers }),
          fetch(`${API_URL}/clientes/canjes`, { headers }),
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

        if (canjesRes.ok) {
          const canjesData = await canjesRes.json();
          if (isMounted && Array.isArray(canjesData)) {
            setCanjesHistorial(canjesData);
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
    direccion_datos,
    avatar_url,
  }) => {
    if (!token) {
      throw new Error("Iniciá sesión para guardar cambios en tu perfil.");
    }

    const payload = {
      nombre,
      usuario,
      telefono,
      direccion_default,
    };
    if (direccion_datos !== undefined) {
      payload.direccion_datos = direccion_datos;
    }
    if (avatar_url !== undefined) {
      payload.avatar_url = avatar_url;
    }

    const res = await fetch(`${API_URL}/clientes/perfil`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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

  const requestPasswordReset = async (email) => {
    const res = await fetch(`${API_URL}/clientes/solicitar-recuperacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "No se pudo enviar el enlace de recuperación.");
    }
    return data;
  };

  const confirmPasswordReset = async ({ token: resetToken, newPassword }) => {
    const res = await fetch(`${API_URL}/clientes/restablecer-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "El enlace expiró o no es válido.");
    }
    if (data.token && data.user) {
      persistSession(data.token, data.user);
      await refreshProfile(data.token);
    }
    return data;
  };

  const validateReferralCode = async (codigo) => {
    const res = await fetch(`${API_URL}/clientes/referido/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    });
    const data = await res.json().catch(() => ({ valido: false }));
    return data;
  };

  const redeemReward = async (recompensaId, notas = "") => {
    if (!token) {
      throw new Error("Iniciá sesión para canjear recompensas del Club Valette.");
    }
    const res = await fetch(`${API_URL}/clientes/canjear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recompensa_id: recompensaId, notas }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "No se pudo completar el canje.");
    }
    await Promise.all([refreshProfile(token), refreshRecompensas()]);
    return data;
  };

  const logout = useCallback(() => {
    persistSession(null, null);
    setPuntosHistorial([]);
    setPedidosHistorial([]);
    setCanjesHistorial([]);
  }, [persistSession]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token && user),
        puntosHistorial,
        pedidosHistorial,
        canjesHistorial,
        recompensas,
        login,
        register,
        updateProfile,
        changePassword,
        requestPasswordReset,
        confirmPasswordReset,
        validateReferralCode,
        redeemReward,
        refreshProfile,
        refreshRecompensas,
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
