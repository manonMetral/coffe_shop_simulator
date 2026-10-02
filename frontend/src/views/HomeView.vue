<script setup lang="ts">
import { onMounted } from 'vue';
import { useHealthStore } from '../health/infrastructure/primary/useHealthStore';
import ShopQueue from '../shop/infrastructure/primary/ShopQueue.vue';
import ShopServers from '../shop/infrastructure/primary/ShopServers.vue';
import ShopStatusBar from '../shop/infrastructure/primary/ShopStatusBar.vue';

const health = useHealthStore();
onMounted(() => health.check());
</script>

<template>
  <ShopStatusBar />
  <h1>Coffee Shop Simulator ☕</h1>
  <ShopServers />
  <ShopQueue />
  <p>API : {{ health.status }}</p>
</template>
