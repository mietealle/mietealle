"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingRange {
  id: string;
  label: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
}

interface Props {
  bookings: BookingRange[];
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-200 text-yellow-800",
  CONFIRMED: "bg-blue-200 text-blue-800",
  ACTIVE: "bg-indigo-200 text-indigo-800",
  DISPATCHED: "bg-purple-200 text-purple-800",
  DELIVERED: "bg-teal-200 text-teal-800",
  RETURN_INITIATED: "bg-orange-200 text-orange-800",
  RETURN_DISPATCHED: "bg-orange-200 text-orange-800",
  RETURNED: "bg-gray-200 text-gray-700",
  COMPLETED: "bg-green-200 text-green-800",
  CANCELLED: "bg-red-100 text-red-600 line-through",
};

const DOT_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-400",
  CONFIRMED: "bg-blue-400",
  ACTIVE: "bg-indigo-500",
  DISPATCHED: "bg-purple-500",
  DELIVERED: "bg-teal-500",
  RETURN_INITIATED: "bg-orange-400",
  RETURN_DISPATCHED: "bg-orange-400",
  RETURNED: "bg-gray-400",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-300",
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isBetween(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

export function BookingCalendar({ bookings }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const parsed = bookings.map((b) => ({
    ...b,
    startDate: new Date(b.startDate),
    endDate: new Date(b.endDate),
  }));

  // Build grid: first day of month, fill Mon-based week
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  const cells: Array<Date | null> = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) {
      cells.push(null);
    } else {
      cells.push(new Date(year, month, dayNum));
    }
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthName = new Date(year, month, 1).toLocaleString("de-DE", { month: "long", year: "numeric" });

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1 hover:bg-gray-100"
          aria-label="Vorheriger Monat"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-semibold text-gray-700 capitalize">{monthName}</span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1 hover:bg-gray-100"
          aria-label="Nächster Monat"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="h-9" />;
          }

          const isToday = isSameDay(date, today);
          const activeBookings = parsed.filter(
            (b) => b.status !== "CANCELLED" && isBetween(date, b.startDate, b.endDate)
          );
          const isStart = parsed.some((b) => b.status !== "CANCELLED" && isSameDay(date, b.startDate));
          const isEnd = parsed.some((b) => b.status !== "CANCELLED" && isSameDay(date, b.endDate));

          return (
            <div
              key={date.toISOString()}
              className={[
                "relative flex h-9 flex-col items-center justify-start pt-1",
                "rounded-lg",
                activeBookings.length > 0 && !isStart && !isEnd
                  ? "bg-brand-50"
                  : "",
                isStart || isEnd ? "bg-brand-100" : "",
                isToday ? "ring-2 ring-brand-400" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "text-xs font-medium leading-none",
                  isToday ? "text-brand-700 font-bold" : "text-gray-700",
                  activeBookings.length > 0 ? "text-brand-900" : "",
                ].join(" ")}
              >
                {date.getDate()}
              </span>
              {activeBookings.length > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  {activeBookings.slice(0, 3).map((b, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[b.status] ?? "bg-gray-400"}`}
                      title={b.label}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {parsed.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-500">Buchungen dieses Monats</p>
          <div className="flex flex-col gap-1">
            {parsed
              .filter((b) => {
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0);
                return b.endDate >= start && b.startDate <= end;
              })
              .map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs ${
                    STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="font-medium">{b.label}</span>
                  <span className="opacity-70">
                    {b.startDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                    {" – "}
                    {b.endDate.toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
