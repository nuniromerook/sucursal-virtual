import { Search } from "lucide-react";
import React from "react";

const SearchInput = () => {
  return (
    <div
      className="flex w-full h-10 mb-auto bg-white rounded-md items-center gap-1 border border-neutral-200 lg:border-0"
      aria-label="Búsqueda de productos"
      role="search"
    >
      <input
        type="text"
        placeholder="Qué queres comer hoy?"
        className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-2 text-base"
        aria-label="Campo para buscar productos"
      />
      <button
        type="submit"
        className="flex items-center justify-center bg-main-red rounded-r-md text-white p-1 cursor-pointer aspect-video h-full active:scale-105 transition-all"
      >
        <Search className="size-5 shrink-0" />
      </button>
    </div>
  );
};

export default SearchInput;
