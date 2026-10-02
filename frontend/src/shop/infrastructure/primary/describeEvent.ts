import type { ShopEvent } from '../../domain/ShopMessage';
import { formatEuros } from './formatEuros';

/** A sentence for an event of the journal, or null for the events that are not written down. */
export function describeEvent(event: ShopEvent): string | null {
  switch (event.type) {
    case 'customer-arrived':
      return `#${event.customer.id} (${event.customer.personality}) arrive et veut un ${event.customer.drink}`;
    case 'customer-left':
      return event.reason === 'patience'
        ? `#${event.customerId} part, il a trop attendu`
        : `#${event.customerId} part, sa boisson n'est plus disponible`;
    case 'order-started':
      return `${event.server} prépare un ${event.drink} pour #${event.customerId}`;
    case 'order-delivered': {
      const tip = event.tipCents > 0 ? ` (+ ${formatEuros(event.tipCents)} de pourboire)` : '';
      return `${event.server} sert un ${event.drink} à #${event.customerId} : ${formatEuros(event.priceCents)}${tip}`;
    }
    case 'stock-low':
      return `Stock bas : ${event.ingredient} (${event.remaining} restants)`;
    case 'restock-ordered':
      return `Commande de ${event.quantity} ${event.ingredient} pour ${formatEuros(event.costCents)}`;
    case 'restock-delivered':
      return `Livraison de ${event.quantity} ${event.ingredient}`;
    case 'rush-hour-started':
      return `Début du rush : les clients arrivent ${event.multiplier} fois plus souvent`;
    case 'rush-hour-ended':
      return 'Fin du rush';
    case 'day-started':
      return `Début du jour ${event.day}`;
    case 'day-ended':
      return `Fin du jour ${event.day}`;
    case 'day-report':
      return `Bilan du jour ${event.report.day} : ${formatEuros(event.report.profitCents)} de bénéfice`;
    case 'clock-tick':
    case 'queue-updated':
    case 'servers-updated':
    case 'inventory-updated':
      return null;
  }
}
