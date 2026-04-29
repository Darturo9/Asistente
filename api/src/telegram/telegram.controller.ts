import { Body, Controller, Get, Post } from "@nestjs/common";
import type { TelegramUpdate } from "./telegram.types";
import { TelegramService } from "./telegram.service";

@Controller()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get("health")
  health() {
    return { ok: true };
  }

  @Post("telegram/webhook")
  async webhook(@Body() update: TelegramUpdate) {
    await this.telegramService.handleUpdate(update);
    return { ok: true };
  }
}
