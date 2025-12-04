"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
  deleteApiToken,
  restoreApiToken,
} from "@/lib/api-tokens/actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RiAddLine,
  RiCheckLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiKeyLine,
  RiPauseLine,
  RiPlayLine,
} from "@remixicon/react";
import { toast } from "sonner";

type Token = {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export function ApiTokensManager() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Função para carregar tokens
  const loadTokens = useCallback(async () => {
    setLoading(true);
    const result = await listApiTokens();
    if (result.success && result.data) {
      setTokens(result.data);
    }
    setLoading(false);
  }, []);

  // Carregar tokens ao montar
  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  async function handleCreateToken() {
    if (!newTokenName.trim()) {
      toast.error("Digite um nome para o token");
      return;
    }

    const result = await createApiToken({
      name: newTokenName.trim(),
    });

    if (result.success && result.data) {
      setCreatedToken(result.data.token);
      setNewTokenName("");
      await loadTokens();
      toast.success("Token criado com sucesso!");
    } else {
      toast.error(result.error || "Erro ao criar token");
    }
  }

  async function handleRevokeToken(tokenId: string) {
    const result = await revokeApiToken(tokenId);
    if (result.success) {
      await loadTokens();
      toast.success("Token revogado");
    } else {
      toast.error(result.error || "Erro ao revogar token");
    }
  }

  async function handleRestoreToken(tokenId: string) {
    const result = await restoreApiToken(tokenId);
    if (result.success) {
      await loadTokens();
      toast.success("Token restaurado");
    } else {
      toast.error(result.error || "Erro ao restaurar token");
    }
  }

  async function handleDeleteToken() {
    if (!tokenToDelete) return;

    const result = await deleteApiToken(tokenToDelete);
    if (result.success) {
      await loadTokens();
      setTokenToDelete(null);
      toast.success("Token deletado");
    } else {
      toast.error(result.error || "Erro ao deletar token");
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  function getStatusBadge(token: Token) {
    if (token.revokedAt) {
      return <Badge variant="destructive">Revogado</Badge>;
    }
    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-500">
        Ativo
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando tokens...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão criar token */}
      <Button
        onClick={() => setShowCreateDialog(true)}
        className="w-full sm:w-auto"
      >
        <RiAddLine className="mr-2 h-4 w-4" />
        Criar Token
      </Button>

      {/* Lista de tokens */}
      {tokens.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <RiKeyLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">Nenhum token criado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie um token para conectar seu app Android
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div key={token.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{token.name}</h4>
                    {getStatusBadge(token)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>
                      Criado em:{" "}
                      {format(
                        new Date(token.createdAt),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </p>
                    {token.lastUsedAt && (
                      <p>
                        Último uso:{" "}
                        {format(
                          new Date(token.lastUsedAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!token.revokedAt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeToken(token.id)}
                    >
                      <RiPauseLine className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreToken(token.id)}
                    >
                      <RiPlayLine className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenToDelete(token.id)}
                  >
                    <RiDeleteBinLine className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog para criar token */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setCreatedToken(null);
            setNewTokenName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdToken ? "Token Criado!" : "Criar Token de API"}
            </DialogTitle>
            <DialogDescription>
              {createdToken
                ? "Copie este token agora! Você não poderá vê-lo novamente."
                : "Dê um nome descritivo para identificar onde este token será usado."}
            </DialogDescription>
          </DialogHeader>

          {createdToken ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Seu Token</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdToken}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToken(createdToken)}
                  >
                    {copied ? (
                      <RiCheckLine className="h-4 w-4 text-green-500" />
                    ) : (
                      <RiFileCopyLine className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure este token no seu app Android em: Configurações →
                  Token de API
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenName">Nome do Token</Label>
                <Input
                  id="tokenName"
                  placeholder="Ex: Meu Celular"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateToken();
                    }
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdToken ? (
              <Button
                onClick={() => {
                  setShowCreateDialog(false);
                  setCreatedToken(null);
                }}
              >
                Fechar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateToken}>Criar Token</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog
        open={!!tokenToDelete}
        onOpenChange={() => setTokenToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Token?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O app que usa este token não
              conseguirá mais enviar notificações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteToken}
              className="bg-destructive text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
