import React, { useState, useEffect } from "react";
import { CalendarClock } from "lucide-react";

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export default function TimeSlotSelector({ sucursal, onSelectSlot, selectedDate, selectedSlot }) {
  const [availableDays, setAvailableDays] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!sucursal || !sucursal.horarios_apertura) return;

    // Calcular los próximos 7 días habilitados
    const days = [];
    let d = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(d);
      const dayName = DIAS_SEMANA[date.getDay()];
      const horario = sucursal.horarios_apertura[dayName];
      
      if (horario && horario.abierto) {
        days.push({
          date: date,
          label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }),
          horario
        });
      }
      d.setDate(d.getDate() + 1);
    }
    setAvailableDays(days);
    
    // Select first day by default if nothing selected
    if (days.length > 0 && !selectedDate) {
      handleDateSelect(days[0]);
    }
  }, [sucursal]);

  const handleDateSelect = (dayObj) => {
    onSelectSlot(dayObj.date, null); // reset slot
    
    const slots = [];
    const [aperturaH, aperturaM] = dayObj.horario.apertura.split(":").map(Number);
    const [cierreH, cierreM] = dayObj.horario.cierre.split(":").map(Number);
    
    let current = new Date(dayObj.date);
    current.setHours(aperturaH, aperturaM, 0, 0);
    
    const end = new Date(dayObj.date);
    end.setHours(cierreH, cierreM, 0, 0);

    const now = new Date();

    // Generar franjas de 1 hora
    while (current < end) {
      const slotEnd = new Date(current);
      slotEnd.setHours(current.getHours() + 1);
      
      if (slotEnd > end) {
        slotEnd.setTime(end.getTime());
      }
      
      // Si es hoy, solo mostrar franjas futuras (con 30 min de margen)
      if (dayObj.label === "Hoy" && current < new Date(now.getTime() + 30 * 60000)) {
        current.setHours(current.getHours() + 1);
        continue;
      }

      const label = `${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")} - ${slotEnd.getHours().toString().padStart(2, "0")}:${slotEnd.getMinutes().toString().padStart(2, "0")}`;
      
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        label
      });

      current.setHours(current.getHours() + 1);
    }

    setAvailableSlots(slots);
  };

  useEffect(() => {
    if (selectedDate && availableDays.length > 0) {
       const dayObj = availableDays.find(d => d.date.toDateString() === selectedDate.toDateString());
       if (dayObj) {
           handleDateSelect(dayObj);
       }
    }
  }, [selectedDate, availableDays]);

  if (!sucursal || !sucursal.horarios_apertura) return null;

  return (
    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-neutral-100">
      <div className="flex items-center gap-2">
        <CalendarClock className="size-4 text-main-blue" />
        <label className="block text-xs font-semibold text-neutral-700">
          ¿Cuándo querés recibir/retirar tu pedido?
        </label>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
        {availableDays.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleDateSelect(day)}
            className={`min-w-fit px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${
              selectedDate && selectedDate.toDateString() === day.date.toDateString()
                ? "bg-main-blue text-white border-main-blue"
                : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {availableSlots.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {availableSlots.map((slot, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSlot(selectedDate, slot.label)}
              className={`p-2 rounded border text-xs text-center transition-colors ${
                selectedSlot === slot.label
                  ? "bg-blue-50 border-main-blue text-main-blue font-bold ring-1 ring-main-blue"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
          La sucursal ya no toma más pedidos para este día o está cerrada. Por favor elegí otra fecha.
        </div>
      )}
    </div>
  );
}
