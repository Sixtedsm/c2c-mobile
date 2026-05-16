<script setup>
import { computed, toRef } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';
import { useOfflineStore } from '@/stores/offline';
import { activityLabel } from '@/constants/c2c';
import { useDocCover } from '@/composables/useDocCover';

const props = defineProps({
  // Document object (any C2C type). Required.
  doc: { type: Object, required: true },
  // C2C document type ('route', 'outing', 'waypoint', 'article', 'book', 'xreport').
  type: { type: String, required: true },
  // 'hero' (default, image-led) | 'compact' (single row, thumbnail) |
  // 'feed' (insta-style 4:5 image, used by RecentOutings).
  variant: { type: String, default: 'hero' },
  lang: { type: String, default: 'fr' },
  // Whether to show the "save offline" button. Articles/books/xreports
  // are stored differently — keep the button off for now to avoid confusion.
  showSave: { type: Boolean, default: true },
});

const api = useC2cApi();
const offlineStore = useOfflineStore();

// Cover/thumb resolution: the listing payloads don't carry associations.images
// (only img_count). `useDocCover` falls back to a lazy `/images?d=<doc_id>`
// fetch when the doc has at least one image. Cached per session.
const docRef = toRef(props, 'doc');
const heroSize = computed(() => (props.variant === 'feed' ? 'BI' : 'MI'));
const { url: coverImage } = useDocCover(docRef, heroSize.value);
const { url: thumbImage } = useDocCover(docRef, 'SI');

const title = computed(() => {
  const locales = props.doc.locales;
  if (Array.isArray(locales) && locales.length) {
    const match = locales.find((l) => l.lang === props.lang) || locales[0];
    return match?.title || 'Sans titre';
  }
  return props.doc.title || 'Sans titre';
});

const summary = computed(() => {
  const locales = props.doc.locales;
  if (Array.isArray(locales) && locales.length) {
    const m = locales.find((l) => l.lang === props.lang) || locales[0];
    return m?.summary || '';
  }
  return '';
});

const activities = computed(() => props.doc.activities || []);

const isSaved = computed(() =>
  offlineStore.isSaved(props.type, props.doc.document_id, props.lang)
);
const isDownloading = computed(() =>
  offlineStore.isDownloading(props.type, props.doc.document_id, props.lang)
);

const elevationLabel = computed(() => {
  if (props.doc.height_diff_up) return `${props.doc.height_diff_up} m D+`;
  if (props.doc.elevation) return `${props.doc.elevation} m`;
  return null;
});

const difficultyLabel = computed(() => {
  return (
    props.doc.global_rating ||
    props.doc.ski_rating ||
    props.doc.rock_free_rating ||
    props.doc.engagement_rating ||
    null
  );
});

// Type-specific badge displayed on compact rows: waypoint kind, article
// category, etc. Helps the user scan a heterogenous list quickly.
const subtypeLabel = computed(() => {
  if (props.type === 'waypoint' && props.doc.waypoint_type) {
    return props.doc.waypoint_type;
  }
  if (props.type === 'article' && props.doc.categories?.length) {
    return props.doc.categories[0];
  }
  if (props.type === 'book' && props.doc.book_types?.length) {
    return props.doc.book_types[0];
  }
  return null;
});

const dateLabel = computed(() => {
  const d = props.doc.date_start || props.doc.date;
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
});

async function toggleSave() {
  if (isDownloading.value) return;
  if (isSaved.value) {
    await offlineStore.removeDocument(props.type, props.doc.document_id, props.lang);
  } else {
    await offlineStore.saveDocument({
      type: props.type,
      id: props.doc.document_id,
      lang: props.lang,
    });
  }
}

const linkTo = computed(() => ({
  name: 'topo',
  params: { type: props.type, id: props.doc.document_id, lang: props.lang },
}));
</script>

<template>
  <!-- ============ HERO VARIANT ============ -->
  <article v-if="variant === 'hero'" class="card">
    <router-link :to="linkTo" class="block">
      <div class="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-300 dark:from-zinc-800 dark:to-zinc-700">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="title"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-brand-700 dark:text-zinc-400">
          <svg class="h-12 w-12 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2 22 7.586-7.586a2 2 0 0 1 2.828 0L20 22M14 14l1.586-1.586a2 2 0 0 1 2.828 0L22 16M14 8h.01M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
          </svg>
        </div>

        <button
          v-if="showSave"
          class="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 backdrop-blur transition-colors hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-200"
          :class="{ '!bg-brand-500 !text-white': isSaved }"
          :aria-label="isSaved ? 'Retirer du hors-ligne' : 'Sauvegarder hors-ligne'"
          @click.prevent.stop="toggleSave"
        >
          <svg v-if="isDownloading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        </button>
      </div>

      <div class="space-y-2 p-3">
        <h3 class="line-clamp-2 text-base font-semibold leading-tight">{{ title }}</h3>
        <p v-if="summary" class="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{{ summary }}</p>
        <div class="flex flex-wrap items-center gap-1.5">
          <span v-for="activity in activities" :key="activity" class="pill-brand">
            {{ activityLabel(activity) }}
          </span>
          <span v-if="subtypeLabel" class="pill">{{ subtypeLabel }}</span>
          <span v-if="elevationLabel" class="pill">{{ elevationLabel }}</span>
          <span v-if="difficultyLabel" class="pill">{{ difficultyLabel }}</span>
          <span v-if="dateLabel" class="ml-auto text-xs text-zinc-500">{{ dateLabel }}</span>
        </div>
      </div>
    </router-link>
  </article>

  <!-- ============ FEED VARIANT (4:5 hero, used by Sorties récentes) ============ -->
  <article v-else-if="variant === 'feed'" class="card overflow-hidden">
    <router-link :to="linkTo" class="block">
      <div class="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="title"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-zinc-400">
          <svg class="h-16 w-16 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m2 22 7.586-7.586a2 2 0 0 1 2.828 0L20 22M14 14l1.586-1.586a2 2 0 0 1 2.828 0L22 16M14 8h.01M2 16V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" />
          </svg>
        </div>
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 text-white">
          <div class="flex flex-wrap items-center gap-1.5">
            <span
              v-for="a in activities"
              :key="a"
              class="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur"
            >{{ activityLabel(a) }}</span>
            <span v-if="dateLabel" class="ml-auto text-[11px] font-medium opacity-90">{{ dateLabel }}</span>
          </div>
        </div>
      </div>
      <div class="space-y-1 p-3">
        <h3 class="line-clamp-2 text-base font-semibold leading-tight">{{ title }}</h3>
        <p v-if="summary" class="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{{ summary }}</p>
      </div>
    </router-link>
  </article>

  <!-- ============ COMPACT VARIANT (no image or small thumb) ============ -->
  <router-link v-else :to="linkTo" class="list-row block">
    <div class="h-14 w-14 flex-none overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
      <img
        v-if="thumbImage"
        :src="thumbImage"
        :alt="title"
        loading="lazy"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-zinc-400">
        <svg class="h-6 w-6 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-medium">{{ title }}</h3>
      <div class="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span v-if="subtypeLabel" class="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
          {{ subtypeLabel }}
        </span>
        <span v-for="a in activities.slice(0, 2)" :key="a">{{ activityLabel(a) }}</span>
        <span v-if="elevationLabel">· {{ elevationLabel }}</span>
        <span v-if="difficultyLabel">· {{ difficultyLabel }}</span>
        <span v-if="dateLabel" class="ml-auto">{{ dateLabel }}</span>
      </div>
    </div>
    <button
      v-if="showSave"
      class="flex h-9 w-9 flex-none items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      :class="{ '!text-brand-500': isSaved }"
      :aria-label="isSaved ? 'Retirer du hors-ligne' : 'Sauvegarder hors-ligne'"
      @click.prevent.stop="toggleSave"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
      </svg>
    </button>
  </router-link>
</template>
