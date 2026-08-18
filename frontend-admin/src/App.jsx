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
import Catalogo from "./pages/Catalogo";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Inicio />} />
          <Route path="/ingresar" element={<Auth />} />

          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/editar/:id" element={<ProductEditor />} />
          <Route path="/catalogo/nuevo-producto" element={<ProductEditor />} />
          <Route path="/sucursal/:id" element={<Sucursal />}>
            <Route index element={<Overview />} />
            <Route path="stock" element={<Stock />} />
            <Route path="informacion" element={<Informacion />} />
            <Route path="empleados" element={<Empleados />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
