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
  // 'compact' (default, dense list row) | 'outing' (camptocamp.org-style
  // outing card with header + photos + footer) | 'hero' (single large image
  // card kept for non-outing contexts that want one)
  variant: { type: String, default: 'compact' },
  lang: { type: String, default: 'fr' },
  showSave: { type: Boolean, default: true },
});

const api = useC2cApi();
const offlineStore = useOfflineStore();

const docRef = toRef(props, 'doc');
const { url: coverImage } = useDocCover(docRef, 'MI');
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

const elevationUpLabel = computed(() => {
  if (props.doc.height_diff_up) return `${props.doc.height_diff_up} m`;
  return null;
});
const elevationDownLabel = computed(() => {
  if (props.doc.height_diff_down) return `${props.doc.height_diff_down} m`;
  return null;
});
const elevationLabel = computed(() => {
  if (props.doc.elevation) return `${props.doc.elevation} m`;
  return null;
});

const primaryRating = computed(() => {
  // For outings c2c shows the most expressive available rating in the chip.
  return (
    props.doc.ski_rating ||
    props.doc.global_rating ||
    props.doc.rock_free_rating ||
    props.doc.engagement_rating ||
    null
  );
});

const secondaryRating = computed(() => {
  const p = primaryRating.value;
  if (!p) return null;
  if (props.doc.global_rating && p !== props.doc.global_rating) {
    return props.doc.global_rating;
  }
  if (props.doc.rock_free_rating && p !== props.doc.rock_free_rating) {
    return props.doc.rock_free_rating;
  }
  if (props.doc.equipment_rating) return props.doc.equipment_rating;
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
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return d;
  }
});

const shortDateLabel = computed(() => {
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

// Areas formatted "A - B - C - Country" like the footer line c2c.org uses.
const areasLabel = computed(() => {
  const areas = props.doc.areas;
  if (!Array.isArray(areas) || !areas.length) return null;
  return areas
    .map((a) => a.locales?.[0]?.title || a.locales?.find((l) => l.lang === props.lang)?.title)
    .filter(Boolean)
    .join(' - ');
});

// Photos array for the outing variant (mosaic of up to 4 thumbs).
const photos = computed(() => {
  const imgs = props.doc?.associations?.images;
  if (!Array.isArray(imgs)) return [];
  return imgs.slice(0, 4).map((img) => ({
    src: api.imageUrl(img, 'MI'),
    id: img.document_id,
  }));
});

const condition = computed(() => {
  // c2c shows a tiny dot indicator for outings (qualité conditions).
  return props.doc.condition_rating || null;
});

const CONDITION_COLOR = {
  excellent: '#22c55e',
  good: '#65a30d',
  average: '#eab308',
  poor: '#f97316',
  awful: '#dc2626',
};

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
  <!-- ============ OUTING CARD (camptocamp.org outing card replica) ============ -->
  <article v-if="variant === 'outing'" class="card">
    <router-link :to="linkTo" class="block">
      <!-- Header: activity icon, title, date -->
      <header class="flex items-start gap-2 p-3" style="border-bottom: 1px solid rgba(0,0,0,0.08);">
        <ActivityIcon
          v-if="primaryActivity"
          :activity="primaryActivity"
          :size="22"
          class="mt-0.5 flex-none"
        />
        <h3 class="min-w-0 flex-1 text-sm font-semibold leading-snug" style="color: #4a4a4a;">
          {{ title }}
        </h3>
        <time
          v-if="dateLabel"
          class="flex-none text-xs"
          style="color: #4a4a4a;"
        >{{ dateLabel }}</time>
      </header>

      <!-- Photo mosaic — up to 4 thumbs, c2c shows them inline. -->
      <div v-if="photos.length" class="flex">
        <div
          v-for="(p, i) in photos"
          :key="p.id"
          class="overflow-hidden bg-zinc-100"
          :class="i === 0 ? 'flex-[2]' : 'flex-1'"
          :style="i === 0 ? 'aspect-ratio: 16/10;' : 'aspect-ratio: 1/1;'"
        >
          <img :src="p.src" alt="" loading="lazy" class="h-full w-full object-cover" />
        </div>
      </div>

      <!-- Author line -->
      <div class="flex items-center gap-2 px-3 pt-2.5 text-xs" style="color: #4a4a4a;">
        <svg class="h-4 w-4 flex-none text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 22c0-4 4-7 8-7s8 3 8 7" />
        </svg>
        <span v-if="author">
          <span class="font-medium">{{ author }}</span>
          a publié une sortie
        </span>
        <span v-else>Sortie publiée</span>
      </div>

      <!-- Ratings + elevation row -->
      <div class="flex items-center justify-between gap-3 px-3 py-2 text-xs" style="color: #4a4a4a;">
        <div class="flex items-center gap-1.5">
          <RatingBadge :rating="primaryRating" :secondary="secondaryRating" size="sm" />
        </div>
        <div v-if="elevationUpLabel" class="flex items-center gap-1">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" />
          </svg>
          {{ elevationUpLabel }}
        </div>
        <div v-if="elevationDownLabel" class="flex items-center gap-1">
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
          </svg>
          {{ elevationDownLabel }}
        </div>
      </div>

      <!-- Areas + activity-condition footer -->
      <footer class="flex items-center gap-2 px-3 py-2 text-xs" style="color: #4a4a4a; border-top: 1px solid rgba(0,0,0,0.06);">
        <svg class="h-4 w-4 flex-none text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span class="min-w-0 flex-1 truncate">{{ areasLabel || '—' }}</span>
        <ActivityIcon v-if="primaryActivity" :activity="primaryActivity" :size="18" badge />
        <span
          v-if="condition"
          class="h-3 w-3 flex-none"
          :style="{ backgroundColor: CONDITION_COLOR[condition] || '#9ca3af', borderRadius: '50%' }"
          :title="`Conditions: ${condition}`"
        />
      </footer>
    </router-link>
  </article>

  <!-- ============ HERO VARIANT (single image-led card) ============ -->
  <article v-else-if="variant === 'hero'" class="card">
    <router-link :to="linkTo" class="block">
      <div v-if="coverImage" class="aspect-[16/10] w-full overflow-hidden bg-zinc-100">
        <img :src="coverImage" :alt="title" loading="lazy" decoding="async" class="h-full w-full object-cover" />
      </div>

      <button
        v-if="showSave && coverImage"
        class="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center text-c2c-text hover:bg-white"
        :class="isSaved ? 'text-white' : ''"
        :style="isSaved ? 'background-color: #ff9933; border-radius: 50%;' : 'background-color: rgba(255,255,255,0.92); border-radius: 50%;'"
        :aria-label="isSaved ? 'Retirer du hors-ligne' : 'Sauvegarder hors-ligne'"
        @click.prevent.stop="toggleSave"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
        </svg>
      </button>

      <div class="space-y-1.5 p-3">
        <h3 class="line-clamp-2 text-base font-semibold leading-tight" style="color: #337ab7;">{{ title }}</h3>
        <p v-if="summary" class="line-clamp-2 text-xs text-zinc-600">{{ summary }}</p>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span v-for="activity in activities.slice(0, 2)" :key="activity" class="inline-flex items-center gap-1">
            <ActivityIcon :activity="activity" :size="13" />
            {{ activityLabel(activity) }}
          </span>
          <RatingBadge :rating="primaryRating" :secondary="secondaryRating" size="sm" />
          <span v-if="elevationUpLabel">{{ elevationUpLabel }} D+</span>
          <span v-if="shortDateLabel" class="ml-auto">{{ shortDateLabel }}</span>
        </div>
      </div>
    </router-link>
  </article>

  <!-- ============ COMPACT VARIANT (default — dense list row) ============ -->
  <router-link v-else :to="linkTo" class="list-row block">
    <!-- Thumb. No grey-mountain placeholder anymore when there's no photo —
         just the activity icon on a neutral background. -->
    <div v-if="thumbImage" class="h-14 w-14 flex-none overflow-hidden bg-zinc-100">
      <img :src="thumbImage" :alt="title" loading="lazy" class="h-full w-full object-cover" />
    </div>
    <div v-else-if="primaryActivity" class="flex h-14 w-14 flex-none items-center justify-center" style="background-color: #f4f2ec;">
      <ActivityIcon :activity="primaryActivity" :size="28" />
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
        <span v-if="elevationLabel || elevationUpLabel">{{ elevationLabel || `${elevationUpLabel} D+` }}</span>
        <span v-if="shortDateLabel" class="ml-auto">{{ shortDateLabel }}</span>
      </div>
      <p v-if="areasLabel" class="mt-0.5 truncate text-[11px] text-zinc-400">{{ areasLabel }}</p>
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
