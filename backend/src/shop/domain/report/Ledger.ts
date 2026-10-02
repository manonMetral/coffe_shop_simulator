import type { Money } from '../Money.js';
import type { DayReport } from './DayReport.js';

/** Keeps the accounts of the current day, and the reports of the days that are over. */
export class Ledger {
  private readonly closedDays: DayReport[] = [];
  private salesCents = 0;
  private tipsCents = 0;
  private restockCostCents = 0;
  private served = 0;
  private lostPatience = 0;
  private lostOutOfStock = 0;
  private satisfactionTotal = 0;

  reports(): readonly DayReport[] {
    return [...this.closedDays];
  }

  recordSale(price: Money, tip: Money, satisfactionPercent: number): void {
    this.salesCents += price.cents;
    this.tipsCents += tip.cents;
    this.served += 1;
    this.satisfactionTotal += satisfactionPercent;
  }

  recordRestock(cost: Money): void {
    this.restockCostCents += cost.cents;
  }

  recordLostCustomer(reason: 'patience' | 'out-of-stock'): void {
    if (reason === 'patience') {
      this.lostPatience += 1;
    } else {
      this.lostOutOfStock += 1;
    }
  }

  /** Ends the day: returns its report and starts the accounts of the next day from zero. */
  closeDay(day: number, closingCash: Money): DayReport {
    const customers = this.served + this.lostPatience + this.lostOutOfStock;
    const report: DayReport = {
      day,
      salesCents: this.salesCents,
      tipsCents: this.tipsCents,
      restockCostCents: this.restockCostCents,
      profitCents: this.salesCents + this.tipsCents - this.restockCostCents,
      customersServed: this.served,
      customersLostPatience: this.lostPatience,
      customersLostOutOfStock: this.lostOutOfStock,
      averageSatisfactionPercent:
        customers === 0 ? 0 : Math.round(this.satisfactionTotal / customers),
      closingCashCents: closingCash.cents,
    };
    this.closedDays.push(report);
    this.salesCents = 0;
    this.tipsCents = 0;
    this.restockCostCents = 0;
    this.served = 0;
    this.lostPatience = 0;
    this.lostOutOfStock = 0;
    this.satisfactionTotal = 0;
    return report;
  }
}
