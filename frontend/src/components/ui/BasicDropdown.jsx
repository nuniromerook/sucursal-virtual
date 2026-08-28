// frontend/src/components/ui/BasicDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const BasicDropdown = ({
  label,
  items = [],
  value,
  id,
  onChange,
  setOnChange,
  placeholder = "Seleccionar",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedItem = items.find((item) => item.value === value);
  const selectedLabel = selectedItem?.label ?? placeholder;

  const handleSelect = (item) => {
    if (disabled) return;
    if (typeof onChange === "function") {
      onChange(item.value);
    }
    if (typeof setOnChange === "function") {
      setOnChange({
        target: { name: id, value: item.value, type: "text" },
      });
    }
    setIsOpen(false);
  };

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-700 mb-1">
          {label}
        </label>
      )}

      <button
        id={id}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-800 transition-all hover:border-neutral-300 hover:bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-main-blue/20 ${
          disabled
            ? "cursor-not-allowed bg-neutral-100 opacity-60"
            : "cursor-pointer shadow-2xs"
        } ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>

        <ChevronDown
          className={`size-4 shrink-0 text-neutral-400 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-main-blue" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 top-full z-50 mt-1 w-full min-w-36 overflow-hidden rounded-xl border border-neutral-200/90 bg-white/95 backdrop-blur-md py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
        >
          {items.map((item) => {
            const isSelected = item.value === value;

            return (
              <button
                type="button"
                key={item.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item)}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-main-blue text-white"
                    : "text-neutral-700 hover:bg-neutral-100/80"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && <Check className="size-3.5 shrink-0 ml-2 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BasicDropdown;
