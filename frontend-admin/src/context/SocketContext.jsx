// frontend-admin/src/context/SocketContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { VITE_API_URL } from "../config/api";

const SocketContext = createContext(null);

/**
 * Reproduce el archivo de audio /sounds/nueva-comanda.mp3 o /nueva-comanda.mp3
 * Si el archivo no está presente o el navegador bloquea audio externo, usa fallback de Web Audio API.
 */
let audioCache = null;

const reproducirSonidoComanda = () => {
  try {
    if (!audioCache) {
      // Intentar cargar desde /sounds/ o raíz de public
      audioCache = new Audio("/sounds/nueva-comanda.mp3");
    }

    audioCache.currentTime = 0;
    const playPromise = audioCache.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Si falla por ruta /sounds/, probar directamente /nueva-comanda.mp3
        const fallbackAudio = new Audio("/nueva-comanda.mp3");
        fallbackAudio.play().catch(() => {
          // Fallback a Web Audio API sintetizado
          reproducirTonoSintetizado();
        });
      });
    }
  } catch (err) {
    reproducirTonoSintetizado();
  }
};

const reproducirTonoSintetizado = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "square";
    osc2.type = "sawtooth";

    const ahora = ctx.currentTime;

    osc1.frequency.setValueAtTime(1200, ahora);
    osc2.frequency.setValueAtTime(1205, ahora);
    gainNode.gain.setValueAtTime(0.4, ahora);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.1);

    osc1.frequency.setValueAtTime(1500, ahora + 0.15);
    osc2.frequency.setValueAtTime(1505, ahora + 0.15);
    gainNode.gain.setValueAtTime(0.4, ahora + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.25);

    osc1.frequency.setValueAtTime(2000, ahora + 0.3);
    osc2.frequency.setValueAtTime(2005, ahora + 0.3);
    gainNode.gain.setValueAtTime(0.5, ahora + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ahora + 0.55);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ahora);
    osc2.start(ahora);
    osc1.stop(ahora + 0.6);
    osc2.stop(ahora + 0.6);
  } catch (err) {
    console.warn("No se pudo reproducir audio:", err);
  }
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [alertaCortador, setAlertaCortador] = useState(null);
  const socketRef = useRef(null);

  // Obtener URL base del backend (removiendo /api si lo tuviese)
  const socketUrl = VITE_API_URL.replace(/\/api$/, "");

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socketRef.current.on("connect", () => {
        console.log(
          "⚡ [Admin Socket] Conectado exitosamente con ID:",
          socketRef.current?.id,
        );
        setIsConnected(true);
      });

      socketRef.current.on("disconnect", () => {
        console.log("🔌 [Admin Socket] Desconectado");
        setIsConnected(false);
      });

      // Listener global de nuevo pedido
      socketRef.current.on("nuevo_pedido", (pedido) => {
        console.log(
          "🔔 [Admin Socket] Nuevo pedido recibido en tiempo real:",
          pedido,
        );
        setUltimoPedido(pedido);
        reproducirSonidoComanda();
      });

      // Listener global para cortadores
      socketRef.current.on("alerta_cortador", (alerta) => {
        console.log("🥩 [Admin Socket] Alerta para cortador:", alerta);
        setAlertaCortador(alerta);
        reproducirSonidoComanda();
      });

      setSocket(socketRef.current);
    }

    return () => {
      // Dejamos la conexión activa durante la sesión
    };
  }, [socketUrl]);

  const joinSucursal = useCallback(
    (sucursalId) => {
      if (socket && isConnected && sucursalId) {
        socket.emit("join_sucursal", sucursalId);
      }
    },
    [socket, isConnected],
  );

  const leaveSucursal = useCallback(
    (sucursalId) => {
      if (socket && isConnected && sucursalId) {
        socket.emit("leave_sucursal", sucursalId);
      }
    },
    [socket, isConnected],
  );

  const joinCortadores = useCallback(
    (sucursalId) => {
      if (socket && isConnected && sucursalId) {
        socket.emit("join_cortadores", sucursalId);
      }
    },
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        ultimoPedido,
        alertaCortador,
        joinSucursal,
        leaveSucursal,
        joinCortadores,
        reproducirSonidoComanda,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket debe usarse dentro de un SocketContextProvider");
  }
  return context;
};
