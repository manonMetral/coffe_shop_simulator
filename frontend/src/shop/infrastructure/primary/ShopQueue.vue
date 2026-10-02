<script setup lang="ts">
import { computed } from 'vue';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
const queue = computed(() => shop.view.state?.queue ?? []);

/** Share of the patience that is left, from 0 to 1. */
const patienceLeft = (waitedMinutes: number, patienceMinutes: number) =>
  Math.max(0, 1 - waitedMinutes / patienceMinutes);
</script>

<template>
  <section class="queue" aria-label="File d'attente">
    <h2>File d'attente ({{ queue.length }})</h2>
    <p v-if="queue.length === 0" class="empty">Personne n'attend.</p>
    <ul v-else>
      <li v-for="customer in queue" :key="customer.id">
        <span class="who">#{{ customer.id }} {{ customer.personality }}</span>
        <span class="drink">{{ customer.drink }}</span>
        <span
          class="patience"
          role="img"
          :aria-label="`Patience restante : ${Math.round(patienceLeft(customer.waitedMinutes, customer.patienceMinutes) * 100)} %`"
        >
          <span
            class="patience-left"
            :class="{ low: patienceLeft(customer.waitedMinutes, customer.patienceMinutes) < 0.33 }"
            :style="{
              width: `${patienceLeft(customer.waitedMinutes, customer.patienceMinutes) * 100}%`,
            }"
          />
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

li {
  display: grid;
  grid-template-columns: 12rem 6rem 1fr;
  align-items: center;
  gap: 1rem;
}

.empty {
  color: #7a6a5e;
}

.patience {
  display: block;
  height: 0.6rem;
  background: #e8dccd;
  border-radius: 0.3rem;
  overflow: hidden;
}

.patience-left {
  display: block;
  height: 100%;
  background: #6b8f4e;
}

.patience-left.low {
  background: #c0392b;
}
</style>
