<script setup>
import { ref, computed } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { useDocList } from '@/composables/useDocList';
import { emptyFilters, filtersToParams, countActiveFilters, PARAM_OVERRIDES } from '@/composables/useFilters';
import { ARTICLE_CATEGORIES } from '@/constants/c2c';

const filters = ref(emptyFilters());
const filtersOpen = ref(false);

const filterScope = {
  activities: true, areas: false,
  articleCategories: true, articleTypes: true,
  langs: true, quality: true,
};

const { docs, loading, loadingMore, error, hasMore, sentinel, reload } =
  useDocList('article', () => filtersToParams(filters.value, PARAM_OVERRIDES.article || {}));

function applyFilters(newFilters) {
  filters.value = newFilters;
  reload();
}

function quickCategory(key) {
  const list = filters.value.articleCategories;
  const idx = list.indexOf(key);
  if (idx === -1) list.push(key);
  else list.splice(idx, 1);
  reload();
}

const activeFilterCount = computed(() => countActiveFilters(filters.value));

// Featured category tiles — mirrors the "discover by topic" entry the site
// offers on the articles landing page. Tap = filter the list below.
const CATEGORY_TILES = [
  { key: 'technical', label: 'Technique', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'gear', label: 'Matériel', icon: 'M12 2v6m0 0 4 4m-4-4-4 4M4 14h16M4 18h16M4 22h16', color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  { key: 'mountain_environment', label: 'Environnement', icon: 'M2 22h20L13.71 3.86a2 2 0 0 0-3.42 0L2 22Z', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { key: 'stories', label: 'Récits', icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l7-3 7 3Z', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { key: 'soft_mobility', label: 'Mobilité douce', icon: 'M5.5 17a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-6.5-7 2-4h2l-2 4 4 4-2 5', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300' },
  { key: 'expeditions', label: 'Expéditions', icon: 'm6 19 4-7 4 4 5-8M3 21h18', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
];

function isCategoryActive(key) {
  return filters.value.articleCategories.includes(key);
}
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="mb-2 flex items-center justify-between">
        <h1 class="page-title">Articles</h1>
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

      <div class="-mx-4 overflow-x-auto no-scrollbar">
        <div class="flex gap-1.5 px-4 py-1">
          <button
            v-for="c in ARTICLE_CATEGORIES"
            :key="c.key"
            :class="isCategoryActive(c.key) ? 'chip-active' : 'chip'"
            @click="quickCategory(c.key)"
          >
            {{ c.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- Discover-by-topic grid (page d'accueil Articles). Each tile toggles a
         category filter. Same data, but visual entry that mirrors the site's
         "discover" affordance. -->
    <section class="px-3 pt-3">
      <h2 class="px-1 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Explorer par thème
      </h2>
      <ul class="grid grid-cols-3 gap-2">
        <li v-for="t in CATEGORY_TILES" :key="t.key">
          <button
            type="button"
            class="card flex h-full w-full flex-col items-start gap-1.5 p-3 text-left transition-transform active:scale-[0.98]"
            :class="{ 'ring-2 ring-brand-500': isCategoryActive(t.key) }"
            @click="quickCategory(t.key)"
          >
            <div class="inline-flex h-8 w-8 items-center justify-center rounded-lg" :class="t.color">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="t.icon" />
              </svg>
            </div>
            <span class="text-xs font-medium leading-tight">{{ t.label }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section class="space-y-3 p-3">
      <h2 class="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Tous les articles
      </h2>

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
          <p class="font-semibold">Chargement impossible.</p>
          <p class="mt-1 opacity-80">{{ error }}</p>
          <button class="btn-secondary mt-3" @click="reload">Réessayer</button>
        </div>
      </template>

      <template v-else-if="!docs.length">
        <div class="rounded-2xl bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Aucun article avec ces filtres.
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="doc.document_id"
          :doc="doc"
          type="article"
          variant="hero"
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
