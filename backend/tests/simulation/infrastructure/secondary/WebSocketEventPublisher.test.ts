import { EventEmitter } from 'node:events';
import { WebSocket, type WebSocketServer } from 'ws';
import { describe, expect, it, vi } from 'vitest';
import type { SimulationSnapshot } from '../../../../src/simulation/domain/SimulationSnapshot.js';
import { WebSocketEventPublisher } from '../../../../src/simulation/infrastructure/secondary/WebSocketEventPublisher.js';

const snapshot: SimulationSnapshot = {
  day: 1,
  minuteOfDay: 0,
  time: '08:00',
  dayLengthMinutes: 480,
  cashCents: 30000,
};

const fakeSocket = (readyState: number) => ({ readyState, send: vi.fn() });

function createPublisher(clients: ReturnType<typeof fakeSocket>[] = []) {
  const server = Object.assign(new EventEmitter(), { clients: new Set(clients) });
  const publisher = new WebSocketEventPublisher(
    server as unknown as WebSocketServer,
    async () => snapshot,
  );
  return { server, publisher };
}

describe('WebSocketEventPublisher', () => {
  it('broadcasts an event to the clients whose connection is open', () => {
    const open = fakeSocket(WebSocket.OPEN);
    const closed = fakeSocket(WebSocket.CLOSED);
    const { publisher } = createPublisher([open, closed]);

    publisher.publish({ type: 'day-started', day: 2 });

    expect(open.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'event', data: { type: 'day-started', day: 2 } }),
    );
    expect(closed.send).not.toHaveBeenCalled();
  });

  it('sends a snapshot to a client that connects', async () => {
    const { server } = createPublisher();
    const socket = fakeSocket(WebSocket.OPEN);

    server.emit('connection', socket);

    await vi.waitFor(() =>
      expect(socket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'snapshot', data: snapshot }),
      ),
    );
  });

  it('does not send the snapshot to a client that left in the meantime', async () => {
    const { server } = createPublisher();
    const socket = fakeSocket(WebSocket.CLOSED);

    server.emit('connection', socket);
    await Promise.resolve();
    await Promise.resolve();

    expect(socket.send).not.toHaveBeenCalled();
  });
});
