export const ACCOUNTS = ["efectivo", "banco", "tarjeta_credito"] as const;

export const EXPENSE_CATEGORIES = [
  "comida",
  "transporte",
  "hogar",
  "salud",
  "educacion",
  "entretenimiento",
  "servicios",
  "otros",
] as const;

export const INCOME_CATEGORIES = ["salario", "freelance", "ventas", "otros"] as const;

export type AccountName = (typeof ACCOUNTS)[number];
export type ExpenseCategoryName = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategoryName = (typeof INCOME_CATEGORIES)[number];

export function isValidAmount(value: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return false;
  }

  return Number(value) > 0;
}

export function formatMoney(value: number): string {
  return `Q${value.toFixed(2)}`;
}

export function isValidAccount(value: string): value is AccountName {
  return (ACCOUNTS as readonly string[]).includes(value);
}

export function isValidExpenseCategory(value: string): value is ExpenseCategoryName {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export function isValidIncomeCategory(value: string): value is IncomeCategoryName {
  return (INCOME_CATEGORIES as readonly string[]).includes(value);
}
