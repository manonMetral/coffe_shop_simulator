<script setup lang="ts">
import { computed } from 'vue';
import type { Server } from '../../domain/Server';
import type { Floater } from './sceneEffects';
import SceneCustomer from './SceneCustomer.vue';
import { DRINK_SYMBOLS, SERVER_SYMBOLS } from './sceneSymbols';

const props = defineProps<{
  server: Server;
  floaters: readonly Floater[];
}>();

/** Share of the preparation that is done, from 0 to 1. */
const progress = computed(() => {
  const order = props.server.order;
  if (!order || order.preparationMinutes === 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, 1 - order.remainingMinutes / order.preparationMinutes));
});
</script>

<template>
  <div class="station" :class="{ busy: server.order }">
    <div class="customer-slot">
      <SceneCustomer
        v-if="server.order"
        :id="server.order.customerId"
        :personality="server.order.personality"
        :drink="server.order.drink"
      />
    </div>
    <div class="worker">
      <span class="avatar" aria-hidden="true">{{ SERVER_SYMBOLS[server.name] }}</span>
      <span v-if="server.order" class="drink" aria-hidden="true">{{
        DRINK_SYMBOLS[server.order.drink]
      }}</span>
    </div>
    <span class="name">{{ server.name }}</span>
    <span v-if="server.order" class="progress" aria-hidden="true">
      <span class="progress-done" :style="{ width: `${progress * 100}%` }" />
    </span>
    <span v-else class="idle">libre</span>
    <span
      v-for="floater in floaters"
      :key="floater.id"
      class="floater"
      :class="floater.kind"
      role="status"
    >
      {{ floater.text }}
    </span>
  </div>
</template>

<style scoped>
.station {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  min-width: 6rem;
  padding: 0.5rem;
  background: #f1e3cf;
  border-radius: 0.5rem;
}

.customer-slot {
  min-height: 3.5rem;
}

.worker {
  position: relative;
}

.avatar {
  font-size: 2.2rem;
  line-height: 1;
}

.busy .avatar {
  display: inline-block;
  animation: work 0.8s ease-in-out infinite;
}

.drink {
  position: absolute;
  right: -1rem;
  bottom: -0.2rem;
  font-size: 1.2rem;
}

.name {
  font-weight: 600;
  font-size: 0.9rem;
}

.idle {
  font-size: 0.8rem;
  color: #6b8f4e;
}

.progress {
  display: block;
  width: 100%;
  height: 0.4rem;
  background: #e0cdb0;
  border-radius: 0.2rem;
  overflow: hidden;
}

.progress-done {
  display: block;
  height: 100%;
  background: #b5833f;
  transition: width 1s linear;
}

.floater {
  position: absolute;
  top: -0.5rem;
  left: 50%;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 2.5s ease-out forwards;
  pointer-events: none;
}

.floater.gain {
  color: #3f7a2a;
}

@keyframes work {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes float-up {
  from {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -2.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .busy .avatar,
  .floater {
    animation: none;
  }

  .progress-done {
    transition: none;
  }
}
</style>
