import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

class FakeWebSocket {
  static urls: string[] = [];
  onopen = null;
  onmessage = null;
  onclose = null;
  close = vi.fn();

  constructor(url: string) {
    FakeWebSocket.urls.push(url);
  }
}

describe('main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('mounts the application on #app and follows the shop through the WebSocket', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.stubGlobal('WebSocket', FakeWebSocket);
    document.body.innerHTML = '<div id="app"></div>';

    await import('./main');
    await flushPromises();

    expect(document.querySelector('#app header nav')).not.toBeNull();
    expect(document.querySelector('#app .status-bar')).not.toBeNull();
    expect(FakeWebSocket.urls).toEqual([`ws://${window.location.host}/ws`]);
  });
});
