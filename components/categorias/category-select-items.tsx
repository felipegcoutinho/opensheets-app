"use client";

import DotIcon from "@/components/dot-icon";

export function TypeSelectContent({ label }: { label: string }) {
	const isReceita = label === "Receita";

	return (
		<span className="flex items-center gap-2">
			<DotIcon
				color={
					isReceita
						? "bg-emerald-600 dark:bg-emerald-300"
						: "bg-rose-600 dark:bg-rose-300"
				}
			/>
			<span>{label}</span>
		</span>
	);
}
