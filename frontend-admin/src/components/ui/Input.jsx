// Input.jsx
import React from "react";
import { useAppContext } from "../../context/AppContext";

const Input = ({
  label,
  id,
  inputName,
  inputType,
  autoComplete,
  placeholder,
  value,
  setOnChange,
}) => {
  const { isLoading } = useAppContext();

  return (
    <>
      <div className="flex flex-col w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
          {label}
        </label>
        <div className="mt-2">
          <input
            id={id}
            name={inputName}
            type={inputType}
            required
            disabled={isLoading}
            autoComplete={autoComplete}
            value={value}
            onChange={setOnChange}
            placeholder={placeholder}
            className="flex w-full rounded-md bg-white px-3 py-1.5 placeholder:text-gray-500 disabled:bg-gray-100 outline-1 outline-gray-300 focus:outline-gray-400"
          />
        </div>
      </div>
    </>
  );
};

export default Input;
