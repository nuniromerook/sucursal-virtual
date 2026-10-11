import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MobileDock } from "@/components/layout/MobileDock";

const MainLayout = () => {
  return (
    <>
      <Navbar />

      {/* Contenido principal */}
      <main className="pt-16 lg:pt-24 px-4 pb-24 lg:pb-32 bg-slate-50/30">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Dock móvil */}
      <MobileDock />
    </>
  );
};

export default MainLayout;
