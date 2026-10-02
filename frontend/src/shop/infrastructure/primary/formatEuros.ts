const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatEuros(cents: number): string {
  return euros.format(cents / 100);
}
