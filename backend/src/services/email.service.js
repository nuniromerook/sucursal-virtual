// backend/src/services/email.service.js
const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Remitente por defecto (onboarding@resend.dev para pruebas de desarrollo)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Valette Carnicería <onboarding@resend.dev>";

/**
 * Genera la plantilla HTML responsive con branding de Valette
 */
function getPasswordResetTemplate({ nombre, resetUrl }) {
  const nombreCliente = nombre ? nombre.split(" ")[0] : "Cliente";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecé tu contraseña - Abastecedora Valette</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #002b49 0%, #1e3a8a 100%);
      padding: 35px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .header p {
      color: #93c5fd;
      margin: 6px 0 0 0;
      font-size: 13px;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .content {
      padding: 35px 30px;
      line-height: 1.6;
    }
    .content h2 {
      color: #111827;
      font-size: 19px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .content p {
      color: #4b5563;
      font-size: 15px;
      margin-bottom: 22px;
    }
    .btn-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
      transition: background-color 0.2s ease;
    }
    .badge-timer {
      display: inline-block;
      background-color: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .fallback-url {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      border: 1px dashed #d1d5db;
    }
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 20px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header con identidad Valette -->
    <div class="header">
      <h1>🥩 Abastecedora Valette</h1>
      <p>Sucursal Virtual · Carnicería Boutique</p>
    </div>

    <!-- Contenido del Correo -->
    <div class="content">
      <h2>¡Hola, ${nombreCliente}! 👋</h2>
      <p>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Abastecedora Valette</strong>.
      </p>

      <div style="text-align: center;">
        <span class="badge-timer">⏱️ Este enlace vence en 15 minutos</span>
      </div>

      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn">
          Restablecer mi Contraseña →
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280;">
        Si el botón anterior no funciona en tu dispositivo, podés copiar y pegar este enlace en tu navegador:
      </p>
      <p class="fallback-url">${resetUrl}</p>

      <div style="margin-top: 25px; padding-top: 18px; border-top: 1px solid #f3f4f6; font-size: 13px; color: #9ca3af;">
        🛡️ <strong>¿No solicitaste este cambio?</strong> Podés desestimar este mensaje de forma segura. Tu contraseña actual no será modificada hasta que ingreses al enlace.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Abastecedora Valette</strong> · Calidad Premium Garantizada</p>
      <p>Luis Guillón, Buenos Aires, Argentina</p>
      <p style="margin-top: 8px; font-size: 11px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envía el email de recuperación de contraseña usando Resend
 */
async function enviarEmailRecuperacion({ to, nombre, resetUrl }) {
  if (!resend) {
    console.warn("⚠️ [Resend] No se encontró RESEND_API_KEY configurada. Simulando envío...");
    console.log(`[Simulación Email] Para: ${to} | URL: ${resetUrl}`);
    return { id: "simulated-id", success: true };
  }

  try {
    const htmlContent = getPasswordResetTemplate({ nombre, resetUrl });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Recuperá tu contraseña - Abastecedora Valette",
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ [Resend Error]:", response.error);
      throw new Error(response.error.message || "Error al enviar correo con Resend");
    }

    console.log(`✅ [Resend] Correo de recuperación enviado a ${to} (ID: ${response.data?.id})`);
    return response.data;
  } catch (error) {
    console.error("❌ Error enviando email con Resend:", error.message);
    throw error;
  }
}

module.exports = {
  enviarEmailRecuperacion,
};
