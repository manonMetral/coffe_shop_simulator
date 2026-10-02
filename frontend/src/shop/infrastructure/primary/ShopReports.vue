<script setup lang="ts">
import { computed } from 'vue';
import { formatEuros } from './formatEuros';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
/** The most recent day first. */
const reports = computed(() => [...(shop.view.state?.reports ?? [])].reverse());
</script>

<template>
  <section class="reports" aria-label="Bilans">
    <h2>Bilans des journées</h2>
    <p v-if="reports.length === 0" class="empty">Aucune journée terminée.</p>
    <table v-else>
      <thead>
        <tr>
          <th>Jour</th>
          <th>Ventes</th>
          <th>Pourboires</th>
          <th>Achats</th>
          <th>Bénéfice</th>
          <th>Servis</th>
          <th>Perdus</th>
          <th>Satisfaction</th>
          <th>Caisse</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="report in reports" :key="report.day">
          <td>{{ report.day }}</td>
          <td>{{ formatEuros(report.salesCents) }}</td>
          <td>{{ formatEuros(report.tipsCents) }}</td>
          <td>{{ formatEuros(report.restockCostCents) }}</td>
          <td :class="report.profitCents < 0 ? 'loss' : 'profit'">
            {{ formatEuros(report.profitCents) }}
          </td>
          <td>{{ report.customersServed }}</td>
          <td>{{ report.customersLostPatience + report.customersLostOutOfStock }}</td>
          <td>{{ report.averageSatisfactionPercent }} %</td>
          <td>{{ formatEuros(report.closingCashCents) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  padding: 0.25rem 0.75rem;
  text-align: right;
}

th:first-child,
td:first-child {
  text-align: left;
}

.profit {
  color: #3f7a2a;
}

.loss {
  color: #c0392b;
}

.empty {
  color: #7a6a5e;
}
</style>
