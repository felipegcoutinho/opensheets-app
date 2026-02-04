"use client";

import DotIcon from "@/components/dot-icon";

export function StatusSelectContent({ label }: { label: string }) {
	const isActive = label === "Ativo";

	return (
		<span className="flex items-center gap-2">
			<DotIcon
				color={
					isActive
						? "bg-emerald-600 dark:bg-emerald-300"
						: "bg-slate-400 dark:bg-slate-500"
				}
			/>
			<span>{label}</span>
		</span>
	);
}
