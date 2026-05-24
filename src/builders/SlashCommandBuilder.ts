export type OptionType =
  | 'STRING'
  | 'INTEGER'
  | 'BOOLEAN'
  | 'USER'
  | 'CHANNEL'
  | 'ROLE'
  | 'NUMBER';

export interface CommandOptionChoice {
  name: string;
  value: string | number;
}

export interface CommandOptionData {
  type: OptionType;
  name: string;
  description: string;
  required?: boolean;
  choices?: CommandOptionChoice[];
  min_value?: number;
  max_value?: number;
  min_length?: number;
  max_length?: number;
}

export interface CommandData {
  name: string;
  description: string;
  type?: 'CHAT_INPUT' | 'USER' | 'MESSAGE';
  options?: CommandOptionData[];
  dmPermission?: boolean;
  nsfw?: boolean;
}

// ─── Option Builder ───────────────────────────────────────────────────────────

export class OptionBuilder {
  protected readonly data: Partial<CommandOptionData>;

  constructor(type: OptionType) {
    this.data = { type };
  }

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setRequired(required: boolean): this {
    this.data.required = required;
    return this;
  }

  addChoice(name: string, value: string | number): this {
    if (!this.data.choices) this.data.choices = [];
    this.data.choices.push({ name, value });
    return this;
  }

  setMinValue(min: number): this {
    this.data.min_value = min;
    return this;
  }

  setMaxValue(max: number): this {
    this.data.max_value = max;
    return this;
  }

  setMinLength(min: number): this {
    this.data.min_length = min;
    return this;
  }

  setMaxLength(max: number): this {
    this.data.max_length = max;
    return this;
  }

  toJSON(): CommandOptionData {
    if (!this.data.name || !this.data.description || !this.data.type) {
      throw new Error('Option must have name, description, and type');
    }
    return this.data as CommandOptionData;
  }
}

// ─── Slash Command Builder ────────────────────────────────────────────────────

export class SlashCommandBuilder {
  private readonly data: Partial<CommandData> = {};
  private readonly _options: OptionBuilder[] = [];

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setDmPermission(allowed: boolean): this {
    this.data.dmPermission = allowed;
    return this;
  }

  setNsfw(nsfw: boolean): this {
    this.data.nsfw = nsfw;
    return this;
  }

  addStringOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('STRING');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  addIntegerOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('INTEGER');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  addBooleanOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('BOOLEAN');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  addUserOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('USER');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  addChannelOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('CHANNEL');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  addNumberOption(fn: (opt: OptionBuilder) => OptionBuilder): this {
    const opt = new OptionBuilder('NUMBER');
    fn(opt);
    this._options.push(opt);
    return this;
  }

  toJSON(): CommandData {
    if (!this.data.name || !this.data.description) {
      throw new Error('Command must have name and description');
    }
    return {
      ...this.data,
      options: this._options.length > 0 ? this._options.map((o) => o.toJSON()) : undefined,
    } as CommandData;
  }
}
