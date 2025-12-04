"use client";

import {
  excluirTransacaoPendente,
  ignorarTransacaoPendente,
} from "@/app/(dashboard)/transacoes-pendentes/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/lancamentos/formatting-helpers";
import type { TransacaoPendenteComRelacoes } from "@/lib/transacoes-pendentes/fetch-data";
import { RiCloseLine, RiDeleteBinLine } from "@remixicon/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTransition } from "react";
import { toast } from "sonner";
import { ProcessarDialog } from "./processar-dialog";

interface Props {
  transacao: TransacaoPendenteComRelacoes;
  contas?: any[];
  cartoes?: any[];
  categorias?: any[];
  pagadores?: any[];
}

export function TransacaoCard({
  transacao,
  contas,
  cartoes,
  categorias,
  pagadores,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleIgnorar = () => {
    startTransition(async () => {
      const result = await ignorarTransacaoPendente(transacao.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleExcluir = () => {
    startTransition(async () => {
      const result = await excluirTransacaoPendente(transacao.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {transacao.estabelecimento || transacao.appName}
              </h3>
              <Badge
                variant={
                  transacao.status === "pendente"
                    ? "default"
                    : transacao.status === "processado"
                    ? "success"
                    : "secondary"
                }
              >
                {transacao.status}
              </Badge>
            </div>
            {transacao.valor && (
              <p className="text-2xl font-bold">
                {formatCurrency(Number(transacao.valor))}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {format(new Date(transacao.createdAt), "PPp", { locale: ptBR })}
            </p>
          </div>

          {transacao.status === "pendente" && (
            <div className="flex flex-wrap gap-2">
              <ProcessarDialog
                transacao={transacao}
                contas={contas || []}
                cartoes={cartoes || []}
                categorias={categorias || []}
                pagadores={pagadores || []}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleIgnorar}
                disabled={isPending}
              >
                <RiCloseLine className="mr-1 size-4" />
                Ignorar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={isPending}>
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta transação pendente?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExcluir}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="border-0">
            <AccordionTrigger>Detalhes da notificação</AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <div>
                <strong>App:</strong> {transacao.appName}
              </div>
              <div>
                <strong>Package:</strong>{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {transacao.appPackageName}
                </code>
              </div>
              {transacao.notificationTitle && (
                <div>
                  <strong>Título:</strong> {transacao.notificationTitle}
                </div>
              )}
              <div>
                <strong>Texto:</strong>
                <p className="mt-1 whitespace-pre-wrap rounded bg-muted p-2">
                  {transacao.notificationText}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
