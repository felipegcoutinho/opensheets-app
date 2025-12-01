"use client";
import { updateInvoicePaymentStatusAction } from "@/app/(dashboard)/cartoes/[cartaoId]/fatura/actions";
import MoneyValues from "@/components/money-values";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter as ModalFooter,
} from "@/components/ui/dialog";
import type { DashboardInvoice } from "@/lib/dashboard/invoices";
import { INVOICE_PAYMENT_STATUS, INVOICE_STATUS_LABEL } from "@/lib/faturas";
import { getAvatarSrc } from "@/lib/pagadores/utils";
import { formatPeriodForUrl } from "@/lib/utils/period";
import {
  RiBillLine,
  RiCheckboxCircleFill,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
  RiLoader4Line,
} from "@remixicon/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { WidgetEmptyState } from "../widget-empty-state";

type InvoicesWidgetProps = {
  invoices: DashboardInvoice[];
};

type ModalState = "idle" | "processing" | "success";

const DUE_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const resolveLogoPath = (logo: string | null) => {
  if (!logo) {
    return null;
  }
  if (/^(https?:\/\/|data:)/.test(logo)) {
    return logo;
  }
  return logo.startsWith("/") ? logo : `/logos/${logo}`;
};

const buildInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CC";
  }
  if (parts.length === 1) {
    const firstPart = parts[0];
    return firstPart ? firstPart.slice(0, 2).toUpperCase() : "CC";
  }
  const firstChar = parts[0]?.[0] ?? "";
  const secondChar = parts[1]?.[0] ?? "";
  return `${firstChar}${secondChar}`.toUpperCase() || "CC";
};

const parseDueDate = (period: string, dueDay: string) => {
  const [yearStr, monthStr] = period.split("-");
  const dayNumber = Number.parseInt(dueDay, 10);
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);

  if (
    Number.isNaN(dayNumber) ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    period.length !== 7
  ) {
    return {
      label: `Vence dia ${dueDay}`,
    };
  }

  const date = new Date(Date.UTC(year, month - 1, dayNumber));
  return {
    label: `Vence em ${DUE_DATE_FORMATTER.format(date)}`,
  };
};

const formatPaymentDate = (value: string | null) => {
  if (!value) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  const day = Number.parseInt(dayStr ?? "", 10);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    yearStr?.length !== 4 ||
    monthStr?.length !== 2 ||
    dayStr?.length !== 2
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    label: `Pago em ${DUE_DATE_FORMATTER.format(date)}`,
  };
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatSharePercentage = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0%";
  }
  const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
  return (
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + "%"
  );
};

const getShareLabel = (amount: number, total: number) => {
  if (total <= 0) {
    return "0% do total";
  }
  const percentage = (amount / total) * 100;
  return `${formatSharePercentage(percentage)} do total`;
};

export function InvoicesWidget({ invoices }: InvoicesWidgetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(invoices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>("idle");

  useEffect(() => {
    setItems(invoices);
  }, [invoices]);

  const selectedInvoice = useMemo(
    () => items.find((invoice) => invoice.id === selectedId) ?? null,
    [items, selectedId]
  );

  const selectedLogo = useMemo(
    () => (selectedInvoice ? resolveLogoPath(selectedInvoice.logo) : null),
    [selectedInvoice]
  );

  const selectedPaymentInfo = useMemo(
    () => (selectedInvoice ? formatPaymentDate(selectedInvoice.paidAt) : null),
    [selectedInvoice]
  );

  const handleOpenModal = (invoiceId: string) => {
    setSelectedId(invoiceId);
    setModalState("idle");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalState("idle");
    setSelectedId(null);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) {
      return;
    }

    setModalState("processing");

    startTransition(async () => {
      const result = await updateInvoicePaymentStatusAction({
        cartaoId: selectedInvoice.cardId,
        period: selectedInvoice.period,
        status: INVOICE_PAYMENT_STATUS.PAID,
      });

      if (result.success) {
        toast.success(result.message);
        setItems((previous) =>
          previous.map((invoice) =>
            invoice.id === selectedInvoice.id
              ? {
                  ...invoice,
                  paymentStatus: INVOICE_PAYMENT_STATUS.PAID,
                  paidAt: getTodayDateString(),
                }
              : invoice
          )
        );
        setModalState("success");
        router.refresh();
        return;
      }

      toast.error(result.error);
      setModalState("idle");
    });
  };

  const getStatusBadgeVariant = (status: string): "success" | "info" => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "em aberto") {
      return "info";
    }
    return "success";
  };

  return (
    <>
      <CardContent className="flex flex-col gap-4 px-0">
        {items.length === 0 ? (
          <WidgetEmptyState
            icon={<RiBillLine className="size-6 text-muted-foreground" />}
            title="Nenhuma fatura para o período selecionado"
            description="Quando houver cartões com compras registradas, eles aparecerão aqui."
          />
        ) : (
          <ul className="flex flex-col">
            {items.map((invoice) => {
              const logo = resolveLogoPath(invoice.logo);
              const initials = buildInitials(invoice.cardName);
              const dueInfo = parseDueDate(invoice.period, invoice.dueDay);
              const isPaid =
                invoice.paymentStatus === INVOICE_PAYMENT_STATUS.PAID;
              const paymentInfo = formatPaymentDate(invoice.paidAt);

              return (
                <li
                  key={invoice.id}
                  className="flex items-center justify-between border-b border-dashed last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 py-2">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      {logo ? (
                        <Image
                          src={logo}
                          alt={`Logo do cartão ${invoice.cardName}`}
                          width={44}
                          height={44}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      {(() => {
                        const breakdown = invoice.pagadorBreakdown ?? [];
                        const hasBreakdown = breakdown.length > 0;
                        const linkNode = (
                          <Link
                            prefetch
                            href={`/cartoes/${
                              invoice.cardId
                            }/fatura?periodo=${formatPeriodForUrl(
                              invoice.period
                            )}`}
                            className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                          >
                            <span className="truncate">{invoice.cardName}</span>
                            <RiExternalLinkLine
                              className="size-3 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                          </Link>
                        );

                        if (!hasBreakdown) {
                          return linkNode;
                        }

                        const totalForShare = Math.abs(invoice.totalAmount);

                        return (
                          <HoverCard openDelay={150}>
                            <HoverCardTrigger asChild>
                              {linkNode}
                            </HoverCardTrigger>
                            <HoverCardContent
                              align="start"
                              className="w-72 space-y-3"
                            >
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Distribuição por pagador
                              </p>
                              <ul className="space-y-2">
                                {breakdown.map((share, index) => (
                                  <li
                                    key={`${invoice.id}-${
                                      share.pagadorId ??
                                      share.pagadorName ??
                                      index
                                    }`}
                                    className="flex items-center gap-3"
                                  >
                                    <Avatar className="size-9">
                                      <AvatarImage
                                        src={getAvatarSrc(share.pagadorAvatar)}
                                        alt={`Avatar de ${share.pagadorName}`}
                                      />
                                      <AvatarFallback>
                                        {buildInitials(share.pagadorName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {share.pagadorName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {getShareLabel(
                                          share.amount,
                                          totalForShare
                                        )}
                                      </p>
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                      <MoneyValues amount={share.amount} />
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })()}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {!isPaid ? <span>{dueInfo.label}</span> : null}
                        {isPaid && paymentInfo ? (
                          <span className="text-green-600 dark:text-green-400">
                            {paymentInfo.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end">
                    <MoneyValues amount={Math.abs(invoice.totalAmount)} />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPaid}
                        onClick={() => handleOpenModal(invoice.id)}
                        variant={"link"}
                        className="p-0 h-auto disabled:opacity-100"
                      >
                        {isPaid ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <RiCheckboxCircleFill className="size-3" /> Pago
                          </span>
                        ) : (
                          <span>Pagar</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
            return;
          }
          setIsModalOpen(true);
        }}
      >
        <DialogContent
          className="max-w-md"
          onEscapeKeyDown={(event) => {
            if (modalState === "processing") {
              event.preventDefault();
              return;
            }
            handleCloseModal();
          }}
          onPointerDownOutside={(event) => {
            if (modalState === "processing") {
              event.preventDefault();
            }
          }}
        >
          {modalState === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <RiCheckboxCircleLine className="size-8" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-base">
                  Pagamento confirmado!
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Atualizamos o status da fatura. O lançamento do pagamento
                  aparecerá no extrato em instantes.
                </DialogDescription>
              </div>
              <ModalFooter className="sm:justify-center">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  className="sm:w-auto"
                >
                  Fechar
                </Button>
              </ModalFooter>
            </div>
          ) : (
            <>
              <DialogHeader className="gap-3">
                <DialogTitle>Confirmar pagamento</DialogTitle>
                <DialogDescription>
                  Revise os dados antes de confirmar. Vamos registrar a fatura
                  como paga.
                </DialogDescription>
              </DialogHeader>

              {selectedInvoice ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/50 p-3">
                    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-background">
                      {selectedLogo ? (
                        <Image
                          src={selectedLogo}
                          alt={`Logo do cartão ${selectedInvoice.cardName}`}
                          width={48}
                          height={48}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          {buildInitials(selectedInvoice.cardName)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cartão</p>
                      <p className="text-base font-semibold text-foreground">
                        {selectedInvoice.cardName}
                      </p>
                      {selectedInvoice.paymentStatus !==
                      INVOICE_PAYMENT_STATUS.PAID ? (
                        <p className="text-xs text-muted-foreground">
                          {
                            parseDueDate(
                              selectedInvoice.period,
                              selectedInvoice.dueDay
                            ).label
                          }
                        </p>
                      ) : null}
                      {selectedInvoice.paymentStatus ===
                        INVOICE_PAYMENT_STATUS.PAID && selectedPaymentInfo ? (
                        <p className="text-xs text-emerald-600">
                          {selectedPaymentInfo.label}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-1">
                    <div className="rounded border border-border/60 px-3 items-center py-2 flex justify-between">
                      <span className="text-xs uppercase text-muted-foreground/80">
                        Valor da fatura
                      </span>
                      <MoneyValues
                        amount={Math.abs(selectedInvoice.totalAmount)}
                        className="text-lg"
                      />
                    </div>
                    <div className="rounded border border-border/60 px-3 py-2 flex justify-between items-center">
                      <span className="text-xs uppercase text-muted-foreground/80">
                        Status atual
                      </span>
                      <span className="block text-sm">
                        <Badge
                          variant={getStatusBadgeVariant(
                            INVOICE_STATUS_LABEL[selectedInvoice.paymentStatus]
                          )}
                          className="text-xs"
                        >
                          {INVOICE_STATUS_LABEL[selectedInvoice.paymentStatus]}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <ModalFooter className="sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={modalState === "processing"}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={modalState === "processing" || isPending}
                  className="relative"
                >
                  {modalState === "processing" || isPending ? (
                    <>
                      <RiLoader4Line className="mr-1.5 size-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar pagamento"
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
