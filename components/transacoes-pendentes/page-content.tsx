"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TransacaoCard } from "./transacao-card";
import { EmptyState } from "./empty-state";
import type { PageData } from "@/app/(dashboard)/transacoes-pendentes/data";

export function TransacoesPendentesPageContent({ data }: { data: PageData }) {
  const pendentes = data.transacoes.filter((t) => t.status === "pendente");
  const processadas = data.transacoes.filter((t) => t.status === "processado");
  const ignoradas = data.transacoes.filter((t) => t.status === "ignorado");

  return (
    <Tabs defaultValue="pendentes" className="w-full">
      <TabsList>
        <TabsTrigger value="pendentes">
          Pendentes {pendentes.length > 0 && `(${pendentes.length})`}
        </TabsTrigger>
        <TabsTrigger value="processadas">Processadas</TabsTrigger>
        <TabsTrigger value="ignoradas">Ignoradas</TabsTrigger>
      </TabsList>

      <TabsContent value="pendentes" className="mt-6 space-y-3">
        {pendentes.length === 0 ? (
          <EmptyState status="pendente" />
        ) : (
          pendentes.map((t) => (
            <TransacaoCard
              key={t.id}
              transacao={t}
              contas={data.contas}
              cartoes={data.cartoes}
              categorias={data.categorias}
              pagadores={data.pagadores}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="processadas" className="mt-6 space-y-3">
        {processadas.length === 0 ? (
          <EmptyState status="processado" />
        ) : (
          processadas.map((t) => (
            <TransacaoCard key={t.id} transacao={t} />
          ))
        )}
      </TabsContent>

      <TabsContent value="ignoradas" className="mt-6 space-y-3">
        {ignoradas.length === 0 ? (
          <EmptyState status="ignorado" />
        ) : (
          ignoradas.map((t) => (
            <TransacaoCard key={t.id} transacao={t} />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
