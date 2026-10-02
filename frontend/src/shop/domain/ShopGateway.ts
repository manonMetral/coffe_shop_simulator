import type { ConnectionStatus } from './ConnectionStatus';
import type { ShopMessage } from './ShopMessage';

export interface ShopGatewayHandlers {
  onMessage(message: ShopMessage): void;
  onStatus(status: ConnectionStatus): void;
}

export interface ShopGateway {
  connect(handlers: ShopGatewayHandlers): void;
  disconnect(): void;
}
