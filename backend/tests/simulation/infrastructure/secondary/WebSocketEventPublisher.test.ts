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
  queue: [],
};

const fakeSocket = (readyState: number) =>
  Object.assign(new EventEmitter(), { readyState, send: vi.fn() });

function createPublisher(
  clients: ReturnType<typeof fakeSocket>[] = [],
  snapshotProvider: () => Promise<SimulationSnapshot> = async () => snapshot,
) {
  const server = Object.assign(new EventEmitter(), { clients: new Set(clients) });
  const logger = { error: vi.fn() };
  const publisher = new WebSocketEventPublisher(
    server as unknown as WebSocketServer,
    snapshotProvider,
    logger,
  );
  return { server, publisher, logger };
}

describe('WebSocketEventPublisher', () => {
  it('broadcasts an event to the clients whose connection is open', () => {
    const open = fakeSocket(WebSocket.OPEN);
    const closed = fakeSocket(WebSocket.CLOSED);
    const { publisher } = createPublisher([open, closed]);

    const event = { type: 'day-started', day: 2 };
    publisher.publish(event);

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

  it('logs a snapshot failure instead of crashing', async () => {
    const failure = new Error('cash unavailable');
    const { server, logger } = createPublisher([], async () => {
      throw failure;
    });
    const socket = fakeSocket(WebSocket.OPEN);

    server.emit('connection', socket);

    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith('Sending the snapshot failed', failure),
    );
    expect(socket.send).not.toHaveBeenCalled();
  });

  it('logs a client socket error instead of crashing', () => {
    const { server, logger } = createPublisher();
    const socket = fakeSocket(WebSocket.OPEN);
    const failure = new Error('connection reset');

    server.emit('connection', socket);

    expect(() => socket.emit('error', failure)).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith('WebSocket client error', failure);
  });
});
