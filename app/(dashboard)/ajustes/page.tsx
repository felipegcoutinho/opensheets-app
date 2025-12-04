import { DeleteAccountForm } from "@/components/ajustes/delete-account-form";
import { UpdateEmailForm } from "@/components/ajustes/update-email-form";
import { UpdateNameForm } from "@/components/ajustes/update-name-form";
import { UpdatePasswordForm } from "@/components/ajustes/update-password-form";
import { ApiTokensManager } from "@/components/ajustes/api-tokens-manager";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth/config";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const userName = session.user.name || "";
  const userEmail = session.user.email || "";

  // Detectar método de autenticação (Google OAuth vs E-mail/Senha)
  const userAccount = await db.query.account.findFirst({
    where: eq(schema.account.userId, session.user.id),
  });

  // Se o providerId for "google", o usuário usa Google OAuth
  const authProvider = userAccount?.providerId || "credential";

  return (
    <div className="max-w-3xl">
      <Tabs defaultValue="nome" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-2">
          <TabsTrigger value="nome">Nome</TabsTrigger>
          <TabsTrigger value="senha">Senha</TabsTrigger>
          <TabsTrigger value="email">E-mail</TabsTrigger>
          <TabsTrigger value="tokens">Tokens API</TabsTrigger>
          <TabsTrigger value="deletar" className="text-destructive">
            Deletar
          </TabsTrigger>
        </TabsList>

        <Card className="p-6">
          <TabsContent value="nome" className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Alterar nome</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Atualize como seu nome aparece no Opensheets. Esse nome pode ser
                exibido em diferentes seções do app e em comunicações.
              </p>
            </div>
            <UpdateNameForm currentName={userName} />
          </TabsContent>

          <TabsContent value="senha" className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Alterar senha</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Defina uma nova senha para sua conta. Guarde-a em local seguro.
              </p>
            </div>
            <UpdatePasswordForm authProvider={authProvider} />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Alterar e-mail</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Atualize o e-mail associado à sua conta. Você precisará
                confirmar os links enviados para o novo e também para o e-mail
                atual (quando aplicável) para concluir a alteração.
              </p>
            </div>
            <UpdateEmailForm
              currentEmail={userEmail}
              authProvider={authProvider}
            />
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Tokens de API</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Gerencie tokens para autenticar apps externos como o app Android.
                Tokens são como senhas especiais para seus dispositivos.
              </p>
            </div>
            <ApiTokensManager />
          </TabsContent>

          <TabsContent value="deletar" className="space-y-4">
            <div>
              <h2 className="text-lg font-medium mb-1 text-destructive">
                Deletar conta
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Ao prosseguir, sua conta e todos os dados associados serão
                excluídos de forma irreversível.
              </p>
            </div>
            <DeleteAccountForm />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
