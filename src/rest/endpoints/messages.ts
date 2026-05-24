import type { RestClient } from '../RestClient';

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  footer?: { text: string; iconURL?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  timestamp?: string; // ISO string
}

export interface SendMessageOptions {
  content?: string;
  embeds?: EmbedData[];
}

export interface EditMessageOptions {
  content?: string;
  embeds?: EmbedData[];
}

export class MessagesEndpoint {
  constructor(private readonly rest: RestClient) {}

  send(channelId: string, options: SendMessageOptions): Promise<unknown> {
    if (!options.content && (!options.embeds || options.embeds.length === 0)) {
      throw new Error('Message must have content or at least one embed');
    }
    return this.rest.post(`/channels/${channelId}/messages`, options);
  }

  edit(channelId: string, messageId: string, options: EditMessageOptions): Promise<unknown> {
    return this.rest.patch(`/channels/${channelId}/messages/${messageId}`, options);
  }

  delete(channelId: string, messageId: string): Promise<void> {
    return this.rest.delete<void>(`/channels/${channelId}/messages/${messageId}`);
  }
}
