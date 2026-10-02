/** Reads the cash of the shop, which belongs to another bounded context. */
export interface CashReader {
  balanceCents(): Promise<number>;
}
