import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { lancamentos, pagadores } from "@/db/schema";
import { ACCOUNT_AUTO_INVOICE_NOTE_PREFIX } from "@/lib/accounts/constants";
import { toNumber } from "@/lib/dashboard/common";
import { db } from "@/lib/db";
import { PAGADOR_ROLE_ADMIN } from "@/lib/pagadores/constants";

export type DashboardPagador = {
	id: string;
	name: string;
	email: string | null;
	avatarUrl: string | null;
	totalExpenses: number;
	isAdmin: boolean;
};

export type DashboardPagadoresSnapshot = {
	pagadores: DashboardPagador[];
	totalExpenses: number;
};

export async function fetchDashboardPagadores(
	userId: string,
	period: string,
): Promise<DashboardPagadoresSnapshot> {
	const rows = await db
		.select({
			id: pagadores.id,
			name: pagadores.name,
			email: pagadores.email,
			avatarUrl: pagadores.avatarUrl,
			role: pagadores.role,
			totalExpenses: sql<number>`COALESCE(SUM(ABS(${lancamentos.amount})), 0)`,
		})
		.from(lancamentos)
		.innerJoin(pagadores, eq(lancamentos.pagadorId, pagadores.id))
		.where(
			and(
				eq(lancamentos.userId, userId),
				eq(lancamentos.period, period),
				eq(lancamentos.transactionType, "Despesa"),
				or(
					isNull(lancamentos.note),
					sql`${lancamentos.note} NOT LIKE ${`${ACCOUNT_AUTO_INVOICE_NOTE_PREFIX}%`}`,
				),
			),
		)
		.groupBy(
			pagadores.id,
			pagadores.name,
			pagadores.email,
			pagadores.avatarUrl,
			pagadores.role,
		)
		.orderBy(desc(sql`SUM(ABS(${lancamentos.amount}))`));

	const pagadoresList = rows
		.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			avatarUrl: row.avatarUrl,
			totalExpenses: toNumber(row.totalExpenses),
			isAdmin: row.role === PAGADOR_ROLE_ADMIN,
		}))
		.filter((p) => p.totalExpenses > 0);

	const totalExpenses = pagadoresList.reduce(
		(sum, p) => sum + p.totalExpenses,
		0,
	);

	return {
		pagadores: pagadoresList,
		totalExpenses,
	};
}
