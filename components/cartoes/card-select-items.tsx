"use client";

import { RiBankLine } from "@remixicon/react";
import Image from "next/image";
import DotIcon from "@/components/dot-icon";

type SelectItemContentProps = {
	label: string;
	logo?: string | null;
};

const resolveLogoSrc = (logo: string | null) => {
	if (!logo) {
		return null;
	}

	const fileName = logo.split("/").filter(Boolean).pop() ?? logo;
	return `/logos/${fileName}`;
};

const getBrandLogo = (brand: string): string | null => {
	const brandMap: Record<string, string> = {
		Visa: "visa.png",
		Mastercard: "mastercard.png",
		Elo: "elo.png",
	};

	return brandMap[brand] ?? null;
};

export function BrandSelectContent({ label }: { label: string }) {
	const brandLogo = getBrandLogo(label);
	const logoSrc = brandLogo ? `/logos/${brandLogo}` : null;

	return (
		<span className="flex items-center gap-2">
			{logoSrc ? (
				<Image
					src={logoSrc}
					alt={`Logo ${label}`}
					width={24}
					height={24}
					className="rounded object-contain"
				/>
			) : (
				<RiBankLine className="size-5 text-muted-foreground" aria-hidden />
			)}
			<span>{label}</span>
		</span>
	);
}

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

export function AccountSelectContent({ label, logo }: SelectItemContentProps) {
	const logoSrc = resolveLogoSrc(logo);

	return (
		<span className="flex items-center gap-2">
			{logoSrc ? (
				<Image
					src={logoSrc}
					alt={`Logo de ${label}`}
					width={20}
					height={20}
					className="rounded"
				/>
			) : (
				<RiBankLine className="size-4 text-muted-foreground" aria-hidden />
			)}
			<span>{label}</span>
		</span>
	);
}
