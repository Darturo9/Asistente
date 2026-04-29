import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FinanceModule } from "../finance/finance.module";
import { ReportsModule } from "../reports/reports.module";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";

@Module({
  imports: [AuthModule, FinanceModule, ReportsModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
