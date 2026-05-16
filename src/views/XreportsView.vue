<script setup>
import { ref, computed } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { useDocList } from '@/composables/useDocList';
import { emptyFilters, filtersToParams, countActiveFilters, PARAM_OVERRIDES } from '@/composables/useFilters';

// Sérac (xreports) — incident reports from the C2C community. All content
// rendered here comes from the live API, not from local copy.

const filters = ref(emptyFilters());
const filtersOpen = ref(false);

const filterScope = {
  activities: true, areas: true,
  eventTypes: true, severity: true, participants: true,
  avalanche: true,
  elevation: true, dates: true,
  langs: true, quality: true,
};

const { docs, loading, loadingMore, error, hasMore, sentinel, reload } =
  useDocList('xreport', () => filtersToParams(filters.value, PARAM_OVERRIDES.xreport));

function applyFilters(newFilters) {
  filters.value = newFilters;
  reload();
}

const activeFilterCount = computed(() => countActiveFilters(filters.value));
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="flex items-center justify-between">
        <h1 class="page-title">Sérac</h1>
        <button
          class="relative inline-flex h-9 items-center gap-1.5 bg-zinc-100 px-3 text-sm font-medium text-c2c-text hover:bg-zinc-200"
          style="border-radius: 3px;"
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
      <p class="mt-1 text-xs text-zinc-500">
        Récits d'accidents et d'incidents partagés par la communauté
      </p>
    </header>

    <section class="space-y-2 p-3">
      <template v-if="loading">
        <div v-for="i in 5" :key="i" class="list-row animate-pulse">
          <div class="h-14 w-14 flex-none bg-zinc-200" />
          <div class="flex-1 space-y-1.5">
            <div class="h-4 w-3/4 bg-zinc-200" />
            <div class="h-3 w-1/2 bg-zinc-200" />
          </div>
        </div>
      </template>

      <template v-else-if="error">
        <div class="p-4 text-sm text-red-700" style="background-color: #fff5f5; border: 1px solid #fed7d7;">
          <p class="font-semibold">Chargement impossible.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="reload">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!docs.length">
        <div class="bg-white p-6 text-center text-sm text-zinc-500" style="border: 1px solid rgba(0,0,0,0.12);">
          Aucun récit avec ces filtres.
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="doc.document_id"
          :doc="doc"
          type="xreport"
          variant="compact"
          :show-save="false"
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
