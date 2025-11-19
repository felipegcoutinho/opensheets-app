"use client";

import { updateEmailAction } from "@/app/(dashboard)/ajustes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiCheckLine, RiCloseLine, RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";

type UpdateEmailFormProps = {
  currentEmail: string;
  authProvider?: string; // 'google' | 'credential' | undefined
};

export function UpdateEmailForm({ currentEmail, authProvider }: UpdateEmailFormProps) {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verificar se o usuário usa login via Google (não precisa de senha)
  const isGoogleAuth = authProvider === "google";

  // Validação em tempo real: e-mails coincidem
  const emailsMatch = useMemo(() => {
    if (!confirmEmail) return null; // Não mostrar erro se campo vazio
    return newEmail.toLowerCase() === confirmEmail.toLowerCase();
  }, [newEmail, confirmEmail]);

  // Validação: novo e-mail é diferente do atual
  const isEmailDifferent = useMemo(() => {
    if (!newEmail) return true;
    return newEmail.toLowerCase() !== currentEmail.toLowerCase();
  }, [newEmail, currentEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação frontend antes de enviar
    if (newEmail.toLowerCase() !== confirmEmail.toLowerCase()) {
      toast.error("Os e-mails não coincidem");
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("O novo e-mail deve ser diferente do atual");
      return;
    }

    startTransition(async () => {
      const result = await updateEmailAction({
        password: isGoogleAuth ? undefined : password,
        newEmail,
        confirmEmail,
      });

      if (result.success) {
        toast.success(result.message);
        setPassword("");
        setNewEmail("");
        setConfirmEmail("");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* E-mail atual (apenas informativo) */}
      <div className="space-y-2">
        <Label htmlFor="currentEmail">E-mail atual</Label>
        <Input
          id="currentEmail"
          type="email"
          value={currentEmail}
          disabled
          className="bg-muted cursor-not-allowed"
          aria-describedby="current-email-help"
        />
        <p id="current-email-help" className="text-xs text-muted-foreground">
          Este é seu e-mail atual cadastrado
        </p>
      </div>

      {/* Senha de confirmação (apenas para usuários com login por e-mail/senha) */}
      {!isGoogleAuth && (
        <div className="space-y-2">
          <Label htmlFor="password" required>
            Senha atual
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="Digite sua senha para confirmar"
              required
              aria-required="true"
              aria-describedby="password-help"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <RiEyeOffLine size={20} />
              ) : (
                <RiEyeLine size={20} />
              )}
            </button>
          </div>
          <p id="password-help" className="text-xs text-muted-foreground">
            Por segurança, confirme sua senha antes de alterar seu e-mail
          </p>
        </div>
      )}

      {/* Novo e-mail */}
      <div className="space-y-2">
        <Label htmlFor="newEmail" required>
          Novo e-mail
        </Label>
        <Input
          id="newEmail"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={isPending}
          placeholder="Digite o novo e-mail"
          required
          aria-required="true"
          aria-describedby="new-email-help"
          aria-invalid={!isEmailDifferent}
          className={!isEmailDifferent ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {!isEmailDifferent && newEmail && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <RiCloseLine className="h-3.5 w-3.5" />
            O novo e-mail deve ser diferente do atual
          </p>
        )}
        {!newEmail && (
          <p id="new-email-help" className="text-xs text-muted-foreground">
            Digite o novo endereço de e-mail para sua conta
          </p>
        )}
      </div>

      {/* Confirmar novo e-mail */}
      <div className="space-y-2">
        <Label htmlFor="confirmEmail" required>
          Confirmar novo e-mail
        </Label>
        <div className="relative">
          <Input
            id="confirmEmail"
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            disabled={isPending}
            placeholder="Repita o novo e-mail"
            required
            aria-required="true"
            aria-describedby="confirm-email-help"
            aria-invalid={emailsMatch === false}
            className={
              emailsMatch === false
                ? "border-red-500 focus-visible:ring-red-500 pr-10"
                : emailsMatch === true
                ? "border-green-500 focus-visible:ring-green-500 pr-10"
                : ""
            }
          />
          {/* Indicador visual de match */}
          {emailsMatch !== null && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailsMatch ? (
                <RiCheckLine className="h-5 w-5 text-green-500" aria-label="Os e-mails coincidem" />
              ) : (
                <RiCloseLine className="h-5 w-5 text-red-500" aria-label="Os e-mails não coincidem" />
              )}
            </div>
          )}
        </div>
        {/* Mensagem de erro em tempo real */}
        {emailsMatch === false && (
          <p id="confirm-email-help" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <RiCloseLine className="h-3.5 w-3.5" />
            Os e-mails não coincidem
          </p>
        )}
        {emailsMatch === true && (
          <p id="confirm-email-help" className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <RiCheckLine className="h-3.5 w-3.5" />
            Os e-mails coincidem
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || emailsMatch === false || !isEmailDifferent}
      >
        {isPending ? "Atualizando..." : "Atualizar e-mail"}
      </Button>
    </form>
  );
}
