"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CardDetailData } from "@/lib/relatorios/cartoes-report";
import { title_font } from "@/public/fonts/font_index";
import { RiBankCard2Fill } from "@remixicon/react";

type CardInvoiceStatusProps = {
  data: CardDetailData["invoiceStatus"];
};

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function CardInvoiceStatus({ data }: CardInvoiceStatusProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pago":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900"
          >
            Pago
          </Badge>
        );
      case "pendente":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900"
          >
            Pendente
          </Badge>
        );
      case "atrasado":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900"
          >
            Atrasado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            —
          </Badge>
        );
    }
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split("-");
    return `${monthLabels[parseInt(month, 10) - 1]}/${year.slice(2)}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle
          className={`${title_font.className} flex items-center gap-1.5 text-base`}
        >
          <RiBankCard2Fill className="size-4 text-primary" />
          Status das Faturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...data].reverse().map((invoice) => (
            <div
              key={invoice.period}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">
                  {formatPeriod(invoice.period)}
                </span>
                {getStatusBadge(invoice.status)}
              </div>
              <span className="text-sm font-bold">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
