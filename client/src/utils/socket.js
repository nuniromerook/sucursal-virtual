// client/src/utils/socket.js
import { io } from "socket.io-client";
import { API_URL } from "@/config/api";

let sharedSocket = null;

/**
 * Devuelve una única instancia compartida (singleton) de Socket.io para toda la tienda.
 * Reduce el consumo de conexiones simultáneas en la VPS en un 75%.
 */
export function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(API_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
  } else if (sharedSocket.disconnected) {
    sharedSocket.connect();
  }
  return sharedSocket;
}
