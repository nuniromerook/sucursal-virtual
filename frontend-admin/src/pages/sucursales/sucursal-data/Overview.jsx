import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Package, AlertTriangle, DollarSign, Layers } from "lucide-react";
import { API_URL } from "../../../config/api";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
    <div
      className={`flex size-10 shrink-0 items-center justify-center rounded-md ${accent}`}
    >
      <Icon className="size-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const Overview = () => {
  const { sucursal } = useOutletContext();
  const [resumen, setResumen] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResumen = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/inventario/resumen?sucursal_id=${sucursal.id}`,
        );
        const data = await res.json();

        setResumen(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sucursal?.id) loadResumen();
  }, [sucursal?.id]);

  return (
    <div className="flex flex-col gap-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{sucursal?.nombre}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {sucursal?.direccion}, {sucursal?.ciudad}
        </p>
        {sucursal?.telefono && (
          <p className="text-sm text-gray-500">Tel: {sucursal.telefono}</p>
        )}
        {sucursal?.horario_atencion && (
          <p className="text-sm text-gray-500">{sucursal.horario_atencion}</p>
        )}
      </div>

      {isLoading || !resumen ? (
        <p className="text-sm text-gray-500">Cargando resumen...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Layers}
            label="Productos con precio cargado"
            value={`${resumen.productos_con_precio} / ${resumen.productos_total_catalogo}`}
            accent="bg-main-blue"
          />
          <StatCard
            icon={Package}
            label="Paquetes disponibles"
            value={resumen.paquetes_disponibles}
            accent="bg-emerald-600"
          />
          <StatCard
            icon={DollarSign}
            label="Valor del stock disponible"
            value={`$ ${resumen.valor_stock_disponible.toLocaleString("es-AR")}`}
            accent="bg-amber-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Productos sin stock"
            value={resumen.productos_sin_stock}
            accent="bg-red-600"
          />
        </div>
      )}
    </div>
  );
};

export default Overview;
