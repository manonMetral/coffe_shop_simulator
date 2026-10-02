import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { startServer } from '../src/bootstrap.js';

describe('startServer', () => {
  let client: WebSocket | undefined;
  let server: ReturnType<typeof startServer> | undefined;

  afterEach(async () => {
    client?.close();
    if (server) {
      const closed = new Promise((resolve) => server?.once('close', resolve));
      server.close();
      server.closeAllConnections();
      await closed;
    }
  });

  it('serves the REST API and sends a snapshot to a WebSocket client', async () => {
    const listening = new Promise<void>((resolve) => {
      server = startServer(0, resolve);
    });
    await listening;
    const { port } = server?.address() as AddressInfo;

    const health = await fetch(`http://localhost:${port}/api/health`);
    expect(health.status).toBe(200);

    client = new WebSocket(`ws://localhost:${port}/ws`);
    const message = await new Promise((resolve) =>
      client?.once('message', (data) => resolve(JSON.parse(String(data)))),
    );
    expect(message).toEqual({
      type: 'snapshot',
      data: {
        day: 1,
        minuteOfDay: 0,
        time: '08:00',
        dayLengthMinutes: 480,
        cashCents: 30000,
        queue: [],
        servers: expect.any(Array),
      },
    });
  });

  it('sends the state of the queue at every tick', async () => {
    const listening = new Promise<void>((resolve) => {
      server = startServer(0, resolve);
    });
    await listening;
    const { port } = server?.address() as AddressInfo;
    const socket = new WebSocket(`ws://localhost:${port}/ws`);
    client = socket;

    const queueUpdate = await new Promise<{ type: string; queue: unknown[] }>((resolve) => {
      socket.on('message', (data) => {
        const message = JSON.parse(String(data));
        if (message.type === 'event' && message.data.type === 'queue-updated') {
          resolve(message.data);
        }
      });
    });

    expect(Array.isArray(queueUpdate.queue)).toBe(true);
  }, 5000);
});
