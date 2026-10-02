import type { Staff } from './Staff.js';

export interface StaffRepository {
  get(): Promise<Staff>;
  save(staff: Staff): Promise<void>;
}
