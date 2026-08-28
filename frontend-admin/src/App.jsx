import DashboardLayout from "@/layouts/dashboardLayout";
import Auth from "@/pages/Auth";
import Inicio from "@/pages/Inicio";
import NotFound from "@/pages/NotFound";
import ProductEditor from "@/pages/ProductEditor";
import Sucursal from "@/pages/sucursales/Sucursal";
import { Routes, Route } from "react-router-dom";
import Overview from "@/pages/sucursales/sucursal-data/Overview";
import Stock from "@/pages/sucursales/sucursal-data/Stock";
import Informacion from "@/pages/sucursales/sucursal-data/Info";
import Empleados from "@/pages/sucursales/sucursal-data/Empleados";
import PedidosSucursal from "@/pages/sucursales/sucursal-data/PedidosSucursal";
import Catalogo from "./pages/Catalogo";
import SucursalEditor from "./pages/sucursales/SucursalEditor";
import GestionPaquetes from "./pages/sucursales/sucursal-data/GestionPaquetes";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Inicio />} />
          <Route path="/ingresar" element={<Auth />} />

          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/editar/:slug" element={<ProductEditor />} />
          <Route path="/catalogo/nuevo-producto" element={<ProductEditor />} />

          {/* Cambiado :id a :slug para que coincida con useParams() en los componentes */}
          <Route path="/sucursal/:slug" element={<Sucursal />}>
            <Route index element={<Overview />} />
            <Route path="pedidos" element={<PedidosSucursal />} />
            <Route path="stock" element={<Stock />} />
            {/* Ruta relativa para el gestor de paquetes de un producto específico */}
            <Route
              path="stock/:catalogoProducto/paquetes"
              element={<GestionPaquetes />}
            />
            <Route path="ajustes" element={<Informacion />} />
            <Route path="equipo" element={<Empleados />} />
          </Route>

          <Route path="/sucursales/nueva" element={<SucursalEditor />} />
          <Route path="/sucursales/editar/:id" element={<SucursalEditor />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
