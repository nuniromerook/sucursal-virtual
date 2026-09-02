import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";
import CartDrawer from "../components/CartDrawer";
import NotificationsDrawer from "../components/NotificationsDrawer";
import BottomNavbar from "../components/BottomNavbar";

export default function ecomLayout() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-neutral-100 transition-all pb-16 md:pb-0">
      <Navbar />
      <Sidebar />
      <CartDrawer />
      <NotificationsDrawer />
      {/* will either be <Home/> or <Settings/> */}
      <Outlet />
      <Footer />
      <BottomNavbar />
    </div>
  );
}
