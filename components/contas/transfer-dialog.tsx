"use client";

import { transferBetweenAccountsAction } from "@/app/(dashboard)/contas/actions";
import type { AccountData } from "@/app/(dashboard)/contas/data";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useControlledState } from "@/hooks/use-controlled-state";
import { formatDateForDb } from "@/lib/utils/date";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

interface TransferDialogProps {
  trigger?: React.ReactNode;
  accounts: AccountData[];
  fromAccountId: string;
  currentPeriod: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransferDialog({
  trigger,
  accounts,
  fromAccountId,
  currentPeriod,
  open,
  onOpenChange,
}: TransferDialogProps) {
  const [dialogOpen, setDialogOpen] = useControlledState(
    open,
    false,
    onOpenChange
  );

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateForDb(new Date()));
  const [period, setPeriod] = useState(currentPeriod);

  // Available destination accounts (exclude source account)
  const availableAccounts = useMemo(
    () => accounts.filter((account) => account.id !== fromAccountId),
    [accounts, fromAccountId]
  );

  // Source account info
  const fromAccount = useMemo(
    () => accounts.find((account) => account.id === fromAccountId),
    [accounts, fromAccountId]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!toAccountId) {
      setErrorMessage("Selecione a conta de destino.");
      return;
    }

    if (toAccountId === fromAccountId) {
      setErrorMessage("Selecione uma conta de destino diferente da origem.");
      return;
    }

    if (!amount || parseFloat(amount.replace(",", ".")) <= 0) {
      setErrorMessage("Informe um valor válido maior que zero.");
      return;
    }

    startTransition(async () => {
      const result = await transferBetweenAccountsAction({
        fromAccountId,
        toAccountId,
        amount,
        date: new Date(date),
        period,
      });

      if (result.success) {
        toast.success(result.message);
        setDialogOpen(false);
        // Reset form
        setToAccountId("");
        setAmount("");
        setDate(formatDateForDb(new Date()));
        setPeriod(currentPeriod);
        return;
      }

      setErrorMessage(result.error);
      toast.error(result.error);
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transferir entre contas</DialogTitle>
          <DialogDescription>
            Registre uma transferência de valores entre suas contas.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-date" required>
                Data da transferência
              </Label>
              <Input
                id="transfer-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-period" required>
                Período
              </Label>
              <Input
                id="transfer-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="AAAA-MM"
                required
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="transfer-amount" required>
                Valor
              </Label>
              <CurrencyInput
                id="transfer-amount"
                value={amount}
                onValueChange={setAmount}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="from-account">Conta de origem</Label>
              <Input
                id="from-account"
                value={fromAccount?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="to-account">Conta de destino</Label>
              {availableAccounts.length === 0 ? (
                <div className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                  É necessário ter mais de uma conta cadastrada para realizar
                  transferências.
                </div>
              ) : (
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger id="to-account" className="w-full">
                    <SelectValue placeholder="Selecione a conta de destino" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {availableAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.accountType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || availableAccounts.length === 0}
            >
              {isPending ? "Processando..." : "Confirmar transferência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
