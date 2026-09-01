// frontend-client/src/components/TimeSlotSelector.jsx
import React, { useState, useEffect } from "react";
import { CalendarClock, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

const DIAS_SEMANA = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

function getScheduleForDay(sucursal, dateObj) {
  const dayName = DIAS_SEMANA[dateObj.getDay()];

  if (
    sucursal?.horarios_apertura &&
    typeof sucursal.horarios_apertura === "object"
  ) {
    const h = sucursal.horarios_apertura[dayName];
    if (h) {
      return {
        abierto: h.abierto !== false,
        apertura: h.apertura || "08:00",
        cierre: h.cierre || "20:00",
      };
    }
  }

  // Fallback seguro si no hay JSON de horarios_apertura
  if (dayName === "domingo") {
    return { abierto: true, apertura: "08:00", cierre: "13:00" };
  }
  return { abierto: true, apertura: "08:00", cierre: "20:00" };
}

export default function TimeSlotSelector({
  sucursal,
  onSelectSlot,
  selectedDate,
  selectedSlot,
}) {
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // 1. Calcular días disponibles (Próximos 7 días)
  useEffect(() => {
    const days = [];
    let d = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      const isToday = i === 0;
      const horario = getScheduleForDay(sucursal, date);

      if (horario.abierto) {
        days.push({
          date: new Date(date),
          isToday,
          label: isToday
            ? "Hoy"
            : i === 1
              ? "Mañana"
              : date.toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "numeric",
                }),
          horario,
        });
      }
      d.setDate(d.getDate() + 1);
    }

    setAvailableDays(days);

    // Seleccionar el primer día por defecto si no hay ninguno seleccionado
    if (days.length > 0 && !selectedDate) {
      handleDateSelect(days[0]);
    }
  }, [sucursal]);

  // 2. Generar franjas horarias para el día seleccionado
  const handleDateSelect = (dayObj) => {
    const slots = [];
    const schedule = dayObj.horario;

    if (!schedule || !schedule.abierto) {
      setAvailableSlots([]);
      onSelectSlot(dayObj.date, null);
      return;
    }

    const [aperturaH, aperturaM] = (schedule.apertura || "08:00")
      .split(":")
      .map(Number);
    const [cierreH, cierreM] = (schedule.cierre || "20:00")
      .split(":")
      .map(Number);

    const startOfDay = new Date(dayObj.date);
    startOfDay.setHours(aperturaH || 8, aperturaM || 0, 0, 0);

    const endOfDay = new Date(dayObj.date);
    endOfDay.setHours(cierreH || 20, cierreM || 0, 0, 0);

    // Regla de negocio: 30 minutos antes del cierre del local se cierran los pedidos
    const cutoffTime = new Date(endOfDay.getTime() - 30 * 60000);

    const now = new Date();
    // Margen de 30 min desde la hora actual si es para "Hoy"
    const nowBuffer = new Date(now.getTime() + 30 * 60000);

    let curr = new Date(startOfDay);

    while (curr < endOfDay) {
      const nextSlot = new Date(curr);
      nextSlot.setHours(curr.getHours() + 1);

      if (nextSlot > endOfDay) {
        nextSlot.setTime(endOfDay.getTime());
      }

      const label = `${curr.getHours().toString().padStart(2, "0")}:${curr.getMinutes().toString().padStart(2, "0")} - ${nextSlot.getHours().toString().padStart(2, "0")}:${nextSlot.getMinutes().toString().padStart(2, "0")}`;

      // Determinar si la franja está deshabilitada (en gris)
      // a) Si es hoy y la hora ya pasó o está a menos de 30 min
      // b) Si el horario cae dentro de los 30 min previos al cierre del local
      const isPast = dayObj.isToday && curr < nowBuffer;
      const isTooCloseToClosing = curr >= cutoffTime;
      const isDisabled = isPast || isTooCloseToClosing;

      slots.push({
        start: new Date(curr),
        end: new Date(nextSlot),
        label,
        isDisabled,
        reason: isTooCloseToClosing
          ? "Cierra en menos de 30 min"
          : isPast
            ? "Horario pasado"
            : null,
      });

      curr.setHours(curr.getHours() + 1);
    }

    setAvailableSlots(slots);

    // Auto-seleccionar la primera franja disponible válida si no hay selección o la selección previa quedó deshabilitada
    const firstValid = slots.find((s) => !s.isDisabled);
    if (firstValid) {
      onSelectSlot(dayObj.date, firstValid.label);
    } else {
      onSelectSlot(dayObj.date, null);
    }
  };

  // Re-evaluar franjas cuando cambie la fecha elegida
  useEffect(() => {
    if (selectedDate && availableDays.length > 0) {
      const dayObj = availableDays.find(
        (d) => d.date.toDateString() === new Date(selectedDate).toDateString(),
      );
      if (dayObj) {
        handleDateSelect(dayObj);
      }
    }
  }, [selectedDate]);

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200/80 space-y-3 bg-neutral-50/50 p-4 rounded-xl border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-xs uppercase tracking-wider">
          <CalendarClock className="size-4 text-main-blue" />
          <span>Fecha y Horario de Entrega / Retiro</span>
        </div>
        {selectedSlot && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-600" />
            {selectedSlot}
          </span>
        )}
      </div>

      {/* Selector de Días (Tabs) */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
        {availableDays.map((day, idx) => {
          const isSelected =
            selectedDate &&
            new Date(selectedDate).toDateString() ===
              day.date.toDateString();

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDateSelect(day)}
              className={`min-w-fit px-3.5 py-2 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                isSelected
                  ? "bg-main-blue text-white border-main-blue shadow-sm"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      {/* Selector de Franjas Horarias */}
      {availableSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
          {availableSlots.map((slot, idx) => {
            const isSelected = selectedSlot === slot.label;
            const isDisabled = slot.isDisabled;

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectSlot(selectedDate, slot.label)}
                title={
                  isDisabled
                    ? slot.reason || "Horario deshabilitado"
                    : `Elegir ${slot.label}`
                }
                className={`p-2.5 rounded-lg border text-xs text-center transition-all flex flex-col items-center justify-center min-h-[44px] ${
                  isDisabled
                    ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through opacity-60 select-none"
                    : isSelected
                      ? "bg-main-blue text-white font-black border-main-blue ring-2 ring-main-blue/30 shadow-xs cursor-pointer"
                      : "bg-white text-neutral-800 font-bold border-neutral-200 hover:border-main-blue hover:text-main-blue cursor-pointer"
                }`}
              >
                <span>{slot.label}</span>
                {isDisabled && (
                  <span className="text-[9px] no-underline font-semibold text-neutral-400 mt-0.5">
                    {slot.reason || "No disponible"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-center gap-2 font-semibold">
          <AlertCircle className="size-4 text-amber-600 shrink-0" />
          <span>
            La sucursal está cerrada o no dispone de franjas horarias libres
            para este día. Por favor seleccioná otra fecha.
          </span>
        </div>
      )}

      <p className="text-[11px] text-neutral-400 flex items-center gap-1 font-medium pt-1">
        <Clock className="size-3 text-neutral-400 shrink-0" />
        <span>
          Las franjas se cierran 30 minutos antes del horario de cierre del
          local para garantizar la preparación.
        </span>
      </p>
    </div>
  );
}
