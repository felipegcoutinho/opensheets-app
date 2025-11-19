"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient, googleSignInAvailable } from "@/lib/auth/client";
import { cn } from "@/lib/utils/ui";
import { RiLoader4Line } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Logo } from "../logo";
import { AuthErrorAlert } from "./auth-error-alert";
import { AuthHeader } from "./auth-header";
import AuthSidebar from "./auth-sidebar";
import { GoogleAuthButton } from "./google-auth-button";

type DivProps = React.ComponentProps<"div">;

export function SignupForm({ className, ...props }: DivProps) {
  const router = useRouter();
  const isGoogleAvailable = googleSignInAvailable;

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await authClient.signUp.email(
      {
        email,
        password,
        name: fullname,
      },
      {
        onRequest: () => {
          setError("");
          setLoadingEmail(true);
        },
        onSuccess: () => {
          setLoadingEmail(false);
          toast.success("Conta criada com sucesso!");
          router.replace("/dashboard");
        },
        onError: (ctx) => {
          setError(ctx.error.message);
          setLoadingEmail(false);
        },
      }
    );
  }

  async function handleGoogle() {
    if (!isGoogleAvailable) {
      setError("Login com Google não está disponível no momento.");
      return;
    }

    // Ativa loading antes de iniciar o fluxo OAuth
    setError("");
    setLoadingGoogle(true);

    // OAuth redirect - o loading permanece até a página ser redirecionada
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/dashboard",
      },
      {
        onError: (ctx) => {
          // Só desativa loading se houver erro
          setError(ctx.error.message);
          setLoadingGoogle(false);
        },
      }
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Logo className="mb-2" />
      <Card className="overflow-hidden p-0">
        <CardContent className="grid gap-0 p-0 md:grid-cols-[1.05fr_0.95fr]">
          <form
            className="flex flex-col gap-6 p-6 md:p-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <FieldGroup className="gap-4">
              <AuthHeader
                title="Criar sua conta"
                description="Comece com sua nova conta"
              />

              <AuthErrorAlert error={error} />

              <Field>
                <FieldLabel htmlFor="name" required>
                  Nome completo
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome"
                  autoComplete="name"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  aria-invalid={!!error}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email" required>
                  E-mail
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" required>
                  Senha
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Crie uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={loadingEmail || loadingGoogle}
                  className="w-full"
                >
                  {loadingEmail ? (
                    <RiLoader4Line className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </Field>

              <FieldSeparator className="my-2 *:data-[slot=field-separator-content]:bg-card">
                Ou continue com
              </FieldSeparator>

              <Field>
                <GoogleAuthButton
                  onClick={handleGoogle}
                  loading={loadingGoogle}
                  disabled={loadingEmail || loadingGoogle || !isGoogleAvailable}
                  text="Continuar com Google"
                />
              </Field>

              <FieldDescription className="text-center">
                Já tem uma conta?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Entrar
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <AuthSidebar />
        </CardContent>
      </Card>

      {/* <AuthFooter /> */}
      <FieldDescription className="text-center">
        <a href="/" className="underline underline-offset-4">
          Voltar para o site
        </a>
      </FieldDescription>
    </div>
  );
}
