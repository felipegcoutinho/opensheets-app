"use client";
import {
  createPagadorAction,
  updatePagadorAction,
} from "@/app/(dashboard)/pagadores/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useControlledState } from "@/hooks/use-controlled-state";
import { useFormState } from "@/hooks/use-form-state";
import {
  DEFAULT_PAGADOR_AVATAR,
  PAGADOR_STATUS_OPTIONS,
  type PagadorStatus,
} from "@/lib/pagadores/constants";
import { RiCheckLine, RiCloseCircleLine } from "@remixicon/react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { StatusSelectContent } from "./pagador-select-items";

import { getAvatarSrc } from "@/lib/pagadores/utils";
import type { Pagador, PagadorFormValues } from "./types";

interface PagadorDialogProps {
  mode: "create" | "update";
  trigger?: React.ReactNode;
  pagador?: Pagador;
  avatarOptions: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const buildInitialValues = ({
  pagador,
  avatarOptions,
}: {
  pagador?: Pagador;
  avatarOptions: string[];
}): PagadorFormValues => {
  const defaultAvatar = avatarOptions[0] ?? DEFAULT_PAGADOR_AVATAR;

  return {
    name: pagador?.name ?? "",
    email: pagador?.email ?? "",
    status: (pagador?.status as PagadorStatus) ?? PAGADOR_STATUS_OPTIONS[0],
    avatarUrl: pagador?.avatarUrl ?? defaultAvatar,
    note: pagador?.note ?? "",
    isAutoSend: pagador?.isAutoSend ?? false,
  };
};

export function PagadorDialog({
  mode,
  trigger,
  pagador,
  avatarOptions,
  open,
  onOpenChange,
}: PagadorDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Use controlled state hook for dialog open state
  const [dialogOpen, setDialogOpen] = useControlledState(
    open,
    false,
    onOpenChange
  );

  const initialState = useMemo(
    () => buildInitialValues({ pagador, avatarOptions }),
    [pagador, avatarOptions]
  );

  // Use form state hook for form management
  const { formState, updateField, setFormState } =
    useFormState<PagadorFormValues>(initialState);

  const availableAvatars = useMemo(() => {
    const set = new Set<string>();
    avatarOptions.forEach((avatar) => set.add(avatar));
    set.add(initialState.avatarUrl);
    set.add(DEFAULT_PAGADOR_AVATAR);
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    );
  }, [avatarOptions, initialState.avatarUrl]);

  // Reset form when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setFormState(initialState);
      setErrorMessage(null);
    }
  }, [dialogOpen, initialState, setFormState]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);

      if (mode === "update" && !pagador?.id) {
        const message = "Pagador inválido.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      const payload: {
        name: string;
        email?: string;
        status: PagadorStatus;
        avatarUrl: string;
        note: string;
        isAutoSend: boolean;
      } = {
        name: formState.name.trim(),
        status: formState.status,
        avatarUrl: formState.avatarUrl,
        note: formState.note.trim(),
        isAutoSend: formState.isAutoSend,
      };

      const emailValue = formState.email.trim();
      if (emailValue.length > 0) {
        payload.email = emailValue;
      }

      startTransition(async () => {
        const result =
          mode === "create"
            ? await createPagadorAction(payload)
            : await updatePagadorAction({
                id: pagador?.id ?? "",
                ...payload,
              });

        if (result.success) {
          toast.success(result.message);
          setDialogOpen(false);
          setFormState(initialState);
          return;
        }

        setErrorMessage(result.error);
        toast.error(result.error);
      });
    },
    [formState, initialState, mode, pagador?.id, setDialogOpen, setFormState]
  );

  const title = mode === "create" ? "Novo pagador" : "Editar pagador";
  const description =
    mode === "create"
      ? "Selecione um avatar e informe os detalhes para criar um novo pagador."
      : "Atualize os detalhes do pagador selecionado.";
  const submitLabel =
    mode === "create" ? "Salvar pagador" : "Atualizar pagador";

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl px-6 py-5 sm:px-8 sm:py-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <fieldset className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex w-full gap-2">
                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="pagador-name" required>
                    Nome
                  </Label>
                  <Input
                    id="pagador-name"
                    value={formState.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Ex.: Felipe Coutinho"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <Label htmlFor="pagador-email">E-mail</Label>
                  <Input
                    id="pagador-email"
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="Ex.: felipe@email.com"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pagador-status">Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value: PagadorStatus) =>
                    updateField("status", value)
                  }
                >
                  <SelectTrigger id="pagador-status" className="w-full">
                    <SelectValue placeholder="Selecione o status">
                      {formState.status && (
                        <StatusSelectContent label={formState.status} />
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAGADOR_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        <StatusSelectContent label={status} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <fieldset className="flex flex-col gap-3">
                <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                  <Checkbox
                    id="pagador-auto-send"
                    checked={formState.isAutoSend}
                    onCheckedChange={(checked) =>
                      updateField("isAutoSend", Boolean(checked))
                    }
                    aria-label="Ativar envio automático"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="pagador-auto-send"
                      className="text-sm font-medium text-foreground"
                    >
                      Enviar automaticamente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dispare cobranças e lembretes sem intervenção manual.
                    </p>
                  </div>
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {availableAvatars.length === 0 ? (
                    <div className="col-span-5 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
                      <RiCloseCircleLine className="size-6" />
                      Nenhum avatar disponível. Adicione imagens em
                      <span className="font-mono text-xs">public/avatares</span>
                      .
                    </div>
                  ) : null}
                  {availableAvatars.map((avatar) => {
                    const isSelected = avatar === formState.avatarUrl;
                    return (
                      <button
                        type="button"
                        key={avatar}
                        onClick={() => updateField("avatarUrl", avatar)}
                        className="group relative flex items-center justify-center overflow-hidden rounded-xl border border-border/70 p-2 transition-all hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 data-[selected=true]:border-primary data-[selected=true]:bg-primary/10"
                        data-selected={isSelected}
                        aria-pressed={isSelected}
                      >
                        <span className="absolute inset-0 rounded-xl border-2 border-primary/80 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                        {isSelected ? (
                          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-sidebar-foreground text-primary-foreground shadow-sm">
                            <RiCheckLine className="size-3.5" />
                          </span>
                        ) : null}
                        <Image
                          src={getAvatarSrc(avatar)}
                          alt={`Avatar ${avatar}`}
                          width={72}
                          height={72}
                          className="size-12 rounded-lg object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <Label htmlFor="pagador-note">Anotações</Label>
                <Textarea
                  id="pagador-note"
                  rows={2}
                  value={formState.note}
                  onChange={(event) => updateField("note", event.target.value)}
                  placeholder="Observações, preferências ou detalhes relevantes sobre este pagador"
                />
              </div>
            </div>
          </fieldset>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
