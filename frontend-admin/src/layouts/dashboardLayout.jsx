// src/layouts/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Breadcrumb from "../components/Breadcrumb";
import { ADMIN_BREADCRUMB_ROUTES } from "../breadcumbRoutes";
import { useAppContext } from "../context/AppContext";

export default function DashboardLayout() {
  const { breadcrumbExtra } = useAppContext();

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex flex-col w-full">
        <Navbar />
        <Breadcrumb routes={ADMIN_BREADCRUMB_ROUTES} extra={breadcrumbExtra} />
        <Outlet />
      </main>
    </div>
  );
}
