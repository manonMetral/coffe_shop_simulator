import { describe, expect, it } from 'vitest';
import router from './index';

describe('router', () => {
  it('resolves / to the home route', () => {
    expect(router.resolve('/').name).toBe('home');
  });
});
