/**
 * Developer-facing event types.
 * These are the friendly objects the SDK exposes — no raw snake_case, no op codes.
 */

import type { Interaction } from '../structures/Interaction';

// ─── READY ────────────────────────────────────────────────────────────────────

export interface ReadyData {
  bot: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  };
  servers: Array<{ id: string }>;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export interface MessageData {
  id: string;
  content: string;
  channelId: string;
  serverId: string;
  timestamp: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    isBot: boolean;
  };
}

export interface MessageUpdateData {
  id: string;
  content: string;
  editedAt: Date | null;
  channelId: string;
  serverId: string;
}

export interface MessageDeleteData {
  messageId: string;
  channelId: string;
  serverId: string;
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export interface ServerMemberData {
  userId: string;
  username: string;
  displayName: string | null;
  joinedAt: Date;
  serverId: string;
}

export interface PartialServerMemberData {
  userId: string;
  username: string;
  serverId: string;
}

// ─── CLIENT EVENT MAP ─────────────────────────────────────────────────────────

export interface ClientEvents {
  ready: [data: ReadyData];
  messageCreate: [message: MessageData];
  messageUpdate: [message: MessageUpdateData];
  messageDelete: [data: MessageDeleteData];
  interactionCreate: [interaction: Interaction];
  serverMemberAdd: [member: ServerMemberData];
  serverMemberRemove: [member: PartialServerMemberData];
  disconnect: [reason: string];
  reconnect: [];
  error: [error: Error];
}
