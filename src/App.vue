<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
import OfflineBanner from '@/components/OfflineBanner.vue';
import { useOnline } from '@vueuse/core';
import { useOfflineStore } from '@/stores/offline';

const route = useRoute();
const online = useOnline();
const offlineStore = useOfflineStore();

const hideBottomNav = computed(() => route.meta?.hideBottomNav === true);

onMounted(() => {
  // Hydrate the offline catalog as soon as the app boots so the saved list
  // is ready when the user opens the "Mes topos" tab.
  offlineStore.hydrate();
});
</script>

<template>
  <div class="relative flex min-h-screen flex-col mx-auto max-w-app">
    <OfflineBanner v-if="!online" />

    <!-- Each route renders inside a scrollable region above the bottom nav. -->
    <main class="flex-1 overflow-x-hidden">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <BottomNav v-if="!hideBottomNav" />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}
</style>
