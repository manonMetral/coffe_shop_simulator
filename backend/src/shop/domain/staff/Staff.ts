import { InvalidStaffError } from '../errors.js';
import type { Server } from './Server.js';

export class Staff {
  private readonly all: readonly Server[];

  constructor(servers: readonly Server[]) {
    if (servers.length === 0) {
      throw new InvalidStaffError('The shop needs at least one server');
    }
    if (new Set(servers.map((server) => server.name)).size !== servers.length) {
      throw new InvalidStaffError('Two servers cannot have the same name');
    }
    this.all = [...servers];
  }

  servers(): readonly Server[] {
    return this.all;
  }

  idleServers(): Server[] {
    return this.all.filter((server) => server.isIdle());
  }
}
