import EventEmitter from 'eventemitter3';
import { GatewayManager } from '../gateway/GatewayManager';
import { RestClient } from '../rest/RestClient';
import { MessagesEndpoint } from '../rest/endpoints/messages';
import { CommandsEndpoint } from '../rest/endpoints/commands';
import { Interaction } from '../structures/Interaction';
import { Logger, type LogLevel } from '../utils/Logger';
import type {
  ReadyPayload,
  MessageCreatePayload,
  MessageUpdatePayload,
  MessageDeletePayload,
  InteractionPayload,
  ServerMemberAddPayload,
  ServerMemberRemovePayload,
} from '../types/payloads';
import type {
  ClientEvents,
  ReadyData,
  MessageData,
  MessageUpdateData,
  MessageDeleteData,
  ServerMemberData,
  PartialServerMemberData,
} from '../types/events';

export interface ClientOptions {
  /** Bot token from the Developer Portal. */
  token: string;
  /** REST API base URL. Defaults to the production API. */
  baseUrl?: string;
  /** Gateway (Socket.IO) base URL. Defaults to the production API. */
  gatewayUrl?: string;
  /** Enable verbose debug logging. */
  debug?: boolean;
}

const DEFAULT_API_URL = 'https://api.sesli.app';

export class Client extends EventEmitter<ClientEvents> {
  /** Bot info — available after the "ready" event. */
  user: ReadyData['bot'] | null = null;

  /** Send, edit and delete messages in channels. */
  readonly messages: MessagesEndpoint;

  /**
   * Register and manage slash commands.
   * Available only after the "ready" event fires.
   */
  get commands(): CommandsEndpoint {
    if (!this._commands) {
      throw new Error(
        'client.commands is not available before the "ready" event. ' +
          'Call client.commands inside the ready handler.',
      );
    }
    return this._commands;
  }

  private readonly rest: RestClient;
  private readonly gateway: GatewayManager;
  private readonly logger: Logger;
  private _commands: CommandsEndpoint | null = null;

  constructor(options: ClientOptions) {
    super();

    if (!options.token) throw new Error('Bot token is required');

    const logLevel: LogLevel = options.debug ? 'debug' : 'info';
    this.logger = new Logger(logLevel);

    this.rest = new RestClient(
      options.baseUrl ?? DEFAULT_API_URL,
      options.token,
    );

    this.gateway = new GatewayManager(
      options.gatewayUrl ?? DEFAULT_API_URL,
      options.token,
      this.logger,
    );

    this.messages = new MessagesEndpoint(this.rest);

    this._bindGatewayEvents();
  }

  /**
   * Connects to the gateway and starts receiving events.
   * Returns `this` for chaining.
   */
  login(): this {
    this.logger.info("🔌 Gateway'e bağlanılıyor...");
    this.gateway.connect();
    return this;
  }

  /** Disconnects from the gateway and cleans up. */
  destroy(): void {
    this.gateway.destroy();
    this.removeAllListeners();
    this.logger.info('Bot durduruldu');
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _bindGatewayEvents(): void {

    this.gateway.on('READY', (payload: ReadyPayload) => {
      this.user = payload.bot;
      this._commands = new CommandsEndpoint(this.rest, payload.bot.id);

      const data: ReadyData = {
        bot: payload.bot,
        servers: payload.servers,
      };

      this.logger.info(`✅ ${payload.bot.username} hazır — ${payload.servers.length} sunucu`);
      this.emit('ready', data);
    });

    this.gateway.on('MESSAGE_CREATE', (payload: MessageCreatePayload) => {
      const message: MessageData = {
        id: payload.id,
        content: payload.content,
        channelId: payload.channel_id,
        serverId: payload.server_id,
        timestamp: new Date(payload.timestamp),
        author: {
          id: payload.author.id,
          username: payload.author.username,
          displayName: payload.author.displayName,
          isBot: payload.author.is_bot ?? false,
        },
      };
      this.emit('messageCreate', message);
    });

    this.gateway.on('MESSAGE_UPDATE', (payload: MessageUpdatePayload) => {
      const data: MessageUpdateData = {
        id: payload.id,
        content: payload.content,
        editedAt: payload.edited_at ? new Date(payload.edited_at) : null,
        channelId: payload.channel_id,
        serverId: payload.server_id,
      };
      this.emit('messageUpdate', data);
    });

    this.gateway.on('MESSAGE_DELETE', (payload: MessageDeletePayload) => {
      const data: MessageDeleteData = {
        messageId: payload.id,
        channelId: payload.channel_id,
        serverId: payload.server_id,
      };
      this.emit('messageDelete', data);
    });

    this.gateway.on('INTERACTION_CREATE', (payload: InteractionPayload) => {
      const interaction = new Interaction(payload, this.rest);
      this.emit('interactionCreate', interaction);
    });

    this.gateway.on('SERVER_MEMBER_ADD', (payload: ServerMemberAddPayload) => {
      const data: ServerMemberData = {
        userId: payload.user.userId,
        username: payload.user.username,
        displayName: payload.user.displayName,
        joinedAt: new Date(payload.joined_at),
        serverId: payload.server_id,
      };
      this.emit('serverMemberAdd', data);
    });

    this.gateway.on('SERVER_MEMBER_REMOVE', (payload: ServerMemberRemovePayload) => {
      const data: PartialServerMemberData = {
        userId: payload.user.userId,
        username: payload.user.username,
        serverId: payload.server_id,
      };
      this.emit('serverMemberRemove', data);
    });

    this.gateway.on('disconnect', (reason: string) => {
      this.emit('disconnect', reason);
    });

    this.gateway.on('reconnect', () => {
      this.emit('reconnect');
    });

    this.gateway.on('error', (error: Error) => {
      this.emit('error', error);
    });
  }
}
