import React, { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const SearchInput = () => {
  return (
    <div className="w-full md:max-w-xl relative">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Search className="size-4 stroke-[2.5]" />
        </div>
        <input
          type="text"
          placeholder="Qué queres comer hoy?"
          className="w-full pl-10 pr-24 py-3 rounded-2xl bg-[#F1F4F8] border-none text-xs sm:text-sm font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366]/20 transition-all outline-none"
        />
        <button
          type="button"
          className="absolute right-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal className="size-3 text-slate-500 stroke-[2.5]" />
          <span>Filtros</span>
        </button>
      </div>
    </div>
  );
};

export default SearchInput;
