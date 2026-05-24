import { io, Socket } from 'socket.io-client';
import EventEmitter from 'eventemitter3';
import { HeartbeatManager } from './HeartbeatManager';
import type { Logger } from '../utils/Logger';
import type {
  GatewayEnvelope,
  ReadyPayload,
  MessageCreatePayload,
  MessageUpdatePayload,
  MessageDeletePayload,
  InteractionPayload,
  ServerMemberAddPayload,
  ServerMemberRemovePayload,
} from '../types/payloads';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1_000;

// Internal event map (raw gateway events → typed payloads)
interface GatewayEvents {
  READY: [payload: ReadyPayload];
  MESSAGE_CREATE: [payload: MessageCreatePayload];
  MESSAGE_UPDATE: [payload: MessageUpdatePayload];
  MESSAGE_DELETE: [payload: MessageDeletePayload];
  INTERACTION_CREATE: [payload: InteractionPayload];
  SERVER_MEMBER_ADD: [payload: ServerMemberAddPayload];
  SERVER_MEMBER_REMOVE: [payload: ServerMemberRemovePayload];
  disconnect: [reason: string];
  reconnect: [];
  error: [error: Error];
}

export class GatewayManager extends EventEmitter<GatewayEvents> {
  private socket: Socket | null = null;
  private heartbeat: HeartbeatManager | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  constructor(
    private readonly gatewayUrl: string,
    private readonly token: string,
    private readonly logger: Logger,
  ) {
    super();
  }

  connect(): void {
    if (this.destroyed) throw new Error('GatewayManager has been destroyed');
    if (this.socket?.connected) return;

    // Namespace: /bot-gateway
    const url = `${this.gatewayUrl}/bot-gateway`;

    this.logger.debug(`Socket.IO bağlantısı başlatılıyor → ${url}`);

    this.socket = io(url, {
      transports: ['websocket'],
      auth: { token: this.token },
      reconnection: false, // Manual reconnect for full control
    });

    this.heartbeat = new HeartbeatManager(this.socket, this.logger);
    this.registerSocketListeners();
  }

  private registerSocketListeners(): void {
    const socket = this.socket!;

    socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.heartbeat!.start();
      this.logger.info('🟢 Gateway bağlantısı kuruldu');
    });

    socket.on('disconnect', (reason: string) => {
      this.heartbeat!.stop();
      this.logger.warn(`🔴 Bağlantı kesildi: ${reason}`);
      this.emit('disconnect', reason);

      // If the server intentionally disconnected (bad token etc.), don't retry
      if (reason === 'io server disconnect') {
        this.logger.error('Sunucu bağlantıyı kapattı. Token geçerli mi?');
        return;
      }

      this.scheduleReconnect();
    });

    socket.on('connect_error', (err: Error) => {
      this.logger.error(`Bağlantı hatası: ${err.message}`);
      this.scheduleReconnect();
    });

    // ─── Gateway Events ─────────────────────────────────────────────────────
    // Each event is wrapped in { op, t, d } — we unwrap before forwarding.

    socket.on('READY', (raw: GatewayEnvelope<ReadyPayload>) => {
      this.emit('READY', raw.d);
    });

    socket.on('MESSAGE_CREATE', (raw: GatewayEnvelope<MessageCreatePayload>) => {
      this.emit('MESSAGE_CREATE', raw.d);
    });

    socket.on('MESSAGE_UPDATE', (raw: GatewayEnvelope<MessageUpdatePayload>) => {
      this.emit('MESSAGE_UPDATE', raw.d);
    });

    socket.on('MESSAGE_DELETE', (raw: GatewayEnvelope<MessageDeletePayload>) => {
      this.emit('MESSAGE_DELETE', raw.d);
    });

    socket.on('INTERACTION_CREATE', (raw: GatewayEnvelope<InteractionPayload>) => {
      this.emit('INTERACTION_CREATE', raw.d);
    });

    socket.on('SERVER_MEMBER_ADD', (raw: GatewayEnvelope<ServerMemberAddPayload>) => {
      this.emit('SERVER_MEMBER_ADD', raw.d);
    });

    socket.on('SERVER_MEMBER_REMOVE', (raw: GatewayEnvelope<ServerMemberRemovePayload>) => {
      this.emit('SERVER_MEMBER_REMOVE', raw.d);
    });

    socket.on('heartbeat_ack', () => {
      this.logger.debug('💓 Heartbeat ACK alındı');
    });
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('Maksimum yeniden bağlanma denemesi aşıldı, vazgeçildi');
      this.emit('error', new Error('Max reconnect attempts reached'));
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.logger.info(
      `🔄 ${delay}ms sonra yeniden bağlanılıyor... (deneme ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
    );

    setTimeout(() => {
      if (this.destroyed) return;
      this.emit('reconnect');
      this.connect();
    }, delay);
  }

  destroy(): void {
    this.destroyed = true;
    this.heartbeat?.stop();
    this.socket?.disconnect();
    this.socket = null;
    this.removeAllListeners();
    this.logger.debug('GatewayManager destroy edildi');
  }
}
