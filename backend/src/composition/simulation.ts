import type { WebSocketServer } from 'ws';
import { config } from '../config.js';
import { SimulationApplicationService } from '../simulation/application/SimulationApplicationService.js';
import { Calendar } from '../simulation/domain/Calendar.js';
import { InMemoryCalendarRepository } from '../simulation/infrastructure/secondary/InMemoryCalendarRepository.js';
import { IntervalTickScheduler } from '../simulation/infrastructure/secondary/IntervalTickScheduler.js';
import { ShopCashReader } from '../simulation/infrastructure/secondary/ShopCashReader.js';
import { SystemClock } from '../simulation/infrastructure/secondary/SystemClock.js';
import { WebSocketEventPublisher } from '../simulation/infrastructure/secondary/WebSocketEventPublisher.js';
import type { ShopModule } from './shop.js';

/** Wires the simulation bounded context: a clock that drives the days and a WebSocket broadcast. */
export function createSimulationModule(shop: ShopModule, webSocketServer: WebSocketServer) {
  const simulationService: SimulationApplicationService = new SimulationApplicationService(
    new InMemoryCalendarRepository(Calendar.start(config.dayLengthMinutes, config.dayStartHour)),
    new SystemClock(),
    new IntervalTickScheduler(),
    new WebSocketEventPublisher(webSocketServer, () => simulationService.getSnapshot()),
    new ShopCashReader(shop.finance),
    { timeScale: config.timeScale, tickIntervalMs: config.tickIntervalMs },
  );
  return simulationService;
}
