// TextArea.jsx
import React from "react";
import { X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

const TextArea = ({
  label,
  id,
  inputName,
  autoComplete,
  placeholder,
  classNames,
  value,
  setOnChange,
}) => {
  const { isLoading } = useAppContext();

  const handleClean = () => {
    setOnChange({
      target: { name: inputName, value: "", type: "text" },
    });
  };

  return (
    <>
      <div className={classNames}>
        <label htmlFor={id}>
          <span className="block text-sm font-medium text-gray-900 bg-white pb-2">
            {" "}
            {label}{" "}
          </span>

          <div className="relative overflow-hidden rounded outline-1 outline-gray-300 focus:outline-gray-400">
            <textarea
              id={id}
              name={inputName}
              autoComplete={autoComplete}
              placeholder={placeholder}
              disabled={isLoading}
              className="w-full resize-none outline-none lg:text-base px-3 py-1.5 disabled:bg-gray-100"
              rows="4"
              value={value}
              onChange={setOnChange}
            ></textarea>

            <div className="flex items-center justify-end gap-2 p-1.5">
              <button
                type="button"
                className="flex items-center rounded bg-main-blue text-white pr-3 pl-2 py-1.5 text-sm font-medium transition-colors hover:bg-main-blue/80 cursor-pointer disabled:cursor-not-allowed"
                onClick={handleClean}
                disabled={isLoading}
              >
                <X className="size-5 stroke-1 mr-1" /> Limpiar
              </button>
            </div>
          </div>
        </label>
      </div>
    </>
  );
};

export default TextArea;
