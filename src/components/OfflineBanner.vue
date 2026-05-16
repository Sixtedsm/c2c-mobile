<script setup>
import { ref } from 'vue';

const dismissed = ref(false);
</script>

<template>
  <transition name="banner">
    <div
      v-if="!dismissed"
      class="sticky top-0 z-40 flex items-center gap-2 bg-amber-300 px-3 py-1.5 text-xs font-medium text-amber-950"
      role="status"
    >
      <svg class="h-4 w-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
        <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <router-link :to="{ name: 'saved' }" class="flex-1 underline-offset-2 hover:underline">
        Hors-ligne — accéder à mes topos sauvegardés
      </router-link>
      <button class="-mr-1 flex h-6 w-6 items-center justify-center rounded-full hover:bg-amber-400/40" :aria-label="'Fermer'" @click="dismissed = true">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
