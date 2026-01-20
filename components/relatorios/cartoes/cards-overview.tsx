"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CartoesReportData } from "@/lib/relatorios/cartoes-report";
import { cn } from "@/lib/utils";
import { title_font } from "@/public/fonts/font_index";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiBankCard2Line,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type CardsOverviewProps = {
  data: CartoesReportData;
};

const BRAND_ASSETS: Record<string, string> = {
  visa: "/bandeiras/visa.svg",
  mastercard: "/bandeiras/mastercard.svg",
  amex: "/bandeiras/amex.svg",
  american: "/bandeiras/amex.svg",
  elo: "/bandeiras/elo.svg",
  hipercard: "/bandeiras/hipercard.svg",
  hiper: "/bandeiras/hipercard.svg",
};

const resolveBrandAsset = (brand: string | null) => {
  if (!brand) return null;
  const normalized = brand.trim().toLowerCase();
  const match = (
    Object.keys(BRAND_ASSETS) as Array<keyof typeof BRAND_ASSETS>
  ).find((entry) => normalized.includes(entry));
  return match ? BRAND_ASSETS[match] : null;
};

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

export function CardsOverview({ data }: CardsOverviewProps) {
  const searchParams = useSearchParams();
  const periodoParam = searchParams.get("periodo");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const buildUrl = (cardId: string) => {
    const params = new URLSearchParams();
    if (periodoParam) params.set("periodo", periodoParam);
    params.set("cartao", cardId);
    return `/relatorios/cartoes?${params.toString()}`;
  };

  if (data.cards.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <RiBankCard2Line className="size-4" />
            Resumo dos Cartões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <RiBankCard2Line className="size-8 mb-2" />
            <p className="text-sm">Nenhum cartão ativo encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle
          className={`${title_font.className} flex items-center gap-1.5 text-base`}
        >
          <RiBankCard2Line className="size-4 text-primary" />
          Resumo dos Cartões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">Limite Total</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.totalLimit)}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">Uso Total</p>
            <p className="text-lg font-semibold">
              {formatCurrency(data.totalUsage)}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">Utilização</p>
            <p className="text-lg font-semibold">
              {data.totalUsagePercent.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {data.cards.map((card) => {
            const logoPath = resolveLogoPath(card.logo);
            const brandAsset = resolveBrandAsset(card.brand);

            return (
              <Link
                key={card.id}
                href={buildUrl(card.id)}
                className={cn(
                  "flex flex-col py-2 border-b border-dashed last:border-0 transition-colors hover:bg-muted/50",
                  data.selectedCard?.card.id === card.id && "bg-muted/30",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {/* Logo container - size-10 like expenses-by-category */}
                    <div className="flex size-10 shrink-0 items-center justify-center">
                      {logoPath ? (
                        <Image
                          src={logoPath}
                          alt={`Logo ${card.name}`}
                          width={28}
                          height={28}
                          className="rounded object-contain"
                        />
                      ) : (
                        <RiBankCard2Line className="size-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Name and brand */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {card.name}
                        </span>
                        {brandAsset && (
                          <Image
                            src={brandAsset}
                            alt={`Bandeira ${card.brand}`}
                            width={24}
                            height={16}
                            className="h-2.5 w-auto shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatCurrency(card.currentUsage)} /{" "}
                          {formatCurrency(card.limit)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trend and percentage */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm font-medium">
                      {card.usagePercent.toFixed(0)}%
                    </span>
                    <div className="flex items-center gap-1">
                      {card.trend === "up" && (
                        <RiArrowUpLine className="size-3 text-red-500" />
                      )}
                      {card.trend === "down" && (
                        <RiArrowDownLine className="size-3 text-green-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          card.trend === "up" && "text-red-500",
                          card.trend === "down" && "text-green-500",
                          card.trend === "stable" && "text-muted-foreground",
                        )}
                      >
                        {card.changePercent > 0 ? "+" : ""}
                        {card.changePercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar - aligned with content */}
                <div className="ml-12 mt-1.5">
                  <Progress
                    value={Math.min(card.usagePercent, 100)}
                    className={cn(
                      "h-1.5",
                      `[&>div]:${getUsageColor(card.usagePercent)}`,
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
