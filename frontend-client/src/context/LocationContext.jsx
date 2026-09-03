// frontend-client/src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  SUCURSAL_LUIS_GUILLON,
  RADIO_COBERTURA_KM,
  calcularDistanciaKm,
  obtenerUbicacionNavegador,
  guardarUbicacionLocal,
  leerUbicacionLocal,
} from "../utils/geolocation";
import { useAuth } from "./AuthContext";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const { user, isAuthenticated, updatePerfil } = useAuth();
  const [coords, setCoords] = useState(() => leerUbicacionLocal());
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState(null);

  // Si el usuario logueado ya tiene latitud y longitud guardadas en DB y no teníamos en local
  useEffect(() => {
    if (user && user.latitud && user.longitud && !coords) {
      const userDbCoords = {
        lat: Number(user.latitud),
        lng: Number(user.longitud),
      };
      setCoords(userDbCoords);
      guardarUbicacionLocal(userDbCoords);
    }
  }, [user, coords]);

  // Escuchar cambios de coordenadas emitidos por otros componentes
  useEffect(() => {
    const handleCoordsUpdated = () => {
      const updated = leerUbicacionLocal();
      if (updated) setCoords(updated);
    };

    window.addEventListener("valette_coords_updated", handleCoordsUpdated);
    return () => window.removeEventListener("valette_coords_updated", handleCoordsUpdated);
  }, []);

  // Calcular distancia respecto a la sucursal Luis Guillón
  const distanceKm = coords
    ? calcularDistanciaKm(
        coords.lat,
        coords.lng,
        SUCURSAL_LUIS_GUILLON.lat,
        SUCURSAL_LUIS_GUILLON.lng
      )
    : null;

  const isInCoverage = distanceKm !== null ? distanceKm <= RADIO_COBERTURA_KM : null;

  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    setDetectError(null);
    try {
      const detected = await obtenerUbicacionNavegador();
      setCoords(detected);

      // Si el cliente está autenticado, sincronizar las coordenadas en su perfil de la base de datos
      if (isAuthenticated && updatePerfil) {
        try {
          await updatePerfil({
            latitud: detected.lat,
            longitud: detected.lng,
          });
        } catch {
          // Si falla la sincronización con el backend, las coordenadas locales persisten igualmente
        }
      }

      return detected;
    } catch (err) {
      setDetectError(err.message || "Error al detectar ubicación");
      throw err;
    } finally {
      setIsDetecting(false);
    }
  }, [isAuthenticated, updatePerfil]);

  return (
    <LocationContext.Provider
      value={{
        coords,
        distanceKm,
        isInCoverage,
        isDetecting,
        detectError,
        detectLocation,
        RADIO_COBERTURA_KM,
        sucursalCentral: SUCURSAL_LUIS_GUILLON,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationCoverage() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationCoverage debe usarse dentro de un LocationProvider");
  }
  return context;
}
