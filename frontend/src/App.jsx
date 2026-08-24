import EcommerceLayout from "@/layouts/ecomLayout";
import Home from "@/pages/ecommerce/Home";
import Product from "@/pages/ecommerce/Product";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<EcommerceLayout />}>
          <Route index element={<Home />} />
          <Route path=":categoria/:especie/:slug" element={<Product />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
