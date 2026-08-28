import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SearchInput = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();

  // Sincronizar con el parámetro de URL si cambia externamente
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/productos?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/productos");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full h-10 mb-auto bg-white rounded-md items-center gap-1 border border-neutral-200 lg:border-0"
      aria-label="Búsqueda de productos"
      role="search"
    >
      <input
        type="text"
        placeholder="Qué queres comer hoy?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-2 text-base"
        aria-label="Campo para buscar productos"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="flex items-center justify-center bg-main-red rounded-r-md text-white p-1 cursor-pointer aspect-video h-full active:scale-105 transition-all"
      >
        <Search className="size-5 shrink-0" />
      </button>
    </form>
  );
};

export default SearchInput;
