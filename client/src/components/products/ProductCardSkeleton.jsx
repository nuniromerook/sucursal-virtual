// src/components/products/ProductCardSkeleton.jsx
import React from "react";

export const ProductCardSkeleton = () => {
  return (
    <div className="h-full w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-native flex flex-col justify-between animate-pulse">
      <div>
        {/* Imagen placeholder */}
        <div className="aspect-square w-full bg-slate-200 relative mb-3">
          <div className="absolute top-2.5 left-2.5 w-20 h-5 bg-slate-300 rounded-lg" />
          <div className="absolute top-2.5 right-2.5 size-8 bg-slate-300 rounded-full" />
        </div>

        {/* Textos placeholders */}
        <div className="px-4 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-16 h-3 bg-slate-200 rounded-full" />
            <div className="w-12 h-3 bg-slate-200 rounded-full" />
          </div>

          <div className="w-4/5 h-4 bg-slate-200 rounded" />
          <div className="w-full h-3 bg-slate-100 rounded" />
          <div className="w-2/3 h-3 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Stepper y precio placeholder */}
      <div className="py-3 px-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="w-16 h-5 bg-slate-200 rounded" />
          <div className="w-12 h-3 bg-slate-100 rounded" />
        </div>
        <div className="w-24 h-9 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};
