import { InboxPage } from "@/components/caixa-de-entrada/inbox-page";
import { getUserId } from "@/lib/auth/server";
import { fetchInboxItems, fetchInboxDialogData } from "./data";

export default async function Page() {
  const userId = await getUserId();

  const [items, dialogData] = await Promise.all([
    fetchInboxItems(userId, "pending"),
    fetchInboxDialogData(userId),
  ]);

  return (
    <main className="flex flex-col items-start gap-6">
      <InboxPage
        items={items}
        pagadorOptions={dialogData.pagadorOptions}
        splitPagadorOptions={dialogData.splitPagadorOptions}
        defaultPagadorId={dialogData.defaultPagadorId}
        contaOptions={dialogData.contaOptions}
        cartaoOptions={dialogData.cartaoOptions}
        categoriaOptions={dialogData.categoriaOptions}
        estabelecimentos={dialogData.estabelecimentos}
      />
    </main>
  );
}
