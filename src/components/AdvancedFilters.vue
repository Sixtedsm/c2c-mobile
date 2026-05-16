<script setup>
import { computed, ref, watch } from 'vue';
import BottomSheet from '@/components/BottomSheet.vue';
import FilterSection from '@/components/FilterSection.vue';
import RangeMinMax from '@/components/RangeMinMax.vue';
import {
  ACTIVITIES, WAYPOINT_TYPES, ROUTE_TYPES, ROUTE_CONFIGURATIONS,
  GLACIER_GEAR_TYPES, ROCK_TYPES, CLIMBING_OUTDOOR_TYPES, CLIMBING_INDOOR_TYPES,
  CLIMBING_STYLES, ARTICLE_CATEGORIES, ARTICLE_TYPES, XREPORT_EVENT_TYPES,
  XREPORT_SEVERITIES, AVALANCHE_LEVELS, AVALANCHE_SLOPES,
  CONDITION_RATINGS, FREQUENTATION_TYPES, GLACIER_RATINGS, AVALANCHE_SIGNS,
  ORIENTATIONS, MONTHS, LANGUAGES, QUALITY_TYPES,
  GLOBAL_RATINGS, ENGAGEMENT_RATINGS, RISK_RATINGS, EQUIPMENT_RATINGS,
  EXPOSITION_ROCK_RATINGS, ROCK_FREE_RATINGS, AID_RATINGS,
  SKI_RATINGS, LABANDE_SKI_RATINGS, ICE_RATINGS, MIXED_RATINGS,
  VIA_FERRATA_RATINGS, HIKING_RATINGS, SNOWSHOE_RATINGS,
  MTB_UP_RATINGS, MTB_DOWN_RATINGS, DURATION_TYPES,
  ACTIVITY_RATINGS,
} from '@/constants/c2c';
import { useC2cApi } from '@/composables/useC2cApi';
import { emptyFilters } from '@/composables/useFilters';

const props = defineProps({
  open: { type: Boolean, default: false },
  // What categories of filters this view needs. Each flag toggles a section.
  scope: {
    type: Object,
    default: () => ({
      activities: true,
      areas: true,
      ratings: true,
      elevation: true,
      heightDiff: true,
      routeLength: false,
      duration: false,
      orientations: true,
      seasons: true,
      // Routes-specific
      routeTypes: false,
      configurations: false,
      glacierGear: false,
      rockTypes: false,
      climbingOutdoorTypes: false,
      // Waypoints-specific
      waypointTypes: false,
      climbingIndoorTypes: false,
      climbingStyles: false,
      // Outings-specific
      dates: false,
      outingConditions: false,
      // Xreports-specific
      eventTypes: false,
      severity: false,
      avalanche: false,
      participants: false,
      // Articles-specific
      articleCategories: false,
      articleTypes: false,
      // Always available
      langs: false,
      quality: false,
    }),
  },
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(['update:modelValue', 'close', 'apply', 'reset']);

const api = useC2cApi();
const draft = ref(clone(props.modelValue));

watch(
  () => props.open,
  (v) => {
    if (v) draft.value = clone(props.modelValue);
  }
);

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

// Generic helpers for chip arrays.
function toggleIn(key, value) {
  const list = draft.value[key] = draft.value[key] || [];
  const idx = list.indexOf(value);
  if (idx === -1) list.push(value);
  else list.splice(idx, 1);
}
function isIn(key, value) {
  return (draft.value[key] || []).includes(value);
}
function count(key) {
  return (draft.value[key] || []).length;
}

// Areas autocomplete --------------------------------------------------
const areaQuery = ref('');
const areaSuggestions = ref([]);
let areaTimer = null;
function onAreaInput() {
  clearTimeout(areaTimer);
  areaTimer = setTimeout(async () => {
    if (areaQuery.value.length < 2) {
      areaSuggestions.value = [];
      return;
    }
    try {
      const docs = await api.searchAreas(areaQuery.value);
      areaSuggestions.value = docs.map((d) => ({
        document_id: d.document_id,
        name: d.locales?.[0]?.title || `Massif ${d.document_id}`,
        area_type: d.area_type,
      }));
    } catch {
      areaSuggestions.value = [];
    }
  }, 300);
}
function addArea(a) {
  draft.value.areas = draft.value.areas || [];
  if (!draft.value.areas.find((x) => x.document_id === a.document_id)) {
    draft.value.areas.push(a);
  }
  areaQuery.value = '';
  areaSuggestions.value = [];
}
function removeArea(id) {
  draft.value.areas = (draft.value.areas || []).filter((a) => a.document_id !== id);
}

// Activity-relevance for rating sections -----------------------------
const relevantRatings = computed(() => {
  const acts = draft.value.activities || [];
  if (!acts.length) {
    // No activity selected: show the most universal ratings only so we don't
    // overwhelm the user. Activity-specific scales appear once they pick one.
    return new Set(['global', 'engagement', 'rock_free', 'ski']);
  }
  const set = new Set();
  for (const a of acts) (ACTIVITY_RATINGS[a] || []).forEach((r) => set.add(r));
  return set;
});
function showR(key) {
  return relevantRatings.value.has(key);
}

// Section active counts (for the badge next to titles) ---------------
function rangeActive(min, max) {
  return draft.value[min] != null || draft.value[max] != null ? 1 : 0;
}
const activitiesActive = computed(() => count('activities'));
const areasActive = computed(() => (draft.value.areas || []).length);
const ratingsActive = computed(() => {
  let n = 0;
  const pairs = [
    'globalRating', 'engagementRating', 'riskRating', 'equipmentRating',
    'rockFreeRating', 'rockRequiredRating', 'aidRating', 'expositionRockRating',
    'skiRating', 'skiExposition', 'labandeSkiRating', 'labandeGlobalRating',
    'iceRating', 'mixedRating', 'viaFerrataRating',
    'hikingRating', 'snowshoeRating',
    'mtbUpRating', 'mtbDownRating', 'hikingMtbExposition',
  ];
  for (const k of pairs) n += rangeActive(`${k}Min`, `${k}Max`);
  return n;
});
const elevationActive = computed(() => rangeActive('elevationMin', 'elevationMax'));
const heightDiffActive = computed(() => rangeActive('heightDiffUpMin', 'heightDiffUpMax') + rangeActive('heightDiffDownMin', 'heightDiffDownMax') + rangeActive('heightDiffAccessMin', 'heightDiffAccessMax') + rangeActive('heightDiffDifficultiesMin', 'heightDiffDifficultiesMax'));
const routeLengthActive = computed(() => rangeActive('routeLengthMin', 'routeLengthMax'));
const durationActive = computed(() => rangeActive('durationMin', 'durationMax'));
const orientationsActive = computed(() => count('orientations'));
const seasonsActive = computed(() => count('seasons'));
const langsActive = computed(() => count('langs'));
const qualityActive = computed(() => (draft.value.qualityMin ? 1 : 0));
const routeTypesActive = computed(() => count('routeTypes'));
const configurationsActive = computed(() => count('configurations'));
const glacierGearActive = computed(() => count('glacierGear'));
const rockTypesActive = computed(() => count('rockTypes'));
const climbingOutdoorActive = computed(() => count('climbingOutdoorTypes'));
const waypointTypesActive = computed(() => count('waypointTypes'));
const climbingIndoorActive = computed(() => count('climbingIndoorTypes'));
const climbingStylesActive = computed(() => count('climbingStyles'));
const eventTypesActive = computed(() => count('xreportEventTypes'));
const severityActive = computed(() => rangeActive('severityMin', 'severityMax'));
const avalancheActive = computed(() => rangeActive('avalancheLevelMin', 'avalancheLevelMax') + rangeActive('avalancheSlopeMin', 'avalancheSlopeMax'));
const participantsActive = computed(() => rangeActive('nbParticipantsMin', 'nbParticipantsMax') + rangeActive('nbImpactedMin', 'nbImpactedMax'));
const articleCategoriesActive = computed(() => count('articleCategories'));
const articleTypesActive = computed(() => count('articleTypes'));
const datesActive = computed(() => (draft.value.dateStart || draft.value.dateEnd) ? 1 : 0);
const outingConditionsActive = computed(() => {
  let n = 0;
  if (draft.value.conditionRatingMin || draft.value.conditionRatingMax) n += 1;
  if (count('frequentation')) n += 1;
  if (count('glacierRating')) n += 1;
  if (count('avalancheSigns')) n += 1;
  if (draft.value.publicTransport) n += 1;
  return n;
});

// Actions ------------------------------------------------------------
function apply() {
  emit('update:modelValue', clone(draft.value));
  emit('apply', clone(draft.value));
  emit('close');
}
function resetAll() {
  draft.value = emptyFilters();
  emit('reset');
}
</script>

<template>
  <BottomSheet :open="open" title="Filtres" @close="emit('close')">
    <div class="divide-y divide-zinc-100 pt-2 dark:divide-zinc-800">

      <!-- Activités -->
      <FilterSection v-if="scope.activities" title="Activités" :active="activitiesActive" :default-open="true">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="a in ACTIVITIES" :key="a.key" type="button"
            :class="isIn('activities', a.key) ? 'chip-active' : 'chip'"
            @click="toggleIn('activities', a.key)"
          >{{ a.label }}</button>
        </div>
      </FilterSection>

      <!-- Massifs / régions -->
      <FilterSection v-if="scope.areas" title="Massifs / régions" :active="areasActive">
        <div class="mb-2 flex flex-wrap gap-1.5">
          <span v-for="a in (draft.areas || [])" :key="a.document_id" class="pill-brand gap-1">
            {{ a.name }}
            <button class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-700/70 hover:text-brand-700"
              :aria-label="`Retirer ${a.name}`" @click="removeArea(a.document_id)">
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </span>
        </div>
        <input v-model="areaQuery" type="search" inputmode="search"
          placeholder="Ajouter un massif (Mont-Blanc, Écrins…)"
          class="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900"
          @input="onAreaInput"
        />
        <ul v-if="areaSuggestions.length" class="mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow dark:border-zinc-700 dark:bg-zinc-900">
          <li v-for="s in areaSuggestions" :key="s.document_id">
            <button type="button" class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800" @click="addArea(s)">
              <span>{{ s.name }}</span>
              <span class="text-xs text-zinc-400">{{ s.area_type }}</span>
            </button>
          </li>
        </ul>
      </FilterSection>

      <!-- Type d'itinéraire (routes) -->
      <FilterSection v-if="scope.routeTypes" title="Type d'itinéraire" :active="routeTypesActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="r in ROUTE_TYPES" :key="r.key" :class="isIn('routeTypes', r.key) ? 'chip-active' : 'chip'" @click="toggleIn('routeTypes', r.key)">{{ r.label }}</button>
        </div>
      </FilterSection>

      <!-- Configuration -->
      <FilterSection v-if="scope.configurations" title="Configuration" :active="configurationsActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="c in ROUTE_CONFIGURATIONS" :key="c.key" :class="isIn('configurations', c.key) ? 'chip-active' : 'chip'" @click="toggleIn('configurations', c.key)">{{ c.label }}</button>
        </div>
      </FilterSection>

      <!-- Matériel glacier -->
      <FilterSection v-if="scope.glacierGear" title="Matériel glacier" :active="glacierGearActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="g in GLACIER_GEAR_TYPES" :key="g.key" :class="isIn('glacierGear', g.key) ? 'chip-active' : 'chip'" @click="toggleIn('glacierGear', g.key)">{{ g.label }}</button>
        </div>
      </FilterSection>

      <!-- Type de rocher -->
      <FilterSection v-if="scope.rockTypes" title="Type de rocher" :active="rockTypesActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="r in ROCK_TYPES" :key="r.key" :class="isIn('rockTypes', r.key) ? 'chip-active' : 'chip'" @click="toggleIn('rockTypes', r.key)">{{ r.label }}</button>
        </div>
      </FilterSection>

      <!-- Type d'escalade extérieur -->
      <FilterSection v-if="scope.climbingOutdoorTypes" title="Type d'escalade" :active="climbingOutdoorActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="c in CLIMBING_OUTDOOR_TYPES" :key="c.key" :class="isIn('climbingOutdoorTypes', c.key) ? 'chip-active' : 'chip'" @click="toggleIn('climbingOutdoorTypes', c.key)">{{ c.label }}</button>
        </div>
      </FilterSection>

      <!-- Type de point (waypoints) -->
      <FilterSection v-if="scope.waypointTypes" title="Type de point" :active="waypointTypesActive" :default-open="true">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="w in WAYPOINT_TYPES" :key="w.key" :class="isIn('waypointTypes', w.key) ? 'chip-active' : 'chip'" @click="toggleIn('waypointTypes', w.key)">{{ w.label }}</button>
        </div>
      </FilterSection>

      <!-- Type d'escalade intérieur -->
      <FilterSection v-if="scope.climbingIndoorTypes" title="Type de salle" :active="climbingIndoorActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="c in CLIMBING_INDOOR_TYPES" :key="c.key" :class="isIn('climbingIndoorTypes', c.key) ? 'chip-active' : 'chip'" @click="toggleIn('climbingIndoorTypes', c.key)">{{ c.label }}</button>
        </div>
      </FilterSection>

      <!-- Style d'escalade -->
      <FilterSection v-if="scope.climbingStyles" title="Style d'escalade" :active="climbingStylesActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="c in CLIMBING_STYLES" :key="c.key" :class="isIn('climbingStyles', c.key) ? 'chip-active' : 'chip'" @click="toggleIn('climbingStyles', c.key)">{{ c.label }}</button>
        </div>
      </FilterSection>

      <!-- Catégories d'article -->
      <FilterSection v-if="scope.articleCategories" title="Catégories" :active="articleCategoriesActive" :default-open="true">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="c in ARTICLE_CATEGORIES" :key="c.key" :class="isIn('articleCategories', c.key) ? 'chip-active' : 'chip'" @click="toggleIn('articleCategories', c.key)">{{ c.label }}</button>
        </div>
      </FilterSection>
      <FilterSection v-if="scope.articleTypes" title="Type d'article" :active="articleTypesActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="t in ARTICLE_TYPES" :key="t.key" :class="isIn('articleTypes', t.key) ? 'chip-active' : 'chip'" @click="toggleIn('articleTypes', t.key)">{{ t.label }}</button>
        </div>
      </FilterSection>

      <!-- Types d'événement (xreports) -->
      <FilterSection v-if="scope.eventTypes" title="Type d'événement" :active="eventTypesActive" :default-open="true">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="e in XREPORT_EVENT_TYPES" :key="e.key" :class="isIn('xreportEventTypes', e.key) ? 'chip-active' : 'chip'" @click="toggleIn('xreportEventTypes', e.key)">{{ e.label }}</button>
        </div>
      </FilterSection>

      <!-- Gravité (xreports) -->
      <FilterSection v-if="scope.severity" title="Gravité" :active="severityActive">
        <RangeMinMax label="Séquelles" :values="XREPORT_SEVERITIES.map((s) => s.key)"
          :min="draft.severityMin" :max="draft.severityMax"
          @update:min="draft.severityMin = $event" @update:max="draft.severityMax = $event"
        />
      </FilterSection>

      <!-- Avalanche detail (conditional sur xreport=avalanche) -->
      <FilterSection v-if="scope.avalanche" title="Avalanche" :active="avalancheActive">
        <div class="space-y-3">
          <RangeMinMax label="Niveau de risque" :values="AVALANCHE_LEVELS.map((l) => l.key)"
            :min="draft.avalancheLevelMin" :max="draft.avalancheLevelMax"
            @update:min="draft.avalancheLevelMin = $event" @update:max="draft.avalancheLevelMax = $event"
          />
          <RangeMinMax label="Pente" :values="AVALANCHE_SLOPES.map((s) => s.key)"
            :min="draft.avalancheSlopeMin" :max="draft.avalancheSlopeMax"
            @update:min="draft.avalancheSlopeMin = $event" @update:max="draft.avalancheSlopeMax = $event"
          />
        </div>
      </FilterSection>

      <!-- Participants / impactés (xreports) -->
      <FilterSection v-if="scope.participants" title="Personnes" :active="participantsActive">
        <div class="space-y-3">
          <RangeMinMax label="Nombre de participants"
            :min="draft.nbParticipantsMin" :max="draft.nbParticipantsMax"
            @update:min="draft.nbParticipantsMin = $event" @update:max="draft.nbParticipantsMax = $event"
          />
          <RangeMinMax label="Personnes impactées"
            :min="draft.nbImpactedMin" :max="draft.nbImpactedMax"
            @update:min="draft.nbImpactedMin = $event" @update:max="draft.nbImpactedMax = $event"
          />
        </div>
      </FilterSection>

      <!-- Dates (outings, xreports) -->
      <FilterSection v-if="scope.dates" title="Dates" :active="datesActive">
        <div class="flex items-center gap-2">
          <input type="date" v-model="draft.dateStart" class="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          <span class="text-zinc-400">→</span>
          <input type="date" v-model="draft.dateEnd" class="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        </div>
      </FilterSection>

      <!-- Conditions (outings) -->
      <FilterSection v-if="scope.outingConditions" title="Conditions" :active="outingConditionsActive">
        <div class="space-y-3">
          <RangeMinMax label="Qualité des conditions" :values="CONDITION_RATINGS.map((c) => c.key)"
            :min="draft.conditionRatingMin" :max="draft.conditionRatingMax"
            @update:min="draft.conditionRatingMin = $event" @update:max="draft.conditionRatingMax = $event"
          />
          <div>
            <p class="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Fréquentation</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="f in FREQUENTATION_TYPES" :key="f.key" :class="isIn('frequentation', f.key) ? 'chip-active' : 'chip'" @click="toggleIn('frequentation', f.key)">{{ f.label }}</button>
            </div>
          </div>
          <div>
            <p class="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Glacier</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="g in GLACIER_RATINGS" :key="g.key" :class="isIn('glacierRating', g.key) ? 'chip-active' : 'chip'" @click="toggleIn('glacierRating', g.key)">{{ g.label }}</button>
            </div>
          </div>
          <div>
            <p class="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Signes d'avalanche</p>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="a in AVALANCHE_SIGNS" :key="a.key" :class="isIn('avalancheSigns', a.key) ? 'chip-active' : 'chip'" @click="toggleIn('avalancheSigns', a.key)">{{ a.label }}</button>
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="draft.publicTransport" class="h-4 w-4 rounded border-zinc-300 text-brand-500 focus:ring-brand-500" />
            Accessible en transports en commun
          </label>
        </div>
      </FilterSection>

      <!-- Altitude (commun) -->
      <FilterSection v-if="scope.elevation" title="Altitude (m)" :active="elevationActive">
        <RangeMinMax label="Altitude min/max"
          :min="draft.elevationMin" :max="draft.elevationMax"
          @update:min="draft.elevationMin = $event" @update:max="draft.elevationMax = $event"
        />
      </FilterSection>

      <!-- Dénivelé -->
      <FilterSection v-if="scope.heightDiff" title="Dénivelé (m)" :active="heightDiffActive">
        <div class="space-y-3">
          <RangeMinMax label="Dénivelé positif"
            :min="draft.heightDiffUpMin" :max="draft.heightDiffUpMax"
            @update:min="draft.heightDiffUpMin = $event" @update:max="draft.heightDiffUpMax = $event"
          />
          <RangeMinMax label="Dénivelé négatif"
            :min="draft.heightDiffDownMin" :max="draft.heightDiffDownMax"
            @update:min="draft.heightDiffDownMin = $event" @update:max="draft.heightDiffDownMax = $event"
          />
          <RangeMinMax label="Dénivelé d'approche"
            :min="draft.heightDiffAccessMin" :max="draft.heightDiffAccessMax"
            @update:min="draft.heightDiffAccessMin = $event" @update:max="draft.heightDiffAccessMax = $event"
          />
          <RangeMinMax label="Dénivelé des difficultés"
            :min="draft.heightDiffDifficultiesMin" :max="draft.heightDiffDifficultiesMax"
            @update:min="draft.heightDiffDifficultiesMin = $event" @update:max="draft.heightDiffDifficultiesMax = $event"
          />
        </div>
      </FilterSection>

      <!-- Longueur -->
      <FilterSection v-if="scope.routeLength" title="Longueur (m)" :active="routeLengthActive">
        <RangeMinMax label="Longueur de l'itinéraire"
          :min="draft.routeLengthMin" :max="draft.routeLengthMax"
          @update:min="draft.routeLengthMin = $event" @update:max="draft.routeLengthMax = $event"
        />
      </FilterSection>

      <!-- Durée -->
      <FilterSection v-if="scope.duration" title="Durée" :active="durationActive">
        <RangeMinMax label="Nombre de jours" :values="DURATION_TYPES"
          :min="draft.durationMin" :max="draft.durationMax"
          @update:min="draft.durationMin = $event" @update:max="draft.durationMax = $event"
        />
      </FilterSection>

      <!-- Cotations (dynamique selon activités) -->
      <FilterSection v-if="scope.ratings" title="Cotations" :active="ratingsActive" :default-open="ratingsActive > 0">
        <div class="space-y-3">
          <RangeMinMax v-if="showR('global')" label="Cotation globale" :values="GLOBAL_RATINGS"
            :min="draft.globalRatingMin" :max="draft.globalRatingMax"
            @update:min="draft.globalRatingMin = $event" @update:max="draft.globalRatingMax = $event"
          />
          <RangeMinMax v-if="showR('engagement')" label="Engagement" :values="ENGAGEMENT_RATINGS"
            :min="draft.engagementRatingMin" :max="draft.engagementRatingMax"
            @update:min="draft.engagementRatingMin = $event" @update:max="draft.engagementRatingMax = $event"
          />
          <RangeMinMax v-if="showR('risk')" label="Risque" :values="RISK_RATINGS"
            :min="draft.riskRatingMin" :max="draft.riskRatingMax"
            @update:min="draft.riskRatingMin = $event" @update:max="draft.riskRatingMax = $event"
          />
          <RangeMinMax v-if="showR('equipment')" label="Qualité d'équipement" :values="EQUIPMENT_RATINGS"
            :min="draft.equipmentRatingMin" :max="draft.equipmentRatingMax"
            @update:min="draft.equipmentRatingMin = $event" @update:max="draft.equipmentRatingMax = $event"
          />
          <RangeMinMax v-if="showR('exposition_rock')" label="Exposition rocher" :values="EXPOSITION_ROCK_RATINGS"
            :min="draft.expositionRockRatingMin" :max="draft.expositionRockRatingMax"
            @update:min="draft.expositionRockRatingMin = $event" @update:max="draft.expositionRockRatingMax = $event"
          />
          <RangeMinMax v-if="showR('rock_free')" label="Cotation libre" :values="ROCK_FREE_RATINGS"
            :min="draft.rockFreeRatingMin" :max="draft.rockFreeRatingMax"
            @update:min="draft.rockFreeRatingMin = $event" @update:max="draft.rockFreeRatingMax = $event"
          />
          <RangeMinMax v-if="showR('rock_required')" label="Cotation obligatoire" :values="ROCK_FREE_RATINGS"
            :min="draft.rockRequiredRatingMin" :max="draft.rockRequiredRatingMax"
            @update:min="draft.rockRequiredRatingMin = $event" @update:max="draft.rockRequiredRatingMax = $event"
          />
          <RangeMinMax v-if="showR('aid')" label="Artif" :values="AID_RATINGS"
            :min="draft.aidRatingMin" :max="draft.aidRatingMax"
            @update:min="draft.aidRatingMin = $event" @update:max="draft.aidRatingMax = $event"
          />
          <RangeMinMax v-if="showR('ski')" label="Cotation ski technique" :values="SKI_RATINGS"
            :min="draft.skiRatingMin" :max="draft.skiRatingMax"
            @update:min="draft.skiRatingMin = $event" @update:max="draft.skiRatingMax = $event"
          />
          <RangeMinMax v-if="showR('labande_ski')" label="Cotation Labande ski" :values="LABANDE_SKI_RATINGS"
            :min="draft.labandeSkiRatingMin" :max="draft.labandeSkiRatingMax"
            @update:min="draft.labandeSkiRatingMin = $event" @update:max="draft.labandeSkiRatingMax = $event"
          />
          <RangeMinMax v-if="showR('global_labande')" label="Cotation globale (Labande)" :values="GLOBAL_RATINGS"
            :min="draft.labandeGlobalRatingMin" :max="draft.labandeGlobalRatingMax"
            @update:min="draft.labandeGlobalRatingMin = $event" @update:max="draft.labandeGlobalRatingMax = $event"
          />
          <RangeMinMax v-if="showR('ice')" label="Cotation glace" :values="ICE_RATINGS"
            :min="draft.iceRatingMin" :max="draft.iceRatingMax"
            @update:min="draft.iceRatingMin = $event" @update:max="draft.iceRatingMax = $event"
          />
          <RangeMinMax v-if="showR('mixed')" label="Cotation mixte" :values="MIXED_RATINGS"
            :min="draft.mixedRatingMin" :max="draft.mixedRatingMax"
            @update:min="draft.mixedRatingMin = $event" @update:max="draft.mixedRatingMax = $event"
          />
          <RangeMinMax v-if="showR('via_ferrata')" label="Via ferrata" :values="VIA_FERRATA_RATINGS"
            :min="draft.viaFerrataRatingMin" :max="draft.viaFerrataRatingMax"
            @update:min="draft.viaFerrataRatingMin = $event" @update:max="draft.viaFerrataRatingMax = $event"
          />
          <RangeMinMax v-if="showR('hiking')" label="Randonnée" :values="HIKING_RATINGS"
            :min="draft.hikingRatingMin" :max="draft.hikingRatingMax"
            @update:min="draft.hikingRatingMin = $event" @update:max="draft.hikingRatingMax = $event"
          />
          <RangeMinMax v-if="showR('snowshoe')" label="Raquettes" :values="SNOWSHOE_RATINGS"
            :min="draft.snowshoeRatingMin" :max="draft.snowshoeRatingMax"
            @update:min="draft.snowshoeRatingMin = $event" @update:max="draft.snowshoeRatingMax = $event"
          />
          <RangeMinMax v-if="showR('mtb_up')" label="VTT montée" :values="MTB_UP_RATINGS"
            :min="draft.mtbUpRatingMin" :max="draft.mtbUpRatingMax"
            @update:min="draft.mtbUpRatingMin = $event" @update:max="draft.mtbUpRatingMax = $event"
          />
          <RangeMinMax v-if="showR('mtb_down')" label="VTT descente" :values="MTB_DOWN_RATINGS"
            :min="draft.mtbDownRatingMin" :max="draft.mtbDownRatingMax"
            @update:min="draft.mtbDownRatingMin = $event" @update:max="draft.mtbDownRatingMax = $event"
          />
        </div>
      </FilterSection>

      <!-- Orientations -->
      <FilterSection v-if="scope.orientations" title="Orientation" :active="orientationsActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="o in ORIENTATIONS" :key="o.key" :class="isIn('orientations', o.key) ? 'chip-active' : 'chip'" @click="toggleIn('orientations', o.key)">{{ o.label }}</button>
        </div>
      </FilterSection>

      <!-- Saison / mois -->
      <FilterSection v-if="scope.seasons" title="Saison" :active="seasonsActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="m in MONTHS" :key="m.key" :class="isIn('seasons', m.key) ? 'chip-active' : 'chip'" @click="toggleIn('seasons', m.key)">{{ m.label }}</button>
        </div>
      </FilterSection>

      <!-- Langue -->
      <FilterSection v-if="scope.langs" title="Langue" :active="langsActive">
        <div class="flex flex-wrap gap-1.5">
          <button v-for="l in LANGUAGES" :key="l.key" :class="isIn('langs', l.key) ? 'chip-active' : 'chip'" @click="toggleIn('langs', l.key)">{{ l.label }}</button>
        </div>
      </FilterSection>

      <!-- Qualité min -->
      <FilterSection v-if="scope.quality" title="Qualité minimale" :active="qualityActive">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="q in QUALITY_TYPES" :key="q.key"
            :class="draft.qualityMin === q.key ? 'chip-active' : 'chip'"
            @click="draft.qualityMin = draft.qualityMin === q.key ? null : q.key"
          >{{ q.label }}</button>
        </div>
      </FilterSection>

    </div>

    <template #footer>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary flex-1" @click="resetAll">Réinitialiser</button>
        <button type="button" class="btn-primary flex-1" @click="apply">Appliquer</button>
      </div>
    </template>
  </BottomSheet>
</template>
