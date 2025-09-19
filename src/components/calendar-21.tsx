"use client";

import { useState, useEffect } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";
import type { Sale } from "@/types";

export default function Calendar21() {
  const [date, setDate] = useState<Date>(new Date());
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    // 샘플 매출 데이터 불러오기
    fetch("/sample-sales.json")
      .then((response) => response.json())
      .then((data: Sale[]) => {
        setSales(data);
      })
      .catch((error) => {
        console.error("데이터 불러오기 실패", error);
      });
  }, []);

  const salesDays = sales.map((sale) => new Date(sale.date));

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
