<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Five tabs matching the agreed nav. Icons stay inline SVG to avoid an icon
// library — keeps the bundle and the maintenance surface small.
const tabs = [
  {
    to: { name: 'search' },
    key: 'search',
    label: 'Recherche',
    icon: 'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  },
  {
    to: { name: 'recent' },
    key: 'recent',
    label: 'Récentes',
    icon: 'M12 8v4l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z',
  },
  {
    to: { name: 'saved' },
    key: 'saved',
    label: 'Mes topos',
    icon: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z',
  },
  {
    to: { name: 'profile' },
    key: 'profile',
    label: 'Moi',
    icon: 'M16 14a4 4 0 1 0-8 0m12 7c0-3.314-3.582-6-8-6s-8 2.686-8 6m16 0H4',
  },
  {
    to: { name: 'more' },
    key: 'more',
    label: 'Plus',
    icon: 'M4 6h16M4 12h16M4 18h16',
  },
];

const activeTab = computed(() => route.meta?.tab || null);
</script>

<template>
  <nav
    class="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <ul class="flex h-16 items-stretch justify-around">
      <li v-for="tab in tabs" :key="tab.key" class="flex-1">
        <router-link
          :to="tab.to"
          class="flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors"
          :class="
            activeTab === tab.key
              ? 'text-brand-500'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          "
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="tab.icon" />
          </svg>
          <span>{{ tab.label }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>
