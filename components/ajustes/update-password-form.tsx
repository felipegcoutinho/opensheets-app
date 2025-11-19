"use client";

import { updatePasswordAction } from "@/app/(dashboard)/ajustes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine, RiAlertLine } from "@remixicon/react";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";

type UpdatePasswordFormProps = {
  authProvider?: string; // 'google' | 'credential' | undefined
};

export function UpdatePasswordForm({ authProvider }: UpdatePasswordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verificar se o usuário usa login via Google
  const isGoogleAuth = authProvider === "google";

  // Validação em tempo real: senhas coincidem
  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return null; // Não mostrar erro se campo vazio
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  // Indicador de força da senha (básico)
  const passwordStrength = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return "weak";
    if (newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) {
      return "strong";
    }
    if (newPassword.length >= 8 && (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword))) {
      return "medium";
    }
    return "weak";
  }, [newPassword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação frontend antes de enviar
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await updatePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        toast.success(result.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error);
      }
    });
  };

  // Se o usuário usa Google OAuth, mostrar aviso
  if (isGoogleAuth) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex gap-3">
          <RiAlertLine className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-400">
              Alteração de senha não disponível
            </h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-500">
              Você fez login usando sua conta do Google. A senha é gerenciada diretamente pelo Google
              e não pode ser alterada aqui. Para modificar sua senha, acesse as configurações de
              segurança da sua conta Google.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Senha atual */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword" required>
          Senha atual
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending}
            placeholder="Digite sua senha atual"
            required
            aria-required="true"
            aria-describedby="current-password-help"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
          >
            {showCurrentPassword ? (
              <RiEyeOffLine size={20} />
            ) : (
              <RiEyeLine size={20} />
            )}
          </button>
        </div>
        <p id="current-password-help" className="text-xs text-muted-foreground">
          Por segurança, confirme sua senha atual antes de alterá-la
        </p>
      </div>

      {/* Nova senha */}
      <div className="space-y-2">
        <Label htmlFor="newPassword" required>
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            placeholder="Mínimo de 6 caracteres"
            required
            minLength={6}
            aria-required="true"
            aria-describedby="new-password-help"
            aria-invalid={newPassword.length > 0 && newPassword.length < 6}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
          >
            {showNewPassword ? (
              <RiEyeOffLine size={20} />
            ) : (
              <RiEyeLine size={20} />
            )}
          </button>
        </div>
        <div className="space-y-1">
          <p id="new-password-help" className="text-xs text-muted-foreground">
            Use no mínimo 6 caracteres. Recomendado: 12+ caracteres com letras, números e símbolos
          </p>
          {/* Indicador de força da senha */}
          {passwordStrength && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength === "weak"
                      ? "w-1/3 bg-red-500"
                      : passwordStrength === "medium"
                      ? "w-2/3 bg-amber-500"
                      : "w-full bg-green-500"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  passwordStrength === "weak"
                    ? "text-red-600 dark:text-red-400"
                    : passwordStrength === "medium"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {passwordStrength === "weak"
                  ? "Fraca"
                  : passwordStrength === "medium"
                  ? "Média"
                  : "Forte"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmar nova senha */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" required>
          Confirmar nova senha
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            placeholder="Repita a senha"
            required
            minLength={6}
            aria-required="true"
            aria-describedby="confirm-password-help"
            aria-invalid={passwordsMatch === false}
            className={
              passwordsMatch === false
                ? "border-red-500 focus-visible:ring-red-500"
                : passwordsMatch === true
                ? "border-green-500 focus-visible:ring-green-500"
                : ""
            }
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
          >
            {showConfirmPassword ? (
              <RiEyeOffLine size={20} />
            ) : (
              <RiEyeLine size={20} />
            )}
          </button>
          {/* Indicador visual de match */}
          {passwordsMatch !== null && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {passwordsMatch ? (
                <RiCheckLine className="h-5 w-5 text-green-500" aria-label="As senhas coincidem" />
              ) : (
                <RiCloseLine className="h-5 w-5 text-red-500" aria-label="As senhas não coincidem" />
              )}
            </div>
          )}
        </div>
        {/* Mensagem de erro em tempo real */}
        {passwordsMatch === false && (
          <p id="confirm-password-help" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
            <RiCloseLine className="h-3.5 w-3.5" />
            As senhas não coincidem
          </p>
        )}
        {passwordsMatch === true && (
          <p id="confirm-password-help" className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <RiCheckLine className="h-3.5 w-3.5" />
            As senhas coincidem
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending || passwordsMatch === false}>
        {isPending ? "Atualizando..." : "Atualizar senha"}
      </Button>
    </form>
  );
}
