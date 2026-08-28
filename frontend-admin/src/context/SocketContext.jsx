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
import { API_URL } from "../config/api";

const SocketContext = createContext(null);

/**
 * Genera un sonido de timbre / comanda profesional mediante Web Audio API
 * No depende de archivos .mp3 externos y suena instantáneo.
 */
const reproducirSonidoComanda = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Usamos dos osciladores para crear una disonancia sutil (un "vibrato" natural) que llame más la atención
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Tipo de onda cuadrada y diente de sierra: Máxima penetración en ambientes con motores
    osc1.type = "square";
    osc2.type = "sawtooth";

    const ahora = ctx.currentTime;

    // --- PULSO 1 (Rápido y de atención) ---
    osc1.frequency.setValueAtTime(1200, ahora);
    osc2.frequency.setValueAtTime(1205, ahora); // Ligero desfase para dar cuerpo y "alarma"
    gainNode.gain.setValueAtTime(0.4, ahora);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.1);

    // --- PULSO 2 (Intermedio) ---
    osc1.frequency.setValueAtTime(1500, ahora + 0.15);
    osc2.frequency.setValueAtTime(1505, ahora + 0.15);
    gainNode.gain.setValueAtTime(0.4, ahora + 0.15);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.25);

    // --- PULSO 3 (Final y agudo, corta el aire) ---
    osc1.frequency.setValueAtTime(2000, ahora + 0.3);
    osc2.frequency.setValueAtTime(2005, ahora + 0.3);
    gainNode.gain.setValueAtTime(0.5, ahora + 0.3); // Un poco más fuerte al final
    gainNode.gain.exponentialRampToValueAtTime(0.001, ahora + 0.55);

    // Conexiones
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Inicio y fin absoluto del nodo
    osc1.start(ahora);
    osc2.start(ahora);
    osc1.stop(ahora + 0.6);
    osc2.stop(ahora + 0.6);
  } catch (err) {
    console.warn("No se pudo reproducir audio Web Audio:", err);
  }
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [alertaCortador, setAlertaCortador] = useState(null);
  const socketRef = useRef(null);

  // Obtener URL base del backend (removiendo /api si lo tuviese)
  const socketUrl = API_URL.replace(/\/api$/, "");

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
