// ─── Main Client ──────────────────────────────────────────────────────────────
export { Client } from './client/Client';
export type { ClientOptions } from './client/Client';

// ─── Builders ─────────────────────────────────────────────────────────────────
export { SlashCommandBuilder } from './builders/SlashCommandBuilder';
export type { CommandData, CommandOptionData, CommandOptionChoice } from './builders/SlashCommandBuilder';

// ─── Structures ───────────────────────────────────────────────────────────────
export { Interaction } from './structures/Interaction';
export type { InteractionReplyOptions } from './structures/Interaction';

// ─── REST Errors ──────────────────────────────────────────────────────────────
export { BotApiError, BotServerError } from './rest/RestClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ReadyData,
  MessageData,
  MessageUpdateData,
  MessageDeleteData,
  ServerMemberData,
  PartialServerMemberData,
  ClientEvents,
} from './types/events';

export type { EmbedData, EmbedField, SendMessageOptions, EditMessageOptions } from './rest/endpoints/messages';
