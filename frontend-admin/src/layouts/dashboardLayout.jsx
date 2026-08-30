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
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900 font-sans">
      <Sidebar />
      <main className="flex flex-col flex-1 min-w-0 bg-neutral-100">
        <Navbar />
        <Breadcrumb routes={ADMIN_BREADCRUMB_ROUTES} extra={breadcrumbExtra} />
        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
