import EcommerceLayout from "@/layouts/ecomLayout";
import Home from "@/pages/ecommerce/Home";
import Product from "@/pages/ecommerce/Product";
import Checkout from "@/pages/ecommerce/Checkout";
import OrderSuccess from "@/pages/ecommerce/OrderSuccess";
import Auth from "@/pages/ecommerce/Auth";
import Profile from "@/pages/ecommerce/Profile";
import CategoryPage from "@/pages/ecommerce/CategoryPage";
import Productos from "@/pages/ecommerce/Productos";
import NotFound from "@/pages/NotFound";
import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { useAnalytics } from "./hooks/useAnalytics";

function App() {
  useAnalytics();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<EcommerceLayout />}>
          <Route index element={<Home />} />
          <Route path="ingresar" element={<Auth />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="productos" element={<Productos />} />
          
          {/* Rutas de comprobante de pedido */}
          <Route path="pedido/:id/confirmacion" element={<OrderSuccess />} />
          <Route path="pedido/:id" element={<OrderSuccess />} />
          <Route path="pedido-exitoso/:id" element={<OrderSuccess />} />

          {/* Rutas de catálogo y productos */}
          <Route path=":categoria" element={<CategoryPage />} />
          <Route path=":categoria/:slug" element={<Product />} />

          {/* Ruta 404 para cualquier URL no encontrada */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
