import PageDescription from "@/components/page-description";
import { RiInboxLine } from "@remixicon/react";

export const metadata = {
  title: "Pré-Lançamentos | Opensheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 px-6">
      <PageDescription
        icon={<RiInboxLine />}
        title="Pré-Lançamentos"
        subtitle="Notificações capturadas aguardando processamento"
      />
      {children}
    </section>
  );
}
