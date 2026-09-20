// backend/src/utils/auth.js
const crypto = require("crypto");

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
 */
function generateToken(payload, expiresInHours = 72) {
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
 * Verifica un token JWT
 * Utiliza comparación en tiempo constante (crypto.timingSafeEqual)
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

    // Validar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Middleware para requerir autenticación
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Acceso no autorizado. Debe iniciar sesión." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res
      .status(401)
      .json({ error: "Token inválido o expirado. Inicie sesión nuevamente." });
  }

  req.user = decoded;
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  requireAuth,
};
