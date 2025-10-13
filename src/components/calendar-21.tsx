"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { ko } from "date-fns/locale";
import { db } from "@/lib/db";
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

  const [editedAmount, setEditedAmount] = useState<number | string>("");
  const [editedMemo, setEditedMemo] = useState("");

  useEffect(() => {
    // 샘플 데이터 불러오기 및 DB 초기화
    async function loadInitialData() {
      try {
        const dbSales = await db.sales.toArray();

        if (dbSales.length > 0) {
          setSales(dbSales);
        } else {
          const response = await fetch("/sample-sales.json");
          const sampleData = await response.json();

          const formattedData: Sale[] = sampleData.map((item: any) => ({
            ...item,
            date: new Date(item.date),
          }));

          await db.sales.bulkAdd(formattedData);

          setSales(formattedData);
        }
      } catch (error) {
        console.error("데이터 초기화에 실패했습니다:", error);
      }
    }

    // async function loadInitialData() {
    //   try {
    //     const dbSales = await db.sales.toArray();

    //     setSales(dbSales);
    //   } catch (error) {
    //     console.error("데이터를 불러오는 중 오류가 발생했습니다:", error);
    //   }
    // }

    loadInitialData();
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
      // 기존 매출이 있다면 그대로 보여주기
      setSelectedSale(saleForDay);
      setEditedAmount(saleForDay.amount);
      setEditedMemo(saleForDay.memo || "");
    } else {
      // 기존 매출이 없다면 새로 생성
      setSelectedSale({
        date: day,
        amount: 0,
        memo: "",
      });
      setEditedAmount("");
      setEditedMemo("");
    }

    setIsDialogOpen(true);
  }

  const hasChanges = useMemo(() => {
    if (!selectedSale) return false;

    const currentAmount = Number(String(editedAmount).replaceAll(",", ""));

    // 신규 데이터일 경우
    if (!selectedSale.id) {
      return currentAmount > 0 || editedMemo !== "";
    }

    // 수정 데이터일 경우
    const amountChanged = selectedSale.amount !== currentAmount;
    const memoChanged = (selectedSale.memo || "") !== editedMemo;

    return amountChanged || memoChanged;
  }, [selectedSale, editedAmount, editedMemo]);

  async function handleSaveChanges() {
    if (!selectedSale) return;

    try {
      const saleToSave: Sale = {
        ...selectedSale,
        amount: Number(String(editedAmount).replaceAll(",", "")),
        memo: editedMemo,
      };

      const savedId = await db.sales.put(saleToSave);

      // id 유무로 신규/수정 구분
      if (selectedSale.id) {
        // 수정
        setSales((prevSales) =>
          prevSales.map((sale) =>
            sale.id === savedId ? { ...saleToSave, id: savedId } : sale
          )
        );
      } else {
        // 신규
        setSales((prevSales) => [...prevSales, { ...saleToSave, id: savedId }]);
      }

      setIsDialogOpen(false);
      console.log("데이터가 저장되었습니다. ID:", savedId);
    } catch (error) {
      console.error("데이터 저장 실패:", error);
    }
  }

  async function handleDelete() {
    if (!selectedSale || !selectedSale.id) return;

    if (!window.confirm("매출 기록을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await db.sales.delete(selectedSale.id);
      setSales((prevSales) =>
        prevSales.filter((sale) => sale.id !== selectedSale.id)
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error("데이터 삭제 실패:", error);
    }
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
                    {/* 숫자 원화 형식 */}
                    {amount.toLocaleString("ko-KR")}
                  </span>
                ) : (
                  <span className="text-xs">&nbsp;</span>
                )}
              </CalendarDayButton>
            );
          },
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">매출액</Label>
              <CurrencyInput
                value={editedAmount}
                onValueChange={setEditedAmount}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memo">메모</Label>
              <Input
                id="memo"
                placeholder="메모를 입력하세요."
                value={editedMemo}
                onChange={(e) => setEditedMemo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="destructive"
              className="mr-auto"
              onClick={handleDelete}
              disabled={!selectedSale?.id}
            >
              삭제
            </Button>

            <DialogClose asChild>
              <Button type="button" variant="outline">
                닫기
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={!hasChanges}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
