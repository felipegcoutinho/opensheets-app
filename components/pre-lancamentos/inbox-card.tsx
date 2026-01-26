"use client";

import MoneyValues from "@/components/money-values";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/ui";
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiMoreLine,
} from "@remixicon/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InboxItem } from "./types";

interface InboxCardProps {
  item: InboxItem;
  onProcess: (item: InboxItem) => void;
  onDiscard: (item: InboxItem) => void;
  onViewDetails: (item: InboxItem) => void;
}

export function InboxCard({
  item,
  onProcess,
  onDiscard,
  onViewDetails,
}: InboxCardProps) {
  const amount = item.parsedAmount ? parseFloat(item.parsedAmount) : null;
  const isReceita = item.parsedTransactionType === "Receita";

  // O timestamp vem do app Android em horário local mas salvo como UTC
  // Precisamos interpretar o valor UTC como se fosse horário de Brasília
  const rawDate = new Date(item.notificationTimestamp);

  // Ajusta adicionando o offset de Brasília (3 horas) para corrigir o cálculo do "há X tempo"
  const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
  const notificationDate = new Date(rawDate.getTime() + BRASILIA_OFFSET_MS);

  const timeAgo = formatDistanceToNow(notificationDate, {
    addSuffix: true,
    locale: ptBR,
  });

  // Para exibição, usa UTC pois o valor já representa horário de Brasília
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(rawDate);

  return (
    <Card className="flex flex-col gap-0 py-0 h-54">
      {/* Header com app e valor */}
      <CardHeader className="pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">
            {item.sourceAppName || item.sourceApp}
            {"  "}
            <span className="text-xs font-normal text-muted-foreground">
              {timeAgo}
            </span>
          </CardTitle>
          {amount !== null && (
            <MoneyValues
              amount={isReceita ? amount : -amount}
              showPositiveSign={isReceita}
              className={cn(
                "text-sm",
                isReceita
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground"
              )}
            />
          )}
        </div>

        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 -mr-2 -mt-1"
              >
                <RiMoreLine className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(item)}>
                <RiEyeLine className="mr-2 size-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onProcess(item)}>
                <RiCheckLine className="mr-2 size-4" />
                Processar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDiscard(item)}
                className="text-destructive"
              >
                <RiDeleteBinLine className="mr-2 size-4" />
                Descartar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      {/* Conteúdo da notificação */}
      <CardContent className="flex-1 py-2">
        {item.originalTitle && (
          <p className="mb-1 text-sm font-bold">{item.originalTitle}</p>
        )}
        <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">
          {item.originalText}
        </p>
      </CardContent>

      {/* Botões de ação */}
      <CardFooter className="gap-2 pt-3 pb-4">
        <Button size="sm" className="flex-1" onClick={() => onProcess(item)}>
          <RiCheckLine className="mr-1.5 size-4" />
          Processar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDiscard(item)}
          className="text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          <RiDeleteBinLine className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
