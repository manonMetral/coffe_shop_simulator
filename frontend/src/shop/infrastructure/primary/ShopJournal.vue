<script setup lang="ts">
import { computed } from 'vue';
import { describeEvent } from './describeEvent';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
const entries = computed(() =>
  shop.view.journal.flatMap((entry) => {
    const text = describeEvent(entry.event);
    return text === null ? [] : [{ id: entry.id, day: entry.day, time: entry.time, text }];
  }),
);
</script>

<template>
  <section class="journal" aria-label="Journal">
    <h2>Journal</h2>
    <p v-if="entries.length === 0" class="empty">Rien ne s'est encore passé.</p>
    <ol v-else>
      <li v-for="entry in entries" :key="entry.id">
        <span class="when">Jour {{ entry.day }} · {{ entry.time }}</span>
        <span class="text">{{ entry.text }}</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.25rem;
  max-height: 16rem;
  overflow-y: auto;
}

li {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 1rem;
  font-size: 0.9rem;
}

.when {
  color: #7a6a5e;
}

.empty {
  color: #7a6a5e;
}
</style>
