<script setup>
import { onMounted, ref } from 'vue';
import { useOfflineStore } from '@/stores/offline';

const offlineStore = useOfflineStore();
const storage = ref({ usage: 0, quota: 0 });

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

onMounted(async () => {
  await offlineStore.hydrate();
  storage.value = await offlineStore.estimateUsage();
});
</script>

<template>
  <div class="flex flex-col">
    <header class="px-4 pb-2 pt-3">
      <h1 class="text-2xl font-bold tracking-tight">Moi</h1>
    </header>

    <section class="space-y-3 p-3">
      <div class="card flex items-center gap-3 p-3">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xl font-bold text-white"
        >
          ?
        </div>
        <div class="flex-1">
          <p class="font-semibold">Non connecté</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            Connecte-toi pour publier des sorties.
          </p>
        </div>
        <a
          href="https://www.camptocamp.org/auth"
          target="_blank"
          rel="noopener"
          class="btn-primary !px-3 !py-2 text-sm"
          >Se connecter</a
        >
      </div>

      <div class="card divide-y divide-zinc-100 dark:divide-zinc-800">
        <div class="flex items-center justify-between p-3">
          <span class="text-sm">Topos sauvegardés</span>
          <span class="font-semibold tabular-nums">{{ offlineStore.savedCount }}</span>
        </div>
        <div class="flex items-center justify-between p-3">
          <span class="text-sm">Espace utilisé</span>
          <span class="font-semibold tabular-nums">{{ formatBytes(storage.usage) }}</span>
        </div>
        <div class="flex items-center justify-between p-3">
          <span class="text-sm">Quota navigateur</span>
          <span class="font-semibold tabular-nums">{{ formatBytes(storage.quota) }}</span>
        </div>
      </div>

      <div class="card divide-y divide-zinc-100 dark:divide-zinc-800">
        <a
          href="https://www.camptocamp.org"
          target="_blank"
          rel="noopener"
          class="flex items-center justify-between p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <span>Aller sur camptocamp.org</span>
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
        <a
          href="https://forum.camptocamp.org"
          target="_blank"
          rel="noopener"
          class="flex items-center justify-between p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          <span>Forum</span>
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      </div>

      <p class="px-2 pt-2 text-center text-xs text-zinc-400">
        Camptocamp PWA · prototype V2
      </p>
    </section>
  </div>
</template>
