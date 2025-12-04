import PageDescription from "@/components/page-description";
import { RiArrowLeftRightLine } from "@remixicon/react";

export const metadata = {
  title: "Lançamentos | Opensheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 px-6">
      <PageDescription
        icon={<RiArrowLeftRightLine />}
        title="Transações Pendentes"
        subtitle="Revise e processe notificações bancárias capturadas"
      />
      {children}
    </section>
  );
}
