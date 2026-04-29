import { Module } from "@nestjs/common";
import { FinanceModule } from "../finance/finance.module";
import { ReportsService } from "./reports.service";

@Module({
  imports: [FinanceModule],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
