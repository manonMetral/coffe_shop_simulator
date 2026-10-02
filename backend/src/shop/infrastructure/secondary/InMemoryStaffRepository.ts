import type { Staff } from '../../domain/staff/Staff.js';
import type { StaffRepository } from '../../domain/staff/StaffRepository.js';

export class InMemoryStaffRepository implements StaffRepository {
  constructor(private staff: Staff) {}

  async get(): Promise<Staff> {
    return this.staff;
  }

  async save(staff: Staff): Promise<void> {
    this.staff = staff;
  }
}
