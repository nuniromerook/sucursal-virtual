// frontend-client/src/pages/ecommerce/profile-tabs/ComprasTab.jsx
import { Link } from "react-router-dom";
import { Package, Store, Truck, ArrowRight } from "lucide-react";
import { formatPrecio, formatCantidad } from "../../../utils/formatters";

export default function ComprasTab({ pedidos = [], loading = false }) {
  if (loading) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm animate-pulse bg-white rounded-lg border border-neutral-200/80 shadow-2xs">
        Cargando tu historial de compras...
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-lg p-10 text-center border border-neutral-200/80 shadow-2xs">
        <div className="size-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
          <Package className="size-7 stroke-1" />
        </div>
        <h3 className="text-base font-bold text-neutral-900">
          Aún no realizaste ningún pedido
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
          Tus compras de carnes vacunas, cerdo y pollo aparecerán acá con su estado en tiempo real.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-main-blue text-white font-bold text-xs shadow-2xs hover:bg-main-blue/90 transition-all cursor-pointer"
        >
          <span>Explorar cortes en la tienda</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {pedidos.map((ped) => {
        const fecha = new Date(ped.creado_en).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div
            key={ped.id}
            className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-3 hover:border-neutral-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-neutral-900">
                    Pedido #{ped.id}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border capitalize ${
                      ped.estado_local === "entregado"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : ped.estado_local === "listo"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {ped.estado_local}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Realizado el {fecha}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-neutral-500 block">Total:</span>
                <span className="text-lg sm:text-xl font-black text-main-blue">
                  {formatPrecio(ped.monto_total_estimado)}
                </span>
              </div>
            </div>

            {/* Datos de Entrega */}
            <div className="text-xs sm:text-sm text-neutral-700 flex items-center gap-2">
              {ped.tipo_entrega === "retiro_sucursal" ? (
                <>
                  <Store className="size-4 text-main-blue shrink-0" />
                  <span>
                    Retiro en Sucursal <strong>{ped.sucursal_nombre}</strong> ({ped.sucursal_direccion})
                  </span>
                </>
              ) : (
                <>
                  <Truck className="size-4 text-main-blue shrink-0" />
                  <span>
                    Envío a <strong>{ped.direccion_entrega}</strong> (
                    {ped.tipo_entrega === "pedidosya" ? "PedidosYa Envíos" : "Logística Valette"})
                  </span>
                </>
              )}
            </div>

            {/* Detalle de Cortes */}
            <div className="bg-neutral-50 rounded-lg p-3 divide-y divide-neutral-200/60 text-xs sm:text-sm">
              {(ped.items || []).map((item) => (
                <div
                  key={item.id}
                  className="py-1.5 flex justify-between items-center first:pt-0 last:pb-0"
                >
                  <span className="text-neutral-800 font-medium">
                    {item.nombre_producto} ({formatCantidad(item.cantidad_kg_solicitada, item.unidad_medida || "kg")})
                  </span>
                  <span className="font-bold text-neutral-900">
                    {formatPrecio(item.precio_estimado)}
                  </span>
                </div>
              ))}
            </div>

            {/* Enlace ver comprobante */}
            <div className="pt-1 flex justify-end">
              <Link
                to={`/pedido/${ped.id}/confirmacion`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-main-blue hover:underline"
              >
                <span>Ver comprobante</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
