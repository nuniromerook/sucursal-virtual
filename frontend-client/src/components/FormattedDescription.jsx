// frontend-client/src/components/FormattedDescription.jsx
import React from "react";
import {
  Flame,
  Lightbulb,
  ChefHat,
  Snowflake,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

/**
 * Parsea formato inline: **negrita**, *cursiva*, `código`
 */
function renderInline(text) {
  if (!text) return null;

  // Split por tokens de negrita, cursiva y código
  const parts = [];
  const regex =
    /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] || match[3]) {
      // Negrita **texto** o __texto__
      parts.push(
        <strong key={match.index} className="font-bold text-neutral-900">
          {match[2] || match[3]}
        </strong>,
      );
    } else if (match[4] || match[5]) {
      // Cursiva *texto* o _texto_
      parts.push(
        <em key={match.index} className="italic text-neutral-800">
          {match[4] || match[5]}
        </em>,
      );
    } else if (match[6]) {
      // Código `texto`
      parts.push(
        <code
          key={match.index}
          className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-main-blue border border-neutral-200"
        >
          {match[6]}
        </code>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Detecta si una línea de texto o bloque califica como caja de llamada temática (Tip, Cocción, Conservación, etc.)
 */
function getCalloutType(text) {
  const lower = text.toLowerCase();
  if (
    lower.includes("cocci") ||
    lower.includes("parrilla") ||
    lower.includes("horno") ||
    lower.includes("fuego") ||
    lower.includes("plancha")
  ) {
    return {
      type: "coccion",
      icon: <Flame className="size-4.5 text-main-red shrink-0" />,
      bg: "bg-red-50/70 border-red-200 text-red-950",
      accent: "text-main-red font-bold",
    };
  }
  if (
    lower.includes("chef") ||
    lower.includes("maestro") ||
    lower.includes("carnicero") ||
    lower.includes("secreto") ||
    lower.includes("recomendaci")
  ) {
    return {
      type: "chef",
      icon: <ChefHat className="size-4.5 text-amber-600 shrink-0" />,
      bg: "bg-amber-50/70 border-amber-200 text-amber-950",
      accent: "text-amber-700 font-bold",
    };
  }
  if (
    lower.includes("conserva") ||
    lower.includes("freezer") ||
    lower.includes("heladera") ||
    lower.includes("fresco") ||
    lower.includes("temperatura")
  ) {
    return {
      type: "conservacion",
      icon: <Snowflake className="size-4.5 text-cyan-600 shrink-0" />,
      bg: "bg-cyan-50/70 border-cyan-200 text-cyan-950",
      accent: "text-cyan-700 font-bold",
    };
  }
  if (
    lower.includes("tip") ||
    lower.includes("consejo") ||
    lower.includes("sugerencia") ||
    lower.includes("maridaje") ||
    lower.includes("acompañ")
  ) {
    return {
      type: "tip",
      icon: <Lightbulb className="size-4.5 text-amber-500 shrink-0" />,
      bg: "bg-amber-50/60 border-amber-200 text-neutral-900",
      accent: "text-amber-800 font-bold",
    };
  }
  return {
    type: "info",
    icon: <Info className="size-4.5 text-main-blue shrink-0" />,
    bg: "bg-blue-50/60 border-blue-200 text-neutral-900",
    accent: "text-main-blue font-bold",
  };
}

/**
 * Componente principal que renderiza texto enriquecido estético
 */
export default function FormattedDescription({ content, className = "" }) {
  if (!content || typeof content !== "string") return null;

  // Dividir en bloques por saltos de línea dobles o líneas
  const rawLines = content.split("\n");
  const elements = [];
  let currentList = [];
  let listKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-2 pl-1">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-sm sm:text-base text-neutral-700 leading-relaxed"
            >
              <span className="mt-1.5 size-1.5 rounded-full bg-main-blue shrink-0 shadow-2xs" />
              <div className="flex-1">{renderInline(item)}</div>
            </li>
          ))}
        </ul>,
      );
      currentList = [];
    }
  };

  rawLines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // 1. Títulos y Encabezados
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={index}
          className="text-sm sm:text-base font-bold text-neutral-900 mt-4 mb-1.5 flex items-center gap-1.5"
        >
          <Sparkles className="size-3.5 shrink-0 text-main-blue" />
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={index}
          className="text-base sm:text-lg font-black text-neutral-900 mt-5 mb-2 border-b border-neutral-100 pb-1 flex items-center gap-2"
        >
          <span className="w-1 h-5 rounded-full bg-main-blue" />
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h2
          key={index}
          className="text-lg sm:text-xl font-black text-neutral-900 mt-6 mb-2"
        >
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h2>,
      );
      return;
    }

    // 2. Elementos de lista (- item, * item, • item, 1. item)
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const cleanItem = trimmed.replace(/^([-*•]|\d+\.)\s+/, "");
      currentList.push(cleanItem);
      return;
    }

    // 3. Blockquotes / Cajas destacadas (> texto o [tip]texto[/tip])
    if (
      trimmed.startsWith("> ") ||
      trimmed.startsWith("[tip]") ||
      trimmed.startsWith("[destacado]")
    ) {
      flushList();
      const cleanCallout = trimmed
        .replace(/^>\s*/, "")
        .replace(/\[\/?(tip|destacado)\]/g, "");
      const calloutMeta = getCalloutType(cleanCallout);

      elements.push(
        <div
          key={index}
          className={`my-3 p-3.5 sm:p-4 rounded-xl border ${calloutMeta.bg} flex items-start gap-3 shadow-2xs transition-all`}
        >
          {calloutMeta.icon}
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            {renderInline(cleanCallout)}
          </div>
        </div>,
      );
      return;
    }

    // 4. Párrafo estándar
    flushList();
    elements.push(
      <p
        key={index}
        className="text-sm sm:text-base text-neutral-700 leading-relaxed"
      >
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}
