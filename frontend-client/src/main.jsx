import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext.jsx";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { CartContextProvider } from "./context/CartContext.jsx";
import { ToastContextProvider } from "./context/ToastContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { NotificationContextProvider } from "./context/NotificationContext.jsx";
import { FavoritesContextProvider } from "./context/FavoritesContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useCart } from "./context/CartContext.jsx";

/**
 * Bridge que conecta AuthContext con CartContext sin crear dependencias circulares.
 *
 * FIX: usa hasSyncedRef para garantizar que la sincronización se dispara:
 *   - Al hacer login (sesión nueva).
 *   - Al montar la app con una sesión ya guardada en localStorage (otro dispositivo, reload).
 * No dispara doble sync en React StrictMode gracias al flag booleano.
 */
function CartSyncBridge() {
  const { token, isAuthenticated } = useAuth();
  const { sincronizarCarrito, setAuthToken } = useCart();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Siempre mantener el tokenRef actualizado en CartContext
    setAuthToken(token);

    if (isAuthenticated && token) {
      if (!hasSyncedRef.current) {
        // Primera vez que vemos una sesión válida (login fresco O mount con token guardado)
        hasSyncedRef.current = true;
        sincronizarCarrito(token);
      }
    } else if (!isAuthenticated) {
      // Logout: permitir una nueva sincronización en el próximo login
      hasSyncedRef.current = false;
      setAuthToken(null);
    }
  }, [isAuthenticated, token]);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <AuthContextProvider>
          <FavoritesContextProvider>
            <SocketContextProvider>
              <ToastContextProvider>
                <NotificationContextProvider>
                  <CartContextProvider>
                    <CartSyncBridge />
                    <App />
                  </CartContextProvider>
                </NotificationContextProvider>
              </ToastContextProvider>
            </SocketContextProvider>
          </FavoritesContextProvider>
        </AuthContextProvider>
      </AppContextProvider>
    </BrowserRouter>
  </StrictMode>,
);

