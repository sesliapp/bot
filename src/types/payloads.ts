/**
 * Raw gateway event payloads — exactly what the backend sends.
 * All gateway events are wrapped in { op, t, d } envelope;
 * GatewayManager unwraps `.d` before forwarding to the Client.
 */

export interface GatewayEnvelope<T> {
  op: number;
  t: string;
  d: T;
}

// ─── READY ────────────────────────────────────────────────────────────────────

export interface ReadyPayload {
  bot: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  };
  servers: Array<{ id: string }>;
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export interface MessageCreatePayload {
  id: string;
  content: string;
  timestamp: string; // ISO date string
  channel_id: string;
  server_id: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    is_bot: boolean;
  };
}

export interface MessageUpdatePayload {
  id: string;
  content: string;
  edited_at: string | null;
  channel_id: string;
  server_id: string;
}

export interface MessageDeletePayload {
  id: string;
  channel_id: string;
  server_id: string;
}

// ─── INTERACTIONS ─────────────────────────────────────────────────────────────

export interface RawInteractionOption {
  name: string;
  type: number;
  value?: string | number | boolean;
}

export interface InteractionPayload {
  id: string;
  type: number;
  commandName: string;
  options: RawInteractionOption[];
  channelId: string;
  serverId: string;
  member: {
    userId: string;
    username: string;
  };
  token: string;
}

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export interface ServerMemberAddPayload {
  server_id: string;
  user: {
    userId: string;
    username: string;
    displayName: string | null;
    joinedAt: string;
  };
  joined_at: string;
}

export interface ServerMemberRemovePayload {
  server_id: string;
  user: {
    userId: string;
    username: string;
  };
}
