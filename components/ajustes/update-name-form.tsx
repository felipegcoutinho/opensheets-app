"use client";

import { updateNameAction } from "@/app/(dashboard)/ajustes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type UpdateNameFormProps = {
  currentName: string;
};

export function UpdateNameForm({ currentName }: UpdateNameFormProps) {
  const [isPending, startTransition] = useTransition();

  // Dividir o nome atual em primeiro nome e sobrenome
  const nameParts = currentName.split(" ");
  const initialFirstName = nameParts[0] || "";
  const initialLastName = nameParts.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateNameAction({
        firstName,
        lastName,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName" required>
          Primeiro nome
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" required>
          Sobrenome
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Atualizando..." : "Atualizar nome"}
      </Button>
    </form>
  );
}
