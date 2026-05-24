import type { RestClient } from '../rest/RestClient';
import type { InteractionPayload, RawInteractionOption } from '../types/payloads';
import type { EmbedData } from '../rest/endpoints/messages';

export interface InteractionReplyOptions {
  content?: string;
  embeds?: EmbedData[];
  /** Only visible to the user who triggered the command. */
  ephemeral?: boolean;
}

export class Interaction {
  readonly id: string;
  readonly type: number;
  readonly commandName: string;
  readonly channelId: string;
  readonly serverId: string;
  readonly token: string;
  readonly member: { userId: string; username: string };

  /** Whether reply() or deferReply() has already been called. */
  replied = false;
  /** Whether deferReply() has been called. */
  deferred = false;

  private readonly _optionMap: Map<string, RawInteractionOption['value']>;
  private readonly _rest: RestClient;

  constructor(payload: InteractionPayload, rest: RestClient) {
    this.id = payload.id;
    this.type = payload.type;
    this.commandName = payload.commandName;
    this.channelId = payload.channelId;
    this.serverId = payload.serverId;
    this.token = payload.token;
    this.member = payload.member;
    this._rest = rest;

    // Build option lookup map
    this._optionMap = new Map(
      (payload.options ?? []).map((opt) => [opt.name, opt.value]),
    );
  }

  /** Returns true if this is a slash command (CHAT_INPUT) interaction. */
  isCommand(): boolean {
    return this.type === 2;
  }

  // ─── Option Accessors ──────────────────────────────────────────────────────

  readonly options = {
    getString: (name: string, required = false): string | null => {
      return this._getOption<string>(name, required, (v) => String(v));
    },
    getInteger: (name: string, required = false): number | null => {
      return this._getOption<number>(name, required, (v) => Math.trunc(Number(v)));
    },
    getNumber: (name: string, required = false): number | null => {
      return this._getOption<number>(name, required, (v) => Number(v));
    },
    getBoolean: (name: string, required = false): boolean | null => {
      return this._getOption<boolean>(name, required, (v) => Boolean(v));
    },
    getUser: (name: string, required = false): string | null => {
      return this._getOption<string>(name, required, (v) => String(v));
    },
    getChannel: (name: string, required = false): string | null => {
      return this._getOption<string>(name, required, (v) => String(v));
    },
  };

  private _getOption<T>(
    name: string,
    required: boolean,
    cast: (v: NonNullable<RawInteractionOption['value']>) => T,
  ): T | null {
    const val = this._optionMap.get(name);
    if (val === undefined || val === null) {
      if (required) throw new Error(`Required option "${name}" is missing`);
      return null;
    }
    return cast(val);
  }

  // ─── Response Methods ──────────────────────────────────────────────────────

  /**
   * Sends an immediate response to the interaction.
   * Must be called within 3 seconds of receiving the event.
   */
  async reply(options: string | InteractionReplyOptions): Promise<void> {
    if (this.replied) {
      throw new Error('Interaction has already been acknowledged');
    }

    const data = typeof options === 'string' ? { content: options } : options;

    await this._rest.post(`/interactions/${this.id}/callback`, {
      type: 'CHANNEL_MESSAGE_WITH_SOURCE',
      data: {
        content: data.content,
        embeds: data.embeds,
        flags: data.ephemeral ? 64 : undefined,
      },
    });

    this.replied = true;
  }

  /**
   * Defers the reply — tells the platform the bot is working on it.
   * Use editReply() to send the actual response afterwards.
   * Gives 15 minutes instead of 3 seconds.
   */
  async deferReply(options?: { ephemeral?: boolean }): Promise<void> {
    if (this.replied || this.deferred) {
      throw new Error('Interaction has already been acknowledged');
    }

    await this._rest.post(`/interactions/${this.id}/callback`, {
      type: 'DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE',
      data: {
        flags: options?.ephemeral ? 64 : undefined,
      },
    });

    this.deferred = true;
    this.replied = true;
  }

  /**
   * Edits the response after reply() or deferReply().
   */
  async editReply(options: string | Omit<InteractionReplyOptions, 'ephemeral'>): Promise<void> {
    const data = typeof options === 'string' ? { content: options } : options;

    await this._rest.patch(`/webhooks/${this.id}/${this.token}/messages/@original`, {
      content: data.content,
      embeds: data.embeds,
    });
  }
}
