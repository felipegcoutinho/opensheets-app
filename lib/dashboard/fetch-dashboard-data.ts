import { fetchDashboardAccounts } from "./accounts";
import { fetchDashboardBoletos } from "./boletos";
import { fetchExpensesByCategory } from "./categories/expenses-by-category";
import { fetchIncomeByCategory } from "./categories/income-by-category";
import { fetchInstallmentExpenses } from "./expenses/installment-expenses";
import { fetchRecurringExpenses } from "./expenses/recurring-expenses";
import { fetchTopExpenses } from "./expenses/top-expenses";
import { fetchIncomeExpenseBalance } from "./income-expense-balance";
import { fetchDashboardInvoices } from "./invoices";
import { fetchDashboardCardMetrics } from "./metrics";
import { fetchDashboardNotifications } from "./notifications";
import { fetchDashboardPagadores } from "./pagadores";
import { fetchPaymentConditions } from "./payments/payment-conditions";
import { fetchPaymentMethods } from "./payments/payment-methods";
import { fetchPaymentStatus } from "./payments/payment-status";
import { fetchPurchasesByCategory } from "./purchases-by-category";
import { fetchRecentTransactions } from "./recent-transactions";
import { fetchTopEstablishments } from "./top-establishments";

export async function fetchDashboardData(userId: string, period: string) {
	const [
		metrics,
		accountsSnapshot,
		invoicesSnapshot,
		boletosSnapshot,
		notificationsSnapshot,
		paymentStatusData,
		incomeExpenseBalanceData,
		pagadoresSnapshot,
		recentTransactionsData,
		paymentConditionsData,
		paymentMethodsData,
		recurringExpensesData,
		installmentExpensesData,
		topEstablishmentsData,
		topExpensesAll,
		topExpensesCardOnly,
		purchasesByCategoryData,
		incomeByCategoryData,
		expensesByCategoryData,
	] = await Promise.all([
		fetchDashboardCardMetrics(userId, period),
		fetchDashboardAccounts(userId),
		fetchDashboardInvoices(userId, period),
		fetchDashboardBoletos(userId, period),
		fetchDashboardNotifications(userId, period),
		fetchPaymentStatus(userId, period),
		fetchIncomeExpenseBalance(userId, period),
		fetchDashboardPagadores(userId, period),
		fetchRecentTransactions(userId, period),
		fetchPaymentConditions(userId, period),
		fetchPaymentMethods(userId, period),
		fetchRecurringExpenses(userId, period),
		fetchInstallmentExpenses(userId, period),
		fetchTopEstablishments(userId, period),
		fetchTopExpenses(userId, period, false),
		fetchTopExpenses(userId, period, true),
		fetchPurchasesByCategory(userId, period),
		fetchIncomeByCategory(userId, period),
		fetchExpensesByCategory(userId, period),
	]);

	return {
		metrics,
		accountsSnapshot,
		invoicesSnapshot,
		boletosSnapshot,
		notificationsSnapshot,
		paymentStatusData,
		incomeExpenseBalanceData,
		pagadoresSnapshot,
		recentTransactionsData,
		paymentConditionsData,
		paymentMethodsData,
		recurringExpensesData,
		installmentExpensesData,
		topEstablishmentsData,
		topExpensesAll,
		topExpensesCardOnly,
		purchasesByCategoryData,
		incomeByCategoryData,
		expensesByCategoryData,
	};
}

export type DashboardData = Awaited<ReturnType<typeof fetchDashboardData>>;
