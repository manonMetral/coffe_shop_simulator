<script setup lang="ts">
import { computed } from 'vue';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
const inventory = computed(() => shop.view.state?.inventory ?? []);

/** Share of the stock that is left, from 0 to 1. */
const filling = (quantity: number, capacity: number) =>
  Math.min(1, Math.max(0, quantity / capacity));
</script>

<template>
  <section class="inventory" aria-label="Stock">
    <h2>Stock</h2>
    <ul>
      <li v-for="level in inventory" :key="level.ingredient" :class="{ low: level.low }">
        <span class="name">{{ level.ingredient }}</span>
        <span class="gauge" role="img" :aria-label="`${level.quantity} sur ${level.capacity}`">
          <span
            class="gauge-filling"
            :style="{ width: `${filling(level.quantity, level.capacity) * 100}%` }"
          />
        </span>
        <span class="quantity">{{ level.quantity }} / {{ level.capacity }}</span>
        <span v-if="level.low" class="alert">stock bas</span>
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
  grid-template-columns: 5rem 1fr 8rem 5rem;
  align-items: center;
  gap: 1rem;
}

.gauge {
  display: block;
  height: 0.6rem;
  background: #e8dccd;
  border-radius: 0.3rem;
  overflow: hidden;
}

.gauge-filling {
  display: block;
  height: 100%;
  background: #6b8f4e;
}

.low .gauge-filling {
  background: #c0392b;
}

.alert {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
