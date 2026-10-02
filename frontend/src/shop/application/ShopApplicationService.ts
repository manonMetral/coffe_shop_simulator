import { applyEvent } from '../domain/applyEvent';
import type { ConnectionStatus } from '../domain/ConnectionStatus';
import { isJournalEvent, type JournalEntry } from '../domain/Journal';
import type { ShopGateway } from '../domain/ShopGateway';
import type { ShopState } from '../domain/ShopState';

export interface ShopView {
  readonly state: ShopState | null;
  readonly status: ConnectionStatus;
  /** The last events of the shop, the most recent first. */
  readonly journal: readonly JournalEntry[];
}

export const JOURNAL_SIZE = 50;

export class ShopApplicationService {
  private state: ShopState | null = null;
  private status: ConnectionStatus = 'connecting';
  private journal: JournalEntry[] = [];
  private nextEntryId = 1;

  constructor(private readonly gateway: ShopGateway) {}

  /** Follows the shop in real time: `onChange` is called with the new view after each update. */
  start(onChange: (view: ShopView) => void): void {
    const notify = () =>
      onChange({ state: this.state, status: this.status, journal: this.journal });

    this.gateway.connect({
      onMessage: (message) => {
        if (message.type === 'snapshot') {
          this.state = message.data;
        } else if (this.state) {
          this.state = applyEvent(this.state, message.data);
          if (isJournalEvent(message.data)) {
            const entry = {
              id: this.nextEntryId,
              day: this.state.day,
              time: this.state.time,
              event: message.data,
            };
            this.nextEntryId += 1;
            this.journal = [entry, ...this.journal].slice(0, JOURNAL_SIZE);
          }
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
