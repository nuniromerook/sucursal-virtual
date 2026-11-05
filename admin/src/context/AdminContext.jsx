// admin/src/context/AdminContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { VITE_API_URL } from "../config/api";

const CASA_CENTRAL_DEFAULT = {
  id: 1,
  nombre: "Luis Guillon",
  slug: "luis-guillon",
  direccion:
    "Av. Luciano Valette 1696, Luis Guillon, Provincia de Buenos Aires",
  ciudad: "Luis Guillon",
  horario_atencion:
    "Lunes a Sábados de 07:00 a 15:00hs y Domingos de 08:00 a 13:00hs",
  activa: true,
};

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [sucursales, setSucursales] = useState([CASA_CENTRAL_DEFAULT]);
  const [selectedSucursal, setSelectedSucursal] =
    useState(CASA_CENTRAL_DEFAULT);
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(true);
  const [pedidosPendientesCount, setPedidosPendientesCount] = useState(0);
  const [toast, setToast] = useState(null);

  // Cargar sucursal oficial Casa Central (Luis Guillón)
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/sucursales`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : [];
          if (items.length > 0) {
            const central = items.find((s) => Number(s.id) === 1) || items[0];
            setSucursales([central]);
            setSelectedSucursal(central);
          }
        }
      } catch (err) {
        console.error("Error al cargar sucursal:", err);
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return ctx;
}
