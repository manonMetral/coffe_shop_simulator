/** The accounts of a day that is over. */
export interface DayReport {
  readonly day: number;
  readonly salesCents: number;
  readonly tipsCents: number;
  readonly restockCostCents: number;
  readonly profitCents: number;
  readonly customersServed: number;
  readonly customersLostPatience: number;
  readonly customersLostOutOfStock: number;
  /** Average satisfaction of the customers who left, the ones who were not served counting for 0. */
  readonly averageSatisfactionPercent: number;
  readonly closingCashCents: number;
}
