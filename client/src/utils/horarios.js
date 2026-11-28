// client/src/utils/horarios.js
// Evalúa dinámicamente si la sucursal está abierta en hora oficial de Argentina
// usando Temporal API (cuando está disponible) con fallback a Intl.DateTimeFormat.

const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

const DAY_KEYS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

const DAY_LABELS = {
  domingo: "domingo",
  lunes: "lunes",
  martes: "martes",
  miercoles: "miércoles",
  jueves: "jueves",
  viernes: "viernes",
  sabado: "sábado",
};

export const DEFAULT_HORARIOS_APERTURA = {
  lunes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  martes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  miercoles: { abierto: true, apertura: "07:00", cierre: "15:00" },
  jueves: { abierto: true, apertura: "07:00", cierre: "15:00" },
  viernes: { abierto: true, apertura: "07:00", cierre: "15:00" },
  sabado: { abierto: true, apertura: "07:00", cierre: "15:00" },
  domingo: { abierto: true, apertura: "08:00", cierre: "13:00" },
};

export const DEFAULT_HOME_CONFIG = {
  saludo_dinamico: true,
  saludo_manana: "Buen día",
  saludo_tarde: "Buenas tardes",
  saludo_noche: "Buenas noches",
  saludo_fijo: "Hola",
  mensaje_abierto_semana: "Qué vas a pedir hoy?",
  mensaje_abierto_finde: "Qué vas a pedir hoy?",
  mensaje_cerrado_hoy:
    "Todavía no abrimos, pero ya podés dejar tu pedido para hoy.",
  mensaje_cerrado_manana:
    "Ahora estamos cerrados, pero podés dejar tu pedido para mañana.",
  mensaje_manual_activo: false,
  mensaje_manual: "",
  mensaje_manual_expira: null,
  mensaje_manual_sobre_cerrado: false,
};

export function getArgentinaNowParts() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.Temporal?.Now?.zonedDateTimeISO
  ) {
    try {
      const zdt = globalThis.Temporal.Now.zonedDateTimeISO(ARGENTINA_TZ);
      // Temporal dayOfWeek: 1 (Mon) .. 7 (Sun) -> JS 0 (Sun) .. 6 (Sat)
      const dayIndex = zdt.dayOfWeek % 7;
      return {
        dayIndex,
        hour: zdt.hour,
        minutesNow: zdt.hour * 60 + zdt.minute,
      };
    } catch {
      // Fall back to Intl
    }
  }

  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayIndex = weekdayMap[parts.weekday] ?? now.getDay();
  const hour = Number(parts.hour === "24" ? 0 : parts.hour) || 0;
  const minute = Number(parts.minute) || 0;

  return { dayIndex, hour, minutesNow: hour * 60 + minute };
}

function parseTimeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function getBranchOpenStatus(branch) {
  const rawSchedule = branch?.horarios_apertura;
  const schedule =
    rawSchedule && typeof rawSchedule === "object"
      ? { ...DEFAULT_HORARIOS_APERTURA, ...rawSchedule }
      : DEFAULT_HORARIOS_APERTURA;

  if (branch?.activa === false) {
    const { dayIndex, hour } = getArgentinaNowParts();
    return {
      isOpen: false,
      opensLaterToday: false,
      dayIndex,
      hour,
      shortText: "Cerrado temporalmente",
      detailText: "Sucursal pausada",
      badgeText: "Cerrado temporalmente",
    };
  }

  const { dayIndex, hour, minutesNow } = getArgentinaNowParts();
  const todayKey = DAY_KEYS[dayIndex];
  const todayCfg = schedule[todayKey];

  if (todayCfg?.abierto) {
    const openMin = parseTimeToMinutes(todayCfg.apertura);
    const closeMin = parseTimeToMinutes(todayCfg.cierre);

    if (openMin !== null && closeMin !== null) {
      if (minutesNow >= openMin && minutesNow < closeMin) {
        return {
          isOpen: true,
          opensLaterToday: false,
          dayIndex,
          hour,
          shortText: "Abierto ahora",
          detailText: `Cierra a las ${todayCfg.cierre}`,
          badgeText: `Abierto ahora · Cierra ${todayCfg.cierre}hs`,
        };
      }

      if (minutesNow < openMin) {
        return {
          isOpen: false,
          opensLaterToday: true,
          dayIndex,
          hour,
          shortText: "Cerrado",
          detailText: `Abre hoy a las ${todayCfg.apertura}`,
          badgeText: `Cerrado · Abrimos a las ${todayCfg.apertura}hs`,
        };
      }
    }
  }

  // Buscar próximo día abierto (empezando por mañana)
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (dayIndex + offset) % 7;
    const nextKey = DAY_KEYS[nextIdx];
    const nextCfg = schedule[nextKey];
    if (nextCfg?.abierto && nextCfg?.apertura) {
      const whenLabel = offset === 1 ? "mañana" : `el ${DAY_LABELS[nextKey]}`;
      return {
        isOpen: false,
        opensLaterToday: false,
        dayIndex,
        hour,
        shortText: "Cerrado",
        detailText: `Abre ${whenLabel} a las ${nextCfg.apertura}`,
        badgeText: `Cerrado · Abre ${whenLabel} ${nextCfg.apertura}hs`,
      };
    }
  }

  return {
    isOpen: false,
    opensLaterToday: false,
    dayIndex,
    hour,
    shortText: "Cerrado",
    detailText: "Consultá nuestros horarios",
    badgeText: "Cerrado",
  };
}

export function resolveHomeHeaderContent(homeConfig, branch, firstName = "") {
  const cfg = { ...DEFAULT_HOME_CONFIG, ...(homeConfig || {}) };
  const status = getBranchOpenStatus(branch);

  let greetingBase = cfg.saludo_fijo || DEFAULT_HOME_CONFIG.saludo_fijo;
  if (cfg.saludo_dinamico) {
    if (status.hour >= 5 && status.hour < 13) {
      greetingBase = cfg.saludo_manana || DEFAULT_HOME_CONFIG.saludo_manana;
    } else if (status.hour >= 13 && status.hour < 20) {
      greetingBase = cfg.saludo_tarde || DEFAULT_HOME_CONFIG.saludo_tarde;
    } else {
      greetingBase = cfg.saludo_noche || DEFAULT_HOME_CONFIG.saludo_noche;
    }
  }

  const cleanGreeting =
    String(greetingBase).replace(/[!¡]+$/g, "").trim() || "Hola";
  const cleanName = String(firstName || "").trim();
  const title = cleanName ? `${cleanGreeting}, ${cleanName}!` : `${cleanGreeting}!`;

  const expiraMs = cfg.mensaje_manual_expira
    ? new Date(cfg.mensaje_manual_expira).getTime()
    : null;
  const isManualValid =
    Boolean(cfg.mensaje_manual_activo) &&
    Boolean(String(cfg.mensaje_manual || "").trim()) &&
    (!expiraMs || Number.isNaN(expiraMs) || expiraMs > Date.now());

  let subtitle;
  if (!status.isOpen) {
    if (isManualValid && cfg.mensaje_manual_sobre_cerrado) {
      subtitle = String(cfg.mensaje_manual).trim();
    } else if (status.opensLaterToday) {
      subtitle =
        cfg.mensaje_cerrado_hoy || DEFAULT_HOME_CONFIG.mensaje_cerrado_hoy;
    } else {
      subtitle =
        cfg.mensaje_cerrado_manana ||
        DEFAULT_HOME_CONFIG.mensaje_cerrado_manana;
    }
  } else if (isManualValid) {
    subtitle = String(cfg.mensaje_manual).trim();
  } else if (status.dayIndex === 0 || status.dayIndex === 6) {
    subtitle =
      cfg.mensaje_abierto_finde || DEFAULT_HOME_CONFIG.mensaje_abierto_finde;
  } else {
    subtitle =
      cfg.mensaje_abierto_semana || DEFAULT_HOME_CONFIG.mensaje_abierto_semana;
  }

  return { title, subtitle, isOpen: status.isOpen };
}
