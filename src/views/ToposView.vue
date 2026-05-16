<script setup>
import { ref, computed, watch } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { useDocList } from '@/composables/useDocList';
import { emptyFilters, filtersToParams, countActiveFilters, PARAM_OVERRIDES } from '@/composables/useFilters';

const docType = ref('route');

const TYPES = [
  { key: 'route', label: 'Itinéraires' },
  { key: 'waypoint', label: 'Points de passage' },
];

const filters = ref(emptyFilters());
const filtersOpen = ref(false);

// Each segmented control mode exposes the slice of filters relevant to it.
const filterScope = computed(() => {
  if (docType.value === 'waypoint') {
    return {
      activities: false, areas: true,
      waypointTypes: true,
      climbingOutdoorTypes: true, climbingIndoorTypes: true,
      climbingStyles: true, rockTypes: true,
      elevation: true, orientations: true, seasons: true,
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

const { docs, loading, loadingMore, error, hasMore, sentinel, reload } =
  useDocList(docType, () =>
    filtersToParams(filters.value, PARAM_OVERRIDES[docType.value] || {})
  );

watch(docType, () => reload());

function applyFilters(newFilters) {
  filters.value = newFilters;
  reload();
}

const activeFilterCount = computed(() => countActiveFilters(filters.value));
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="mb-2 flex items-center justify-between">
        <h1 class="page-title">Topos</h1>
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

      <div class="segmented">
        <button
          v-for="t in TYPES"
          :key="t.key"
          class="segmented-btn"
          :class="{ 'segmented-btn-active': docType === t.key }"
          @click="docType = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </header>

    <section class="space-y-2 p-3">
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="list-row animate-pulse">
          <div class="h-14 w-14 flex-none rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div class="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p class="font-semibold">Chargement impossible.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="reload">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!docs.length">
        <div class="rounded-2xl bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Aucun résultat avec ces filtres.
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="`${docType}-${doc.document_id}`"
          :doc="doc"
          :type="docType"
          variant="compact"
        />
        <div ref="sentinel" class="h-8" />
        <div v-if="loadingMore" class="py-2 text-center text-sm text-zinc-500">
          Chargement…
        </div>
        <div v-else-if="!hasMore" class="py-2 text-center text-xs text-zinc-400">
          Fin de la liste.
        </div>
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
