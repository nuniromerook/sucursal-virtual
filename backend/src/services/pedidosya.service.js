// backend/src/services/pedidosya.service.js
/**
 * Servicio de integración con la API de PedidosYa Envíos (Courier)
 * Documentación oficial: https://developers.pedidosya.com/courier-doc/introduction
 *
 * Flujo:
 * 1. Autenticación OAuth2 / Token
 * 2. Cotización previa (Estimate / Shipping Price): POST /v1/shippings/estimates
 * 3. Creación de orden de despacho (Shipping Order): POST /v1/shippings
 */

const PEDIDOSYA_BASE_URL =
  process.env.PEDIDOSYA_API_URL || "https://api.pedidosya.com/v1";
const PEDIDOSYA_CLIENT_ID = process.env.PEDIDOSYA_CLIENT_ID || "";
const PEDIDOSYA_CLIENT_SECRET = process.env.PEDIDOSYA_CLIENT_SECRET || "";

/**
 * Obtiene o refresca el token de acceso con PedidosYa Courier
 */
async function getAccessToken() {
  if (!PEDIDOSYA_CLIENT_ID || !PEDIDOSYA_CLIENT_SECRET) {
    // Si no hay credenciales configuradas en .env, retornamos null
    return null;
  }

  try {
    const res = await fetch(`${PEDIDOSYA_BASE_URL}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: PEDIDOSYA_CLIENT_ID,
        client_secret: PEDIDOSYA_CLIENT_SECRET,
      }),
    });

    if (!res.ok) {
      throw new Error(`PedidosYa Auth failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("Error al autenticar con PedidosYa:", error.message);
    return null;
  }
}

/**
 * Cotiza el costo y tiempo de entrega estimado
 * @param {Object} sucursal - Datos de la sucursal de origen { direccion, latitud, longitud, ciudad }
 * @param {Object} destino - Datos de destino { direccion, ciudad, latitud, longitud }
 * @param {Array} items - Items del pedido
 */
async function estimateShipping({ sucursal, destino, items }) {
  const token = await getAccessToken();

  // Si no hay credenciales en desarrollo o producción, calculamos una tarifa base estimada
  if (!token) {
    // Cálculo de tarifa estándar de referencia para simulación mientras se cargan tokens
    const tarifaBase = 1500;
    const estimacionMinutos = 45;

    return {
      success: true,
      isSimulation: true,
      price: tarifaBase,
      currency: "ARS",
      estimatedTimeMinutes: estimacionMinutos,
      provider: "pedidosya",
      message: "Estimación calculada (Modo desarrollo / credenciales pendientes)",
    };
  }

  try {
    const payload = {
      items: (items || []).map((item) => ({
        name: item.nombre_producto || "Corte de carne",
        quantity: Number(item.cantidad_kg) || 1,
        type: "STANDARD",
      })),
      waypoints: [
        {
          type: "PICK_UP",
          addressStreet: sucursal.direccion,
          city: sucursal.ciudad,
          latitude: Number(sucursal.latitud) || undefined,
          longitude: Number(sucursal.longitud) || undefined,
        },
        {
          type: "DROP_OFF",
          addressStreet: destino.direccion,
          city: destino.ciudad || sucursal.ciudad,
          latitude: Number(destino.latitud) || undefined,
          longitude: Number(destino.longitud) || undefined,
        },
      ],
    };

    const res = await fetch(`${PEDIDOSYA_BASE_URL}/shippings/estimates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.warn("PedidosYa Estimate API warning:", errorBody);
      return {
        success: false,
        price: 1800,
        currency: "ARS",
        message: "No se pudo obtener cotización dinámica exacta, se aplicó tarifa base.",
      };
    }

    const data = await res.json();
    return {
      success: true,
      isSimulation: false,
      price: data.pricing?.total || 1800,
      currency: data.pricing?.currency || "ARS",
      estimatedTimeMinutes: data.deliveryEstimateMinutes || 45,
      estimateId: data.estimateId || null,
      provider: "pedidosya",
    };
  } catch (error) {
    console.error("Error en estimateShipping:", error.message);
    return {
      success: false,
      price: 1800,
      currency: "ARS",
      message: error.message,
    };
  }
}

module.exports = {
  getAccessToken,
  estimateShipping,
};
