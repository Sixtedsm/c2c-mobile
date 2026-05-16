<script setup>
import { computed } from 'vue';
import {
  ACTIVITIES, ROUTE_TYPES, ROUTE_CONFIGURATIONS, CLIMBING_OUTDOOR_TYPES,
  CLIMBING_INDOOR_TYPES, CLIMBING_STYLES, ROCK_TYPES, GLACIER_GEAR_TYPES,
  WAYPOINT_TYPES, ORIENTATIONS, DURATION_TYPES, MONTHS,
  CONDITION_RATINGS, FREQUENTATION_TYPES, GLACIER_RATINGS,
  AVALANCHE_SIGNS, AVALANCHE_LEVELS, AVALANCHE_SLOPES,
  XREPORT_EVENT_TYPES, XREPORT_SEVERITIES,
  ARTICLE_CATEGORIES, ARTICLE_TYPES,
  activityLabel,
} from '@/constants/c2c';

const props = defineProps({
  doc: { type: Object, required: true },
  type: { type: String, required: true },
});

// Helper: map an enum key to its French label using the constants tables.
function labelOf(list, key) {
  if (key == null) return null;
  return list.find((x) => x.key === key)?.label || key;
}
function labelsOf(list, keys) {
  if (!Array.isArray(keys) || !keys.length) return null;
  return keys.map((k) => labelOf(list, k)).join(', ');
}

// Format a duration range from doc.durations (array of route_duration_types).
function durationsLabel(d) {
  if (!Array.isArray(d) || !d.length) return null;
  // Each entry is '1' (1 day) … '10+', display as "1–3 j" if multiple.
  if (d.length === 1) return `${d[0]} j`;
  return `${d[0]}–${d[d.length - 1]} j`;
}

// Build the list of (label, value) rows relevant to this doc type. Skip any
// row where the value is empty so the bandeau stays dense.
const rows = computed(() => {
  const d = props.doc;
  if (!d) return [];
  const out = [];
  const push = (label, value) => {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return;
    out.push({ label, value });
  };

  // Activities — common to routes / outings / xreports / articles / waypoints
  push('Activités', (d.activities || []).map(activityLabel).join(', '));

  // Route-specific
  if (props.type === 'route') {
    push('Type d\'itinéraire', labelsOf(ROUTE_TYPES, d.route_types));
    push('Configuration', labelsOf(ROUTE_CONFIGURATIONS, d.configuration));
    push('Type d\'escalade', labelsOf(CLIMBING_OUTDOOR_TYPES, d.climbing_outdoor_type ? [d.climbing_outdoor_type] : null));
    push('Type de rocher', labelsOf(ROCK_TYPES, d.rock_types));
    push('Matériel glacier', labelsOf(GLACIER_GEAR_TYPES, d.glacier_gear ? [d.glacier_gear] : null));
    push('Durée', durationsLabel(d.durations));
    push('Longueur', d.route_length ? `${d.route_length} m` : null);
    push('Altitude max', d.elevation_max ? `${d.elevation_max} m` : null);
    push('Altitude min', d.elevation_min ? `${d.elevation_min} m` : null);
    push('Dénivelé +', d.height_diff_up ? `${d.height_diff_up} m` : null);
    push('Dénivelé −', d.height_diff_down ? `${d.height_diff_down} m` : null);
    push('Dénivelé approche', d.height_diff_access ? `${d.height_diff_access} m` : null);
    push('Dénivelé difficultés', d.height_diff_difficulties ? `${d.height_diff_difficulties} m` : null);
    push('Orientations', labelsOf(ORIENTATIONS, d.orientations));
    push('Cotation globale', d.global_rating);
    push('Engagement', d.engagement_rating);
    push('Risque', d.risk_rating);
    push('Équipement', d.equipment_rating);
    push('Exposition rocher', d.exposition_rock_rating);
    push('Cotation libre', d.rock_free_rating);
    push('Cotation obligatoire', d.rock_required_rating);
    push('Artif', d.aid_rating);
    push('Cotation ski', d.ski_rating);
    push('Ski Labande', d.labande_ski_rating);
    push('Exposition ski', d.ski_exposition);
    push('Glace', d.ice_rating);
    push('Mixte', d.mixed_rating);
    push('Via ferrata', d.via_ferrata_rating);
    push('Randonnée', d.hiking_rating);
    push('Raquettes', d.snowshoe_rating);
    push('VTT montée', d.mtb_up_rating);
    push('VTT descente', d.mtb_down_rating);
    push('Période recommandée', labelsOf(MONTHS, d.main_waypoint_id ? null : d.best_periods));
  }

  // Outing-specific
  if (props.type === 'outing') {
    push('Date', formatDateRange(d.date_start, d.date_end));
    push('Conditions', labelOf(CONDITION_RATINGS, d.condition_rating));
    push('Qualité de la neige', labelOf(CONDITION_RATINGS, d.snow_quality));
    push('Quantité de neige', labelOf(CONDITION_RATINGS, d.snow_quantity));
    push('Glacier', labelOf(GLACIER_RATINGS, d.glacier_rating));
    push('Fréquentation', labelOf(FREQUENTATION_TYPES, d.frequentation));
    push('Signes avalanche', labelOf(AVALANCHE_SIGNS, d.avalanche_signs));
    push('Hauteur de neige sup.', d.elevation_up_snow ? `${d.elevation_up_snow} m` : null);
    push('Hauteur de neige inf.', d.elevation_down_snow ? `${d.elevation_down_snow} m` : null);
    push('Altitude max atteinte', d.elevation_max ? `${d.elevation_max} m` : null);
    push('Altitude accès', d.elevation_access ? `${d.elevation_access} m` : null);
    push('Dénivelé +', d.height_diff_up ? `${d.height_diff_up} m` : null);
    push('Transport public', d.public_transport ? 'Oui' : null);
    push('Cotation globale', d.global_rating);
    push('Engagement', d.engagement_rating);
    push('Équipement', d.equipment_rating);
    push('Cotation libre', d.rock_free_rating);
    push('Cotation ski', d.ski_rating);
    push('Glace', d.ice_rating);
  }

  // Waypoint-specific
  if (props.type === 'waypoint') {
    push('Type', labelOf(WAYPOINT_TYPES, d.waypoint_type));
    push('Altitude', d.elevation ? `${d.elevation} m` : null);
    push('Proéminence', d.prominence ? `${d.prominence} m` : null);
    push('Type de rocher', labelsOf(ROCK_TYPES, d.rock_types));
    push('Type d\'escalade', labelsOf(CLIMBING_OUTDOOR_TYPES, d.climbing_outdoor_types));
    push('Type de salle', labelsOf(CLIMBING_INDOOR_TYPES, d.climbing_indoor_types));
    push('Style d\'escalade', labelsOf(CLIMBING_STYLES, d.climbing_styles));
    push('Orientations', labelsOf(ORIENTATIONS, d.orientations));
    push('Nombre de voies', d.routes_quantity);
    push('Cotation libre', d.climbing_rating_max ? `${d.climbing_rating_min || '?'} → ${d.climbing_rating_max}` : null);
    push('Équipement', d.equipment_ratings?.[0]);
    push('Périodes', labelsOf(MONTHS, d.best_periods));
    push('Temps d\'accès', d.access_time);
    push('Capacité', d.capacity ?? d.capacity_staffed);
  }

  // Xreport-specific
  if (props.type === 'xreport') {
    push('Date', formatDate(d.date));
    push('Événement', labelOf(XREPORT_EVENT_TYPES, d.event_type));
    push('Sévérité', labelOf(XREPORT_SEVERITIES, d.severity));
    push('Participants', d.nb_participants);
    push('Impactés', d.nb_impacted);
    push('Niveau d\'avalanche', labelOf(AVALANCHE_LEVELS, d.avalanche_level));
    push('Pente avalanche', labelOf(AVALANCHE_SLOPES, d.avalanche_slope));
    push('Altitude', d.elevation ? `${d.elevation} m` : null);
  }

  // Article-specific
  if (props.type === 'article') {
    push('Catégories', labelsOf(ARTICLE_CATEGORIES, d.categories));
    push('Type', labelOf(ARTICLE_TYPES, d.article_type));
  }

  return out;
});

function formatDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return d; }
}
function formatDateRange(s, e) {
  if (!s) return null;
  if (e && e !== s) return `${formatDate(s)} – ${formatDate(e)}`;
  return formatDate(s);
}
</script>

<template>
  <div v-if="rows.length" class="card overflow-hidden">
    <dl class="grid grid-cols-2 divide-x divide-y divide-zinc-100 dark:divide-zinc-800">
      <div v-for="row in rows" :key="row.label" class="p-3">
        <dt class="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{{ row.label }}</dt>
        <dd class="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ row.value }}</dd>
      </div>
    </dl>
  </div>
</template>
