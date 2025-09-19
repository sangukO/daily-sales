"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

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
import type { Sale } from "@/types";
import { Dropdown } from "react-day-picker";

export const description = "A line chart with a label";

const chartConfig = {
  sales: {
    label: "매출",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartLine() {
  const [chartData, setChartData] = useState<Sale[]>([]);
  const [chartType, setChartType] = useState<"주간" | "월간" | "연간">("월간");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          매출 차트{" "}
          <Dropdown
            options={[
              { value: 0, label: "주간", disabled: false },
              { value: 1, label: "월간", disabled: false },
              { value: 2, label: "연간", disabled: false },
            ]}
            value={chartType}
            on={(option) => setChartType(option.value)}
          />
        </CardTitle>
        <CardDescription>
          <div>January - June 2024</div>
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
              dataKey="desktop"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
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
