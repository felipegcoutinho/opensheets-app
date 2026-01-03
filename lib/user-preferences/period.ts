import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type PeriodPreferences = {
  monthsBefore: number;
  monthsAfter: number;
};

/**
 * Fetches period preferences for a user
 * @param userId - User ID
 * @returns Period preferences with defaults if not found
 */
export async function fetchUserPeriodPreferences(
  userId: string
): Promise<PeriodPreferences> {
  const result = await db
    .select({
      periodMonthsBefore: schema.userPreferences.periodMonthsBefore,
      periodMonthsAfter: schema.userPreferences.periodMonthsAfter,
    })
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.userId, userId))
    .limit(1);

  const preferences = result[0];

  return {
    monthsBefore: preferences?.periodMonthsBefore ?? 3,
    monthsAfter: preferences?.periodMonthsAfter ?? 3,
  };
}
