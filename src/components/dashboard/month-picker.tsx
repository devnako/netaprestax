"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MONTH_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
  /** Optional subtitle shown below the month name */
  subtitle?: string;
}

export { MONTH_NAMES };

export function MonthPicker({ month, year, onChange, subtitle }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  // Sync picker year when external year changes
  useEffect(() => {
    setPickerYear(year);
  }, [year]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const prevMonth = () => {
    if (month === 1) {
      onChange(12, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      onChange(1, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const selectMonth = (m: number) => {
    onChange(m, pickerYear);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3">
      <button onClick={prevMonth} className="p-1 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="text-center hover:bg-muted rounded-lg px-3 py-1 transition-colors"
      >
        <p className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </button>

      <button onClick={nextMonth} className="p-1 text-muted-foreground hover:text-foreground">
        <ChevronRight className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-white p-3 shadow-lg">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear(pickerYear - 1)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(pickerYear + 1)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT.map((name, i) => {
              const m = i + 1;
              const isSelected = m === month && pickerYear === year;
              return (
                <button
                  key={m}
                  onClick={() => selectMonth(m)}
                  className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
