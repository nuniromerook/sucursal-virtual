// src/components/ui/BasicDropdown.jsx
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
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

  const selectedLabel =
    items.find((item) => item.value === value)?.label ?? placeholder;

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
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-10" />
      )}

      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}

      {/* El id va acá, en el control real — antes estaba en el ícono de
          la flecha, que no es lo que el label debe asociar. */}
      <button
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        disabled={isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between ${
          label ? "mt-2" : ""
        } rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 ${
          isLoading
            ? "cursor-not-allowed bg-gray-100 opacity-70"
            : "cursor-pointer"
        } ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>

        <ChevronDown
          className={`size-4 shrink-0 text-gray-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-300 bg-white py-1"
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
                className={`block w-full px-3 py-1.5 text-left text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-main-blue text-white"
                    : "text-gray-700 hover:bg-main-blue/30 cursor-pointer"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BasicDropdown;
