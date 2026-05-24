import type { Socket } from 'socket.io-client';
import type { Logger } from '../utils/Logger';

const HEARTBEAT_INTERVAL_MS = 45_000;

export class HeartbeatManager {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly socket: Socket,
    private readonly logger: Logger,
  ) {}

  start(): void {
    this.stop(); // Clear any existing timer
    this.timer = setInterval(() => {
      if (this.socket.connected) {
        this.socket.emit('heartbeat');
        this.logger.debug('💓 Heartbeat gönderildi');
      }
    }, HEARTBEAT_INTERVAL_MS);

    this.logger.debug('HeartbeatManager başlatıldı');
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.debug('HeartbeatManager durduruldu');
    }
  }
}
