<script setup lang="ts">
import { computed } from 'vue';
import type { DrinkName, Personality } from '../../domain/Customer';
import { DRINK_SYMBOLS, PERSONALITY_SYMBOLS } from './sceneSymbols';

const props = defineProps<{
  id: number;
  personality: Personality;
  drink: DrinkName;
  /** Share of the patience that is left, from 0 to 1. Without it, the customer is served and no gauge is shown. */
  patienceLeft?: number;
}>();

const angry = computed(() => props.patienceLeft !== undefined && props.patienceLeft < 0.33);
const label = computed(() => `Client ${props.id}, ${props.personality}, veut un ${props.drink}`);
</script>

<template>
  <div class="customer" :class="{ angry }" role="img" :aria-label="label">
    <span class="bubble" aria-hidden="true">{{ DRINK_SYMBOLS[drink] }}</span>
    <span class="avatar" aria-hidden="true">{{ PERSONALITY_SYMBOLS[personality] }}</span>
    <span class="number" aria-hidden="true">#{{ id }}</span>
    <span v-if="patienceLeft !== undefined" class="patience" aria-hidden="true">
      <span
        class="patience-left"
        :style="{ width: `${Math.max(0, Math.min(1, patienceLeft)) * 100}%` }"
      />
    </span>
  </div>
</template>

<style scoped>
.customer {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.1rem;
  width: 3.5rem;
}

.avatar {
  font-size: 1.8rem;
  line-height: 1;
}

.bubble {
  position: absolute;
  top: -0.9rem;
  right: -0.2rem;
  font-size: 1rem;
  background: #fff;
  border-radius: 50%;
  padding: 0.05rem 0.2rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
}

.number {
  font-size: 0.7rem;
  color: #7a6a5e;
}

.patience {
  display: block;
  width: 100%;
  height: 0.3rem;
  background: #e8dccd;
  border-radius: 0.15rem;
  overflow: hidden;
}

.patience-left {
  display: block;
  height: 100%;
  background: #6b8f4e;
  transition: width 1s linear;
}

.angry .patience-left {
  background: #c0392b;
}

.angry .avatar {
  animation: shake 0.4s ease-in-out infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .angry .avatar {
    animation: none;
  }

  .patience-left {
    transition: none;
  }
}
</style>
