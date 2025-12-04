"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiInboxLine, RiArrowRightLine } from "@remixicon/react";
import Link from "next/link";

interface Props {
  count: number;
}

export function PendingTransactionsWidget({ count }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiInboxLine className="size-4" />
          Transações Pendentes
          {count > 0 && <Badge variant="destructive">{count}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma transação pendente para processar
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-muted-foreground">
              {count === 1
                ? "notificação aguardando revisão"
                : "notificações aguardando revisão"}
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/transacoes-pendentes">
                Ver todas
                <RiArrowRightLine className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
