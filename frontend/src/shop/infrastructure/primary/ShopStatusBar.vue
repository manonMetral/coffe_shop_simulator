<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { formatEuros } from './formatEuros';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
onMounted(() => shop.start());
onUnmounted(() => shop.stop());

const statusLabels = { connecting: 'Connexion…', open: 'Connecté', closed: 'Déconnecté' };
const statusLabel = computed(() => statusLabels[shop.view.status]);
</script>

<template>
  <div class="status-bar" role="status">
    <template v-if="shop.view.state">
      <span>Jour {{ shop.view.state.day }}</span>
      <span>{{ shop.view.state.time }}</span>
      <span>Caisse {{ formatEuros(shop.view.state.cashCents) }}</span>
    </template>
    <span v-else>En attente des données…</span>
    <span class="connection" :data-status="shop.view.status">{{ statusLabel }}</span>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #2b1d14;
  color: #faf5ef;
  border-radius: 0.5rem;
}

.connection {
  margin-left: auto;
  font-size: 0.85rem;
}

.connection[data-status='open'] {
  color: #8fd694;
}

.connection[data-status='closed'] {
  color: #ff8a80;
}
</style>
