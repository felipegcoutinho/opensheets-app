import { TransacoesPendentesPageContent } from "@/components/transacoes-pendentes/page-content";
import { fetchPageData } from "./data";

export default async function TransacoesPendentesPage() {
  const data = await fetchPageData();

  return (
    <main className="flex flex-col gap-6">
      <TransacoesPendentesPageContent data={data} />
    </main>
  );
}
