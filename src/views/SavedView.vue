<script setup>
import { computed, onMounted, ref } from 'vue';
import { useOfflineStore } from '@/stores/offline';
import { useC2cApi } from '@/composables/useC2cApi';
import FolderPicker from '@/components/FolderPicker.vue';

const offlineStore = useOfflineStore();
const api = useC2cApi();
const storage = ref({ usage: 0, quota: 0 });
// Local search within saved topos — filters by title across folders.
const query = ref('');

function titleOf(entry) {
  const data = entry.data;
  if (data?.cooked?.title) return data.cooked.title;
  if (Array.isArray(data?.locales)) {
    const match = data.locales.find((l) => l.lang === entry.lang) || data.locales[0];
    if (match?.title) return match.title;
  }
  return 'Sans titre';
}

const filteredDocs = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return offlineStore.savedDocs;
  return offlineStore.savedDocs.filter((e) => titleOf(e).toLowerCase().includes(q));
});

const groupedByFolder = computed(() => {
  const list = filteredDocs.value;
  const groups = [];
  for (const folder of offlineStore.folders) {
    const entries = list.filter((e) => e.folderId === folder.id);
    groups.push({ id: folder.id, name: folder.name, entries });
  }
  const unfiled = list.filter((e) => !e.folderId);
  if (unfiled.length || !groups.length) {
    groups.push({ id: null, name: 'Sans dossier', entries: unfiled });
  }
  return groups;
});

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

// Cover image for a saved entry. Saved docs are cooked (have associations)
// when they exist; otherwise we fall back to the C2C proxy by document_id
// which works even without knowing the filename.
function coverOf(entry) {
  const assoc = entry.data?.associations?.images;
  if (Array.isArray(assoc) && assoc.length) {
    return api.imageUrl(assoc[0], 'SI');
  }
  return null;
}

// Folder picker state: shared between "new folder" and "move entry to folder".
const folderSheetOpen = ref(false);
const folderSheetMode = ref('create'); // 'create' | 'move'
const folderSheetEntry = ref(null);
const folderSheetDraft = ref(null);

function openNewFolderSheet() {
  folderSheetMode.value = 'create';
  folderSheetEntry.value = null;
  folderSheetDraft.value = null;
  folderSheetOpen.value = true;
}

function openMoveSheet(entry) {
  folderSheetMode.value = 'move';
  folderSheetEntry.value = entry;
  folderSheetDraft.value = entry.folderId || null;
  folderSheetOpen.value = true;
}

async function onFolderSelect(folderId) {
  if (folderSheetMode.value === 'move' && folderSheetEntry.value) {
    const e = folderSheetEntry.value;
    await offlineStore.moveToFolder(e.type, e.id, e.lang, folderId);
    folderSheetOpen.value = false;
  }
  // For 'create' mode, the folder is already created by FolderPicker; closing
  // is up to the user (they may want to move several after).
}

async function removeEntry() {
  if (!folderSheetEntry.value) return;
  const e = folderSheetEntry.value;
  await offlineStore.removeDocument(e.type, e.id, e.lang);
  folderSheetOpen.value = false;
  storage.value = await offlineStore.estimateUsage();
}

onMounted(async () => {
  await offlineStore.hydrate();
  storage.value = await offlineStore.estimateUsage();
});
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Mes topos</h1>
          <p class="text-xs text-zinc-500">
            {{ offlineStore.savedCount }} topos · {{ formatBytes(storage.usage) }} utilisés
          </p>
        </div>
        <button
          class="btn-primary !px-3 !py-2"
          :disabled="offlineStore.creatingFolder"
          :class="offlineStore.creatingFolder ? 'opacity-50' : ''"
          @click="openNewFolderSheet"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Dossier
        </button>
      </div>

      <!-- Local search bar — filters by title across all folders. -->
      <div v-if="offlineStore.savedDocs.length" class="relative mt-2">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="query"
          type="search"
          inputmode="search"
          placeholder="Rechercher dans mes topos…"
          class="w-full bg-white py-2 pl-9 pr-3 text-base placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none"
          style="border: 1px solid rgba(0,0,0,0.18); border-radius: 3px;"
        />
      </div>
    </header>

    <section class="space-y-5 p-3">
      <div
        v-if="!offlineStore.savedDocs.length"
        class="card flex flex-col items-center gap-2 p-8 text-center"
      >
        <svg class="h-12 w-12 text-zinc-300 dark:text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
        </svg>
        <p class="font-medium">Pas encore de topo enregistré</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">
          Sauvegarde un topo depuis la recherche pour le consulter hors-ligne en montagne.
        </p>
        <router-link to="/search" class="btn-primary mt-2">Rechercher</router-link>
      </div>

      <template v-else>
        <section v-for="group in groupedByFolder" :key="group.id || 'unfiled'">
          <header class="flex items-center gap-2 px-1 pb-1.5">
            <svg class="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="group.id ? 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z' : 'M3 6h18M3 12h18M3 18h18'" />
            </svg>
            <h2 class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {{ group.name }}
              <span class="ml-1 text-zinc-400">({{ group.entries.length }})</span>
            </h2>
          </header>

          <div v-if="!group.entries.length" class="px-3 py-2 text-xs italic text-zinc-400">
            Aucun topo
          </div>

          <ul v-else class="space-y-2">
            <li v-for="entry in group.entries" :key="`${entry.type}-${entry.id}-${entry.lang}`">
              <div class="card flex items-center gap-3 p-2.5">
                <router-link
                  :to="{ name: 'topo', params: { type: entry.type, id: entry.id, lang: entry.lang }, query: { from: 'saved' } }"
                  class="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div class="h-14 w-14 flex-none overflow-hidden bg-zinc-200">
                    <img v-if="coverOf(entry)" :src="coverOf(entry)" alt="" class="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate font-medium">{{ titleOf(entry) }}</h3>
                    <p class="text-xs text-zinc-500">
                      <span class="capitalize">{{ entry.type }}</span> · {{ entry.lang.toUpperCase() }}
                    </p>
                  </div>
                </router-link>
                <button
                  class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Actions"
                  @click="openMoveSheet(entry)"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </section>

    <FolderPicker
      v-model="folderSheetDraft"
      :open="folderSheetOpen"
      :title="folderSheetMode === 'move' ? 'Déplacer vers…' : 'Nouveau dossier'"
      :show-remove="folderSheetMode === 'move'"
      @close="folderSheetOpen = false"
      @select="onFolderSelect"
      @remove="removeEntry"
    />
  </div>
</template>
