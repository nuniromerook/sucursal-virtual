// frontend-admin/src/components/ui/BasicDropdown.jsx
import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const BasicDropdown = ({
  label,
  items = [],
  value,
  id,
  setOnChange,
  onChange,
  placeholder = "Seleccionar",
  buttonClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading } = useAppContext();

  const selectedItem = items.find((item) => String(item.value) === String(value));
  const selectedLabel = selectedItem?.label ?? placeholder;

  const handleSelect = (item) => {
    if (typeof setOnChange === "function") {
      setOnChange({
        target: { name: id || "", value: item.value, type: "text" },
      });
    }
    if (typeof onChange === "function") {
      onChange(item.value);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col w-full">
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-20" />
      )}

      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
          {label}
        </label>
      )}

      <button
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-bold text-neutral-800 transition-all hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-main-blue/20 focus:border-main-blue ${
          isLoading ? "cursor-not-allowed bg-neutral-100 opacity-70" : "cursor-pointer"
        } ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-main-blue" : ""
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 text-sm"
        >
          {items.map((item) => {
            const isSelected = String(item.value) === String(value);
            return (
              <li
                key={item.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(item)}
                className={`flex items-center justify-between px-3.5 py-2 cursor-pointer font-medium transition-colors ${
                  isSelected
                    ? "bg-main-blue/10 text-main-blue font-bold"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span className="truncate">{item.label}</span>
                {isSelected && <Check className="size-4 text-main-blue shrink-0 ml-2" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default BasicDropdown;
