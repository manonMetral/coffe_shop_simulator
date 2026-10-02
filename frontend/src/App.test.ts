import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.vue';
import router from './router';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the navigation and the routed view', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, { global: { plugins: [createPinia(), router] } });

    expect(wrapper.find('nav a').text()).toBe('Accueil');
    expect(wrapper.find('h1').text()).toContain('Coffee Shop Simulator');
  });
});
