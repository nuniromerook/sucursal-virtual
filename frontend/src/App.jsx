import EcommerceLayout from "@/layouts/ecomLayout";
import Home from "@/pages/ecommerce/Home";
import Product from "@/pages/ecommerce/Product";
import Checkout from "@/pages/ecommerce/Checkout";
import OrderSuccess from "@/pages/ecommerce/OrderSuccess";
import Auth from "@/pages/ecommerce/Auth";
import Profile from "@/pages/ecommerce/Profile";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<EcommerceLayout />}>
          <Route index element={<Home />} />
          <Route path="ingresar" element={<Auth />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="pedido/:id/confirmacion" element={<OrderSuccess />} />
          <Route path=":categoria/:especie/:slug" element={<Product />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
