import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SearchInput = ({
  placeholder = "¿Qué corte buscás hoy? (ej. Asado, Vacío, Milanesa...)",
  className = "",
  inCategoryPage = false,
  onSearchChange = null,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();

  // Sincronizar con el parámetro de URL si cambia externamente
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearchChange) {
      onSearchChange("");
    }
    if (inCategoryPage) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("q");
      setSearchParams(nextParams);
    } else if (searchParams.has("q")) {
      navigate("/productos");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();

    if (inCategoryPage) {
      const nextParams = new URLSearchParams(searchParams);
      if (cleanQuery) {
        nextParams.set("q", cleanQuery);
      } else {
        nextParams.delete("q");
      }
      setSearchParams(nextParams);
    } else {
      if (cleanQuery) {
        navigate(`/productos?q=${encodeURIComponent(cleanQuery)}`);
      } else {
        navigate("/productos");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center w-full h-10 bg-white rounded border border-neutral-200/90 shadow-2xs hover:border-neutral-300 focus-within:border-main-red focus-within:ring-2 focus-within:ring-main-red/15 transition-all pl-3 ${className}`}
      aria-label="Búsqueda de productos"
      role="search"
    >
      <Search className="size-4 text-neutral-400 shrink-0 mr-2" />

      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-neutral-900 placeholder:text-neutral-400 font-medium pr-1"
        aria-label="Campo para buscar productos"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer mr-1 shrink-0"
          title="Borrar búsqueda"
        >
          <X className="size-3.5" />
        </button>
      )}

      <button
        type="submit"
        aria-label="Buscar"
        className="flex items-center justify-center gap-1.5 bg-main-red hover:bg-red-700 text-white px-6 h-full rounded-e text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
      >
        <span className="text-neutral-50">Buscar</span>
      </button>
    </form>
  );
};

export default SearchInput;
