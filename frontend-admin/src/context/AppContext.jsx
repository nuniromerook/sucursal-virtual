import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [navbarTitle, setNavbarTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
