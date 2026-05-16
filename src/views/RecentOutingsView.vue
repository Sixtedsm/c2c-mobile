<script setup>
import { computed, onMounted, ref } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { usePreferencesStore } from '@/stores/preferences';
import { useDocList } from '@/composables/useDocList';
import { activityLabel } from '@/constants/c2c';

const prefs = usePreferencesStore();
const filtersOpen = ref(false);
const prefsDraft = ref({});

function openFilters() {
  prefsDraft.value = JSON.parse(JSON.stringify(prefs.prefs));
  filtersOpen.value = true;
}

// Recent outings are always chronological (latest first) — the API order.
// No client-side sort: Sixte was explicit that this list is "sorties récentes"
// and shouldn't pretend to offer alternative orderings.
function buildParams() {
  if (!prefs.isEnabled) return {};
  return prefs.apiParams('outing');
}

const { docs, loading, loadingMore, error, hasMore, sentinel, reload } =
  useDocList('outing', buildParams);

async function toggleEnabled() {
  await prefs.setEnabled(!prefs.isEnabled);
  reload();
}

async function applyFilters(newFilters) {
  await prefs.update(newFilters);
  if (!prefs.isEnabled) await prefs.setEnabled(true);
  reload();
}

const filterScope = {
  activities: true, areas: true,
  ratings: true, elevation: true, heightDiff: true,
  orientations: true, seasons: true,
  outingConditions: true, dates: true,
  langs: true, quality: true,
};

const activeSummary = computed(() => {
  const p = prefs.prefs;
  const parts = [];
  if (p.activities.length) parts.push(p.activities.map(activityLabel).join(', '));
  if (p.areas.length) parts.push(p.areas.map((a) => a.name).join(', '));
  if (p.elevationMin != null || p.elevationMax != null) {
    parts.push(`${p.elevationMin ?? '?'}–${p.elevationMax ?? '?'} m`);
  }
  if (p.globalRatingMin || p.globalRatingMax) {
    parts.push(`Globale ${p.globalRatingMin || ''}–${p.globalRatingMax || ''}`);
  }
  return parts;
});

// Every outing in the feed uses the camptocamp.org-style card. The card
// itself handles the no-photo case (just omits the mosaic), so we don't
// need a variant switch anymore.

onMounted(async () => {
  await prefs.hydrate();
  reload();
});
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Sorties récentes</h1>

      <div class="mt-2 flex items-center gap-3 bg-white p-2.5"
        style="border: 1px solid rgba(0,0,0,0.12);">
        <button
          type="button"
          class="switch"
          :class="{ 'switch-on': prefs.isEnabled }"
          :aria-pressed="prefs.isEnabled"
          aria-label="Activer mes préférences"
          @click="toggleEnabled"
        >
          <span class="switch-thumb" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-c2c-text">Mes préférences</p>
          <p class="truncate text-xs text-zinc-500">
            {{
              prefs.isEnabled
                ? (activeSummary.length ? activeSummary.join(' · ') : 'Aucun filtre — règle tes préférences')
                : 'Fil global, toutes les sorties'
            }}
          </p>
        </div>
        <button
          class="inline-flex h-9 w-9 flex-none items-center justify-center bg-zinc-100 text-c2c-text hover:bg-zinc-200"
          aria-label="Modifier les préférences"
          @click="openFilters"
          style="border-radius: 3px;"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
      </div>
    </header>

    <section class="space-y-3 p-3">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="aspect-[16/10] w-full bg-zinc-200" />
          <div class="space-y-2 p-3">
            <div class="h-4 w-3/4 bg-zinc-200" />
            <div class="h-3 w-1/2 bg-zinc-200" />
          </div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="p-4 text-sm text-red-700" style="background-color: #fff5f5; border: 1px solid #fed7d7;">
          <p class="font-semibold">Impossible de charger.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="reload">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!docs.length">
        <div class="bg-white p-6 text-center text-sm text-zinc-500" style="border: 1px solid rgba(0,0,0,0.12);">
          {{ prefs.isEnabled ? 'Aucune sortie ne correspond à tes préférences.' : 'Aucune sortie récente.' }}
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="doc.document_id"
          :doc="doc"
          type="outing"
          variant="outing"
          :show-save="true"
        />
        <div ref="sentinel" class="h-8" />
        <div v-if="loadingMore" class="py-2 text-center text-sm text-zinc-500">
          Chargement…
        </div>
        <div v-else-if="!hasMore" class="py-2 text-center text-xs text-zinc-400">
          Fin du fil.
        </div>
      </template>
    </section>

    <AdvancedFilters
      v-model="prefsDraft"
      :open="filtersOpen"
      :scope="filterScope"
      @close="filtersOpen = false"
      @apply="applyFilters"
    />
  </div>
</template>
