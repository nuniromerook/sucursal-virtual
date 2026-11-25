// admin/src/pages/ClientesClubPage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Gift,
  Ticket,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/formatters";

const EMPTY_REWARD = {
  id: null,
  titulo: "",
  descripcion: "",
  tipo: "producto",
  puntos_requeridos: "150",
  stock_disponible: "",
  activo: true,
  orden: 0,
};

export default function ClientesClubPage() {
  const { showToast } = useAdmin();
  const { authHeaders } = useAuth();

  const [subTab, setSubTab] = useState("clientes"); // "clientes" | "premios" | "canjes"
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [clientes, setClientes] = useState([]);
  const [recompensas, setRecompensas] = useState([]);
  const [canjes, setCanjes] = useState([]);

  // Modal Ajuste de Puntos
  const [adjustModal, setAdjustModal] = useState(null); // cliente object
  const [adjustDelta, setAdjustDelta] = useState("100");
  const [adjustReason, setAdjustReason] = useState("");
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  // Modal CRUD Premio
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState(EMPTY_REWARD);
  const [isSavingReward, setIsSavingReward] = useState(false);

  const fetchAll = useCallback(async () => {
    const [cliRes, rewRes, canRes] = await Promise.all([
      fetch(`${VITE_API_URL}/clientes/admin`, { headers: authHeaders }),
      fetch(`${VITE_API_URL}/recompensas/admin`, { headers: authHeaders }),
      fetch(`${VITE_API_URL}/canjes/admin`, { headers: authHeaders }),
    ]);
    const cliData = cliRes.ok ? await cliRes.json() : [];
    const rewData = rewRes.ok ? await rewRes.json() : [];
    const canData = canRes.ok ? await canRes.json() : [];
    return {
      clientes: Array.isArray(cliData) ? cliData : [],
      recompensas: Array.isArray(rewData) ? rewData : [],
      canjes: Array.isArray(canData) ? canData : [],
    };
  }, [authHeaders]);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAll();
      setClientes(data.clientes);
      setRecompensas(data.recompensas);
      setCanjes(data.canjes);
    } catch {
      showToast("Error al consultar datos del Club Valette.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchAll()
      .then((data) => {
        if (!isMounted) return;
        setClientes(data.clientes);
        setRecompensas(data.recompensas);
        setCanjes(data.canjes);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [fetchAll]);

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    if (!adjustModal || !adjustReason.trim()) return;
    setIsSavingAdjust(true);
    try {
      const res = await fetch(
        `${VITE_API_URL}/clientes/admin/${adjustModal.id}/puntos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            puntos: Number(adjustDelta),
            descripcion: adjustReason.trim(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al ajustar puntos.");

      showToast(`Puntos actualizados para ${adjustModal.nombre}.`);
      setAdjustModal(null);
      setAdjustDelta("100");
      setAdjustReason("");
      await loadAll();
    } catch (err) {
      showToast(err.message || "Error al ajustar puntos.", "error");
    } finally {
      setIsSavingAdjust(false);
    }
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    if (!rewardForm.titulo.trim()) return;
    setIsSavingReward(true);
    try {
      const isEdit = Boolean(rewardForm.id);
      const url = isEdit
        ? `${VITE_API_URL}/recompensas/${rewardForm.id}`
        : `${VITE_API_URL}/recompensas`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          titulo: rewardForm.titulo.trim(),
          descripcion: rewardForm.descripcion.trim(),
          tipo: rewardForm.tipo,
          puntos_requeridos: Number(rewardForm.puntos_requeridos),
          stock_disponible:
            rewardForm.stock_disponible === ""
              ? null
              : Number(rewardForm.stock_disponible),
          activo: Boolean(rewardForm.activo),
          orden: Number(rewardForm.orden) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar premio.");

      showToast(isEdit ? "Premio actualizado." : "Nuevo premio creado.");
      setRewardModalOpen(false);
      await loadAll();
    } catch (err) {
      showToast(err.message || "Error al guardar premio.", "error");
    } finally {
      setIsSavingReward(false);
    }
  };

  const handleDeleteReward = async (rew) => {
    if (!window.confirm(`¿Eliminar el premio "${rew.titulo}"?`)) return;
    try {
      const res = await fetch(`${VITE_API_URL}/recompensas/${rew.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setRecompensas((prev) => prev.filter((r) => r.id !== rew.id));
      showToast("Premio eliminado.");
    } catch {
      showToast("No se pudo eliminar el premio.", "error");
    }
  };

  const handleCanjeEstado = async (canje, nuevoEstado) => {
    if (
      nuevoEstado === "cancelado" &&
      !window.confirm(
        `¿Cancelar el canje ${canje.codigo_canje} y devolver ${canje.puntos_gastados} puntos al cliente?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${VITE_API_URL}/canjes/admin/${canje.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al actualizar canje.");
      showToast(
        nuevoEstado === "entregado"
          ? `Canje ${canje.codigo_canje} marcado como ENTREGADO.`
          : `Canje ${canje.codigo_canje} cancelado y puntos reembolsados.`
      );
      await loadAll();
    } catch (err) {
      showToast(err.message || "Error al actualizar canje.", "error");
    }
  };

  const filteredClients = clientes.filter((c) => {
    const q = searchTerm.trim().toLowerCase().replace(/^#/, "");
    if (!q) return true;
    return (
      String(c.referral_code || "").toLowerCase().includes(q) ||
      String(c.nombre || "").toLowerCase().includes(q) ||
      String(c.email || "").toLowerCase().includes(q) ||
      String(c.telefono || "").toLowerCase().includes(q) ||
      String(c.usuario || "").toLowerCase().includes(q)
    );
  });

  const pendientesCanjes = canjes.filter((c) => c.estado === "pendiente").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Clientes & Club Valette
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fidelización estratégica: gestioná clientes, acreditación manual de
            puntos, catálogo de premios (sorteos, cortes, envíos) y validación de
            códigos de canje.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            disabled={isLoading}
            className="p-2.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setRewardForm({ ...EMPTY_REWARD, orden: recompensas.length + 1 });
              setRewardModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#002244] hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Premio</span>
          </button>
        </div>
      </div>

      {/* Sub-pestañas */}
      <div className="inline-flex p-1 bg-slate-200/60 rounded-xl gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubTab("clientes")}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
            subTab === "clientes"
              ? "bg-white text-[#002244] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clientes ({clientes.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("premios")}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
            subTab === "premios"
              ? "bg-white text-[#002244] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Premios & Sorteos ({recompensas.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("canjes")}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
            subTab === "canjes"
              ? "bg-white text-[#002244] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Canjes ({canjes.length})</span>
          {pendientesCanjes > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#c53030] text-white text-[10px] font-black">
              {pendientesCanjes}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CLIENTES */}
      {subTab === "clientes" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID de cliente (caja), nombre, email, usuario o teléfono..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:bg-white focus:border-[#002244]"
              />
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No hay clientes registrados para mostrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3 px-4">ID Caja</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Pedidos / Facturado</th>
                    <th className="py-3 px-4">Puntos Club</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#EFF4F9] text-[#002244] font-mono font-black text-xs tracking-wider">
                          {c.referral_code || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{c.nombre}</div>
                        {c.usuario && (
                          <div className="text-[11px] font-normal text-slate-400">
                            @{String(c.usuario).replace(/^@/, "")}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{c.email || "—"}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {c.telefono || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">
                          {c.pedidos_count || 0} ped.
                        </span>{" "}
                        <span className="text-slate-400">·</span>{" "}
                        <span className="text-emerald-700 font-bold">
                          {formatMoney(c.total_gastado || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-mono font-black">
                          {c.puntos_acumulados || 0} pts
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustModal(c);
                            setAdjustDelta("100");
                            setAdjustReason("");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#002244] hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Ajustar Puntos</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PREMIOS & SORTEOS */}
      {subTab === "premios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recompensas.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 ${
                r.activo ? "border-slate-200/80" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                    {r.tipo} {r.activo ? "" : "· PAUSADO"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-mono font-black text-xs">
                    {r.puntos_requeridos} pts
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900">{r.titulo}</h3>
                {r.descripcion && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {r.descripcion}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  Stock:{" "}
                  <b>
                    {r.stock_disponible === null
                      ? "Ilimitado"
                      : r.stock_disponible}
                  </b>{" "}
                  · Canjes: <b>{r.total_canjes || 0}</b>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRewardForm({
                        id: r.id,
                        titulo: r.titulo || "",
                        descripcion: r.descripcion || "",
                        tipo: r.tipo || "producto",
                        puntos_requeridos: String(r.puntos_requeridos || 100),
                        stock_disponible:
                          r.stock_disponible === null
                            ? ""
                            : String(r.stock_disponible),
                        activo: r.activo !== false,
                        orden: r.orden || 0,
                      });
                      setRewardModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReward(r)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CANJES & VALIDACIÓN DE CÓDIGOS */}
      {subTab === "canjes" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {canjes.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Todavía ningún cliente canjeó recompensas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Premio Canjeado</th>
                    <th className="py-3 px-4">Fecha / Estado</th>
                    <th className="py-3 px-4 text-right">Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canjes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-[#002244]/10 text-[#002244] font-mono font-black">
                          {c.codigo_canje}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {c.cliente_nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {c.cliente_telefono || c.cliente_email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {c.titulo_recompensa}
                        </div>
                        <div className="text-[11px] text-amber-800 font-mono font-bold">
                          -{c.puntos_gastados} pts ({c.tipo_recompensa})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.estado === "entregado"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.estado === "cancelado"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {c.estado}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.creado_en ? formatDate(c.creado_en) : ""}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.estado === "pendiente" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCanjeEstado(c, "entregado")}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Entregar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCanjeEstado(c, "cancelado")}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Cancelar y reembolsar puntos"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Finalizado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Ajuste Manual de Puntos */}
      {adjustModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
          onClick={() => !isSavingAdjust && setAdjustModal(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                Ajustar Puntos — {adjustModal.nombre}
              </h2>
              <button
                type="button"
                onClick={() => setAdjustModal(null)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAdjust} className="p-6 space-y-4 text-xs">
              <p className="text-slate-500">
                Saldo actual:{" "}
                <b className="text-amber-800 font-mono">
                  {adjustModal.puntos_acumulados || 0} pts
                </b>
                . Usá un número positivo para sumar o negativo para descontar.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cantidad de Puntos (+ o -) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-sm outline-none focus:bg-white focus:border-[#002244]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo visible para el cliente *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="ej: Bono fidelidad mostrador / Corrección de compra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdjust}
                  className="px-5 py-2 rounded-xl bg-[#002244] hover:bg-slate-800 text-white font-black cursor-pointer disabled:opacity-60"
                >
                  {isSavingAdjust ? "Aplicando..." : "Aplicar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CRUD Premio */}
      {rewardModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
          onClick={() => !isSavingReward && setRewardModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                {rewardForm.id ? "Editar Premio" : "Nuevo Premio Club Valette"}
              </h2>
              <button
                type="button"
                onClick={() => setRewardModalOpen(false)}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Título del Premio *
                </label>
                <input
                  type="text"
                  required
                  value={rewardForm.titulo}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, titulo: e.target.value })
                  }
                  placeholder="ej: Número para Sorteo Mensual / 1 kg Roast Beef"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:bg-white focus:border-[#002244]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={rewardForm.descripcion}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, descripcion: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-[#002244]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Beneficio
                  </label>
                  <select
                    value={rewardForm.tipo}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, tipo: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none"
                  >
                    <option value="sorteo">Número de Sorteo</option>
                    <option value="producto">Corte / Producto Gratis</option>
                    <option value="envio">Envío Gratis</option>
                    <option value="descuento">Descuento / Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Puntos Requeridos *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={rewardForm.puntos_requeridos}
                    onChange={(e) =>
                      setRewardForm({
                        ...rewardForm,
                        puntos_requeridos: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stock (vacío = ilimitado)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rewardForm.stock_disponible}
                    onChange={(e) =>
                      setRewardForm({
                        ...rewardForm,
                        stock_disponible: e.target.value,
                      })
                    }
                    placeholder="Ilimitado"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={rewardForm.orden}
                    onChange={(e) =>
                      setRewardForm({ ...rewardForm, orden: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rewardForm.activo}
                  onChange={(e) =>
                    setRewardForm({ ...rewardForm, activo: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Visible y canjeable por los clientes</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRewardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingReward}
                  className="px-5 py-2 rounded-xl bg-[#c53030] hover:bg-[#a82525] text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingReward ? "Guardando..." : "Guardar Premio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
