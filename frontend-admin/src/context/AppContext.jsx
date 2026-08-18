import { createContext, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppContext.Provider
      value={{
        navigate,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
};
