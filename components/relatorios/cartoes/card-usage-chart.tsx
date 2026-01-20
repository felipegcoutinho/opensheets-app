"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";
import { cn } from "@/lib/utils";
import { RiBankCard2Line } from "@remixicon/react";
import Image from "next/image";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

type CardUsageChartProps = {
  data: CardDetailData["monthlyUsage"];
  limit: number;
  card: {
    name: string;
    logo: string | null;
  };
};

const chartConfig = {
  amount: {
    label: "Uso",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

type PeriodFilter = "3" | "6" | "12";

const filterOptions: { value: PeriodFilter; label: string }[] = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
];

const resolveLogoPath = (logo: string | null) => {
  if (!logo) return null;
  if (
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("data:")
  ) {
    return logo;
  }
  return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

export function CardUsageChart({ data, limit, card }: CardUsageChartProps) {
  const [period, setPeriod] = useState<PeriodFilter>("6");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(value);
    }
    return formatCurrency(value);
  };

  // Filter data based on selected period
  const filteredData = data.slice(-Number(period));

  const chartData = filteredData.map((item) => ({
    month: item.periodLabel,
    amount: item.amount,
  }));

  const logoPath = resolveLogoPath(card.logo);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Card logo and name on the left */}
          <div className="flex items-center gap-2">
            {logoPath ? (
              <div className="flex size-10 shrink-0 items-center justify-center">
                <Image
                  src={logoPath}
                  alt={`Logo ${card.name}`}
                  width={32}
                  height={32}
                  className="rounded object-contain"
                />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center">
                <RiBankCard2Line className="size-5 text-muted-foreground" />
              </div>
            )}
            <span className="text-base font-semibold">{card.name}</span>
          </div>

          {/* Filters on the right */}
          <div className="flex items-center gap-1">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "h-7 text-xs",
                  period === option.value && "pointer-events-none",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              tickFormatter={formatCurrencyCompact}
            />
            {limit > 0 && (
              <ReferenceLine
                y={limit}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: "Limite",
                  position: "right",
                  className: "text-xs fill-red-500",
                }}
              />
            )}
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }

                const data = payload[0].payload;
                const value = data.amount as number;
                const usagePercent = limit > 0 ? (value / limit) * 100 : 0;

                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">
                      {data.month}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Uso
                        </span>
                        <span className="text-xs font-medium tabular-nums">
                          {formatCurrency(value)}
                        </span>
                      </div>
                      {limit > 0 && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-muted-foreground">
                            % do Limite
                          </span>
                          <span className="text-xs font-medium tabular-nums">
                            {usagePercent.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Bar
              dataKey="amount"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
