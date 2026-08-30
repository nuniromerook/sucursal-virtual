// frontend-admin/src/components/ui/Input.jsx
import React from "react";
import { useAppContext } from "../../context/AppContext";

const Input = ({
  label,
  id,
  inputName,
  inputType = "text",
  autoComplete,
  placeholder,
  value,
  setOnChange,
  onChange,
  isRequired,
  disabled,
  className = "",
}) => {
  const { isLoading: contextLoading } = useAppContext();
  const isDisabled = disabled !== undefined ? disabled : contextLoading;

  const handleChange = (e) => {
    if (typeof setOnChange === "function") setOnChange(e);
    if (typeof onChange === "function") onChange(e);
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
          {label} {isRequired && <span className="text-main-red">*</span>}
        </label>
      )}
      <input
        id={id}
        name={inputName}
        type={inputType}
        required={isRequired}
        disabled={isDisabled}
        autoComplete={autoComplete}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-base sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-main-blue focus:outline-none focus:ring-2 focus:ring-main-blue/20 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed ${className}`}
      />
    </div>
  );
};

export default Input;
