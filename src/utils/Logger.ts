export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info:  1,
  warn:  2,
  error: 3,
  none:  4,
};

export class Logger {
  private readonly level: number;
  private readonly prefix: string;

  constructor(level: LogLevel = 'info', prefix = '[sesli/bot]') {
    this.level = LEVELS[level];
    this.prefix = prefix;
  }

  debug(msg: string): void {
    if (this.level <= LEVELS.debug) console.debug(`${this.prefix} [DEBUG] ${msg}`);
  }

  info(msg: string): void {
    if (this.level <= LEVELS.info) console.log(`${this.prefix} [INFO]  ${msg}`);
  }

  warn(msg: string): void {
    if (this.level <= LEVELS.warn) console.warn(`${this.prefix} [WARN]  ${msg}`);
  }

  error(msg: string): void {
    if (this.level <= LEVELS.error) console.error(`${this.prefix} [ERROR] ${msg}`);
  }
}
