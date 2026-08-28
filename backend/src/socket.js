// backend/src/socket.js
const { Server } = require("socket.io");

let io = null;

/**
 * Inicializa el servidor de Socket.io sobre el servidor HTTP existente de Express.
 * Configura CORS permisivo para desarrollo y salas dinámicas para sucursales,
 * cortadores y clientes individuales.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // En producción se puede restringir al dominio de la VPS
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`⚡ [Socket.io] Nuevo cliente conectado: ${socket.id}`);

    // 1. Unirse a la sala de una sucursal específica (para cajeras y administradores)
    socket.on("join_sucursal", (sucursalId) => {
      if (!sucursalId) return;
      const room = `sala_sucursal_${sucursalId}`;
      socket.join(room);
      console.log(`👥 Socket ${socket.id} se unió a ${room}`);
    });

    socket.on("leave_sucursal", (sucursalId) => {
      if (!sucursalId) return;
      const room = `sala_sucursal_${sucursalId}`;
      socket.leave(room);
      console.log(`🚪 Socket ${socket.id} abandonó ${room}`);
    });

    // 2. Unirse a la sala de cortadores/fraccionadores de una sucursal
    socket.on("join_cortadores", (sucursalId) => {
      if (!sucursalId) return;
      const room = `sala_cortadores_${sucursalId}`;
      socket.join(room);
      console.log(`🥩 Socket ${socket.id} (Cortador) se unió a ${room}`);
    });

    // 3. Unirse a la sala privada de un cliente (para seguimiento de sus pedidos)
    socket.on("join_cliente", (clienteId) => {
      if (!clienteId) return;
      const room = `sala_cliente_${clienteId}`;
      socket.join(room);
      console.log(`👤 Socket ${socket.id} se unió a sala privada ${room}`);
    });

    // 4. Unirse a la sala global de stock / catálogo
    socket.on("join_stock", () => {
      socket.join("sala_stock");
      console.log(`📦 Socket ${socket.id} se unió a sala_stock`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket.io] Desconectado ${socket.id}: ${reason}`);
    });
  });

  return io;
};

/**
 * Retorna la instancia activa de Socket.io
 */
const getIO = () => {
  if (!io) {
    console.warn("⚠ [Socket.io] getIO() llamado antes de initSocket()");
  }
  return io;
};

/**
 * Emite evento de nuevo pedido a la sucursal y alerta comanda a los cortadores
 */
const emitirNuevoPedido = (sucursalId, pedido) => {
  if (!io) return;
  const roomSucursal = `sala_sucursal_${sucursalId}`;
  const roomCortadores = `sala_cortadores_${sucursalId}`;

  console.log(`📢 Emitiendo 'nuevo_pedido' a ${roomSucursal} y ${roomCortadores}`);
  io.to(roomSucursal).emit("nuevo_pedido", pedido);
  io.to(roomCortadores).emit("alerta_cortador", {
    mensaje: `¡Nuevo pedido #${pedido.id} para fraccionar!`,
    pedidoId: pedido.id,
    pedido,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emite evento de actualización de estado de un pedido al cliente y al panel admin
 */
const emitirActualizacionPedido = (clienteId, sucursalId, pedido) => {
  if (!io) return;
  
  if (clienteId) {
    const roomCliente = `sala_cliente_${clienteId}`;
    console.log(`📢 Emitiendo 'pedido_actualizado' a ${roomCliente}`);
    io.to(roomCliente).emit("pedido_actualizado", pedido);
  }

  if (sucursalId) {
    const roomSucursal = `sala_sucursal_${sucursalId}`;
    io.to(roomSucursal).emit("pedido_actualizado", pedido);
  }
};

/**
 * Emite evento de cambio de stock a la sucursal y a la sala general
 */
const emitirCambioStock = (sucursalId, data) => {
  if (!io) return;
  if (sucursalId) {
    io.to(`sala_sucursal_${sucursalId}`).emit("stock_actualizado", data);
  }
  io.to("sala_stock").emit("stock_actualizado", data);
};

/**
 * Emite evento de cambio en catálogo (creación, edición, eliminación o promos)
 */
const emitirCambioCatalogo = (data) => {
  if (!io) return;
  console.log("📢 [Socket.io] Emitiendo 'catalogo_actualizado'");
  io.emit("catalogo_actualizado", data);
};

module.exports = {
  initSocket,
  getIO,
  emitirNuevoPedido,
  emitirActualizacionPedido,
  emitirCambioStock,
  emitirCambioCatalogo,
};
