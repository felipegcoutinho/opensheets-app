import { readdir } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { PagadoresPage } from "@/components/pagadores/pagadores-page";
import { user } from "@/db/schema";
import { getUserId } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { fetchPagadoresWithAccess } from "@/lib/pagadores/access";
import type { PagadorStatus } from "@/lib/pagadores/constants";
import {
	DEFAULT_PAGADOR_AVATAR,
	PAGADOR_ROLE_ADMIN,
	PAGADOR_STATUS_OPTIONS,
} from "@/lib/pagadores/constants";

const AVATAR_DIRECTORY = path.join(process.cwd(), "public", "avatares");
const AVATAR_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

async function loadAvatarOptions() {
	try {
		const files = await readdir(AVATAR_DIRECTORY, { withFileTypes: true });

		const items = files
			.filter((file) => file.isFile())
			.map((file) => file.name)
			.filter((file) => AVATAR_EXTENSIONS.has(path.extname(file).toLowerCase()))
			.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

		if (items.length === 0) {
			items.push(DEFAULT_PAGADOR_AVATAR);
		}

		return Array.from(new Set(items));
	} catch {
		return [DEFAULT_PAGADOR_AVATAR];
	}
}

const resolveStatus = (status: string | null): PagadorStatus => {
	const normalized = status?.trim() ?? "";
	const found = PAGADOR_STATUS_OPTIONS.find(
		(option) => option.toLowerCase() === normalized.toLowerCase(),
	);
	return found ?? PAGADOR_STATUS_OPTIONS[0];
};

export default async function Page() {
	const userId = await getUserId();

	const [pagadorRows, localAvatarOptions, userData] = await Promise.all([
		fetchPagadoresWithAccess(userId),
		loadAvatarOptions(),
		db.query.user.findFirst({
			columns: { image: true },
			where: eq(user.id, userId),
		}),
	]);

	// Incluir a imagem do Google nas opções se disponível
	const userImage = userData?.image;
	const avatarOptions = userImage
		? [userImage, ...localAvatarOptions]
		: localAvatarOptions;

	const pagadoresData = pagadorRows
		.map((pagador) => ({
			id: pagador.id,
			name: pagador.name,
			email: pagador.email,
			avatarUrl: pagador.avatarUrl,
			status: resolveStatus(pagador.status),
			note: pagador.note,
			role: pagador.role,
			isAutoSend: pagador.isAutoSend ?? false,
			createdAt: pagador.createdAt?.toISOString() ?? new Date().toISOString(),
			canEdit: pagador.canEdit,
			sharedByName: pagador.sharedByName ?? null,
			sharedByEmail: pagador.sharedByEmail ?? null,
			shareId: pagador.shareId ?? null,
			shareCode: pagador.canEdit ? (pagador.shareCode ?? null) : null,
		}))
		.sort((a, b) => {
			// Admin sempre primeiro
			if (a.role === PAGADOR_ROLE_ADMIN && b.role !== PAGADOR_ROLE_ADMIN) {
				return -1;
			}
			if (a.role !== PAGADOR_ROLE_ADMIN && b.role === PAGADOR_ROLE_ADMIN) {
				return 1;
			}
			// Se ambos são admin ou ambos não são, mantém ordem original
			return 0;
		});

	return (
		<main className="flex flex-col items-start gap-6">
			<PagadoresPage pagadores={pagadoresData} avatarOptions={avatarOptions} />
		</main>
	);
}
