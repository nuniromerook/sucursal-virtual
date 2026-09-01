// frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { VITE_API_URL } from "../config/api";
import { useAuth } from "./AuthContext";
import { useRef } from "react";

const SocketContext = createContext(null);

export const SocketContextProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pedidoActualizado, setPedidoActualizado] = useState(null);
  const [catalogoVersion, setCatalogoVersion] = useState(0);
  const socketRef = useRef(null);

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
          "⚡ [Ecommerce Socket] Conectado exitosamente:",
          socketRef.current?.id,
        );
        setIsConnected(true);
        socketRef.current.emit("join_stock");
      });

      socketRef.current.on("disconnect", () => {
        console.log("🔌 [Ecommerce Socket] Desconectado");
        setIsConnected(false);
      });

      socketRef.current.on("pedido_actualizado", (pedido) => {
        console.log("📦 [Ecommerce Socket] Tu pedido se actualizó:", pedido);
        setPedidoActualizado(pedido);
      });

      socketRef.current.on("catalogo_actualizado", (data) => {
        console.log(
          "🥩 [Ecommerce Socket] Catálogo actualizado en vivo:",
          data,
        );
        setCatalogoVersion((prev) => prev + 1);
      });

      socketRef.current.on("stock_actualizado", (data) => {
        console.log("📦 [Ecommerce Socket] Stock actualizado en vivo:", data);
        setCatalogoVersion((prev) => prev + 1);
      });

      setSocket(socketRef.current);
    }

    return () => {
      // Dejamos la conexión activa durante la sesión
    };
  }, [socketUrl]);

  // Si el usuario está autenticado, unirse automáticamente a su sala privada
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user?.id) {
      console.log(`👤 [Ecommerce Socket] Uniéndose a sala_cliente_${user.id}`);
      socket.emit("join_cliente", user.id);
    }
  }, [socket, isConnected, isAuthenticated, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        pedidoActualizado,
        catalogoVersion,
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
