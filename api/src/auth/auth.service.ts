import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async isAuthorized(telegramUserId: string): Promise<boolean> {
    const allowedUserId = this.configService.get<string>("TELEGRAM_ALLOWED_USER_ID", "").trim();

    if (allowedUserId && telegramUserId === allowedUserId) {
      return true;
    }

    const user = await this.prisma.allowedUser.findUnique({
      where: { telegramUserId },
      select: { active: true },
    });

    return Boolean(user?.active);
  }
}
