"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { RiCheckLine } from "@remixicon/react";
import { processarTransacaoPendente } from "@/app/(dashboard)/transacoes-pendentes/actions";
import {
  suggestCategoryForEstablishment,
  suggestConta,
  suggestCartao,
} from "@/lib/transacoes-pendentes/auto-suggest";
import type { TransacaoPendenteComRelacoes } from "@/lib/transacoes-pendentes/fetch-data";
import { getUserId } from "@/lib/auth/server";

interface Props {
  transacao: TransacaoPendenteComRelacoes;
  contas: any[];
  cartoes: any[];
  categorias: any[];
  pagadores: any[];
}

export function ProcessarDialog({
  transacao,
  contas,
  cartoes,
  categorias,
  pagadores,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formState, setFormState] = useState({
    descricaoEditada:
      transacao.estabelecimento ||
      transacao.notificationText.slice(0, 100),
    valor: transacao.valor?.toString() || "",
    data: new Date().toISOString().split("T")[0],
    categoriaId: "",
    formaPagamento:
      transacao.tipoTransacao === "credito" ? "cartao" : "conta",
    contaId: "",
    cartaoId: "",
    pagadorId: "",
    observacoes: "",
  });

  // Auto-sugestão ao abrir dialog
  useEffect(() => {
    if (open && transacao.estabelecimento) {
      // Usar server action inline para buscar sugestões
      const loadSuggestions = async () => {
        try {
          // Nota: Essas funções são server-side, precisamos chamar de forma diferente
          // Por enquanto vamos deixar vazio, o usuário seleciona manualmente
          // Em produção, criar uma server action específica para auto-suggest
        } catch (error) {
          console.error("Erro ao buscar sugestões:", error);
        }
      };

      loadSuggestions();
    }
  }, [open, transacao.estabelecimento, formState.formaPagamento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await processarTransacaoPendente(transacao.id, {
        descricaoEditada: formState.descricaoEditada,
        valor: parseFloat(formState.valor),
        data: formState.data,
        categoriaId: formState.categoriaId,
        contaId:
          formState.formaPagamento === "conta"
            ? formState.contaId
            : undefined,
        cartaoId:
          formState.formaPagamento === "cartao"
            ? formState.cartaoId
            : undefined,
        pagadorId: formState.pagadorId || undefined,
        observacoes: formState.observacoes || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiCheckLine className="mr-1 size-4" />
          Processar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Processar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formState.descricaoEditada}
              onChange={(e) =>
                setFormState({ ...formState, descricaoEditada: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formState.valor}
                onChange={(e) =>
                  setFormState({ ...formState, valor: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formState.data}
                onChange={(e) =>
                  setFormState({ ...formState, data: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formState.categoriaId}
              onValueChange={(value) =>
                setFormState({ ...formState, categoriaId: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="conta"
                  checked={formState.formaPagamento === "conta"}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      formaPagamento: e.target.value,
                    })
                  }
                />
                Conta
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="cartao"
                  checked={formState.formaPagamento === "cartao"}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      formaPagamento: e.target.value,
                    })
                  }
                />
                Cartão
              </label>
            </div>
          </div>

          {formState.formaPagamento === "conta" ? (
            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Select
                value={formState.contaId}
                onValueChange={(value) =>
                  setFormState({ ...formState, contaId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="cartao">Cartão</Label>
              <Select
                value={formState.cartaoId}
                onValueChange={(value) =>
                  setFormState({ ...formState, cartaoId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((cartao) => (
                    <SelectItem key={cartao.id} value={cartao.id}>
                      {cartao.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pagador">Pagador (opcional)</Label>
            <Select
              value={formState.pagadorId}
              onValueChange={(value) =>
                setFormState({ ...formState, pagadorId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pagador" />
              </SelectTrigger>
              <SelectContent>
                {pagadores.map((pag) => (
                  <SelectItem key={pag.id} value={pag.id}>
                    {pag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={formState.observacoes}
              onChange={(e) =>
                setFormState({ ...formState, observacoes: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Processando..." : "Salvar como Lançamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
