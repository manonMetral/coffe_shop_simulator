import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SceneCustomer from './SceneCustomer.vue';

const props = { id: 12, personality: 'Pressé', drink: 'Espresso' } as const;

describe('SceneCustomer', () => {
  it('shows the customer with the face of its personality and the drink it wants', () => {
    const wrapper = mount(SceneCustomer, { props });

    expect(wrapper.find('.avatar').text()).toBe('🏃');
    expect(wrapper.find('.bubble').text()).toBe('☕');
    expect(wrapper.find('.number').text()).toBe('#12');
  });

  it('has a description for the screen readers', () => {
    const wrapper = mount(SceneCustomer, {
      props: { ...props, personality: 'Généreux', drink: 'Latte' },
    });

    expect(wrapper.attributes('aria-label')).toBe('Client 12, Généreux, veut un Latte');
    expect(wrapper.find('.avatar').text()).toBe('🤗');
    expect(wrapper.find('.bubble').text()).toBe('🥛');
  });

  it('shows how much patience is left', () => {
    const wrapper = mount(SceneCustomer, { props: { ...props, patienceLeft: 0.75 } });

    expect(wrapper.find('.patience-left').attributes('style')).toContain('width: 75%');
    expect(wrapper.classes()).not.toContain('angry');
  });

  it('gets angry when the patience is almost over', () => {
    const wrapper = mount(SceneCustomer, { props: { ...props, patienceLeft: 0.2 } });

    expect(wrapper.classes()).toContain('angry');
  });

  it('keeps the gauge between empty and full', () => {
    expect(
      mount(SceneCustomer, { props: { ...props, patienceLeft: -1 } })
        .find('.patience-left')
        .attributes('style'),
    ).toContain('width: 0%');
    expect(
      mount(SceneCustomer, { props: { ...props, patienceLeft: 3 } })
        .find('.patience-left')
        .attributes('style'),
    ).toContain('width: 100%');
  });

  it('shows no gauge for a customer who is served', () => {
    const wrapper = mount(SceneCustomer, { props });

    expect(wrapper.find('.patience').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('angry');
  });
});
