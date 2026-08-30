// frontend-admin/src/components/ui/RichTextEditor.jsx
import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Flame,
  Lightbulb,
  Snowflake,
  Sparkles,
  Eye,
  Edit3,
  HelpCircle,
} from "lucide-react";
import FormattedDescription from "./FormattedDescription";

export default function RichTextEditor({
  label = "Descripción del producto",
  value = "",
  onChange,
  disabled = false,
  placeholder = "Escribí la descripción del producto, características y sugerencias de cocción...",
}) {
  const [tab, setTab] = useState("editor"); // 'editor' | 'preview'
  const textareaRef = useRef(null);

  // Inserta o envuelve texto seleccionado con sintaxis de formato
  const applyFormat = (prefix, suffix = "", defaultText = "texto") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || "";

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newVal =
      currentVal.substring(0, start) +
      replacement +
      currentVal.substring(end);

    // Disparar evento sintético compatible con e.target
    if (onChange) {
      onChange({
        target: {
          name: "descripcion",
          value: newVal,
        },
      });
    }

    // Restaurar foco y selección
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  // Plantilla carnicera sugerida
  const insertTemplate = () => {
    const template = `Corte seleccionado de primera calidad, tierno y con excelente infiltración de grasa para realzar su sabor natural.

## Características del corte
- **Textura:** Extremadamente tierna y jugosa
- **Ideal para:** Parrilla, horno o plancha
- **Rendimiento:** 100% aprovechable, sin desperdicios

> 🔥 Recomendación de cocción: Sellar a fuego fuerte 3 minutos por lado para concentrar los jugos y terminar a fuego medio hasta lograr el punto deseado.

> ❄️ Conservación: Mantener refrigerado entre 0° y 4°C. Consumir dentro de las 72hs o congelar inmediatamente.`;

    if (onChange) {
      onChange({
        target: {
          name: "descripcion",
          value: template,
        },
      });
    }
  };

  // Atajos de teclado (Ctrl+B, Ctrl+I)
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        applyFormat("**", "**", "texto en negrita");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        applyFormat("*", "*", "texto en cursiva");
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>

        {/* Selector de pestañas: Editar / Vista Previa */}
        <div className="flex items-center rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setTab("editor")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              tab === "editor"
                ? "bg-white text-main-blue shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Edit3 className="size-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              tab === "preview"
                ? "bg-white text-main-blue shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Vista previa</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-300 bg-white overflow-hidden shadow-2xs focus-within:border-main-blue focus-within:ring-2 focus-within:ring-main-blue/20 transition-all">
        {/* Barra de herramientas */}
        {tab === "editor" && (
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-gray-200 bg-gray-50/90 px-3 py-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => applyFormat("**", "**", "texto en negrita")}
                title="Negrita (Ctrl+B)"
                disabled={disabled}
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Bold className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => applyFormat("*", "*", "texto en cursiva")}
                title="Cursiva (Ctrl+I)"
                disabled={disabled}
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Italic className="size-4" />
              </button>

              <div className="h-4 w-px bg-gray-300 mx-1" />

              <button
                type="button"
                onClick={() => applyFormat("## ", "", "Título de sección")}
                title="Título H2"
                disabled={disabled}
                className="px-2 py-1 rounded-lg text-xs font-black text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              >
                H2
              </button>

              <button
                type="button"
                onClick={() => applyFormat("### ", "", "Subtítulo")}
                title="Subtítulo H3"
                disabled={disabled}
                className="px-2 py-1 rounded-lg text-xs font-black text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              >
                H3
              </button>

              <button
                type="button"
                onClick={() => applyFormat("- ", "", "Elemento de lista")}
                title="Lista con viñetas"
                disabled={disabled}
                className="p-1.5 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <List className="size-4" />
              </button>

              <div className="h-4 w-px bg-gray-300 mx-1" />

              <button
                type="button"
                onClick={() =>
                  applyFormat("> 🔥 Recomendación de cocción: ", "", "Cocinar a fuego medio...")
                }
                title="Caja de Cocción / Parrilla"
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              >
                <Flame className="size-3.5" />
                <span>Cocción</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyFormat("> 💡 Consejo del Carnicero: ", "", "Ideal para marinar con...")
                }
                title="Caja de Consejo / Tip"
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              >
                <Lightbulb className="size-3.5" />
                <span>Tip</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyFormat("> ❄️ Conservación: ", "", "Mantener en heladera entre 0° y 4°C")
                }
                title="Caja de Conservación"
                disabled={disabled}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors cursor-pointer"
              >
                <Snowflake className="size-3.5" />
                <span>Conservación</span>
              </button>
            </div>

            {/* Plantilla carnicera rápida */}
            <button
              type="button"
              onClick={insertTemplate}
              title="Insertar plantilla carnicera completa"
              disabled={disabled}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-main-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="size-3.5 text-main-blue" />
              <span>Plantilla recomendada</span>
            </button>
          </div>
        )}

        {/* Cuerpo: Textarea o Vista Previa */}
        {tab === "editor" ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="descripcion"
              name="descripcion"
              rows={8}
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full resize-y p-3.5 text-sm text-gray-800 focus:outline-none placeholder:text-gray-400 font-sans leading-relaxed"
            />
            <div className="px-3.5 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Soporta Markdown: **negrita**, *cursiva*, ## títulos, - listas, &gt; cajas</span>
              <span>{value ? value.length : 0} caracteres</span>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 min-h-[220px] bg-neutral-50/50">
            <FormattedDescription content={value} />
          </div>
        )}
      </div>
    </div>
  );
}
