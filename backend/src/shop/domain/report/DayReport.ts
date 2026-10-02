export interface DayReport {
  readonly day: number;
  /** Money earned by selling the drinks. */
  readonly salesCents: number;
  readonly tipsCents: number;
  /** Money spent buying ingredients. */
  readonly restockCostCents: number;
  readonly profitCents: number;
  readonly customersServed: number;
  readonly customersLostPatience: number;
  readonly customersLostOutOfStock: number;
  /** Average satisfaction of the customers who left, the ones who were not served counting for 0. */
  readonly averageSatisfactionPercent: number;
  readonly closingCashCents: number;
}
