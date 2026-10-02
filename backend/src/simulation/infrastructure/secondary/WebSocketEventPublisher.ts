import { WebSocket, type WebSocketServer } from 'ws';
import type { EventPublisher } from '../../domain/EventPublisher.js';
import type { SimulationEvent } from '../../domain/SimulationEvent.js';
import type { SnapshotProvider } from '../../domain/SnapshotProvider.js';

/**
 * Broadcasts the simulation events to every connected client.
 * A new client first receives a full snapshot, then the events.
 */
export class WebSocketEventPublisher implements EventPublisher {
  constructor(
    private readonly server: WebSocketServer,
    private readonly snapshotProvider: SnapshotProvider,
  ) {
    server.on('connection', (socket) => void this.sendSnapshot(socket));
  }

  publish(event: SimulationEvent): void {
    const message = JSON.stringify({ type: 'event', data: event });
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  private async sendSnapshot(socket: WebSocket): Promise<void> {
    const data = await this.snapshotProvider();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'snapshot', data }));
    }
  }
}
