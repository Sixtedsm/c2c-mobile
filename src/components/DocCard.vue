<script setup>
import { computed, toRef } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';
import { useOfflineStore } from '@/stores/offline';
import { activityLabel } from '@/constants/c2c';
import { useDocCover } from '@/composables/useDocCover';
import ActivityIcon from '@/components/ActivityIcon.vue';
import RatingBadge from '@/components/RatingBadge.vue';

const props = defineProps({
  doc: { type: Object, required: true },
  type: { type: String, required: true },
  // 'hero' (image-led card) | 'feed' (4:5 hero, used by Sorties récentes) |
  // 'compact' (dense list row matching camptocamp.org's listing rows)
  variant: { type: String, default: 'compact' },
  lang: { type: String, default: 'fr' },
  showSave: { type: Boolean, default: true },
});

const api = useC2cApi();
const offlineStore = useOfflineStore();

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
const primaryActivity = computed(() => activities.value[0] || null);

const isSaved = computed(() =>
  offlineStore.isSaved(props.type, props.doc.document_id, props.lang)
);
const isDownloading = computed(() =>
  offlineStore.isDownloading(props.type, props.doc.document_id, props.lang)
);

const elevationLabel = computed(() => {
  if (props.doc.height_diff_up) return `${props.doc.height_diff_up} m`;
  if (props.doc.elevation) return `${props.doc.elevation} m`;
  return null;
});

const primaryRating = computed(() => {
  return (
    props.doc.global_rating ||
    props.doc.ski_rating ||
    props.doc.rock_free_rating ||
    props.doc.engagement_rating ||
    null
  );
});

const secondaryRating = computed(() => {
  // If we already showed global_rating, show ski_rating as secondary for ski tours.
  const p = primaryRating.value;
  if (!p) return null;
  if (props.doc.ski_rating && props.doc.global_rating && p !== props.doc.ski_rating) {
    return props.doc.ski_rating;
  }
  if (props.doc.engagement_rating && p !== props.doc.engagement_rating) {
    return props.doc.engagement_rating;
  }
  return null;
});

const subtypeLabel = computed(() => {
  if (props.type === 'waypoint' && props.doc.waypoint_type) return props.doc.waypoint_type;
  if (props.type === 'article' && props.doc.categories?.length) return props.doc.categories[0];
  if (props.type === 'book' && props.doc.book_types?.length) return props.doc.book_types[0];
  return null;
});

const dateLabel = computed(() => {
  const d = props.doc.date_start || props.doc.date;
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
});

const author = computed(() => {
  const a = props.doc.author;
  if (!a) return null;
  return a.name || a.username || null;
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
  <!-- ============ HERO VARIANT (image-led card) ============ -->
  <article v-if="variant === 'hero'" class="card">
    <router-link :to="linkTo" class="block">
      <div class="relative aspect-[16/10] w-full overflow-hidden" style="background: linear-gradient(135deg, #f0ece2, #d8d2c1);">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="title"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
        <svg v-else class="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 400 120" preserveAspectRatio="none" style="opacity: 0.4;">
          <path d="M0 120 L80 50 L130 80 L200 20 L280 70 L340 40 L400 90 L400 120 Z" fill="#9ca48f" />
          <path d="M0 120 L60 90 L130 100 L200 70 L280 100 L340 85 L400 110 L400 120 Z" fill="#7d8675" />
        </svg>

        <button
          v-if="showSave"
          class="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center text-c2c-text hover:bg-white"
          :class="isSaved ? 'text-white' : ''"
          :style="isSaved ? 'background-color: #ff9933; border-radius: 50%;' : 'background-color: rgba(255,255,255,0.92); border-radius: 50%;'"
          :aria-label="isSaved ? 'Retirer du hors-ligne' : 'Sauvegarder hors-ligne'"
          @click.prevent.stop="toggleSave"
        >
          <svg v-if="isDownloading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
          </svg>
        </button>
      </div>

      <div class="space-y-1.5 p-3">
        <h3 class="line-clamp-2 text-base font-semibold leading-tight" style="color: #337ab7;">{{ title }}</h3>
        <p v-if="summary" class="line-clamp-2 text-xs text-zinc-600">{{ summary }}</p>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span v-for="activity in activities.slice(0, 2)" :key="activity" class="inline-flex items-center gap-1">
            <ActivityIcon :activity="activity" :size="13" />
            {{ activityLabel(activity) }}
          </span>
          <RatingBadge :rating="primaryRating" :secondary="secondaryRating" size="sm" />
          <span v-if="elevationLabel">{{ elevationLabel }} D+</span>
          <span v-if="dateLabel" class="ml-auto">{{ dateLabel }}</span>
        </div>
      </div>
    </router-link>
  </article>

  <!-- ============ FEED VARIANT (4:5 hero, used by Sorties récentes) ============ -->
  <article v-else-if="variant === 'feed'" class="card overflow-hidden">
    <router-link :to="linkTo" class="block">
      <div class="relative aspect-[4/5] w-full overflow-hidden" style="background: linear-gradient(135deg, #f0ece2, #d8d2c1);">
        <img
          v-if="coverImage"
          :src="coverImage"
          :alt="title"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
        <svg v-else class="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 400 200" preserveAspectRatio="none" style="opacity: 0.4;">
          <path d="M0 200 L80 80 L130 120 L200 40 L280 110 L340 70 L400 140 L400 200 Z" fill="#9ca48f" />
          <path d="M0 200 L60 140 L130 160 L200 110 L280 160 L340 130 L400 170 L400 200 Z" fill="#7d8675" />
        </svg>
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 text-white">
          <div class="flex flex-wrap items-center gap-1.5">
            <span v-for="a in activities" :key="a" class="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <ActivityIcon :activity="a" :size="11" />
              {{ activityLabel(a) }}
            </span>
            <span v-if="dateLabel" class="ml-auto text-[11px] font-medium opacity-90">{{ dateLabel }}</span>
          </div>
        </div>
      </div>
      <div class="space-y-1 p-3">
        <h3 class="line-clamp-2 text-base font-semibold leading-tight" style="color: #337ab7;">{{ title }}</h3>
        <p v-if="summary" class="line-clamp-2 text-xs text-zinc-600">{{ summary }}</p>
        <div v-if="author" class="pt-0.5 text-[11px] text-zinc-500">par {{ author }}</div>
      </div>
    </router-link>
  </article>

  <!-- ============ COMPACT VARIANT (dense list row, c2c-style) ============ -->
  <router-link v-else :to="linkTo" class="list-row block">
    <!-- Thumb: photo if available, otherwise the activity icon as identity. -->
    <div class="h-14 w-14 flex-none overflow-hidden" style="background: linear-gradient(135deg, #f0ece2, #d8d2c1);">
      <img v-if="thumbImage" :src="thumbImage" :alt="title" loading="lazy" class="h-full w-full object-cover" />
      <div v-else-if="primaryActivity" class="flex h-full w-full items-center justify-center">
        <ActivityIcon :activity="primaryActivity" :size="28" />
      </div>
      <svg v-else class="h-full w-full" viewBox="0 0 56 56" preserveAspectRatio="none" style="opacity: 0.5;">
        <path d="M0 56 L12 28 L22 38 L32 18 L42 32 L56 24 L56 56 Z" fill="#9ca48f" />
      </svg>
    </div>

    <div class="min-w-0 flex-1">
      <h3 class="truncate text-sm font-semibold" style="color: #337ab7;">{{ title }}</h3>
      <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
        <span v-for="a in activities.slice(0, 3)" :key="a" class="inline-flex items-center gap-1">
          <ActivityIcon :activity="a" :size="11" />
          {{ activityLabel(a) }}
        </span>
        <RatingBadge :rating="primaryRating" :secondary="secondaryRating" size="sm" />
        <span v-if="subtypeLabel" class="text-zinc-500">{{ subtypeLabel }}</span>
        <span v-if="elevationLabel">{{ elevationLabel }}</span>
        <span v-if="dateLabel" class="ml-auto">{{ dateLabel }}</span>
      </div>
      <p v-if="author" class="mt-0.5 truncate text-[11px] text-zinc-400">par {{ author }}</p>
    </div>

    <button
      v-if="showSave"
      class="flex h-9 w-9 flex-none items-center justify-center text-zinc-400 hover:bg-zinc-100"
      :class="isSaved ? '!text-brand-500' : ''"
      style="border-radius: 50%;"
      :aria-label="isSaved ? 'Retirer du hors-ligne' : 'Sauvegarder hors-ligne'"
      @click.prevent.stop="toggleSave"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
      </svg>
    </button>
  </router-link>
</template>
