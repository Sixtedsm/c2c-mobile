<script setup>
import { computed, onMounted, ref } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { emptyFilters, filtersToParams, countActiveFilters, PARAM_OVERRIDES } from '@/composables/useFilters';

const api = useC2cApi();

const query = ref('');
const activeType = ref('route');
const docs = ref([]);
const loading = ref(false);
const error = ref(null);
const searched = ref(false);

const filters = ref(emptyFilters());
const filtersOpen = ref(false);

const TYPE_OPTIONS = [
  { key: 'route', code: 'r', label: 'Itinéraires' },
  { key: 'outing', code: 'o', label: 'Sorties' },
  { key: 'waypoint', code: 'w', label: 'Points' },
];

// Scope adapts to the selected doc type so the sheet doesn't show irrelevant
// filter sections.
const filterScope = computed(() => {
  const t = activeType.value;
  if (t === 'waypoint') {
    return {
      activities: false, areas: true, waypointTypes: true,
      climbingOutdoorTypes: true, climbingIndoorTypes: true,
      climbingStyles: true, rockTypes: true,
      elevation: true, orientations: true, seasons: true,
      langs: true, quality: true,
    };
  }
  if (t === 'outing') {
    return {
      activities: true, areas: true,
      elevation: true, heightDiff: true,
      ratings: true, dates: true, outingConditions: true,
      langs: true, quality: true,
    };
  }
  return {
    activities: true, areas: true,
    routeTypes: true, configurations: true,
    glacierGear: true, rockTypes: true, climbingOutdoorTypes: true,
    elevation: true, heightDiff: true, routeLength: true, duration: true,
    ratings: true, orientations: true, seasons: true,
    langs: true, quality: true,
  };
});

async function runSearch() {
  loading.value = true;
  error.value = null;
  try {
    const q = query.value.trim();
    if (q.length >= 2) {
      // Full-text search. /search doesn't accept the rich filter set, so
      // filters are silently ignored when a text query is active.
      const typeOpt = TYPE_OPTIONS.find((t) => t.key === activeType.value);
      const result = await api.search(q, { types: [typeOpt.code], limit: 30 });
      const bucket = result[`${activeType.value}s`];
      docs.value = bucket?.documents || [];
      searched.value = true;
    } else {
      const params = {
        limit: 30,
        ...filtersToParams(filters.value, PARAM_OVERRIDES[activeType.value] || {}),
      };
      const result = await api.listDocuments(activeType.value, params);
      docs.value = result.documents || [];
      searched.value = false;
    }
  } catch (e) {
    error.value = e?.message || 'Une erreur est survenue.';
    docs.value = [];
  } finally {
    loading.value = false;
  }
}

let debounceTimer = null;
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 350);
}

function clearQuery() {
  query.value = '';
  clearTimeout(debounceTimer);
  runSearch();
}

function selectType(key) {
  if (activeType.value !== key) {
    activeType.value = key;
    runSearch();
  }
}

function applyFilters(newFilters) {
  filters.value = newFilters;
  runSearch();
}

const activeFilterCount = computed(() => countActiveFilters(filters.value));
const filtersIgnoredHint = computed(
  () => searched.value && activeFilterCount.value > 0
);

onMounted(runSearch);
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="mb-2 flex items-center justify-between">
        <h1 class="page-title">Recherche</h1>
        <button
          class="relative inline-flex h-9 items-center gap-1.5 rounded-full bg-zinc-100 px-3 text-sm font-medium dark:bg-zinc-800"
          @click="filtersOpen = true"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          Filtres
          <span v-if="activeFilterCount" class="ml-1 rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
            {{ activeFilterCount }}
          </span>
        </button>
      </div>

      <div class="relative mb-2">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="query"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Nom de sortie, sommet, voie…"
          class="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-10 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-brand-950"
          @input="onInput"
          @keydown.enter.prevent="runSearch"
        />
        <button
          v-if="query"
          class="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Effacer"
          @click="clearQuery"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="segmented">
        <button
          v-for="opt in TYPE_OPTIONS"
          :key="opt.key"
          class="segmented-btn"
          :class="{ 'segmented-btn-active': activeType === opt.key }"
          @click="selectType(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>

      <p
        v-if="filtersIgnoredHint"
        class="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      >
        Pendant une recherche par mot-clé, les filtres avancés ne sont pas appliqués.
      </p>
    </header>

    <section class="space-y-3 p-3">
      <p v-if="searched && !loading && !error" class="px-1 text-xs uppercase tracking-wider text-zinc-500">
        {{ docs.length }} résultat<span v-if="docs.length !== 1">s</span> pour « {{ query }} »
      </p>

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
          <p class="font-semibold">Recherche impossible.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="runSearch">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!docs.length">
        <div class="rounded-2xl bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {{ query ? 'Aucun résultat. Essaie d’autres mots-clés.' : 'Aucun résultat avec ces filtres.' }}
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="`${activeType}-${doc.document_id}`"
          :doc="doc"
          :type="activeType"
          variant="hero"
        />
      </template>
    </section>

    <AdvancedFilters
      v-model="filters"
      :open="filtersOpen"
      :scope="filterScope"
      @close="filtersOpen = false"
      @apply="applyFilters"
    />
  </div>
</template>
