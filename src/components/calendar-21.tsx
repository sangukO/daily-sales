"use client";

import { useState } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";

export default function Calendar21() {
  const [date, setDate] = useState<Date>(new Date());

  //예시 매출
  const salesDays = [new Date(2025, 8, 15), new Date(2025, 8, 17)];

  return (
    <Calendar
      locale={ko}
      mode="single"
      defaultMonth={date}
      today={date}
      selected={date}
      numberOfMonths={1}
      captionLayout="dropdown"
      className="rounded-lg border shadow-sm [--cell-size:--spacing(11)] md:[--cell-size:--spacing(13)]"
      modifiers={{
        hasSale: salesDays,
      }}
      modifiersClassNames={{
        hasSale: "has-sale-day",
      }}
      formatters={{
        formatMonthDropdown: (date) => {
          return date.toLocaleString("default", { month: "long" });
        },
      }}
      components={{
        DayButton: ({ children, modifiers, day, ...props }) => {
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
          const hasSale = modifiers.hasSale;
          return (
            <CalendarDayButton day={day} modifiers={modifiers} {...props}>
              {children}
            </CalendarDayButton>
          );
        },
      }}
    />
  );
}
