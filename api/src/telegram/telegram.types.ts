export type TelegramUser = {
  id: number;
};

export type TelegramChat = {
  id: number;
};

export type TelegramMessage = {
  text?: string;
  from?: TelegramUser;
  chat: TelegramChat;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};
