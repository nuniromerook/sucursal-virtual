import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "../components/Footer";

export default function ecomLayout() {
  return (
    <div className="flex flex-col w-full h-fit bg-neutral-100 transition-all">
      <Navbar />
      {/* will either be <Home/> or <Settings/> */}
      <Outlet />
      <Footer />
    </div>
  );
}
