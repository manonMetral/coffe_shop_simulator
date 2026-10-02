<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { formatEuros } from './formatEuros';
import SceneCustomer from './SceneCustomer.vue';
import { FLOATER_DURATION_MS, type Floater, floaterFor, MAX_VISIBLE_QUEUE } from './sceneEffects';
import SceneServerStation from './SceneServerStation.vue';
import { INGREDIENT_SYMBOLS } from './sceneSymbols';
import { useShopStore } from './useShopStore';

const shop = useShopStore();
const state = computed(() => shop.view.state);
const queue = computed(() => state.value?.queue ?? []);
const visibleQueue = computed(() => queue.value.slice(0, MAX_VISIBLE_QUEUE));
const hiddenCustomers = computed(() => queue.value.length - visibleQueue.value.length);
const servers = computed(() => state.value?.servers ?? []);
const inventory = computed(() => state.value?.inventory ?? []);
const rushHourMultiplier = computed(() => state.value?.rushHourMultiplier ?? 1);
const rush = computed(() => rushHourMultiplier.value > 1);

/** The sun crosses the sky from the opening to the closing of the shop. */
const sunStyle = computed(() => {
  const progress = state.value ? state.value.minuteOfDay / state.value.dayLengthMinutes : 0;
  return { left: `${progress * 100}%`, top: `${8 + 40 * (2 * progress - 1) ** 2}%` };
});

const patienceLeft = (waitedMinutes: number, patienceMinutes: number) =>
  Math.max(0, 1 - waitedMinutes / patienceMinutes);

const filling = (quantity: number, capacity: number) =>
  Math.min(1, Math.max(0, quantity / capacity));

const summary = computed(() => {
  const busy = servers.value.filter((server) => server.order).length;
  return `${queue.value.length} clients en attente, ${busy} serveurs occupés sur ${servers.value.length}`;
});

// Messages that float for a moment when something happens (a drink is paid, a customer leaves...).
const floaters = ref<Floater[]>([]);
const timers = new Set<ReturnType<typeof setTimeout>>();
let nextFloaterId = 1;
let lastEntryId = shop.view.journal[0]?.id ?? 0;

function float(floater: Omit<Floater, 'id'>) {
  const id = nextFloaterId;
  nextFloaterId += 1;
  floaters.value = [...floaters.value, { ...floater, id }];
  const timer = setTimeout(() => {
    timers.delete(timer);
    floaters.value = floaters.value.filter((current) => current.id !== id);
  }, FLOATER_DURATION_MS);
  timers.add(timer);
}

watch(
  () => shop.view.journal,
  (journal) => {
    // The journal starts with the most recent entry: show the new ones in the order they happened.
    const added = journal.filter((entry) => entry.id > lastEntryId).reverse();
    lastEntryId = journal[0]?.id ?? lastEntryId;
    for (const entry of added) {
      const floater = floaterFor(entry.event);
      if (floater) {
        float(floater);
      }
    }
  },
);

onUnmounted(() => timers.forEach(clearTimeout));

const floatersAtServer = (name: string) =>
  floaters.value.filter(
    (floater) => floater.place.zone === 'server' && floater.place.server === name,
  );
const floatersAt = (zone: 'entrance' | 'shelf') =>
  floaters.value.filter((floater) => floater.place.zone === zone);
</script>

<template>
  <section class="scene" :class="{ rush }" aria-label="Boutique">
    <p class="summary">{{ summary }}</p>

    <div class="sky" aria-hidden="true">
      <span class="sun" :style="sunStyle">☀️</span>
      <span v-if="rush" class="rush-banner">Rush hour x{{ rushHourMultiplier }}</span>
    </div>

    <div class="floor">
      <div class="entrance">
        <h3>Entrée</h3>
        <TransitionGroup name="customer" tag="ul" class="line">
          <li v-for="customer in visibleQueue" :key="customer.id">
            <SceneCustomer
              :id="customer.id"
              :personality="customer.personality"
              :drink="customer.drink"
              :patience-left="patienceLeft(customer.waitedMinutes, customer.patienceMinutes)"
            />
          </li>
        </TransitionGroup>
        <p v-if="hiddenCustomers > 0" class="more">+{{ hiddenCustomers }} autres</p>
        <span
          v-for="floater in floatersAt('entrance')"
          :key="floater.id"
          class="floater"
          :class="floater.kind"
          role="status"
        >
          {{ floater.text }}
        </span>
      </div>

      <div class="counter">
        <SceneServerStation
          v-for="server in servers"
          :key="server.name"
          :server="server"
          :floaters="floatersAtServer(server.name)"
        />
        <div v-if="state" class="register">
          <span aria-hidden="true">💰</span>
          <span :key="state.cashCents" class="cash">{{ formatEuros(state.cashCents) }}</span>
        </div>
      </div>

      <div class="shelf" aria-label="Étagère">
        <div
          v-for="level in inventory"
          :key="level.ingredient"
          class="jar"
          :class="{ low: level.low }"
          :title="`${level.ingredient} : ${level.quantity} / ${level.capacity}`"
        >
          <span class="jar-symbol" aria-hidden="true">{{
            INGREDIENT_SYMBOLS[level.ingredient]
          }}</span>
          <span class="jar-glass" aria-hidden="true">
            <span
              class="jar-filling"
              :style="{ height: `${filling(level.quantity, level.capacity) * 100}%` }"
            />
          </span>
          <span class="jar-name">{{ level.ingredient }}</span>
        </div>
        <span
          v-for="floater in floatersAt('shelf')"
          :key="floater.id"
          class="floater"
          :class="floater.kind"
          role="status"
        >
          {{ floater.text }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scene {
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(#cfe8f7, #faf5ef 45%);
  transition: background 1s;
}

.scene.rush {
  background: linear-gradient(#f7d3c4, #faf5ef 45%);
}

.summary {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.sky {
  position: relative;
  height: 4rem;
}

.sun {
  position: absolute;
  font-size: 2rem;
  transform: translate(-50%, 0);
  transition:
    left 1s linear,
    top 1s linear;
}

.rush-banner {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  padding: 0.2rem 0.8rem;
  background: #c0392b;
  color: #fff;
  border-radius: 1rem;
  font-weight: 700;
  animation: pulse 1s ease-in-out infinite;
}

.floor {
  display: grid;
  grid-template-columns: 8.5rem 1fr 7rem;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  min-height: 12rem;
}

.entrance {
  position: relative;
}

.entrance h3 {
  margin: 0 0 1.2rem;
  font-size: 0.9rem;
  color: #7a6a5e;
}

.line {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem 0.6rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.more {
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  color: #7a6a5e;
}

.counter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.75rem;
  background: #d9bf9a;
  border-radius: 0.5rem;
}

.register {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  font-weight: 700;
}

.cash {
  display: inline-block;
  animation: bump 0.6s ease-out;
}

.shelf {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  align-content: start;
  padding: 0.5rem;
  background: #e8d5b5;
  border-radius: 0.5rem;
}

.jar {
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  font-size: 0.7rem;
}

.jar-symbol {
  font-size: 1rem;
}

.jar-glass {
  display: flex;
  align-items: flex-end;
  width: 1.6rem;
  height: 2.4rem;
  background: rgb(255 255 255 / 60%);
  border: 2px solid #b5a28a;
  border-radius: 0.3rem;
  overflow: hidden;
}

.jar-filling {
  display: block;
  width: 100%;
  background: #6b8f4e;
  transition: height 1s linear;
}

.jar.low .jar-filling {
  background: #c0392b;
}

.jar.low .jar-glass {
  animation: pulse 1s ease-in-out infinite;
}

.floater {
  position: absolute;
  top: 0;
  left: 50%;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 2.5s ease-out forwards;
  pointer-events: none;
}

.floater.bad {
  color: #c0392b;
}

.floater.info {
  color: #2d6a9f;
}

.customer-enter-active,
.customer-leave-active,
.customer-move {
  transition: all 0.5s ease;
}

.customer-enter-from {
  opacity: 0;
  transform: translateX(-2rem);
}

.customer-leave-to {
  opacity: 0;
  transform: translateX(3rem);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes bump {
  0% {
    transform: scale(1.5);
    color: #3f7a2a;
  }
  100% {
    transform: scale(1);
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

@media (max-width: 40rem) {
  .floor {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rush-banner,
  .cash,
  .floater,
  .jar.low .jar-glass {
    animation: none;
  }

  .sun,
  .jar-filling,
  .customer-enter-active,
  .customer-leave-active,
  .customer-move {
    transition: none;
  }
}
</style>
