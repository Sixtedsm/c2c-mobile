<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useC2cApi } from '@/composables/useC2cApi';
import { useOfflineStore } from '@/stores/offline';
import TopoMapPanel from '@/components/TopoMapPanel.vue';
import DocCharacteristics from '@/components/DocCharacteristics.vue';
import DocLocaleSections from '@/components/DocLocaleSections.vue';
import DocAssociations from '@/components/DocAssociations.vue';
import FolderPicker from '@/components/FolderPicker.vue';
import { useDocCover } from '@/composables/useDocCover';

const route = useRoute();
const router = useRouter();
const api = useC2cApi();
const offlineStore = useOfflineStore();

const doc = ref(null);
const loading = ref(true);
const error = ref(null);

// Two modes:
// - 'normal' (default, from Recherche/Récent/Topos): continuous c2c-style
//   layout — caractéristiques bandeau, dynamic sections, integrated map,
//   associations, comments. Mirrors the website.
// - 'offline' (explicit from Mes topos, or implicit when the doc is saved):
//   tabbed mode — Description / Carte / Photos. Optimised for field use.
const isOfflineMode = computed(() => {
  if (route.query?.from === 'saved') return true;
  return isSaved.value;
});

// Offline-mode tab state (only used when isOfflineMode is true).
const tabState = ref('main');
const swipePane = ref('description');
const swipeContainer = ref(null);

const docType = computed(() => route.params.type);
const docId = computed(() => route.params.id);
const docLang = computed(() => route.params.lang || 'fr');

const title = computed(() => {
  if (!doc.value) return '';
  if (doc.value.cooked?.title) return doc.value.cooked.title;
  const locales = doc.value.locales;
  if (Array.isArray(locales) && locales.length) {
    const m = locales.find((l) => l.lang === docLang.value) || locales[0];
    return m?.title || 'Sans titre';
  }
  return 'Sans titre';
});

const summary = computed(() => {
  const locales = doc.value?.locales;
  if (Array.isArray(locales) && locales.length) {
    const m = locales.find((l) => l.lang === docLang.value) || locales[0];
    return m?.summary || '';
  }
  return doc.value?.cooked?.summary || '';
});

// Hero image. Cooked docs include associations.images directly so this
// resolves immediately when the doc has at least one photo.
const docRefForCover = computed(() => doc.value);
const { url: cover } = useDocCover(docRefForCover, 'BI');

const galleryImages = computed(() => {
  const assoc = doc.value?.associations?.images;
  if (!Array.isArray(assoc)) return [];
  return assoc.map((img) => ({
    src: api.imageUrl(img, 'MI'),
    full: api.imageUrl(img, 'BI'),
    id: img.document_id,
  }));
});

const isSaved = computed(() =>
  offlineStore.isSaved(docType.value, docId.value, docLang.value)
);
const isDownloading = computed(() =>
  offlineStore.isDownloading(docType.value, docId.value, docLang.value)
);

const savedEntry = computed(() => {
  return offlineStore.savedDocs.find(
    (e) => e.type === docType.value
      && String(e.id) === String(docId.value)
      && e.lang === docLang.value
  );
});

async function load() {
  loading.value = true;
  error.value = null;
  doc.value = null;
  try {
    const result = await api.getCooked(docType.value, docId.value, docLang.value);
    doc.value = result;
  } catch (e) {
    const offline = await offlineStore.getDocument(docType.value, docId.value, docLang.value);
    if (offline) {
      doc.value = offline;
    } else {
      error.value = e?.message || 'Document indisponible.';
    }
  } finally {
    loading.value = false;
  }
}

// --- Save flow with folder picker ------------------------------------------
const folderPickerOpen = ref(false);
const folderDraft = ref(null);

function openSaveSheet() {
  if (isDownloading.value) return;
  if (isSaved.value) {
    // Manage an already-saved doc: same picker, in "move" mode.
    folderDraft.value = savedEntry.value?.folderId || null;
  } else {
    folderDraft.value = null;
  }
  folderPickerOpen.value = true;
}

async function onFolderSelected(folderId) {
  if (isSaved.value) {
    await offlineStore.moveToFolder(docType.value, docId.value, docLang.value, folderId);
  } else {
    await offlineStore.saveDocument({
      type: docType.value,
      id: docId.value,
      lang: docLang.value,
      folderId,
    });
  }
  folderPickerOpen.value = false;
}

async function onFolderRemove() {
  await offlineStore.removeDocument(docType.value, docId.value, docLang.value);
  folderPickerOpen.value = false;
}

function back() {
  if (window.history.length > 1) router.back();
  else router.push({ name: 'search' });
}

// --- Offline mode swipe pair (Description ↔ Carte) -------------------------
function scrollToPane(pane) {
  swipePane.value = pane;
  const el = swipeContainer.value;
  if (!el) return;
  el.scrollTo({ left: pane === 'carte' ? el.clientWidth : 0, behavior: 'smooth' });
}

function onSwipeScroll(e) {
  const el = e.target;
  const pane = el.scrollLeft > el.clientWidth / 2 ? 'carte' : 'description';
  if (pane !== swipePane.value) swipePane.value = pane;
}

function selectTab(key) {
  if (key === 'description' || key === 'carte') {
    if (tabState.value !== 'main') {
      tabState.value = 'main';
      nextTick(() => scrollToPane(key));
    } else {
      scrollToPane(key);
    }
  } else {
    tabState.value = key;
  }
}

const OFFLINE_TABS = [
  { key: 'description', label: 'Description' },
  { key: 'carte', label: 'Carte' },
  { key: 'photos', label: 'Photos' },
];

const activeTabKey = computed(() => {
  if (tabState.value === 'main') return swipePane.value;
  return tabState.value;
});

watch(() => route.fullPath, load);
onMounted(load);
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero -->
    <div class="relative">
      <div class="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-200 to-brand-500 dark:from-zinc-800 dark:to-zinc-700">
        <img v-if="cover" :src="cover" :alt="title" class="h-full w-full object-cover" />
      </div>

      <div class="absolute inset-x-0 top-0 flex items-center justify-between p-3"
        style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 backdrop-blur hover:bg-white"
          aria-label="Retour"
          @click="back"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 backdrop-blur hover:bg-white"
          :class="{ '!bg-brand-500 !text-white': isSaved }"
          :aria-label="isSaved ? 'Gérer le hors-ligne' : 'Sauvegarder hors-ligne'"
          @click="openSaveSheet"
        >
          <svg v-if="isDownloading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Title card -->
    <div class="relative -mt-6 px-4">
      <div class="card p-4">
        <h1 class="text-xl font-bold leading-tight">{{ title }}</h1>
        <p v-if="summary" class="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{{ summary }}</p>
      </div>
    </div>

    <!-- Loading / error -->
    <div v-if="loading" class="p-4">
      <div class="card animate-pulse space-y-2 p-4">
        <div class="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div class="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
        <div class="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
    <div v-else-if="error" class="p-4">
      <div class="card border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p class="font-semibold">Topo indisponible</p>
        <p class="mt-1 opacity-80">{{ error }}</p>
      </div>
    </div>

    <!-- =================== OFFLINE MODE (Mes topos) =================== -->
    <template v-else-if="isOfflineMode">
      <div class="sticky top-0 z-20 mt-3 border-b border-zinc-200 bg-white/95 px-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div class="flex gap-3">
          <button
            v-for="tab in OFFLINE_TABS"
            :key="tab.key"
            class="border-b-2 px-2 py-2.5 text-sm font-medium transition-colors"
            :class="
              activeTabKey === tab.key
                ? 'border-brand-500 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 dark:text-zinc-400'
            "
            @click="selectTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="tabState === 'main'" class="relative">
        <div
          ref="swipeContainer"
          class="flex snap-x snap-mandatory overflow-x-auto no-scrollbar overscroll-x-contain"
          @scroll.passive="onSwipeScroll"
        >
          <section class="w-full flex-none snap-start p-4">
            <DocLocaleSections :doc="doc" :lang="docLang" />
          </section>
          <section class="w-full flex-none snap-start p-4">
            <TopoMapPanel :doc="doc" :active="swipePane === 'carte'" />
          </section>
        </div>
        <div class="pointer-events-none flex justify-center gap-1.5 pb-3 pt-1">
          <span
            v-for="p in ['description', 'carte']"
            :key="p"
            class="h-1.5 w-1.5 rounded-full transition-colors"
            :class="swipePane === p ? 'bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-700'"
          />
        </div>
      </div>

      <section v-else-if="tabState === 'photos'" class="p-4">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            v-for="img in galleryImages"
            :key="img.id"
            :href="img.full"
            target="_blank"
            rel="noopener"
            class="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
          >
            <img :src="img.src" alt="" class="h-full w-full object-cover" loading="lazy" />
          </a>
          <p v-if="!galleryImages.length" class="col-span-full text-center text-sm text-zinc-500">
            Aucune photo associée.
          </p>
        </div>
      </section>
    </template>

    <!-- =================== NORMAL MODE (consultation) =================== -->
    <template v-else>
      <section class="space-y-5 p-4">
        <!-- Bandeau caractéristiques (activité, type, durée, cotations, etc.) -->
        <DocCharacteristics :doc="doc" :type="docType" />

        <!-- Sections dynamiques : description, historique, matériel, etc. -->
        <DocLocaleSections :doc="doc" :lang="docLang" />

        <!-- Carte intégrée -->
        <div v-if="doc?.geometry?.geom || doc?.geometry?.geom_detail">
          <h2 class="mb-2 text-base font-semibold tracking-tight">Carte</h2>
          <TopoMapPanel :doc="doc" />
        </div>

        <!-- Photos -->
        <div v-if="galleryImages.length">
          <h2 class="mb-2 text-base font-semibold tracking-tight">Photos</h2>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              v-for="img in galleryImages"
              :key="img.id"
              :href="img.full"
              target="_blank"
              rel="noopener"
              class="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
            >
              <img :src="img.src" alt="" class="h-full w-full object-cover" loading="lazy" />
            </a>
          </div>
        </div>

        <!-- Sorties récentes / itinéraires associés / points de passage / etc. -->
        <DocAssociations :doc="doc" />
      </section>
    </template>

    <FolderPicker
      v-model="folderDraft"
      :open="folderPickerOpen"
      :title="isSaved ? 'Déplacer / gérer' : 'Enregistrer dans…'"
      :show-remove="isSaved"
      @close="folderPickerOpen = false"
      @select="onFolderSelected"
      @remove="onFolderRemove"
    />
  </div>
</template>
