// src/components/Navbar.jsx
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  const { sidebarOpen, setSidebarOpen, navbarTitle } = useAppContext();
  return (
    <>
      <header className="sticky top-0 z-20 flex h-18 lg:h-fit items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
            className="cursor-pointer rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">{navbarTitle}</h1>
        </div>
      </header>
    </>
  );
};

export default Navbar;
