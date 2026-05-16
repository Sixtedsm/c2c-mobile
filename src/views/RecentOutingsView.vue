<script setup>
import { computed, onMounted, ref } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { usePreferencesStore } from '@/stores/preferences';
import { useDocList } from '@/composables/useDocList';
import { activityLabel } from '@/constants/c2c';

const prefs = usePreferencesStore();
const filtersOpen = ref(false);
const sortOpen = ref(false);
// Local draft so the AdvancedFilters sheet edits without touching the store
// until the user hits "Appliquer". The sheet itself also keeps its own draft;
// this one just hands a starting value in.
const prefsDraft = ref({});

function openFilters() {
  prefsDraft.value = JSON.parse(JSON.stringify(prefs.prefs));
  filtersOpen.value = true;
}

// Sort modes. "Date" is the API default (chronological). The other modes do
// a client-side sort on the already-loaded page so the user feels the change
// immediately — for a full server-side sort we'd need new API params.
const SORT_OPTIONS = [
  { key: 'date', label: 'Date (récent)' },
  { key: 'date_old', label: 'Date (ancien)' },
  { key: 'rating', label: 'Cotation' },
  { key: 'elevation', label: 'Altitude' },
  { key: 'activity', label: 'Activité' },
];
const sortBy = ref('date');

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

// Apply uses the AdvancedFilters draft directly into the store.
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
  if (p.skiRatingMin || p.skiRatingMax) {
    parts.push(`Ski ${p.skiRatingMin || ''}–${p.skiRatingMax || ''}`);
  }
  if (p.rockFreeRatingMin || p.rockFreeRatingMax) {
    parts.push(`Libre ${p.rockFreeRatingMin || ''}–${p.rockFreeRatingMax || ''}`);
  }
  return parts;
});

function variantFor(doc) {
  const hasImage = Array.isArray(doc.associations?.images) && doc.associations.images.length;
  return hasImage ? 'hero' : 'compact';
}

// Compute the sorted view without mutating the underlying list (lets us keep
// pagination working — fresh pages are appended in chronological order then
// the full result is sorted again).
const sortedDocs = computed(() => {
  const list = docs.value.slice();
  switch (sortBy.value) {
    case 'date_old':
      return list.sort((a, b) => (a.date_start || '').localeCompare(b.date_start || ''));
    case 'rating':
      return list.sort((a, b) => (a.global_rating || '').localeCompare(b.global_rating || ''));
    case 'elevation':
      return list.sort((a, b) => (b.elevation || 0) - (a.elevation || 0));
    case 'activity':
      return list.sort((a, b) => (a.activities?.[0] || '').localeCompare(b.activities?.[0] || ''));
    case 'date':
    default:
      return list.sort((a, b) => (b.date_start || '').localeCompare(a.date_start || ''));
  }
});

const sortLabel = computed(() => SORT_OPTIONS.find((o) => o.key === sortBy.value)?.label);

function selectSort(key) {
  sortBy.value = key;
  sortOpen.value = false;
}

onMounted(async () => {
  await prefs.hydrate();
  reload();
});
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Sorties récentes</h1>

      <!-- Preferences row + sort button. -->
      <div class="mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900">
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
          <p class="text-sm font-medium">Mes préférences</p>
          <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {{
              prefs.isEnabled
                ? (activeSummary.length ? activeSummary.join(' · ') : 'Aucun filtre — règle tes préférences')
                : 'Fil global, toutes les sorties'
            }}
          </p>
        </div>
        <button
          class="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          aria-label="Modifier les préférences"
          @click="openFilters"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
      </div>

      <!-- Sort row — a dropdown that doesn't fight with the rest of the header. -->
      <div class="mt-2 flex items-center gap-2 text-xs">
        <span class="text-zinc-500 dark:text-zinc-400">Trier par</span>
        <div class="relative">
          <button
            class="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            @click="sortOpen = !sortOpen"
          >
            {{ sortLabel }}
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div
            v-if="sortOpen"
            class="absolute left-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-card dark:border-zinc-700 dark:bg-zinc-900"
            @click.stop
          >
            <button
              v-for="opt in SORT_OPTIONS"
              :key="opt.key"
              class="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
              :class="sortBy === opt.key ? 'font-semibold text-brand-600' : ''"
              @click="selectSort(opt.key)"
            >
              {{ opt.label }}
              <svg v-if="sortBy === opt.key" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <section class="space-y-3 p-3" @click="sortOpen = false">
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="card animate-pulse">
          <div class="aspect-[16/10] w-full bg-zinc-200 dark:bg-zinc-800" />
          <div class="space-y-2 p-3">
            <div class="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div class="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p class="font-semibold">Impossible de charger.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="reload">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!sortedDocs.length">
        <div class="rounded-2xl bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {{ prefs.isEnabled ? 'Aucune sortie ne correspond à tes préférences.' : 'Aucune sortie récente.' }}
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in sortedDocs"
          :key="doc.document_id"
          :doc="doc"
          type="outing"
          :variant="variantFor(doc)"
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
