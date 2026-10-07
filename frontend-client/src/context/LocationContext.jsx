// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

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
    direccion: "Merlo 2450",
    ciudad: "Moreno",
    horario: "Lun a Sáb 06:00 a 15:00 hs",
    telefono: "1140502211",
    activa: true,
  },
];

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const [deliveryMode, setDeliveryMode] = useState(() => {
    return localStorage.getItem("valette_delivery_mode") || "delivery";
  });

  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = localStorage.getItem("valette_branch_id");
    const found = SUCURSALES_DEFAULT.find((s) => s.id === Number(saved));
    return found || SUCURSALES_DEFAULT[0];
  });

  const [customerAddress, setCustomerAddress] = useState(() => {
    return localStorage.getItem("valette_address") || "J. Tarulli 1474 (Guillón)";
  });

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
        sucursales: SUCURSALES_DEFAULT,
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
