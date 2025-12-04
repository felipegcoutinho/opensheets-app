import { RiInboxLine, RiCheckDoubleLine, RiCloseLine } from "@remixicon/react";

interface Props {
  status: "pendente" | "processado" | "ignorado";
}

export function EmptyState({ status }: Props) {
  const config = {
    pendente: {
      icon: RiInboxLine,
      title: "Nenhuma transação pendente",
      description:
        "Quando notificações bancárias forem capturadas, elas aparecerão aqui.",
    },
    processado: {
      icon: RiCheckDoubleLine,
      title: "Nenhuma transação processada",
      description:
        "Transações que você converteu em lançamentos aparecerão aqui.",
    },
    ignorado: {
      icon: RiCloseLine,
      title: "Nenhuma transação ignorada",
      description: "Transações que você escolheu ignorar aparecerão aqui.",
    },
  };

  const { icon: Icon, title, description } = config[status];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="mb-4 size-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
