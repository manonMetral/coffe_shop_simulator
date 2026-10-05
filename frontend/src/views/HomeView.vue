<script setup lang="ts">
import ShopInventory from '../shop/infrastructure/primary/ShopInventory.vue';
import ShopJournal from '../shop/infrastructure/primary/ShopJournal.vue';
import ShopQueue from '../shop/infrastructure/primary/ShopQueue.vue';
import ShopReports from '../shop/infrastructure/primary/ShopReports.vue';
import ShopScene from '../shop/infrastructure/primary/ShopScene.vue';
import ShopServers from '../shop/infrastructure/primary/ShopServers.vue';
import ShopStatusBar from '../shop/infrastructure/primary/ShopStatusBar.vue';
</script>

<template>
  <ShopStatusBar />
  <h1>Coffee Shop Simulator ☕</h1>
  <ShopScene />
  <ShopServers />
  <ShopQueue />
  <ShopInventory />
  <ShopReports />
  <ShopJournal />
</template>
