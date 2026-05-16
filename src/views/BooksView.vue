<script setup>
import { ref } from 'vue';
import DocCard from '@/components/DocCard.vue';
import { useDocList } from '@/composables/useDocList';

// Books = topoguides référencés sur C2C. The /books endpoint accepts very
// few filters — keep this view simple, a paginated list is what the user
// already gets on the website.
const filters = ref({});

const { docs, loading, loadingMore, error, hasMore, sentinel, reload } =
  useDocList('book', () => ({}));
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Livres</h1>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Topoguides et ouvrages référencés
      </p>
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
          Aucun livre référencé pour le moment.
        </div>
      </template>

      <template v-else>
        <DocCard
          v-for="doc in docs"
          :key="doc.document_id"
          :doc="doc"
          type="book"
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
  </div>
</template>
