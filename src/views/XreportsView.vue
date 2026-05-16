<script setup>
import { ref, computed } from 'vue';
import DocCard from '@/components/DocCard.vue';
import AdvancedFilters from '@/components/AdvancedFilters.vue';
import { useDocList } from '@/composables/useDocList';
import { emptyFilters, filtersToParams, countActiveFilters, PARAM_OVERRIDES } from '@/composables/useFilters';

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

// Static blocks reproducing the introductory content of camptocamp.org/xreports.
// Wording adapted from the public site; intent is to make Sérac legible to a
// first-time visitor without forcing them to read the website docs.
const INTRO_BLOCKS = [
  {
    key: 'about',
    title: 'Sérac, c\'est quoi ?',
    body:
      'Sérac est le module de partage de récits d\'incidents et d\'accidents en montagne. ' +
      'Toute personne ayant vécu ou été témoin d\'un événement peut publier un récit pour ' +
      'que la communauté en tire des leçons.',
    icon: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
  {
    key: 'witness',
    title: 'À quoi sert mon témoignage ?',
    body:
      'Chaque récit aide les pratiquant·es à mieux comprendre les pièges du terrain, ' +
      'les enchaînements de circonstances, les mécanismes de décision. Le but n\'est ni de juger ' +
      'ni de classer, mais de partager une expérience qui peut éviter le pire à d\'autres.',
    icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    key: 'great',
    title: 'Cas riches d\'enseignement',
    body:
      'Des récits sélectionnés par les modérateur·ices pour leur clarté, leur analyse et la ' +
      'qualité de l\'enseignement qu\'on peut en tirer.',
    icon: 'M12 2 15.09 8.26 22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    action: 'great',
  },
  {
    key: 'conditions',
    title: 'Conditions de déclaration',
    body:
      'Anonymat respecté, pas de mise en cause nominative, pas de procédure judiciaire en ' +
      'cours. Sérac n\'est ni un signalement officiel ni un substitut à la chaîne des secours.',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
];

// "Cas riches d'enseignement" → filter by qualityMin=great.
function showGreatCases() {
  filters.value = emptyFilters();
  filters.value.qualityMin = 'great';
  reload();
}
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="mb-1 flex items-center justify-between">
        <h1 class="page-title">Sérac</h1>
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
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Récits d'accidents et d'incidents partagés par la communauté
      </p>
    </header>

    <!-- Introductory blocks (page d'accueil Sérac) -->
    <section class="space-y-2 p-3 pb-1">
      <article
        v-for="block in INTRO_BLOCKS"
        :key="block.key"
        class="card flex items-start gap-3 p-4"
      >
        <div
          class="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl"
          :class="block.color"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="block.icon" />
          </svg>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold">{{ block.title }}</h3>
          <p class="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{{ block.body }}</p>
          <button
            v-if="block.action === 'great'"
            class="mt-2 text-xs font-medium text-brand-600 hover:underline"
            @click="showGreatCases"
          >
            Voir les cas riches d'enseignement →
          </button>
        </div>
      </article>
    </section>

    <!-- Listing -->
    <section class="space-y-2 p-3 pt-2">
      <h2 class="px-1 pb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Tous les récits
      </h2>

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
