// src/layouts/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Breadcrumb from "../components/Breadcrumb";
import { ADMIN_BREADCRUMB_ROUTES } from "../breadcumbRoutes";
import { useAppContext } from "../context/AppContext";
import BottomNavbarAdmin from "../components/BottomNavbarAdmin";

export default function DashboardLayout() {
  const { breadcrumbExtra } = useAppContext();

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900 font-sans pb-16 lg:pb-0">
      <Sidebar />
      <main className="flex flex-col flex-1 min-w-0 bg-neutral-100 w-full lg:max-w-[calc(100vw-16rem)] mx-auto transition-all duration-300 ease-in-out">
        <Navbar />
        <Breadcrumb routes={ADMIN_BREADCRUMB_ROUTES} extra={breadcrumbExtra} />
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
      <BottomNavbarAdmin />
    </div>
  );
}
