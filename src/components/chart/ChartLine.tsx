"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bold, Italic, Underline } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Sale } from "@/types";
import { aggregateSalesByMonth } from "@/utils/aggregateSablesByMonth";

export const description = "A line chart with a label";

const chartConfig = {
  sales: {
    label: "매출",
    color: "#8884d8",
  },
} satisfies ChartConfig;

export function ChartLine() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<Sale[]>([]);
  const [chartType, setChartType] = useState<"주간" | "월간" | "연간">("월간");

  useEffect(() => {
    // 샘플 매출 데이터 불러오기
    fetch("/sample-sales.json")
      .then((response) => response.json())
      .then((data: Sale[]) => {
        const formattedData = data.map((sale: any) => ({
          ...sale,
          date: new Date(sale.date),
        }));
        setSales(formattedData);
      })
      .catch((error) => {
        console.error("데이터 불러오기 실패", error);
      });
  }, []);

  const chartDataFor2025 = aggregateSalesByMonth(sales, 2025);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          매출 차트
          <ToggleGroup
            type="single"
            size="lg"
            defaultValue="월간"
            onValueChange={(value) =>
              setChartType(value as "주간" | "월간" | "연간")
            }
          >
            <ToggleGroupItem value="주간" aria-label="주간">
              주간
            </ToggleGroupItem>
            <ToggleGroupItem value="월간" aria-label="월간">
              월간
            </ToggleGroupItem>
            <ToggleGroupItem value="연간" aria-label="연간">
              연간
            </ToggleGroupItem>
          </ToggleGroup>
        </CardTitle>
        <CardDescription>
          <div>{new Date().getFullYear()}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="total"
              type="natural"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{
                fill: "#8884d8",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}

export default ChartLine;
