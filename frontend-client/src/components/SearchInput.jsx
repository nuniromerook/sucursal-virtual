import React, { useState, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useLocationCoverage } from "../context/LocationContext";

const SearchInput = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();
  const { coords, isInCoverage, distanceKm } = useLocationCoverage();

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
    <div className="flex flex-col w-full">
      {/* Aviso de Fuera del Área de Cobertura */}
      {coords && isInCoverage === false && (
        <div className="w-full mb-1 px-3 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-lg flex items-center justify-between gap-2 text-[11px] font-bold text-amber-100 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="size-3.5 text-amber-300 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              Estás a {distanceKm} km (fuera del área de envíos). ¡Pero podés pasar por alguna de nuestras sucursales cuando gustes! 🥩
            </span>
          </div>
          <Link
            to="/envios"
            className="underline hover:text-white shrink-0 text-[10px] font-extrabold"
          >
            Ver cobertura
          </Link>
        </div>
      )}

      {/* Indicador discreto si está dentro de cobertura */}
      {coords && isInCoverage === true && (
        <div className="w-full mb-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-400/20 rounded-md flex items-center justify-between text-[10px] font-bold text-emerald-200">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dentro del área de envíos a domicilio (10 km)</span>
          </span>
          <Link to="/envios" className="underline hover:text-white text-[10px]">
            Detalles
          </Link>
        </div>
      )}

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
    </div>
  );
};

export default SearchInput;
