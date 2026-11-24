// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchSucursales } from "@/services/catalogo.service";
import { DEFAULT_HORARIOS_APERTURA } from "@/utils/horarios";

export const CASA_CENTRAL_BRANCH = {
  id: 1,
  nombre: "Luis Guillón (Casa Central)",
  slug: "luis-guillon",
  direccion: "Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires",
  ciudad: "Luis Guillón",
  horario: "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs",
  horario_atencion: "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs",
  horarios_apertura: DEFAULT_HORARIOS_APERTURA,
  telefono: "1135534033",
  telefono_whatsapp: "5491162166222",
  activa: true,
};

const SUCURSALES_DEFAULT = [CASA_CENTRAL_BRANCH];

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [sucursales, setSucursales] = useState(SUCURSALES_DEFAULT);

  const [deliveryMode, setDeliveryMode] = useState(() => {
    return localStorage.getItem("valette_delivery_mode") || "delivery";
  });

  const [selectedBranch, setSelectedBranch] = useState(CASA_CENTRAL_BRANCH);

  const [customerAddress, setCustomerAddress] = useState(() => {
    const saved = localStorage.getItem("valette_address");
    if (saved && !saved.toLowerCase().includes("moreno")) {
      return saved;
    }
    return "Av. Luciano Valette 1696, Luis Guillon";
  });

  // Cargar datos de la sucursal única desde PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const loadSucursales = async () => {
      const data = await fetchSucursales();
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const central = data.find((s) => s.id === 1) || data[0];
        const normalized = {
          ...CASA_CENTRAL_BRANCH,
          ...central,
          id: 1,
          nombre: central.nombre || CASA_CENTRAL_BRANCH.nombre,
          direccion: central.direccion || CASA_CENTRAL_BRANCH.direccion,
          ciudad: central.ciudad || CASA_CENTRAL_BRANCH.ciudad,
          horario: central.horario_atencion || central.horario || CASA_CENTRAL_BRANCH.horario,
          horario_atencion: central.horario_atencion || central.horario || CASA_CENTRAL_BRANCH.horario_atencion,
          horarios_apertura: central.horarios_apertura || CASA_CENTRAL_BRANCH.horarios_apertura,
        };
        setSucursales([normalized]);
        setSelectedBranch(normalized);
        try {
          localStorage.setItem("valette_sucursales_cache", JSON.stringify([normalized]));
          localStorage.setItem("valette_branch_id", "1");
        } catch {}
      }
    };

    loadSucursales();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("valette_delivery_mode", deliveryMode);
  }, [deliveryMode]);

  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem("valette_branch_id", "1");
    }
  }, [selectedBranch]);

  const selectBranch = (branch) => {
    setSelectedBranch(branch || CASA_CENTRAL_BRANCH);
  };

  const updateCustomerAddress = (addr) => {
    setCustomerAddress(addr);
    localStorage.setItem("valette_address", addr);
  };

  return (
    <LocationContext.Provider
      value={{
        deliveryMode,
        setDeliveryMode,
        selectedBranch,
        selectBranch,
        sucursales,
        customerAddress,
        updateCustomerAddress,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation debe ser usado dentro de LocationProvider");
  return ctx;
};
