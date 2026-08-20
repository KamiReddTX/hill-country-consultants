/** Expense categories for the Finance ledger and budgets. Kept short and
 *  business-relevant; "Other" catches anything unmapped. */
export const EXPENSE_CATEGORIES = [
  "Software & subscriptions",
  "Contractors & payroll",
  "Advertising & marketing",
  "Office & supplies",
  "Travel & meals",
  "Fees & processing",
  "Professional services",
  "Education & training",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
