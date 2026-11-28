// admin/src/pages/IngresosPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  RefreshCw,
  Download,
  Search,
  Trash2,
  Eye,
  X,
  Scale,
  ArrowUpDown,
  Save,
} from "lucide-react";
import { VITE_API_URL } from "../config/api";
import { useAdmin } from "../context/AdminContext";
import { useAuth } from "../context/AuthContext";
import { formatMoney, formatDate } from "../utils/formatters";

const RUBRO_OPTIONS = ["Vacuno", "Cerdo", "Pollo", "Embutidos", "Almacén", "Otro"];
const CAMARA_OPTIONS = ["Cámara 1", "Cámara 2", "Mostrador", "Freezer"];
const MERCADERIA_SUGGESTIONS = [
  "Media Res Novillito",
  "Cuarto Trasero Vacuno",
  "Vacío en Caja",
  "Asado en Manta",
  "Media Res Cerdo",
  "Bondiola Fresca Caja",
  "Carne Picada Puro Cerdo",
  "Pollo Cajón x 20kg",
  "Suprema de Pollo Caja",
];

const EMPTY_QUICK = {
  proveedor: "",
  mercaderia: "",
  rubro: "Vacuno",
  kg_remito: "",
  kg_balanza: "",
  costo_kg: "",
  camara: "Cámara 1",
};

const fmtKg = (n) =>
  `${(Number(n) || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kg`;

const collator = new Intl.Collator("es-AR", {
  numeric: true,
  sensitivity: "base",
});

export default function IngresosPage() {
  const { selectedSucursal, showToast } = useAdmin();
  const { authHeaders } = useAuth();
  const sucursalId = selectedSucursal?.id || 1;

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rango, setRango] = useState("mes"); // hoy | semana | mes | todos
  const [rubroFilter, setRubroFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "creado_en", dir: "desc" });

  // Formulario rápido en 1 línea
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK);
  const mercaderiaInputRef = useRef(null);

  // Modal de detalle y edición completa
  const [detailRow, setDetailRow] = useState(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);

  // Integración real WebSerial para balanza USB/RS-232 (Chrome/Edge)
  const serialSupported =
    typeof navigator !== "undefined" && "serial" in navigator;
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleReading, setScaleReading] = useState(null);
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);

  const fetchIngresosList = useCallback(async () => {
    const res = await fetch(
      `${VITE_API_URL}/ingresos?rango=${rango}&sucursal_id=${sucursalId}`,
      { headers: authHeaders },
    );
    if (!res.ok) throw new Error("No se pudieron cargar los ingresos.");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }, [rango, sucursalId, authHeaders]);

  const loadIngresos = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchIngresosList();
      setRows(list);
    } catch (err) {
      showToast(err.message || "Error al consultar ingresos.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [fetchIngresosList, showToast]);

  useEffect(() => {
    let mounted = true;
    fetchIngresosList()
      .then((list) => {
        if (mounted) setRows(list);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchIngresosList]);

  // Limpiar conexión serial al desmontar
  useEffect(() => {
    return () => {
      try {
        serialReaderRef.current?.cancel();
        serialPortRef.current?.close();
      } catch {
        // Ignorar cierre de puerto ya liberado
      }
    };
  }, []);

  const handleToggleScale = async () => {
    if (!serialSupported) {
      showToast("Conectá la balanza desde Chrome o Edge de escritorio.", "error");
      return;
    }

    if (scaleConnected) {
      try {
        await serialReaderRef.current?.cancel();
        await serialPortRef.current?.close();
      } catch {
        // Ignorar error al desconectar puerto serie
      }
      serialReaderRef.current = null;
      serialPortRef.current = null;
      setScaleConnected(false);
      setScaleReading(null);
      showToast("Balanza desconectada.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setScaleConnected(true);
      showToast("Balanza conectada por puerto serie.");

      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable).catch(() => {});
      const reader = decoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = "";
      (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split(/[\r\n]+/);
              buffer = lines.pop() || "";
              for (const line of lines) {
                const match = line.match(/(\d+[.,]\d+|\d+)/);
                if (match) {
                  const parsed = parseFloat(match[1].replace(",", "."));
                  if (Number.isFinite(parsed) && parsed >= 0) {
                    setScaleReading(parsed);
                  }
                }
              }
            }
          }
        } catch {
          // Cierre normal del puerto
        }
      })();
    } catch (err) {
      if (err?.name !== "NotFoundError") {
        showToast("No se pudo abrir el puerto de la balanza.", "error");
      }
    }
  };

  // Proveedores históricos reales para autocompletar
  const knownSuppliers = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => String(r.proveedor || "").trim()).filter(Boolean)),
    ).sort((a, b) => collator.compare(a, b));
  }, [rows]);

  // Crear ingreso rápido en 1 línea
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickForm.proveedor.trim() || !quickForm.mercaderia.trim()) {
      showToast("Completá proveedor y mercadería.", "error");
      return;
    }
    const kgBalanza = parseFloat(quickForm.kg_balanza || quickForm.kg_remito);
    const kgRemito = parseFloat(quickForm.kg_remito || quickForm.kg_balanza);
    const costoKg = parseFloat(quickForm.costo_kg) || 0;
    if (!Number.isFinite(kgBalanza) || kgBalanza <= 0) {
      showToast("Ingresá un peso de balanza válido.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${VITE_API_URL}/ingresos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          sucursal_id: sucursalId,
          proveedor: quickForm.proveedor.trim(),
          mercaderia: quickForm.mercaderia.trim(),
          rubro: quickForm.rubro,
          kg_remito: Number.isFinite(kgRemito) ? kgRemito : kgBalanza,
          kg_balanza: kgBalanza,
          costo_kg: costoKg,
          camara: quickForm.camara,
        }),
      });
      const saved = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(saved.error || "Error al registrar ingreso.");

      setRows((prev) => [saved, ...prev]);
      setQuickForm((prev) => ({
        ...prev,
        mercaderia: "",
        kg_remito: "",
        kg_balanza: "",
        costo_kg: "",
      }));
      showToast(`Ingreso ${saved.lote} registrado (${fmtKg(saved.kg_balanza)}).`);
      mercaderiaInputRef.current?.focus();
    } catch (err) {
      showToast(err.message || "Error al guardar el ingreso.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edición inline directa en la planilla (kg_balanza o costo_kg)
  const handleInlineUpdate = async (row, field, rawVal) => {
    const num = parseFloat(rawVal);
    if (!Number.isFinite(num) || num < 0) return;
    if (Number(row[field]) === num) return;

    try {
      const res = await fetch(`${VITE_API_URL}/ingresos/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ [field]: num }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      showToast(`Lote ${row.lote} actualizado.`);
    } catch {
      showToast("No se pudo actualizar el lote.", "error");
    }
  };

  const handleSaveDetail = async (e) => {
    e.preventDefault();
    if (!detailRow) return;
    setIsSavingDetail(true);
    try {
      const res = await fetch(`${VITE_API_URL}/ingresos/${detailRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          proveedor: detailRow.proveedor,
          remito: detailRow.remito,
          tropa: detailRow.tropa,
          mercaderia: detailRow.mercaderia,
          rubro: detailRow.rubro,
          kg_remito: Number(detailRow.kg_remito) || 0,
          kg_balanza: Number(detailRow.kg_balanza) || 0,
          costo_kg: Number(detailRow.costo_kg) || 0,
          camara: detailRow.camara,
          temperatura: detailRow.temperatura,
          notas: detailRow.notas,
          estado: detailRow.estado,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDetailRow(null);
      showToast(`Lote ${updated.lote} guardado.`);
    } catch {
      showToast("No se pudieron guardar los cambios del lote.", "error");
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Eliminar el registro ${row.lote} (${row.mercaderia})?`)) {
      return;
    }
    try {
      const res = await fetch(`${VITE_API_URL}/ingresos/${row.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error();
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      showToast(`Registro ${row.lote} eliminado.`);
    } catch {
      showToast("No se pudo eliminar el registro.", "error");
    }
  };

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const visibleRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (rubroFilter !== "Todos" && r.rubro !== rubroFilter) return false;
      if (!q) return true;
      return `${r.lote} ${r.proveedor} ${r.remito} ${r.tropa} ${r.mercaderia} ${r.camara}`
        .toLowerCase()
        .includes(q);
    });

    const factor = sortConfig.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const k = sortConfig.key;
      if (k === "kg_remito" || k === "kg_balanza" || k === "costo_kg") {
        return factor * ((Number(a[k]) || 0) - (Number(b[k]) || 0));
      }
      if (k === "subtotal") {
        const sa = (Number(a.kg_balanza) || 0) * (Number(a.costo_kg) || 0);
        const sb = (Number(b.kg_balanza) || 0) * (Number(b.costo_kg) || 0);
        return factor * (sa - sb);
      }
      if (k === "dif") {
        const da = (Number(a.kg_balanza) || 0) - (Number(a.kg_remito) || 0);
        const db = (Number(b.kg_balanza) || 0) - (Number(b.kg_remito) || 0);
        return factor * (da - db);
      }
      if (k === "creado_en") {
        return factor * (new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
      }
      return factor * collator.compare(String(a[k] || ""), String(b[k] || ""));
    });
  }, [rows, rubroFilter, searchTerm, sortConfig]);

  // KPIs recalculados en vivo sobre las filas visibles
  const kpis = useMemo(() => {
    const kgBalanza = visibleRows.reduce((s, r) => s + (Number(r.kg_balanza) || 0), 0);
    const kgRemito = visibleRows.reduce((s, r) => s + (Number(r.kg_remito) || 0), 0);
    const totalPesos = visibleRows.reduce(
      (s, r) => s + (Number(r.kg_balanza) || 0) * (Number(r.costo_kg) || 0),
      0,
    );
    const avgCosto = kgBalanza > 0 ? totalPesos / kgBalanza : 0;
    const difKg = kgBalanza - kgRemito;
    const difPct = kgRemito > 0 ? (difKg / kgRemito) * 100 : 0;
    return { kgBalanza, totalPesos, avgCosto, difKg, difPct };
  }, [visibleRows]);

  const handleExportCSV = () => {
    if (visibleRows.length === 0) {
      showToast("No hay registros visibles para exportar.", "error");
      return;
    }
    const headers = [
      "Lote",
      "Fecha",
      "Proveedor",
      "Remito",
      "Tropa",
      "Mercaderia",
      "Rubro",
      "KgRemito",
      "KgBalanza",
      "DifKg",
      "CostoKg",
      "Subtotal",
      "Camara",
      "Estado",
    ];
    const lines = [headers.join(";")].concat(
      visibleRows.map((r) => {
        const kgR = Number(r.kg_remito) || 0;
        const kgB = Number(r.kg_balanza) || 0;
        const costo = Number(r.costo_kg) || 0;
        return [
          r.lote,
          r.creado_en ? new Date(r.creado_en).toLocaleString("es-AR") : "",
          r.proveedor,
          r.remito || "",
          r.tropa || "",
          r.mercaderia,
          r.rubro,
          kgR,
          kgB,
          (kgB - kgR).toFixed(2),
          costo,
          Math.round(kgB * costo),
          r.camara,
          r.estado,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(";");
      }),
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valette_ingresos_${rango}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Planilla CSV exportada.");
  };

  return (
    <div className="space-y-4">
      {/* Cabecera compacta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            Ingreso de Mercadería y Balanza
          </h1>
          <p className="text-xs text-slate-500">
            Cargá tropas, medias reses o cajas en una línea. Los totales, mermas y costos se calculan en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {serialSupported && (
            <button
              type="button"
              onClick={handleToggleScale}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                scaleConnected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>
                {scaleConnected
                  ? scaleReading !== null
                    ? `Balanza: ${fmtKg(scaleReading)}`
                    : "Balanza conectada"
                  : "Conectar balanza"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={loadIngresos}
            disabled={isLoading}
            title="Recargar planilla"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Strip de 1 fila */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-500">
            Kilos ingresados (balanza)
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {fmtKg(kpis.kgBalanza)}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
              {visibleRows.length} reg.
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-500">
            Total mercadería ingresada
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {formatMoney(kpis.totalPesos)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-500">
            Costo promedio ponderado
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {formatMoney(kpis.avgCosto)}/kg
            </span>
            <span className="text-[11px] text-slate-400">Neto balanza</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-500">
            Diferencia Remito vs Balanza
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span
              className={`text-xl font-extrabold tabular-nums ${
                kpis.difPct < -1 ? "text-[#c53030]" : "text-slate-900"
              }`}
            >
              {kpis.difKg > 0 ? "+" : ""}
              {kpis.difKg.toFixed(1).replace(".", ",")} kg
            </span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                kpis.difPct < -1
                  ? "bg-red-50 text-[#c53030]"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {kpis.difPct > 0 ? "+" : ""}
              {kpis.difPct.toFixed(2).replace(".", ",")}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra de carga rápida inline en 1 línea */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-native"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#002244]" />
            Carga rápida a planilla (Enter para registrar)
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Editá Kg Balanza o Costo $/kg directo sobre cualquier fila
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Frigorífico / Prov.
            </label>
            <input
              type="text"
              required
              list="ingresos-proveedores-list"
              value={quickForm.proveedor}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, proveedor: e.target.value }))
              }
              placeholder="Ej: Frigorífico Gorina"
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#002244]"
            />
            <datalist id="ingresos-proveedores-list">
              {knownSuppliers.map((sup) => (
                <option key={sup} value={sup} />
              ))}
            </datalist>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Mercadería / Corte
            </label>
            <input
              ref={mercaderiaInputRef}
              type="text"
              required
              list="ingresos-mercaderia-list"
              value={quickForm.mercaderia}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, mercaderia: e.target.value }))
              }
              placeholder="Ej: Media Res Novillito"
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#002244]"
            />
            <datalist id="ingresos-mercaderia-list">
              {MERCADERIA_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Rubro
            </label>
            <select
              value={quickForm.rubro}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, rubro: e.target.value }))
              }
              className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
            >
              {RUBRO_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Kg Remito
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={quickForm.kg_remito}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, kg_remito: e.target.value }))
              }
              placeholder="110.0"
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-right tabular-nums focus:outline-none focus:border-[#002244]"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Kg Balanza
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quickForm.kg_balanza}
                onChange={(e) =>
                  setQuickForm((prev) => ({ ...prev, kg_balanza: e.target.value }))
                }
                placeholder="109.4"
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-right tabular-nums focus:outline-none focus:border-[#002244]"
              />
              {scaleConnected && scaleReading !== null && (
                <button
                  type="button"
                  onClick={() =>
                    setQuickForm((prev) => ({
                      ...prev,
                      kg_balanza: String(scaleReading),
                    }))
                  }
                  className="h-9 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Leer
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Costo $/kg
            </label>
            <input
              type="number"
              step="10"
              min="0"
              required
              value={quickForm.costo_kg}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, costo_kg: e.target.value }))
              }
              placeholder="6950"
              className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-right tabular-nums focus:outline-none focus:border-[#002244]"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Destino
            </label>
            <select
              value={quickForm.camara}
              onChange={(e) =>
                setQuickForm((prev) => ({ ...prev, camara: e.target.value }))
              }
              className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#002244]"
            >
              {CAMARA_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 px-3 rounded-lg bg-[#002244] hover:bg-[#1e3b6c] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Guardando..." : "Ingresar"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Planilla principal */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-native overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar lote, proveedor, corte..."
                className="h-8 pl-8 pr-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs w-56 focus:outline-none focus:border-[#002244]"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {["Todos", "Vacuno", "Cerdo", "Pollo"].map((rub) => (
                <button
                  key={rub}
                  type="button"
                  onClick={() => setRubroFilter(rub)}
                  className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
                    rubroFilter === rub
                      ? "bg-white text-slate-900 font-bold shadow-2xs"
                      : "text-slate-600 font-semibold hover:text-slate-900"
                  }`}
                >
                  {rub}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {[
              { id: "hoy", label: "Hoy" },
              { id: "semana", label: "7 días" },
              { id: "mes", label: "30 días" },
              { id: "todos", label: "Todo" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== rango) {
                    setIsLoading(true);
                    setRango(item.id);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] cursor-pointer transition-colors ${
                  rango === item.id
                    ? "bg-[#002244] text-white font-bold"
                    : "text-slate-600 font-semibold hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-400 font-medium">
            {isLoading
              ? "Cargando ingresos desde PostgreSQL..."
              : "Todavía no hay ingresos registrados en este período. Usá la barra superior para cargar el primero."}
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="ingresos-table-caption"
            className="erp-table-wrapper"
          >
            <table className="erp-table min-w-[980px]">
              <caption id="ingresos-table-caption" className="sr-only-live">
                Planilla de ingresos de mercadería
              </caption>
              <thead>
                <tr>
                  {[
                    { key: "creado_en", label: "Lote / Fecha" },
                    { key: "proveedor", label: "Proveedor & Remito" },
                    { key: "mercaderia", label: "Mercadería" },
                    { key: "kg_remito", label: "Kg Remito", right: true },
                    { key: "kg_balanza", label: "Kg Balanza", right: true },
                    { key: "dif", label: "Dif. / Merma", right: true },
                    { key: "costo_kg", label: "Costo $/kg", right: true },
                    { key: "subtotal", label: "Subtotal", right: true },
                  ].map((col) => {
                    const isSorted = sortConfig.key === col.key;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        className={col.right ? "text-right" : ""}
                        aria-sort={
                          isSorted
                            ? sortConfig.dir === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                        >
                          <span>{col.label}</span>
                          <ArrowUpDown
                            className={`w-3 h-3 ${isSorted ? "opacity-100" : "opacity-35"}`}
                            aria-hidden="true"
                          />
                        </button>
                      </th>
                    );
                  })}
                  <th scope="col">Destino</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const kgR = Number(row.kg_remito) || 0;
                  const kgB = Number(row.kg_balanza) || 0;
                  const costo = Number(row.costo_kg) || 0;
                  const difKg = kgB - kgR;
                  const difPct = kgR > 0 ? (difKg / kgR) * 100 : 0;
                  const subtotal = kgB * costo;
                  const isHighMerma = row.estado === "revisar_dif" || difPct < -1.5;

                  return (
                    <tr key={row.id}>
                      <th scope="row" className="whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-slate-900">
                          {row.lote}
                        </div>
                        <div className="text-[11px] font-normal text-slate-400 tabular-nums">
                          {row.creado_en ? formatDate(row.creado_en) : ""}
                        </div>
                      </th>
                      <td className="whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {row.proveedor}
                        </div>
                        {row.remito && (
                          <div className="text-[11px] font-mono text-slate-400">
                            {row.remito}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {row.mercaderia}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {row.rubro}
                          {row.tropa ? ` · Tropa ${row.tropa}` : ""}
                        </div>
                      </td>
                      <td className="text-right tabular-nums text-slate-600 whitespace-nowrap">
                        {fmtKg(kgR)}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={kgB.toFixed(1)}
                          key={`bal-${row.id}-${kgB}`}
                          aria-label={`Kg balanza lote ${row.lote}`}
                          onBlur={(e) =>
                            handleInlineUpdate(row, "kg_balanza", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          className="erp-cell-input"
                        />
                      </td>
                      <td
                        className={`text-right tabular-nums whitespace-nowrap ${
                          isHighMerma
                            ? "text-[#c53030] font-bold"
                            : difKg < 0
                              ? "text-amber-700 font-semibold"
                              : "text-emerald-700 font-semibold"
                        }`}
                      >
                        <div>
                          {difKg > 0 ? "+" : ""}
                          {difKg.toFixed(1).replace(".", ",")} kg
                        </div>
                        <div className="text-[10px] opacity-80">
                          {difPct.toFixed(2).replace(".", ",")}%
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <input
                          type="number"
                          step="50"
                          defaultValue={Math.round(costo)}
                          key={`cos-${row.id}-${costo}`}
                          aria-label={`Costo por kg lote ${row.lote}`}
                          onBlur={(e) =>
                            handleInlineUpdate(row, "costo_kg", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          className="erp-cell-input"
                        />
                      </td>
                      <td className="text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatMoney(subtotal)}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {row.camara || "Cámara 1"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        {isHighMerma ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                            Revisar dif.
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            Confirmado
                          </span>
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailRow({ ...row })}
                            className="px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            title="Eliminar registro"
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#c53030] hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle y trazabilidad del lote */}
      {detailRow && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4"
          onClick={() => !isSavingDetail && setDetailRow(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Lote {detailRow.lote}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Trazabilidad, remito y control de recepción
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDetail} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    required
                    value={detailRow.proveedor || ""}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, proveedor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#002244] outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mercadería
                  </label>
                  <input
                    type="text"
                    required
                    value={detailRow.mercaderia || ""}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, mercaderia: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#002244] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nro. Remito
                  </label>
                  <input
                    type="text"
                    value={detailRow.remito || ""}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, remito: e.target.value })
                    }
                    placeholder="R-0001-001234"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nro. Tropa
                  </label>
                  <input
                    type="text"
                    value={detailRow.tropa || ""}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, tropa: e.target.value })
                    }
                    placeholder="T-88412"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Temperatura recepción
                  </label>
                  <input
                    type="text"
                    value={detailRow.temperatura || ""}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, temperatura: e.target.value })
                    }
                    placeholder="2.4 °C"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Cámara / Destino
                  </label>
                  <select
                    value={detailRow.camara || "Cámara 1"}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, camara: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white font-semibold outline-none"
                  >
                    {CAMARA_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Kg Remito
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={detailRow.kg_remito}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, kg_remito: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-right tabular-nums font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Kg Balanza
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={detailRow.kg_balanza}
                    onChange={(e) =>
                      setDetailRow({ ...detailRow, kg_balanza: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-right tabular-nums font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={detailRow.notas || ""}
                  onChange={(e) =>
                    setDetailRow({ ...detailRow, notas: e.target.value })
                  }
                  placeholder="Estado de la mercadería, reclamo al proveedor, etc."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailRow(null)}
                  className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetail}
                  className="px-4 py-2 rounded-lg bg-[#002244] hover:bg-[#1e3b6c] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDetail ? "Guardando..." : "Guardar cambios"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
