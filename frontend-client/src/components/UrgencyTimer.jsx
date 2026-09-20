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
    <div className="flex w-full items-center justify-between bg-red-50 border border-red-200 px-3 py-1 mb-1">
      <div className="flex w-fit items-center gap-1.5 text-main-red">
        <Clock className="size-3 animate-pulse" />
        <span className="text-xs font-extrabold uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="flex gap-2 text-red-900 text-sm font-black">
        <div className="flex text-sm font-bold">
          {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
        </div>
      </div>
    </div>
  );
}
