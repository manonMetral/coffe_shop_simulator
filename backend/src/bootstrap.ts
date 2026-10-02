import { createServer, type Server } from 'node:http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { createShopModule } from './composition/shop.js';
import { createSimulationModule } from './composition/simulation.js';

/** Starts the HTTP API, the WebSocket endpoint (/ws) and the simulation. */
export function startServer(port: number, onListening: () => void): Server {
  const shop = createShopModule();
  const server = createServer(createApp(shop));
  const webSocketServer = new WebSocketServer({ server, path: '/ws' });
  const simulation = createSimulationModule(shop, webSocketServer);

  server.on('close', () => {
    simulation.stop();
    webSocketServer.close();
  });
  server.listen(port, onListening);
  simulation.start();
  return server;
}
