"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";
import type { Sale } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CurrencyInput from "@/components/chart/CurrencyInput";

export default function Calendar21() {
  const [date, setDate] = useState<Date>(new Date());
  const [sales, setSales] = useState<Sale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    // 샘플 매출 데이터 불러오기
    fetch("/sample-sales.json")
      .then((response) => response.json())
      .then((data: Sale[]) => {
        const formattedData: Sale[] = data.map((item: any) => ({
          ...item,
          date: new Date(item.date),
        }));
        setSales(formattedData);
      })
      .catch((error) => {
        console.error("데이터 불러오기 실패", error);
      });
  }, []);

  const salesAmountByDate = useMemo(() => {
    const amountMap = new Map<number, number>();
    sales.forEach((sale) => {
      const dateKey = new Date(sale.date).setHours(0, 0, 0, 0);
      const currentAmount = amountMap.get(dateKey) || 0;
      amountMap.set(dateKey, currentAmount + sale.amount);
    });
    return amountMap;
  }, [sales]);

  const salesDays = useMemo(() => sales.map((sale) => sale.date), [sales]);
  const memosDays = useMemo(
    () => sales.filter((sale) => sale.memo).map((sale) => sale.date),
    [sales]
  );

  function handleDayClick(day: Date) {
    setDate(day);

    const dateKey = day.setHours(0, 0, 0, 0);
    const saleForDay = sales.find(
      (sale) => sale.date.setHours(0, 0, 0, 0) === dateKey
    );
    setSelectedDate(day);
    if (saleForDay) {
      setSelectedSale(saleForDay);
    } else {
      setSelectedSale(null);
    }

    setIsDialogOpen(true);
  }

  return (
    <div>
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
          hasMemo: memosDays,
        }}
        modifiersClassNames={{
          hasSale: "has-sale-day",
          hasMemo: "has-memo-day",
        }}
        formatters={{
          formatMonthDropdown: (date) => {
            return date.toLocaleString("default", { month: "long" });
          },
        }}
        components={{
          DayButton: ({ children, modifiers, day, ...props }) => {
            const hasSale = modifiers.hasSale;
            const dateKey = day.date.setHours(0, 0, 0, 0);
            const amount = salesAmountByDate.get(dateKey) || 0;
            return (
              <CalendarDayButton
                day={day}
                modifiers={modifiers}
                {...props}
                onClick={() => handleDayClick(day.date)}
              >
                {children}
                {hasSale && amount !== undefined ? (
                  <span className="text-xs">
                    {/* 숫자를 원화 형식으로 예쁘게 보여주기 */}
                    {amount.toLocaleString("ko-KR")}
                  </span>
                ) : (
                  <span className="text-xs invisible"></span>
                )}
              </CalendarDayButton>
            );
          },
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <form>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>
                {selectedDate?.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}{" "}
              </DialogTitle>
              <DialogDescription>{/*  */}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="amount">매출액</Label>
                <CurrencyInput amountProp={selectedSale?.amount} />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="memo">메모</Label>
                <Input
                  id="memo"
                  name="memo"
                  placeholder="메모를 입력하세요."
                  defaultValue={selectedSale?.memo}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button type="submit">변경 사항 저장</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </div>
  );
}
