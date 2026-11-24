// backend/src/utils/auth.js
const crypto = require("crypto");

const STAFF_ROLES = ["propietario", "admin", "encargado", "cortador"];
const MANAGER_ROLES = ["propietario", "admin", "encargado"];
const OWNER_ADMIN_ROLES = ["propietario", "admin"];

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ [FATAL SECURITY ERROR] JWT_SECRET no está definido en variables de entorno de producción.",
    );
    process.exit(1);
  } else {
    console.warn(
      "⚠️ [SECURITY WARNING] Usando JWT_SECRET de desarrollo por defecto. Configure JWT_SECRET en su entorno.",
    );
  }
}
const EFFECTIVE_JWT_SECRET =
  JWT_SECRET || "valette_super_secret_jwt_key_2026_dev";

/**
 * Hashea una contraseña usando PBKDF2 con salt aleatorio
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 10000;
  const keylen = 64;
  const digest = "sha512";
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, keylen, digest)
    .toString("hex");
  return `${salt}:${iterations}:${hash}`;
}

/**
 * Verifica una contraseña contra su hash almacenado
 * Utiliza comparación de tiempo constante para evitar timing attacks
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, iterations, originalHash] = storedHash.split(":");
  const keylen = 64;
  const digest = "sha512";
  const hash = crypto
    .pbkdf2Sync(password, salt, parseInt(iterations, 10), keylen, digest)
    .toString("hex");

  const hashBuf = Buffer.from(hash, "utf8");
  const origBuf = Buffer.from(originalHash, "utf8");
  if (hashBuf.length !== origBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, origBuf);
}

/**
 * Genera un token JWT firmado con HMAC-SHA256
 * Expiración por defecto: 30 días (720 horas) para persistencia óptima de sesión cliente
 */
function generateToken(payload, expiresInHours = 720) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload = { ...payload, exp };

  const encodeBase64Url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const headerB64 = encodeBase64Url(header);
  const payloadB64 = encodeBase64Url(fullPayload);

  const signature = crypto
    .createHmac("sha256", EFFECTIVE_JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verifica un token JWT con comparación en tiempo constante
 */
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", EFFECTIVE_JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuf = Buffer.from(signatureB64, "utf8");
  const expBuf = Buffer.from(expectedSignature, "utf8");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const payloadStr = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(payloadStr);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extrae y valida un token JWT opcional sin rechazar la petición
 */
function getOptionalAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}

/**
 * Middleware: requiere sesión válida (cliente o personal)
 */
function requireAuth(req, res, next) {
  const decoded = getOptionalAuth(req);
  if (!decoded) {
    return res
      .status(401)
      .json({ error: "Acceso no autorizado. Debe iniciar sesión." });
  }
  req.user = decoded;
  next();
}

/**
 * Middleware: requiere personal interno autenticado (propietario, admin, encargado o cortador)
 */
function requireStaff(req, res, next) {
  const decoded = getOptionalAuth(req);
  if (!decoded) {
    return res
      .status(401)
      .json({ error: "Acceso no autorizado. Inicie sesión en el panel." });
  }
  const rol = String(decoded.rol || "").toLowerCase();
  if (!STAFF_ROLES.includes(rol)) {
    return res.status(403).json({
      error: "Permisos insuficientes. Esta operación es exclusiva del personal de sucursal.",
    });
  }
  req.user = decoded;
  next();
}

/**
 * Middleware: requiere nivel de gestión (propietario, admin o encargado)
 */
function requireAdmin(req, res, next) {
  const decoded = getOptionalAuth(req);
  if (!decoded) {
    return res
      .status(401)
      .json({ error: "Acceso no autorizado. Inicie sesión en el panel." });
  }
  const rol = String(decoded.rol || "").toLowerCase();
  if (!MANAGER_ROLES.includes(rol)) {
    return res.status(403).json({
      error: "Permisos insuficientes. Se requiere rol de Propietario, Admin o Encargado.",
    });
  }
  req.user = decoded;
  next();
}

/**
 * Middleware parametrizable por lista de roles permitidos
 */
function requireRoles(...allowedRoles) {
  const lower = allowedRoles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    const decoded = getOptionalAuth(req);
    if (!decoded) {
      return res
        .status(401)
        .json({ error: "Acceso no autorizado. Inicie sesión en el panel." });
    }
    const rol = String(decoded.rol || "").toLowerCase();
    if (!lower.includes(rol)) {
      return res.status(403).json({
        error: "No tenés permisos suficientes para realizar esta acción.",
      });
    }
    req.user = decoded;
    next();
  };
}

module.exports = {
  STAFF_ROLES,
  MANAGER_ROLES,
  OWNER_ADMIN_ROLES,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getOptionalAuth,
  requireAuth,
  requireStaff,
  requireAdmin,
  requireRoles,
};
