import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function UrgencyTimer({
  endDate,
  title = "Promo por tiempo limitado!",
}) {
  const calculateTimeLeft = () => {
    const end = new Date(endDate);
    const now = new Date();
    const difference = end.getTime() - now.getTime();

    if (difference <= 0) {
      return { hours: "00", minutes: "00", seconds: "00" };
    }

    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (
    timeLeft.hours === "00" &&
    timeLeft.minutes === "00" &&
    timeLeft.seconds === "00"
  ) {
    return null; // Don't show if expired
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-red-50 border border-red-200 p-3 my-6">
      <div className="flex items-center gap-1.5 text-main-red">
        <Clock className="size-4 animate-pulse" />
        <span className="text-xs font-extrabold uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="flex gap-2 text-red-900 text-sm font-black">
        <div className="flex flex-col items-center bg-white border border-red-100 rounded px-2 py-1 flex-1">
          <span className="text-xl tabular-nums">{timeLeft.hours}</span>
          <span className="text-[10px] font-semibold text-red-700 uppercase">
            Horas
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-lg font-bold pb-4">
          :
        </div>
        <div className="flex flex-col items-center bg-white border border-red-100 rounded px-2 py-1 flex-1">
          <span className="text-xl tabular-nums">{timeLeft.minutes}</span>
          <span className="text-[10px] font-semibold text-red-700 uppercase">
            Minutos
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-lg font-bold pb-4">
          :
        </div>
        <div className="flex flex-col items-center bg-white border border-red-100 rounded px-2 py-1 flex-1">
          <span className="text-xl tabular-nums">{timeLeft.seconds}</span>
          <span className="text-[10px] font-semibold text-red-700 uppercase">
            Segundos
          </span>
        </div>
      </div>
    </div>
  );
}
