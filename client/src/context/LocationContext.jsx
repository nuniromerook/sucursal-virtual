// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchSucursales } from "@/services/catalogo.service";

const SUCURSALES_DEFAULT = [
  {
    id: 1,
    nombre: "Luis Guillón",
    direccion: "Av. Luciano Valette 1696",
    ciudad: "Luis Guillón",
    horario: "Lun a Sáb 07:00 a 15:00 hs",
    telefono: "1135534033",
    activa: true,
  },
  {
    id: 2,
    nombre: "Moreno",
    direccion: "Av. del Libertador 4200",
    ciudad: "Moreno",
    horario: "Lun a Sáb 06:00 a 15:00 hs",
    telefono: "1130531313",
    activa: true,
  },
];

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [sucursales, setSucursales] = useState(() => {
    try {
      const cached = localStorage.getItem("valette_sucursales_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SUCURSALES_DEFAULT;
  });

  const [deliveryMode, setDeliveryMode] = useState(() => {
    return localStorage.getItem("valette_delivery_mode") || "delivery";
  });

  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = localStorage.getItem("valette_branch_id");
    const found = sucursales.find((s) => s.id === Number(saved));
    return found || sucursales[0] || SUCURSALES_DEFAULT[0];
  });

  const [customerAddress, setCustomerAddress] = useState(() => {
    return localStorage.getItem("valette_address") || "J. Tarulli 1474 (Guillón)";
  });

  // Cargar sucursales en vivo desde la base de datos PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const loadSucursales = async () => {
      const data = await fetchSucursales();
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setSucursales(data);
        try {
          localStorage.setItem("valette_sucursales_cache", JSON.stringify(data));
        } catch {}

        // Sincronizar sucursal seleccionada si existe en la lista oficial
        setSelectedBranch((prev) => {
          const match = data.find((s) => s.id === prev?.id);
          return match || data[0];
        });
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
      localStorage.setItem("valette_branch_id", selectedBranch.id.toString());
    }
  }, [selectedBranch]);

  const selectBranch = (branch) => {
    setSelectedBranch(branch);
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
