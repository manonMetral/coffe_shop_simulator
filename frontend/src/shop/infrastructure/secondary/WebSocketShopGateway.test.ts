import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketShopGateway, webSocketUrl } from './WebSocketShopGateway';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn(() => this.onclose?.());

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }
}

function createGateway() {
  const handlers = { onMessage: vi.fn(), onStatus: vi.fn() };
  const gateway = new WebSocketShopGateway('ws://shop.test/ws', 1000);
  return { gateway, handlers };
}

describe('webSocketUrl', () => {
  it.each([
    ['http:', 'ws://localhost:5173/ws'],
    ['https:', 'wss://localhost:5173/ws'],
  ])('builds the url from %s', (protocol, expected) => {
    expect(webSocketUrl({ protocol, host: 'localhost:5173' })).toBe(expected);
  });
});

describe('WebSocketShopGateway', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects to the given url and reports the status', () => {
    const { gateway, handlers } = createGateway();

    gateway.connect(handlers);
    expect(FakeWebSocket.instances[0]?.url).toBe('ws://shop.test/ws');
    expect(handlers.onStatus).toHaveBeenLastCalledWith('connecting');

    FakeWebSocket.instances[0]?.onopen?.();
    expect(handlers.onStatus).toHaveBeenLastCalledWith('open');
  });

  it('forwards the parsed messages', () => {
    const { gateway, handlers } = createGateway();
    gateway.connect(handlers);

    FakeWebSocket.instances[0]?.onmessage?.({
      data: JSON.stringify({ type: 'event', data: { type: 'day-ended', day: 1 } }),
    });

    expect(handlers.onMessage).toHaveBeenCalledWith({
      type: 'event',
      data: { type: 'day-ended', day: 1 },
    });
  });

  it('reconnects after the connection is lost', () => {
    const { gateway, handlers } = createGateway();
    gateway.connect(handlers);

    FakeWebSocket.instances[0]?.onclose?.();
    expect(handlers.onStatus).toHaveBeenLastCalledWith('closed');
    expect(FakeWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(handlers.onStatus).toHaveBeenLastCalledWith('connecting');
  });

  it('does not reconnect once disconnected', () => {
    const { gateway, handlers } = createGateway();
    gateway.connect(handlers);

    gateway.disconnect();
    vi.advanceTimersByTime(5000);

    expect(FakeWebSocket.instances[0]?.close).toHaveBeenCalledOnce();
    expect(handlers.onStatus).toHaveBeenLastCalledWith('closed');
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('cancels a pending reconnection when disconnected', () => {
    const { gateway, handlers } = createGateway();
    gateway.connect(handlers);
    FakeWebSocket.instances[0]?.onclose?.();

    gateway.disconnect();
    vi.advanceTimersByTime(5000);

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it('can be disconnected before connecting', () => {
    expect(() => createGateway().gateway.disconnect()).not.toThrow();
  });

  it('uses a default reconnection delay of 2 seconds', () => {
    const handlers = { onMessage: vi.fn(), onStatus: vi.fn() };
    const gateway = new WebSocketShopGateway('ws://shop.test/ws');
    gateway.connect(handlers);
    FakeWebSocket.instances[0]?.onclose?.();

    vi.advanceTimersByTime(1999);
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});
