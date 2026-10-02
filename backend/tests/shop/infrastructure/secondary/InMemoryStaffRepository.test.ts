import { describe, expect, it } from 'vitest';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { Server } from '../../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../../src/shop/domain/staff/ServerName.js';
import { Staff } from '../../../../src/shop/domain/staff/Staff.js';
import { InMemoryStaffRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryStaffRepository.js';

const staffOf = (name: ServerName) => new Staff([new Server(name, 1, [DrinkName.TEA])]);

describe('InMemoryStaffRepository', () => {
  it('returns the staff it was created with', async () => {
    const staff = staffOf(ServerName.ALICE);

    expect(await new InMemoryStaffRepository(staff).get()).toBe(staff);
  });

  it('replaces the staff on save', async () => {
    const repository = new InMemoryStaffRepository(staffOf(ServerName.ALICE));
    const other = staffOf(ServerName.BOB);

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});
