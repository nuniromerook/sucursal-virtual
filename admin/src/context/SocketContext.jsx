// admin/src/context/SocketContext.jsx
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

let audioCache = null;

const reproducirSonidoComanda = () => {
  try {
    if (!audioCache) {
      audioCache = new Audio("/nueva-comanda.mp3");
    }
    audioCache.currentTime = 0;
    const playPromise = audioCache.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        reproducirTonoSintetizado();
      });
    }
  } catch {
    reproducirTonoSintetizado();
  }
};

const reproducirTonoSintetizado = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    const ahora = ctx.currentTime;

    osc1.frequency.setValueAtTime(587.33, ahora); // D5
    osc1.frequency.setValueAtTime(880.0, ahora + 0.12); // A5

    gainNode.gain.setValueAtTime(0.3, ahora);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.45);

    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ahora);
    osc1.stop(ahora + 0.5);
  } catch {
    // Audio no soportado o bloqueado
  }
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const sucursalActivaRef = useRef(null);

  useEffect(() => {
    const s = io(VITE_API_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on("connect", () => {
      setIsConnected(true);
      if (sucursalActivaRef.current) {
        s.emit("join_sucursal", { sucursal_id: sucursalActivaRef.current });
      }
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("nuevo_pedido", (pedido) => {
      setUltimoPedido(pedido);
      reproducirSonidoComanda();
    });

    s.on("pedido_actualizado", (pedido) => {
      setUltimoPedido(pedido);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const joinSucursal = useCallback(
    (sucursalId) => {
      sucursalActivaRef.current = sucursalId;
      if (socket && isConnected && sucursalId) {
        socket.emit("join_sucursal", { sucursal_id: sucursalId });
      }
    },
    [socket, isConnected]
  );

  const leaveSucursal = useCallback(
    (sucursalId) => {
      if (sucursalActivaRef.current === sucursalId) {
        sucursalActivaRef.current = null;
      }
      if (socket && isConnected && sucursalId) {
        socket.emit("leave_sucursal", { sucursal_id: sucursalId });
      }
    },
    [socket, isConnected]
  );

  const value = {
    socket,
    isConnected,
    ultimoPedido,
    joinSucursal,
    leaveSucursal,
    reproducirSonidoComanda,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket debe usarse dentro de SocketProvider");
  return ctx;
}
