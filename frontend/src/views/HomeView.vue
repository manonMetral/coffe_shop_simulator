<script setup lang="ts">
import { onMounted } from 'vue';
import { useHealthStore } from '@/stores/health';

const health = useHealthStore();
onMounted(() => health.check());
</script>

<template>
  <h1>Coffee Shop Simulator ☕</h1>
  <p>API : {{ health.status }}</p>
</template>
