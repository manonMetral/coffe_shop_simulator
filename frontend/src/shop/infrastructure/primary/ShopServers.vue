<script setup lang="ts">
import { computed } from 'vue';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
const servers = computed(() => shop.view.state?.servers ?? []);

/** Share of the preparation that is done, from 0 to 1. */
const progress = (preparationMinutes: number, remainingMinutes: number) =>
  preparationMinutes === 0
    ? 1
    : Math.min(1, Math.max(0, 1 - remainingMinutes / preparationMinutes));
</script>

<template>
  <section class="servers" aria-label="Serveurs">
    <h2>Serveurs</h2>
    <ul>
      <li v-for="server in servers" :key="server.name" :class="{ busy: server.order }">
        <span class="name">{{ server.name }}</span>
        <span class="skills">{{ server.drinks.join(', ') }} · vitesse x{{ server.speed }}</span>
        <span v-if="server.order" class="status">
          prépare {{ server.order.drink }} (client #{{ server.order.customerId }})
          <span class="progress">
            <span
              class="progress-done"
              :style="{
                width: `${progress(server.order.preparationMinutes, server.order.remainingMinutes) * 100}%`,
              }"
            />
          </span>
        </span>
        <span v-else class="status idle">libre</span>
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
  grid-template-columns: 6rem 16rem 1fr;
  align-items: center;
  gap: 1rem;
}

.name {
  font-weight: 600;
}

.skills {
  color: #7a6a5e;
  font-size: 0.9rem;
}

.idle {
  color: #6b8f4e;
}

.progress {
  display: block;
  height: 0.5rem;
  margin-top: 0.25rem;
  background: #e8dccd;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-done {
  display: block;
  height: 100%;
  background: #b5833f;
}
</style>
