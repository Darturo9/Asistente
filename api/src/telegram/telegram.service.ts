import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Account, MovementType } from "@prisma/client";
import {
  ACCOUNTS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatMoney,
  isValidAccount,
  isValidAmount,
  isValidExpenseCategory,
  isValidIncomeCategory,
} from "../common/finance.constants";
import { AuthService } from "../auth/auth.service";
import { FinanceService } from "../finance/finance.service";
import { ReportsService } from "../reports/reports.service";
import type { TelegramUpdate } from "./telegram.types";

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly financeService: FinanceService,
    private readonly reportsService: ReportsService,
  ) {}

  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;

    if (!message?.text || !message.from?.id) {
      return;
    }

    const telegramUserId = String(message.from.id);
    const chatId = message.chat.id;
    const text = message.text.trim();

    const authorized = await this.authService.isAuthorized(telegramUserId);
    if (!authorized) {
      await this.sendMessage(chatId, "Acceso restringido.");
      return;
    }

    const responseText = await this.processCommand(telegramUserId, text);
    await this.sendMessage(chatId, responseText);
  }

  private async processCommand(telegramUserId: string, text: string): Promise<string> {
    const parts = text.split(/\s+/);
    const command = parts[0]?.toLowerCase() ?? "";

    try {
      switch (command) {
        case "/help":
        case "/start":
          return this.helpText();
        case "/gasto":
          return this.handleMovement(telegramUserId, parts, MovementType.expense);
        case "/ingreso":
          return this.handleMovement(telegramUserId, parts, MovementType.income);
        case "/saldo":
          return this.handleSaldo(telegramUserId);
        case "/hoy":
          return this.handleWindowSummary(telegramUserId, "today", "Resumen de hoy");
        case "/semana":
          return this.handleWindowSummary(telegramUserId, "week", "Resumen de semana");
        case "/mes":
          return this.handleWindowSummary(telegramUserId, "month", "Resumen de mes");
        default:
          return "Comando no reconocido. Usa /help para ver opciones.";
      }
    } catch (error) {
      this.logger.error("command_failed", error);
      return "Ocurrio un error procesando el comando. Intenta de nuevo.";
    }
  }

  private async handleMovement(
    telegramUserId: string,
    parts: string[],
    type: MovementType,
  ): Promise<string> {
    if (parts.length < 4) {
      return type === MovementType.expense
        ? "Formato: /gasto <monto> <categoria> <cuenta> <nota_opcional>"
        : "Formato: /ingreso <monto> <categoria> <cuenta> <nota_opcional>";
    }

    const [, amountRaw, categoryRaw, accountRaw, ...noteParts] = parts;
    const note = noteParts.join(" ").trim() || undefined;

    if (!isValidAmount(amountRaw)) {
      return "Monto no valido. Usa 45 o 43.44";
    }

    if (!isValidAccount(accountRaw)) {
      return "Cuenta no valida. Opciones: efectivo, banco, tarjeta_credito";
    }

    if (type === MovementType.expense && !isValidExpenseCategory(categoryRaw)) {
      return `Categoria no permitida. Opciones: ${EXPENSE_CATEGORIES.join(", ")}`;
    }

    if (type === MovementType.income && !isValidIncomeCategory(categoryRaw)) {
      return `Categoria no permitida. Opciones: ${INCOME_CATEGORIES.join(", ")}`;
    }

    await this.financeService.createMovement({
      telegramUserId,
      type,
      amount: amountRaw,
      category: categoryRaw,
      account: accountRaw as Account,
      note,
    });

    const balance = await this.financeService.getBalance(telegramUserId);

    const action = type === MovementType.expense ? "gasto" : "ingreso";

    return `Registrado: ${action} ${formatMoney(Number(amountRaw))} en ${categoryRaw} desde ${accountRaw}. Balance actual: ${formatMoney(balance.totalBalance)}`;
  }

  private async handleSaldo(telegramUserId: string): Promise<string> {
    const balance = await this.financeService.getBalance(telegramUserId);
    const accountLines = balance.accounts
      .map((item) => `- ${item.account}: ${formatMoney(item.balance)}`)
      .join("\n");

    return [
      `Saldo total: ${formatMoney(balance.totalBalance)}`,
      `Ingresos acumulados: ${formatMoney(balance.totalIncome)}`,
      `Gastos acumulados: ${formatMoney(balance.totalExpense)}`,
      "",
      "Detalle por cuenta:",
      accountLines,
    ].join("\n");
  }

  private async handleWindowSummary(
    telegramUserId: string,
    window: "today" | "week" | "month",
    title: string,
  ): Promise<string> {
    const summary = await this.reportsService.getWindowSummary(telegramUserId, window);

    return [
      `${title}:`,
      `- Ingresos: ${formatMoney(summary.incomes)}`,
      `- Gastos: ${formatMoney(summary.expenses)}`,
      `- Balance: ${formatMoney(summary.balance)}`,
      `- Movimientos: ${summary.count}`,
    ].join("\n");
  }

  private helpText(): string {
    return [
      "Comandos disponibles:",
      "/gasto <monto> <categoria> <cuenta> <nota_opcional>",
      "/ingreso <monto> <categoria> <cuenta> <nota_opcional>",
      "/saldo",
      "/hoy",
      "/semana",
      "/mes",
      "",
      "Ejemplos:",
      "/gasto 45 comida efectivo almuerzo",
      "/ingreso 1500 salario banco pago_quincena",
      "",
      `Cuentas: ${ACCOUNTS.join(", ")}`,
      `Categorias gasto: ${EXPENSE_CATEGORIES.join(", ")}`,
      `Categorias ingreso: ${INCOME_CATEGORIES.join(", ")}`,
      "",
      "Monto valido: 45 o 43.44",
    ].join("\n");
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    const token = this.configService.get<string>("TELEGRAM_BOT_TOKEN", "").trim();

    if (!token) {
      this.logger.warn("TELEGRAM_BOT_TOKEN is empty; skipping Telegram sendMessage.");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`telegram_send_failed: ${response.status} ${errorText}`);
    }
  }
}
