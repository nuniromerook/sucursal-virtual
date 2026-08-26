import { ChevronDown, MapPin } from "lucide-react";
import React from "react";

const EnvioNavbar = () => {
  return (
    <>
      <div className="flex w-fit h-fit text-sky-800 bg-white lg:bg-transparent p-2 lg:p-0 border border-main-blue/20 lg:border-none rounded lg:rounded-none lg:text-white gap-0.5">
        <MapPin className="size-6 stroke-1 shrink-0" />
        <div className="flex flex-col w-fit h-fit -space-y-0.5">
          <p className="text-xs w-fit lg:text-neutral-300">Enviar a</p>
          <button
            type="button"
            className="flex w-fit text-sm items-center gap-1"
          >
            <p className="w-full max-w-2xs lg:max-w-60 truncate font-bold">
              Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos
              Aires{" "}
            </p>
            <ChevronDown className="size-4 shrink-0 stroke-1" />
          </button>
        </div>
      </div>
    </>
  );
};

export default EnvioNavbar;
