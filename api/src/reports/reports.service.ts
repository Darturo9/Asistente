import { Injectable } from "@nestjs/common";
import { FinanceService } from "../finance/finance.service";

export type ReportWindow = "today" | "week" | "month";

@Injectable()
export class ReportsService {
  constructor(private readonly financeService: FinanceService) {}

  async getWindowSummary(telegramUserId: string, window: ReportWindow) {
    const now = new Date();
    const start = this.getWindowStart(now, window);

    return this.financeService.getSummaryBetweenDates(telegramUserId, start, now);
  }

  private getWindowStart(now: Date, window: ReportWindow): Date {
    if (window === "today") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    if (window === "week") {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
    }

    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
}
