import { Injectable } from "@nestjs/common";
import { Account, MovementType, Prisma } from "@prisma/client";
import { ACCOUNTS } from "../common/finance.constants";
import { PrismaService } from "../prisma/prisma.service";

type MovementPayload = {
  telegramUserId: string;
  type: MovementType;
  amount: string;
  category: string;
  account: Account;
  note?: string;
};

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createMovement(payload: MovementPayload) {
    return this.prisma.movement.create({
      data: {
        telegramUserId: payload.telegramUserId,
        type: payload.type,
        amount: new Prisma.Decimal(payload.amount),
        category: payload.category,
        account: payload.account,
        note: payload.note,
      },
    });
  }

  async getBalance(telegramUserId: string) {
    const [incomeAgg, expenseAgg, groupedByAccount] = await Promise.all([
      this.prisma.movement.aggregate({
        where: { telegramUserId, type: MovementType.income },
        _sum: { amount: true },
      }),
      this.prisma.movement.aggregate({
        where: { telegramUserId, type: MovementType.expense },
        _sum: { amount: true },
      }),
      this.prisma.movement.groupBy({
        by: ["account", "type"],
        where: { telegramUserId },
        _sum: { amount: true },
      }),
    ]);

    const accountBalances: Record<Account, number> = {
      efectivo: 0,
      banco: 0,
      tarjeta_credito: 0,
    };

    for (const row of groupedByAccount) {
      const amount = row._sum.amount?.toNumber() ?? 0;
      accountBalances[row.account] += row.type === MovementType.income ? amount : -amount;
    }

    const totalIncome = incomeAgg._sum.amount?.toNumber() ?? 0;
    const totalExpense = expenseAgg._sum.amount?.toNumber() ?? 0;

    return {
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense,
      accounts: ACCOUNTS.map((account) => ({
        account,
        balance: accountBalances[account],
      })),
    };
  }

  async getSummaryBetweenDates(telegramUserId: string, start: Date, end: Date) {
    const [incomeAgg, expenseAgg, count] = await Promise.all([
      this.prisma.movement.aggregate({
        where: {
          telegramUserId,
          type: MovementType.income,
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.movement.aggregate({
        where: {
          telegramUserId,
          type: MovementType.expense,
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.movement.count({
        where: {
          telegramUserId,
          createdAt: { gte: start, lte: end },
        },
      }),
    ]);

    const incomes = incomeAgg._sum.amount?.toNumber() ?? 0;
    const expenses = expenseAgg._sum.amount?.toNumber() ?? 0;

    return {
      incomes,
      expenses,
      balance: incomes - expenses,
      count,
      start,
      end,
    };
  }
}
