// admin/src/context/AdminContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { VITE_API_URL } from "../config/api";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [sucursales, setSucursales] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(true);
  const [pedidosPendientesCount, setPedidosPendientesCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Cargar sucursales activas
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/sucursales`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : [];
          setSucursales(items);
          if (items.length > 0 && !selectedSucursal) {
            // Predeterminar Luis Guillón si existe, sino la primera
            const guillon = items.find((s) =>
              s.nombre?.toLowerCase().includes("guillón") || s.nombre?.toLowerCase().includes("guillon")
            );
            setSelectedSucursal(guillon || items[0]);
          }
        }
      } catch (err) {
        console.error("Error al cargar sucursales:", err);
      } finally {
        setIsLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const value = {
    sucursales,
    selectedSucursal,
    setSelectedSucursal,
    isLoadingSucursales,
    pedidosPendientesCount,
    setPedidosPendientesCount,
    toast,
    showToast,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
