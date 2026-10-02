import type { ShopGateway, ShopGatewayHandlers } from '../../domain/ShopGateway';
import type { ShopMessage } from '../../domain/ShopMessage';

export function webSocketUrl(location: Pick<Location, 'protocol' | 'host'>): string {
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
}

/** Receives the shop messages through a WebSocket, and reconnects when the connection is lost. */
export class WebSocketShopGateway implements ShopGateway {
  private socket: WebSocket | undefined;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;

  constructor(
    private readonly url: string,
    private readonly reconnectDelayMs = 2000,
  ) {}

  connect(handlers: ShopGatewayHandlers): void {
    this.stopped = false;
    this.open(handlers);
  }

  disconnect(): void {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }

  private open(handlers: ShopGatewayHandlers): void {
    handlers.onStatus('connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => handlers.onStatus('open');
    socket.onmessage = (event) => handlers.onMessage(JSON.parse(String(event.data)) as ShopMessage);
    socket.onclose = () => {
      handlers.onStatus('closed');
      if (!this.stopped) {
        this.reconnectTimer = setTimeout(() => this.open(handlers), this.reconnectDelayMs);
      }
    };
  }
}
