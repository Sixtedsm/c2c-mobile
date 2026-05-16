<script setup>
// "Plus" hub. Every tile points at an INTERNAL route — the app stays
// self-contained. Icons revised to be visually distinct and recognizable.
const tiles = [
  {
    to: { name: 'topos' },
    label: 'Topos',
    desc: 'Itinéraires, sommets, points, sources, lacs…',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    // Mountain range icon — fits the "geographical catalog" idea better
    // than a graph/line.
    icon: 'M2 20h20L17 8l-3 5-4-7-8 14Z M14 13l3-5 5 12',
  },
  {
    to: { name: 'books' },
    label: 'Livres',
    desc: 'Topoguides référencés',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v15H6.5A2.5 2.5 0 0 0 4 19.5Z',
  },
  {
    to: { name: 'articles' },
    label: 'Articles',
    desc: 'Techniques, conseils, récits',
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    // Newspaper / multi-column article icon — distinct from the
    // bookmark/journal icon used elsewhere.
    icon: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h5',
  },
  {
    to: { name: 'xreports' },
    label: 'Sérac',
    desc: 'Récits d’accidents',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    icon: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  },
  {
    to: { name: 'forum' },
    label: 'Forum',
    desc: 'Discussions de la communauté',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
  },
  {
    to: { name: 'discussions' },
    label: 'Discussions diverses',
    desc: 'Sujets ouverts du forum',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    // Coffee-cup hint at "open-ended chat" — works whether the user reads
    // it as a chat balloon or a fireside conversation.
    icon: 'M3 8h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z M17 8h2a3 3 0 1 1 0 6h-2 M7 4v1 M11 4v1 M15 4v1',
  },
];
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Plus</h1>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Tout le contenu Camptocamp, intégré dans l'application
      </p>
    </header>

    <section class="p-3">
      <ul class="grid grid-cols-2 gap-3">
        <li v-for="tile in tiles" :key="tile.label">
          <router-link
            :to="tile.to"
            class="card flex h-full flex-col gap-2 p-4 transition-transform active:scale-[0.98]"
          >
            <div
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl"
              :class="tile.color"
            >
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="tile.icon" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold leading-tight">{{ tile.label }}</h3>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{{ tile.desc }}</p>
            </div>
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>
