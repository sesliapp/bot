import type { RestClient } from '../RestClient';
import type { SlashCommandBuilder } from '../../builders/SlashCommandBuilder';

export class CommandsEndpoint {
  constructor(
    private readonly rest: RestClient,
    private readonly botId: string,
  ) {}

  /** Registers (or replaces) all commands for this bot. */
  set(commands: SlashCommandBuilder[]): Promise<unknown> {
    return this.rest.put(`/bots/${this.botId}/commands`, {
      commands: commands.map((c) => c.toJSON()),
    });
  }

  /** Deletes a single command by name. */
  delete(commandName: string): Promise<void> {
    return this.rest.delete<void>(`/bots/${this.botId}/commands/${commandName}`);
  }

  /** Returns all currently registered commands. */
  list(): Promise<unknown[]> {
    return this.rest.get<unknown[]>(`/bots/${this.botId}/commands`);
  }
}
