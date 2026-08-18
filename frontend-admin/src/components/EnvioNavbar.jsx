import { ChevronDown, MapPin } from "lucide-react";
import React from "react";

const EnvioNavbar = () => {
  return (
    <>
      <div className="flex w-fit h-fit text-white gap-0.5">
        <MapPin className="size-6 stroke-1 shrink-0" />
        <div className="flex flex-col w-fit h-fit -space-y-0.5">
          <p className="text-xs w-fit text-neutral-300">Enviar a</p>
          <button
            type="button"
            className="flex w-fit text-sm items-center gap-1"
          >
            <p className="w-40 lg:w-60 truncate">
              Av. Luciano Valette 1696, Luis Guillon{" "}
            </p>
            <ChevronDown className="size-4 shrink-0 stroke-1" />
          </button>
        </div>
      </div>
    </>
  );
};

export default EnvioNavbar;
