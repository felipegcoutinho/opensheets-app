import PageDescription from "@/components/page-description";
import { RiGitCommitLine } from "@remixicon/react";

export const metadata = {
  title: "Changelog | Opensheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 px-6">
      <PageDescription
        icon={<RiGitCommitLine />}
        title="Changelog"
        subtitle="Histórico completo de alterações e atualizações do projeto."
      />
      {children}
    </section>
  );
}
