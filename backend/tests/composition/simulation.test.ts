import { EventEmitter } from 'node:events';
import type { WebSocketServer } from 'ws';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function createSimulation() {
  vi.resetModules();
  const { createShopModule } = await import('../../src/composition/shop.js');
  const { createSimulationModule } = await import('../../src/composition/simulation.js');
  const webSocketServer = Object.assign(new EventEmitter(), { clients: new Set() });
  return createSimulationModule(createShopModule(), webSocketServer as unknown as WebSocketServer);
}

/** Lets 30 real minutes go by: at the default speed, the clock reaches 12:00 (240 simulated minutes). */
async function goToNoon(simulation: Awaited<ReturnType<typeof createSimulation>>) {
  simulation.start();
  vi.setSystemTime(Date.now() + 30 * 60_000);
  await simulation.tick();
  simulation.stop();
}

describe('the simulation module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('opens the shop at 08:00 on day 1', async () => {
    const simulation = await createSimulation();

    expect(await simulation.getSnapshot()).toMatchObject({
      day: 1,
      time: '08:00',
      rushHourMultiplier: 1,
    });
  });

  it('has a rush hour at noon by default, when the customers arrive 2.5 times more often', async () => {
    const simulation = await createSimulation();

    await goToNoon(simulation);

    expect(await simulation.getSnapshot()).toMatchObject({
      time: '12:00',
      rushHourMultiplier: 2.5,
    });
  });

  it('can have no rush hour at all', async () => {
    vi.stubEnv('RUSH_HOUR_DURATION_MINUTES', '0');
    const simulation = await createSimulation();

    await goToNoon(simulation);

    expect(await simulation.getSnapshot()).toMatchObject({ time: '12:00', rushHourMultiplier: 1 });
  });
});
