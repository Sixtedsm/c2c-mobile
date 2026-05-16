<script setup>
import { computed, onMounted, ref, watch } from 'vue';
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

const docType = computed(() => route.params.type);
const docId = computed(() => route.params.id);
const docLang = computed(() => route.params.lang || 'fr');

const isSaved = computed(() =>
  offlineStore.isSaved(docType.value, docId.value, docLang.value)
);
const isDownloading = computed(() =>
  offlineStore.isDownloading(docType.value, docId.value, docLang.value)
);

// Two presentation modes:
// - 'offline' (Mes topos, or `?from=saved`): three field-oriented tabs
//   Description / Carte / Photos.
// - 'normal' (everything else): continuous c2c-style page in the order the
//   website renders it, varying by document type.
const isOfflineMode = computed(() => {
  if (route.query?.from === 'saved') return true;
  return isSaved.value;
});

const tabState = ref('description');

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

// Save flow with folder picker --------------------------------------------
const folderPickerOpen = ref(false);
const folderDraft = ref(null);

function openSaveSheet() {
  if (isDownloading.value) return;
  folderDraft.value = isSaved.value ? (savedEntry.value?.folderId || null) : null;
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

const OFFLINE_TABS = [
  { key: 'description', label: 'Description' },
  { key: 'carte', label: 'Carte' },
  { key: 'photos', label: 'Photos' },
];

// Outing-specific helpers --------------------------------------------------
const outingDate = computed(() => {
  if (docType.value !== 'outing') return null;
  const start = doc.value?.date_start;
  if (!start) return null;
  try {
    return new Date(start).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return start;
  }
});

const outingParticipants = computed(() => {
  const users = doc.value?.associations?.users;
  if (!Array.isArray(users)) return [];
  return users;
});

// For an outing, the parent route (the topo of which this is a report) is
// the headline association — display it prominently at the top of the page.
const outingParentRoute = computed(() => {
  if (docType.value !== 'outing') return null;
  return doc.value?.associations?.routes?.[0] || null;
});

watch(() => route.fullPath, load);
onMounted(load);
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero ---------------------------------------------------------------- -->
    <div class="relative">
      <div class="aspect-[16/10] w-full overflow-hidden" style="background: linear-gradient(135deg, #f0ece2, #d8d2c1);">
        <img v-if="cover" :src="cover" :alt="title" class="h-full w-full object-cover" />
        <svg
          v-else-if="!loading"
          class="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
          style="opacity: 0.4;"
        >
          <path d="M0 120 L80 50 L130 80 L200 20 L280 70 L340 40 L400 90 L400 120 Z" fill="#9ca48f" />
          <path d="M0 120 L60 90 L130 100 L200 70 L280 100 L340 85 L400 110 L400 120 Z" fill="#7d8675" />
        </svg>
      </div>

      <div class="absolute inset-x-0 top-0 flex items-center justify-between p-3"
        style="padding-top: calc(env(safe-area-inset-top) + 0.5rem)">
        <button
          class="inline-flex h-10 w-10 items-center justify-center text-c2c-text hover:bg-white"
          aria-label="Retour"
          style="background-color: rgba(255,255,255,0.92); border-radius: 50%;"
          @click="back"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          class="inline-flex h-10 w-10 items-center justify-center text-c2c-text hover:bg-white"
          :class="isSaved ? 'text-white' : ''"
          :style="isSaved ? 'background-color: #ff9933; border-radius: 50%;' : 'background-color: rgba(255,255,255,0.92); border-radius: 50%;'"
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

    <!-- Title card --------------------------------------------------------- -->
    <div class="relative -mt-6 px-4">
      <div class="card p-4">
        <h1 class="text-xl font-bold leading-tight text-c2c-text">{{ title }}</h1>
        <p v-if="summary" class="mt-1 text-sm text-zinc-600">{{ summary }}</p>
        <!-- Outing: date + parent route are the headline metadata. -->
        <div v-if="docType === 'outing' && (outingDate || outingParentRoute)" class="mt-2 flex items-center gap-2 text-xs text-zinc-600">
          <svg v-if="outingDate" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span v-if="outingDate">{{ outingDate }}</span>
        </div>
      </div>
    </div>

    <!-- Loading / error ---------------------------------------------------- -->
    <div v-if="loading" class="p-4">
      <div class="card animate-pulse space-y-2 p-4">
        <div class="h-3 w-3/4 bg-zinc-200" />
        <div class="h-3 w-full bg-zinc-200" />
        <div class="h-3 w-2/3 bg-zinc-200" />
      </div>
    </div>
    <div v-else-if="error" class="p-4">
      <div class="p-4 text-sm text-red-700" style="background-color: #fff5f5; border: 1px solid #fed7d7;">
        <p class="font-semibold">Topo indisponible</p>
        <p class="mt-1 opacity-80">{{ error }}</p>
      </div>
    </div>

    <!-- ============== OFFLINE MODE (Mes topos field view) ============== -->
    <template v-else-if="isOfflineMode">
      <div class="sticky top-0 z-20 mt-3 bg-white px-3" style="border-bottom: 1px solid rgba(0,0,0,0.12);">
        <div class="flex gap-3">
          <button
            v-for="tab in OFFLINE_TABS"
            :key="tab.key"
            class="border-b-2 px-2 py-2.5 text-sm font-medium transition-colors"
            :style="tabState === tab.key
              ? 'border-color: #ff9933; color: #4a4a4a;'
              : 'border-color: transparent; color: #9ca3af;'"
            @click="tabState = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <section v-if="tabState === 'description'" class="p-4">
        <DocLocaleSections :doc="doc" :type="docType" :lang="docLang" />
      </section>
      <section v-else-if="tabState === 'carte'" class="p-4">
        <TopoMapPanel :doc="doc" :active="true" />
      </section>
      <section v-else-if="tabState === 'photos'" class="p-4">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            v-for="img in galleryImages"
            :key="img.id"
            :href="img.full"
            target="_blank"
            rel="noopener"
            class="aspect-square overflow-hidden bg-zinc-100"
          >
            <img :src="img.src" alt="" class="h-full w-full object-cover" loading="lazy" />
          </a>
          <p v-if="!galleryImages.length" class="col-span-full text-center text-sm text-zinc-500">
            Aucune photo associée.
          </p>
        </div>
      </section>
    </template>

    <!-- ============== NORMAL MODE (c2c.org-style continuous page) ============== -->
    <template v-else>
      <!-- For an OUTING, the parent itinerary takes precedence — c2c.org puts
           it just below the date because it's the most useful link out. -->
      <section v-if="docType === 'outing' && outingParentRoute" class="px-4 pt-4">
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Itinéraire suivi
        </h2>
        <router-link
          :to="{ name: 'topo', params: { type: 'route', id: outingParentRoute.document_id, lang: docLang } }"
          class="card flex items-center gap-2 p-3"
        >
          <svg class="h-5 w-5 flex-none" style="color: #ff9933;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 19 4-7 4 4 5-8M3 21h18" />
          </svg>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-c2c-text">
              {{ outingParentRoute.locales?.[0]?.title || 'Itinéraire' }}
            </p>
            <p v-if="outingParentRoute.global_rating || outingParentRoute.ski_rating" class="text-xs text-zinc-500">
              {{ outingParentRoute.global_rating || outingParentRoute.ski_rating }}
            </p>
          </div>
          <svg class="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </router-link>
      </section>

      <section class="space-y-5 p-4">
        <!-- Bandeau caractéristiques. -->
        <DocCharacteristics :doc="doc" :type="docType" />

        <!-- Carte intégrée (suit immédiatement les caractéristiques sur c2c). -->
        <div v-if="doc?.geometry?.geom || doc?.geometry?.geom_detail">
          <h2 class="mb-2 text-base font-semibold uppercase tracking-wide" style="color: #4a4a4a; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 4px;">
            Carte
          </h2>
          <TopoMapPanel :doc="doc" />
        </div>

        <!-- Sections dynamiques (ordre c2c selon docType). -->
        <DocLocaleSections :doc="doc" :type="docType" :lang="docLang" />

        <!-- Participants (outing only). -->
        <div v-if="docType === 'outing' && outingParticipants.length">
          <h2 class="mb-2 text-base font-semibold uppercase tracking-wide" style="color: #4a4a4a; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 4px;">
            Participants
          </h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="u in outingParticipants" :key="u.document_id" class="pill">
              {{ u.name || u.forum_username || 'Anonyme' }}
            </li>
          </ul>
        </div>

        <!-- Photos -->
        <div v-if="galleryImages.length">
          <h2 class="mb-2 text-base font-semibold uppercase tracking-wide" style="color: #4a4a4a; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 4px;">
            Photos
          </h2>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <a
              v-for="img in galleryImages"
              :key="img.id"
              :href="img.full"
              target="_blank"
              rel="noopener"
              class="aspect-square overflow-hidden bg-zinc-100"
            >
              <img :src="img.src" alt="" class="h-full w-full object-cover" loading="lazy" />
            </a>
          </div>
        </div>

        <!-- Associations : sorties récentes (route), itinéraires associés (waypoint), etc. -->
        <DocAssociations :doc="doc" />

        <!-- Metadata footer (c2c always shows author + version) -->
        <div v-if="doc?.author" class="pt-4 text-xs text-zinc-500" style="border-top: 1px solid rgba(0,0,0,0.08);">
          Contribution
          <span v-if="doc.author.name || doc.author.username"> de
            <span class="font-medium">{{ doc.author.name || doc.author.username }}</span>
          </span>
          <span v-if="doc.version"> · v{{ doc.version }}</span>
        </div>
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
