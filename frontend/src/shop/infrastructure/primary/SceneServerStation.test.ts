import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Server } from '../../domain/Server';
import SceneServerStation from './SceneServerStation.vue';

const idle: Server = { name: 'Alice', speed: 1, drinks: ['Espresso'], order: null };
const busy: Server = {
  name: 'Bob',
  speed: 1.5,
  drinks: ['Latte'],
  order: {
    orderId: 3,
    customerId: 12,
    personality: 'Exigeant',
    drink: 'Latte',
    preparationMinutes: 4,
    remainingMinutes: 1,
  },
};

const mountStation = (
  server: Server,
  floaters: Parameters<typeof mount<typeof SceneServerStation>>[1] = {},
) => mount(SceneServerStation, { props: { server, floaters: [] }, ...floaters });

describe('SceneServerStation', () => {
  it('shows an idle server as free, with nobody at the counter', () => {
    const wrapper = mountStation(idle);

    expect(wrapper.find('.name').text()).toBe('Alice');
    expect(wrapper.find('.avatar').text()).toBe('👩‍🍳');
    expect(wrapper.find('.idle').text()).toBe('libre');
    expect(wrapper.find('.customer').exists()).toBe(false);
    expect(wrapper.find('.progress').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('busy');
  });

  it('shows the customer at the counter and the drink being prepared', () => {
    const wrapper = mountStation(busy);

    expect(wrapper.classes()).toContain('busy');
    expect(wrapper.find('.customer').attributes('aria-label')).toBe(
      'Client 12, Exigeant, veut un Latte',
    );
    expect(wrapper.find('.customer .patience').exists()).toBe(false);
    expect(wrapper.find('.drink').text()).toBe('🥛');
    expect(wrapper.find('.idle').exists()).toBe(false);
  });

  it('shows the progress of the preparation', () => {
    expect(mountStation(busy).find('.progress-done').attributes('style')).toContain('width: 75%');
  });

  it('keeps the progress between 0 and 100 percent', () => {
    const progressWith = (remainingMinutes: number) =>
      mountStation({ ...busy, order: { ...busy.order!, remainingMinutes } })
        .find('.progress-done')
        .attributes('style');

    expect(progressWith(-2)).toContain('width: 100%');
    expect(progressWith(10)).toContain('width: 0%');
  });

  it('copes with an instant preparation', () => {
    const wrapper = mountStation({
      ...busy,
      order: { ...busy.order!, preparationMinutes: 0, remainingMinutes: 0 },
    });

    expect(wrapper.find('.progress-done').attributes('style')).toContain('width: 100%');
  });

  it('shows the messages that float above the server', () => {
    const wrapper = mount(SceneServerStation, {
      props: {
        server: idle,
        floaters: [
          { id: 1, text: '+7,80 €', kind: 'gain', place: { zone: 'server', server: 'Alice' } },
        ],
      },
    });

    expect(wrapper.find('.floater').text()).toBe('+7,80 €');
    expect(wrapper.find('.floater').classes()).toContain('gain');
  });
});
