import { startServer } from './bootstrap.js';
import { config } from './config.js';

startServer(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
