import { applyEvent } from '../domain/applyEvent';
import type { ConnectionStatus } from '../domain/ConnectionStatus';
import type { ShopGateway } from '../domain/ShopGateway';
import type { ShopState } from '../domain/ShopState';

export interface ShopView {
  readonly state: ShopState | null;
  readonly status: ConnectionStatus;
}

export class ShopApplicationService {
  private state: ShopState | null = null;
  private status: ConnectionStatus = 'connecting';

  constructor(private readonly gateway: ShopGateway) {}

  /** Follows the shop in real time: `onChange` is called with the new view after each update. */
  start(onChange: (view: ShopView) => void): void {
    const notify = () => onChange({ state: this.state, status: this.status });

    this.gateway.connect({
      onMessage: (message) => {
        if (message.type === 'snapshot') {
          this.state = message.data;
        } else if (this.state) {
          this.state = applyEvent(this.state, message.data);
        }
        notify();
      },
      onStatus: (status) => {
        this.status = status;
        notify();
      },
    });
  }

  stop(): void {
    this.gateway.disconnect();
  }
}
