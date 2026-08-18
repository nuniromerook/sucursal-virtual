// BasicDropdown.jsx
import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";

const BasicDropdown = ({ label, items, value, id, setOnChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading } = useAppContext();

  const selectedLabel =
    items.find((item) => item.value === value)?.label ?? "Seleccionar";

  const handleSelect = (item) => {
    setOnChange({
      target: { name: id, value: item.value, type: "text" },
    });
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative flex flex-col w-full">
        <div
          hidden={!isOpen}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-10"
        />

        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
          {label}
        </label>

        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          disabled={isLoading}
          className={`flex w-full items-center justify-between mt-2 overflow-hidden rounded-md border border-gray-300 bg-white px-3 py-1.5 ${isLoading ? "disabled:bg-gray-100 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:relative">
            {selectedLabel}
          </span>

          <span
            id={id}
            className="text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:relative"
            aria-label="Menu"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </button>

        <div
          role="menu"
          hidden={!isOpen}
          className="absolute right-0 top-full mt-1 z-10 w-full overflow-hidden rounded border border-gray-300 bg-white shadow-sm space-y-1.5 py-2"
        >
          {items.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => handleSelect(item)}
              className="block w-full px-2 font-medium transition-colors group"
            >
              <p
                className={`group-hover:bg-main-blue/20 py-1 rounded px-5 ${
                  item.value === value
                    ? "bg-main-blue text-white hover:bg-main-blue"
                    : "text-black/90 hover:text-black"
                }`}
              >
                {item.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default BasicDropdown;
