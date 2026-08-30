// frontend-admin/src/components/ui/TextArea.jsx
import React from "react";
import { X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const TextArea = ({
  label,
  id,
  inputName,
  autoComplete,
  placeholder,
  className = "",
  value,
  setOnChange,
  onChange,
  rows = 4,
  isRequired,
}) => {
  const { isLoading } = useAppContext();

  const handleChange = (e) => {
    if (typeof setOnChange === "function") setOnChange(e);
    if (typeof onChange === "function") onChange(e);
  };

  const handleClean = () => {
    const fakeEvent = {
      target: { name: inputName, value: "", type: "text" },
    };
    if (typeof setOnChange === "function") setOnChange(fakeEvent);
    if (typeof onChange === "function") onChange(fakeEvent);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
          {label} {isRequired && <span className="text-main-red">*</span>}
        </label>
      )}

      <div className="relative overflow-hidden rounded-lg border border-neutral-300 bg-white focus-within:border-main-blue focus-within:ring-2 focus-within:ring-main-blue/20 transition-all">
        <textarea
          id={id}
          name={inputName}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={isLoading}
          rows={rows}
          value={value ?? ""}
          onChange={handleChange}
          className="w-full resize-none p-3 text-base sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
        />

        {value && (
          <div className="flex items-center justify-end p-2 bg-neutral-50/60 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleClean}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer"
            >
              <X className="size-3.5" /> Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextArea;
