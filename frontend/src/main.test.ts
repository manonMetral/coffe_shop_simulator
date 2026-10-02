import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('mounts the application on #app', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    document.body.innerHTML = '<div id="app"></div>';

    await import('./main');
    await flushPromises();

    expect(document.querySelector('#app header nav')).not.toBeNull();
  });
});
