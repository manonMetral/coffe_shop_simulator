import { WebSocket, type WebSocketServer } from 'ws';
import type { EventPublisher } from '../../domain/EventPublisher.js';
import type { Logger } from '../../domain/Logger.js';
import type { BroadcastEvent } from '../../domain/BroadcastEvent.js';
import type { SnapshotProvider } from '../../domain/SnapshotProvider.js';

/**
 * Broadcasts the simulation events to every connected client.
 * A new client first receives a full snapshot, then the events.
 */
export class WebSocketEventPublisher implements EventPublisher {
  constructor(
    private readonly server: WebSocketServer,
    private readonly snapshotProvider: SnapshotProvider,
    private readonly logger: Logger,
  ) {
    server.on('connection', (socket) => {
      // Without a listener, an 'error' event on a socket would crash the process.
      socket.on('error', (error) => this.logger.error('WebSocket client error', error));
      void this.sendSnapshot(socket);
    });
  }

  publish(event: BroadcastEvent): void {
    const message = JSON.stringify({ type: 'event', data: event });
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  private async sendSnapshot(socket: WebSocket): Promise<void> {
    try {
      const data = await this.snapshotProvider();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'snapshot', data }));
      }
    } catch (error) {
      this.logger.error('Sending the snapshot failed', error);
    }
  }
}
