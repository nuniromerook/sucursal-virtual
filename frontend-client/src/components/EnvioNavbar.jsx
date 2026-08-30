// frontend-client/src/components/EnvioNavbar.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  MapPin,
  Plus,
  Check,
  Star,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EnvioNavbar() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Dirección guardada en localStorage o fallback a la dirección favorita del perfil
  const [selectedDireccion, setSelectedDireccion] = useState(() => {
    return localStorage.getItem("valette_direccion_seleccionada") || "";
  });

  // Si cambia el usuario o carga su perfil y no hay dirección seleccionada en localStorage,
  // usamos automáticamente la dirección favorita de su perfil por defecto.
  useEffect(() => {
    if (user?.direccion_default) {
      const local = localStorage.getItem("valette_direccion_seleccionada");
      if (!local) {
        setSelectedDireccion(user.direccion_default);
        localStorage.setItem(
          "valette_direccion_seleccionada",
          user.direccion_default,
        );
      }
    }
  }, [user?.direccion_default]);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectDireccion = (dir) => {
    setSelectedDireccion(dir);
    localStorage.setItem("valette_direccion_seleccionada", dir);
    // Notificar a la app del cambio de dirección
    window.dispatchEvent(new Event("valette_direccion_changed"));
    setIsOpen(false);
  };

  const handleGoToPerfil = () => {
    setIsOpen(false);
    if (isAuthenticated) {
      navigate("/perfil?tab=datos");
    } else {
      navigate("/ingresar");
    }
  };

  // Lista de direcciones disponibles
  const direcciones = [];
  if (user?.direccion_default) {
    direcciones.push({
      texto: user.direccion_default,
      isDefault: true,
      label: "Dirección favorita (Perfil)",
    });
  }

  // Si hay una dirección seleccionada previa que no sea la default, la mostramos también
  const localSaved = localStorage.getItem("valette_direccion_seleccionada");
  if (
    localSaved &&
    localSaved !== user?.direccion_default &&
    !direcciones.some((d) => d.texto === localSaved)
  ) {
    direcciones.push({
      texto: localSaved,
      isDefault: false,
      label: "Última utilizada",
    });
  }

  const direccionActual = selectedDireccion || user?.direccion_default || "";

  return (
    <div ref={dropdownRef} className="relative z-30">
      {/* Botón selector de dirección */}
      <button
        type="button"
        onClick={() => {
          if (!direccionActual) {
            handleGoToPerfil();
          } else {
            setIsOpen((prev) => !prev);
          }
        }}
        className="flex items-center gap-2 p-1.5 lg:p-1 rounded-md transition-all cursor-pointer group bg-white lg:bg-transparent text-neutral-800 lg:text-white border border-neutral-200/80 lg:border-transparent hover:bg-neutral-50 lg:hover:bg-white/10 shadow-2xs lg:shadow-none"
        aria-label="Seleccionar dirección de entrega"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="size-7 rounded-md bg-main-blue/10 lg:bg-white/20 flex items-center justify-center text-main-blue lg:text-white shrink-0 font-bold">
          <MapPin className="size-4" />
        </div>

        <div className="flex flex-col text-left -space-y-0.5 min-w-0 max-w-2xs sm:max-w-xs lg:max-w-65">
          <span className="text-[10px] font-bold text-neutral-400 lg:text-blue-100 uppercase tracking-wider">
            Enviar a
          </span>
          <span className="text-xs font-bold text-neutral-900 lg:text-white truncate">
            {direccionActual || "Ingresá tu dirección"}
          </span>
        </div>

        <ChevronDown
          className={`size-3.5 text-neutral-400 lg:text-white/80 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-main-blue lg:text-white" : ""
          }`}
        />
      </button>

      {/* Popover / Menú Desplegable */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 lg:left-0 top-full mt-2 w-full sm:w-80 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-neutral-900 z-50"
        >
          <div className="px-2 py-1.5 border-b border-neutral-100 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Direcciones de entrega
            </span>
          </div>

          {/* Listado de direcciones */}
          <div className="space-y-1">
            {direcciones.map((dir, idx) => {
              const isSelected = direccionActual === dir.texto;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDireccion(dir.texto)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-main-blue/10 border border-main-blue/30 text-main-blue font-bold"
                      : "hover:bg-neutral-50 text-neutral-700 border border-transparent"
                  }`}
                >
                  <MapPin
                    className={`size-4 shrink-0 mt-0.5 ${isSelected ? "text-main-blue" : "text-neutral-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{dir.texto}</span>
                      {dir.isDefault && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                          <Star className="size-2.5 fill-amber-500" /> Favorita
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 font-normal mt-0.5">
                      {dir.label}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-main-blue shrink-0 ml-1 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Opción de agregar / modificar en el perfil */}
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleGoToPerfil}
              className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold text-main-blue hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Plus className="size-4" />
                <span>
                  {isAuthenticated
                    ? "Modificar dirección en mi perfil"
                    : "Ingresar y agregar dirección"}
                </span>
              </div>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
