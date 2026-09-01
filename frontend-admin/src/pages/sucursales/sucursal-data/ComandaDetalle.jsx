// frontend-admin/src/pages/sucursales/sucursal-data/ComandaDetalle.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { useAppContext } from "../../../context/AppContext";
import { VITE_API_URL } from "../../../config/api";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Scissors,
  Scale,
  Truck,
  Check,
  XCircle,
  Phone,
  MessageCircle,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Printer,
  Edit3,
  UserCheck,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  ShoppingBag,
  Store,
  Package,
  CheckCircle,
} from "lucide-react";
import ButtonLoader from "../../../components/ui/ButtonLoader";

const ESTADOS = [
  {
    key: "solicitado",
    label: "Solicitado",
    desc: "Pedido ingresado por la tienda web",
    icon: Clock,
    color: "amber",
    bg: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    key: "en_corte",
    label: "En Corte",
    desc: "Cortador preparando piezas de carne",
    icon: Scissors,
    color: "blue",
    bg: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    key: "pesado",
    label: "Pesado / Aprobación",
    desc: "Piezas pesadas, listo para confirmación de monto",
    icon: Scale,
    color: "purple",
    bg: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    key: "listo",
    label: "Listo para Entregar",
    desc: "Empaquetado y rotulado en mostrador",
    icon: CheckCircle2,
    color: "emerald",
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    key: "en_camino",
    label: "En Camino",
    desc: "Repartidor trasladando el pedido",
    icon: Truck,
    color: "orange",
    bg: "bg-orange-50 text-orange-800 border-orange-200",
  },
  {
    key: "entregado",
    label: "Entregado",
    desc: "Pedido finalizado y cobrado",
    icon: Check,
    color: "gray",
    bg: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },
  {
    key: "cancelado",
    label: "Cancelado",
    desc: "Comanda dada de baja",
    icon: XCircle,
    color: "red",
    bg: "bg-red-50 text-red-700 border-red-200",
  },
];

export default function ComandaDetalle() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setNavbarTitle } = useAppContext();
  const { joinSucursal, leaveSucursal, socket } = useSocket();

  const [pedido, setPedido] = useState(null);
  const [cortadores, setCortadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados de edición para encargados
  const [montoRealInput, setMontoRealInput] = useState("");
  const [notasInput, setNotasInput] = useState("");
  const [modalCortadorOpen, setModalCortadorOpen] = useState(false);

  // ¿El usuario es Encargado / Admin?
  const esEncargado = Boolean(
    user &&
      (user.rol === "admin" ||
        user.rol === "administrador" ||
        user.rol === "encargado"),
  );

  const fetchPedido = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${id}`);
      if (!res.ok) {
        throw new Error("No se pudo obtener la información de la comanda.");
      }
      const data = await res.json();
      setPedido(data);
      setMontoRealInput(
        data.monto_total_final || data.monto_total_estimado || "",
      );
      setNotasInput(data.notas || "");

      // Si la comanda tiene sucursal_id, unirse al canal socket
      if (data.sucursal_id) {
        joinSucursal(data.sucursal_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al cargar la comanda.");
    } finally {
      setIsLoading(false);
    }
  }, [id, joinSucursal]);

  const fetchCortadores = useCallback(async () => {
    if (!esEncargado) return;
    try {
      const res = await fetch(`${VITE_API_URL}/empleados`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCortadores(data.filter((e) => e.rol === "cortador" && e.activo));
        }
      }
    } catch (err) {
      console.error("Error al cargar cortadores:", err);
    }
  }, [esEncargado]);

  useEffect(() => {
    setNavbarTitle(`Comanda #${id}`);
    fetchPedido();
    fetchCortadores();

    return () => {
      if (pedido?.sucursal_id) {
        leaveSucursal(pedido.sucursal_id);
      }
    };
  }, [id, setNavbarTitle]);

  // Escuchar cambios de estado en tiempo real vía Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleActualizacion = (pedActualizado) => {
      if (Number(pedActualizado.id) === Number(id)) {
        setPedido(pedActualizado);
        setMontoRealInput(
          pedActualizado.monto_total_final ||
            pedActualizado.monto_total_estimado ||
            "",
        );
      }
    };

    socket.on("pedido_actualizado", handleActualizacion);
    return () => {
      socket.off("pedido_actualizado", handleActualizacion);
    };
  }, [socket, id]);

  // Cambiar estado operativo
  const handleCambiarEstado = async (nuevoEstado) => {
    setIsUpdating(true);
    try {
      const bodyData = { estado: nuevoEstado };
      if (montoRealInput) {
        bodyData.monto_final_real = parseFloat(montoRealInput);
      }

      const res = await fetch(`${VITE_API_URL}/pedidos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Error al actualizar el estado");

      const data = await res.json();
      if (data.pedido) {
        setPedido(data.pedido);
      } else {
        fetchPedido();
      }
    } catch (err) {
      alert(err.message || "No se pudo actualizar el estado.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Asignar cortador
  const handleAsignarCortador = async (cortadorId) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cortador_id: cortadorId }),
      });

      if (!res.ok) throw new Error("Error al asignar cortador");
      setModalCortadorOpen(false);
      fetchPedido();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Guardar notas internas
  const handleGuardarNotas = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${VITE_API_URL}/pedidos/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: notasInput }),
      });

      if (!res.ok) throw new Error("Error al guardar notas");
      fetchPedido();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatMoney = (val) => `$${Number(val || 0).toLocaleString("es-AR")}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="size-8 text-main-blue animate-spin" />
        <p className="text-sm font-bold text-neutral-600">
          Cargando detalle de la comanda #{id}...
        </p>
      </div>
    );
  }

  if (errorMsg || !pedido) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-black text-neutral-900">
          {errorMsg || "Comanda no encontrada"}
        </h2>
        <p className="text-xs text-neutral-500">
          No pudimos localizar los datos del pedido en esta sucursal.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-black"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  const estadoActualObj =
    ESTADOS.find(
      (e) => e.key === (pedido.estado_local || pedido.estado || "solicitado"),
    ) || ESTADOS[0];

  const EstadoIcon = estadoActualObj.icon;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 select-none">
      {/* ─── Top Bar & Breadcrumb ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-main-blue">
                Comanda #{pedido.id}
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${estadoActualObj.bg}`}
              >
                <EstadoIcon className="size-3.5" />
                {estadoActualObj.label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Ingresó el{" "}
              {new Date(pedido.creado_en).toLocaleString("es-AR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}{" "}
              · Sucursal:{" "}
              <strong className="text-neutral-800">
                {pedido.sucursal_nombre || slug}
              </strong>
            </p>
          </div>
        </div>

        {/* Acciones del Encargado / Impresión */}
        <div className="flex items-center gap-2 flex-wrap">
          {esEncargado && (
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Vista Encargado
            </span>
          )}
          {!esEncargado && (
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Eye className="size-3.5 text-neutral-500" />
              Vista General / KDS
            </span>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="size-4 text-neutral-600" />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>

      {/* ─── Grid Principal de Contenido ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1 y 2: Detalles de la Comanda y Productos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Productos / Cortes */}
          <div className="bg-white rounded-xl border border-neutral-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-main-blue" />
                <h3 className="font-extrabold text-base text-neutral-900">
                  Cortes & Productos Pedidos ({pedido.items?.length || 0})
                </h3>
              </div>
              <span className="text-xs font-bold text-neutral-500">
                Canal:{" "}
                <span className="uppercase text-neutral-800">
                  {pedido.canal || "Web"}
                </span>
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {pedido.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.imagen_url ? (
                      <img
                        src={item.imagen_url}
                        alt={item.nombre_producto}
                        className="size-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                        <Package className="size-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-neutral-900 truncate">
                        {item.nombre_producto}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 flex-wrap">
                        <span className="capitalize bg-neutral-100 px-2 py-0.5 rounded text-[11px] font-bold text-neutral-700">
                          {item.especie || "Corte"}
                        </span>
                        {item.fraccion && (
                          <span className="font-semibold text-main-blue">
                            Corte: {item.fraccion}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-neutral-900 block">
                      {Number(item.cantidad_kg_solicitada || item.cantidad || 1)}{" "}
                      {item.unidad_medida || "kg"}
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold">
                      {formatMoney(
                        item.precio_estimado || item.precio_por_kg_congelado,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totalizador de la Comanda */}
            <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-neutral-400">
                  Monto Final / Estimado
                </p>
                <p className="text-xs text-neutral-400">
                  {pedido.monto_total_final
                    ? "Monto pesado final"
                    : "Monto estimado sujeto al peso exacto"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {formatMoney(
                    pedido.monto_total_final || pedido.monto_total_estimado,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Estado Operativo (Solo Encargado / Admin) */}
          {esEncargado && (
            <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="size-4 text-main-blue" />
                  Gestión Operativa de Estado
                </h3>
                <span className="text-xs text-neutral-400 font-semibold">
                  Presioná un estado para actualizarlo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ESTADOS.filter((e) => e.key !== "cancelado").map((est) => {
                  const Icon = est.icon;
                  const isCurrent =
                    (pedido.estado_local || pedido.estado) === est.key;
                  return (
                    <button
                      key={est.key}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleCambiarEstado(est.key)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px] ${
                        isCurrent
                          ? "bg-main-blue text-white border-main-blue shadow-md font-bold"
                          : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className="size-4 shrink-0" />
                        {isCurrent && (
                          <span className="size-2 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs font-bold mt-2">
                        {est.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Ajuste manual de monto en etapa de Pesado */}
              <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Monto Final Exacto luego del Pesado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 14500"
                    value={montoRealInput}
                    onChange={(e) => setMontoRealInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-800 focus:border-main-blue focus:outline-none"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <ButtonLoader
                    value="Guardar Monto"
                    loadingValue="Guardando..."
                    isLoading={isUpdating}
                    onClick={() =>
                      handleCambiarEstado(
                        pedido.estado_local || pedido.estado,
                      )
                    }
                    classNames="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  />

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Estás seguro de cancelar esta comanda?",
                        )
                      ) {
                        handleCambiarEstado("cancelado");
                      }
                    }}
                    className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                  >
                    Cancelar Comanda
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Historial o Notas Internas (Solo Encargado / Admin) */}
          {esEncargado && (
            <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-neutral-700">
                Notas Internas de Sucursal
              </h3>
              <textarea
                rows={2}
                placeholder="Escribí notas o aclaraciones de preparación para el equipo..."
                value={notasInput}
                onChange={(e) => setNotasInput(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-3 text-xs text-neutral-800 focus:border-main-blue focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleGuardarNotas}
                  className="px-3.5 py-1.5 bg-neutral-800 text-white font-bold text-xs rounded-lg hover:bg-black cursor-pointer"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Columna 3: Información de Cliente (Protegida) & Cortador Asignado */}
        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-main-blue" />
                <h3 className="font-extrabold text-sm text-neutral-900">
                  Datos del Cliente
                </h3>
              </div>
              {esEncargado ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Datos Completos
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500 font-bold bg-neutral-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <EyeOff className="size-3" /> Privado
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-400 font-semibold block">
                  Nombre:
                </span>
                <span className="font-extrabold text-neutral-900 text-sm">
                  {pedido.cliente_nombre || "Cliente Valette"}
                </span>
              </div>

              {/* Teléfono (Solo se muestra a Encargados) */}
              {esEncargado ? (
                <div>
                  <span className="text-neutral-400 font-semibold block">
                    Teléfono de Contacto:
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-neutral-800">
                      {pedido.cliente_telefono || "No especificado"}
                    </span>
                    {pedido.cliente_telefono && (
                      <a
                        href={`https://wa.me/${pedido.cliente_telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${pedido.cliente_nombre || ""}, te contactamos de Abastecedora Valette por tu pedido #${pedido.id}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="size-3.5 fill-emerald-600 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-neutral-400 font-semibold block">
                    Teléfono:
                  </span>
                  <span className="font-bold text-neutral-500 italic">
                    [Oculto por política de privacidad KDS]
                  </span>
                </div>
              )}

              {/* Dirección de entrega */}
              <div>
                <span className="text-neutral-400 font-semibold block">
                  Modo de Entrega & Dirección:
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-bold text-neutral-800">
                  <MapPin className="size-3.5 text-main-red shrink-0" />
                  <span className="capitalize">
                    {pedido.tipo_entrega?.replace("_", " ") || "Retiro"}
                  </span>
                </div>
                {pedido.direccion_entrega && (
                  <p className="text-neutral-600 text-xs mt-0.5 pl-5">
                    {pedido.direccion_entrega}
                  </p>
                )}
              </div>

              {/* Medio de pago */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-neutral-400 font-semibold">
                  Medio de Pago:
                </span>
                <span className="font-black text-neutral-800 capitalize bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                  {pedido.medio_pago || "Efectivo"}
                </span>
              </div>
            </div>
          </div>

          {/* Asignación de Cortador */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Scissors className="size-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-neutral-900">
                  Cortador Asignado
                </h3>
              </div>
              {esEncargado && (
                <button
                  type="button"
                  onClick={() => setModalCortadorOpen(true)}
                  className="text-xs font-bold text-main-blue hover:underline cursor-pointer"
                >
                  Cambiar
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <div className="size-9 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs shrink-0">
                {pedido.cortador_apodo || pedido.cortador_nombre
                  ? (pedido.cortador_apodo || pedido.cortador_nombre)
                      .slice(0, 2)
                      .toUpperCase()
                  : "AV"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-neutral-900 truncate">
                  {pedido.cortador_apodo ||
                    pedido.cortador_nombre ||
                    "Sin asignar"}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {pedido.cortador_nombre
                    ? `Encargado del corte y pesado`
                    : `Hacé clic en Cambiar para asignar a un cortador`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal de Selección de Cortador para Encargados ─── */}
      {modalCortadorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-neutral-50">
              <div className="flex items-center gap-2">
                <Scissors className="size-4 text-main-blue" />
                <h3 className="font-extrabold text-sm text-neutral-900">
                  Asignar Cortador para Comanda #{pedido.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCortadorOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {cortadores.length === 0 ? (
                <p className="text-xs text-neutral-500 italic py-4 text-center">
                  No hay cortadores activos disponibles en esta sucursal.
                </p>
              ) : (
                cortadores.map((cortador) => (
                  <button
                    key={cortador.id}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleAsignarCortador(cortador.id)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                      pedido.cortador_id === cortador.id
                        ? "bg-main-blue/10 border-main-blue text-main-blue font-bold"
                        : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-main-blue/10 text-main-blue font-black flex items-center justify-center text-xs">
                        {cortador.apodo?.[0] || cortador.nombre?.[0] || "C"}
                      </div>
                      <div>
                        <p className="text-xs font-bold">
                          {cortador.apodo || cortador.nombre}
                        </p>
                        <p className="text-[10px] text-neutral-400 capitalize">
                          {cortador.rol}
                        </p>
                      </div>
                    </div>
                    {pedido.cortador_id === cortador.id && (
                      <CheckCircle className="size-4 text-main-blue" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalCortadorOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
