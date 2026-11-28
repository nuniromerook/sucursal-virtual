// admin/src/components/layout/CommandPalette.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTabNavigation } from "../../context/TabNavigationContext";

const ALL_COMMANDS = [
  { id: "pedidos", label: "Comandas Web (KDS)", group: "Operación Diaria", staffAllowed: true },
  { id: "catalogo", label: "Catálogo & Precios", group: "Operación Diaria", staffAllowed: true },
  { id: "ingresos", label: "Ingreso de Carne y Balanza", group: "Operación Diaria", staffAllowed: false },
  { id: "combos", label: "Combos & Promos", group: "Sucursal Virtual", staffAllowed: false },
  { id: "banners", label: "Banners Portada", group: "Sucursal Virtual", staffAllowed: false },
  { id: "contenido", label: "Contenido / Inicio", group: "Sucursal Virtual", staffAllowed: false },
  { id: "clientes", label: "Clientes & Club Valette", group: "Sucursal Virtual", staffAllowed: false },
  { id: "notificaciones", label: "Difusión Push", group: "Sucursal Virtual", staffAllowed: false },
  { id: "metricas", label: "Cierre Operativo y Métricas", group: "Administración", staffAllowed: false },
  { id: "equipo", label: "Equipo & Roles", group: "Administración", staffAllowed: false },
  { id: "ajustes", label: "Sucursal & Horarios", group: "Administración", staffAllowed: false },
];

export default function CommandPalette({ open, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const { isManager } = useAuth();
  const { switchTab } = useTabNavigation();

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open) {
      if (!dlg.open) dlg.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (dlg.open) {
      dlg.close();
    }
  }, [open]);

  const commands = useMemo(() => {
    const allowed = isManager
      ? ALL_COMMANDS
      : ALL_COMMANDS.filter((c) => c.staffAllowed);
    const term = query.trim().toLowerCase();
    if (!term) return allowed;
    return allowed.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.group.toLowerCase().includes(term) ||
        c.id.includes(term),
    );
  }, [isManager, query]);

  const handleSelect = (id) => {
    setQuery("");
    switchTab(id);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="erp-dialog"
      aria-label="Buscador rápido de módulos"
    >
      <div className="p-3 border-b border-slate-200 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && commands.length > 0) {
              e.preventDefault();
              handleSelect(commands[0].id);
            }
          }}
          placeholder="Ir a un módulo (ej: Ingresos, Precios, KDS, Club)..."
          className="flex-1 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
          ESC
        </kbd>
      </div>

      <div className="p-2 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
        {commands.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            No se encontraron módulos para &quot;{query}&quot;.
          </div>
        ) : (
          commands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => handleSelect(cmd.id)}
              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <span className="font-semibold text-slate-800">{cmd.label}</span>
              <span className="text-[10px] font-medium text-slate-400">
                {cmd.group}
              </span>
            </button>
          ))
        )}
      </div>
    </dialog>
  );
}
