import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [navbarTitle, setNavbarTitle] = useState("");

  const [sidebarOpen, setSidebarOpenState] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return false;
    }
    const saved = localStorage.getItem("admin_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  const setSidebarOpen = (value) => {
    setSidebarOpenState((prev) => {
      const nextValue = typeof value === "function" ? value(prev) : value;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        localStorage.setItem("admin_sidebar_open", String(nextValue));
      }
      return nextValue;
    });
  };

  const [breadcrumbExtra, setBreadcrumbExtra] = useState({});

  return (
    <AppContext.Provider
      value={{
        navigate,
        isLoading,
        setIsLoading,
        navbarTitle,
        setNavbarTitle,
        sidebarOpen,
        setSidebarOpen,
        breadcrumbExtra,
        setBreadcrumbExtra,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
};
