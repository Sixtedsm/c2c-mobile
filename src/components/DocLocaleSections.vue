<script setup>
import { computed } from 'vue';

const props = defineProps({
  doc: { type: Object, required: true },
  type: { type: String, default: 'route' },
  lang: { type: String, default: 'fr' },
});

const locale = computed(() => {
  const locales = props.doc?.locales;
  if (Array.isArray(locales) && locales.length) {
    return locales.find((l) => l.lang === props.lang) || locales[0];
  }
  return props.doc?.cooked || {};
});

// Section ordering mirrors what camptocamp.org renders for each doc type.
// Source: c2corg/c2c_ui/src/views/document/{Route,Outing,Waypoint,…}View.vue
const ORDER_BY_TYPE = {
  route: [
    { key: 'summary', label: 'Résumé' },
    { key: 'route_history', label: 'Historique' },
    { key: 'description', label: 'Description' },
    { key: 'slackline_anchor1_status', label: 'Ancrage 1' },
    { key: 'slackline_anchor2_status', label: 'Ancrage 2' },
    { key: 'remarks', label: 'Remarques' },
    { key: 'gear', label: 'Matériel' },
    { key: 'external_resources', label: 'Ressources externes' },
  ],
  outing: [
    { key: 'description', label: 'Description de la sortie' },
    { key: 'weather', label: 'Météo' },
    { key: 'conditions', label: 'Conditions' },
    { key: 'conditions_levels', label: 'Niveaux de conditions', kind: 'levels' },
    { key: 'avalanche_signs', label: 'Signes d\'avalanche' },
    { key: 'timing', label: 'Timing' },
    { key: 'access_comment', label: 'Accès' },
    { key: 'hut_comment', label: 'Refuge' },
    { key: 'participants', label: 'Participants' },
    { key: 'route_description', label: 'Description de l\'itinéraire' },
    { key: 'other_comments', label: 'Autres commentaires' },
    { key: 'external_resources', label: 'Ressources externes' },
  ],
  waypoint: [
    { key: 'summary', label: 'Résumé' },
    { key: 'access_period', label: 'Période d\'accès' },
    { key: 'description', label: 'Description' },
    { key: 'access', label: 'Accès' },
    { key: 'external_resources', label: 'Ressources externes' },
    { key: 'remarks', label: 'Remarques' },
  ],
  article: [
    { key: 'summary', label: 'Résumé' },
    { key: 'description', label: 'Description' },
    { key: 'external_resources', label: 'Ressources externes' },
  ],
  book: [
    { key: 'summary', label: 'Résumé' },
    { key: 'description', label: 'Description' },
    { key: 'external_resources', label: 'Ressources externes' },
  ],
  xreport: [
    { key: 'description', label: 'Description' },
    { key: 'place', label: 'Lieu' },
    { key: 'route_study', label: 'Étude de la course' },
    { key: 'conditions', label: 'Conditions' },
    { key: 'training', label: 'Préparation' },
    { key: 'motivations', label: 'Motivations' },
    { key: 'group_management', label: 'Gestion du groupe' },
    { key: 'risk', label: 'Risque' },
    { key: 'time_management', label: 'Gestion du temps' },
    { key: 'safety', label: 'Sécurité' },
    { key: 'reduce_impact', label: 'Réduction d\'impact' },
    { key: 'increase_impact', label: 'Facteurs aggravants' },
    { key: 'modifications', label: 'Que ferais-tu autrement ?' },
    { key: 'other_comments', label: 'Autres commentaires' },
    { key: 'external_resources', label: 'Ressources externes' },
  ],
  profile: [
    { key: 'summary', label: 'Résumé' },
    { key: 'description', label: 'À propos' },
  ],
};

// `conditions_levels` is a JSON-encoded array on outings — the API returns
// the raw string and the website parses it into a table. Detect and parse
// here so we don't dump JSON in the UI.
function parseLevels(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === 'object') {
      return parsed;
    }
  } catch {
    // not JSON — return null so we fall back to HTML rendering
  }
  return null;
}

const sections = computed(() => {
  const order = ORDER_BY_TYPE[props.type] || ORDER_BY_TYPE.route;
  const l = locale.value;
  if (!l) return [];
  return order
    .map((s) => {
      const raw = l[s.key];
      if (typeof raw !== 'string' || !raw.trim().length) return null;
      // Structured field (JSON-encoded levels)
      if (s.kind === 'levels') {
        const levels = parseLevels(raw);
        if (levels) return { ...s, levels };
        // If it's not parseable JSON, drop it — the raw JSON dump is what
        // Sixte complained about.
        return null;
      }
      return { ...s, html: raw };
    })
    .filter(Boolean);
});
</script>

<template>
  <div class="space-y-5">
    <section v-for="s in sections" :key="s.key" class="space-y-2">
      <h2
        class="text-base font-semibold uppercase tracking-wide"
        style="color: #4a4a4a; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 4px;"
      >
        {{ s.label }}
      </h2>

      <!-- Snow / condition levels table — formatted like camptocamp.org. -->
      <table v-if="s.kind === 'levels'" class="w-full text-xs" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th class="px-2 py-1 text-left" style="background-color: #f4f2ec; color: #4a4a4a; font-weight: 600; border: 1px solid rgba(0,0,0,0.12);">Lieu</th>
            <th class="px-2 py-1 text-left" style="background-color: #f4f2ec; color: #4a4a4a; font-weight: 600; border: 1px solid rgba(0,0,0,0.12);">Neige fraîche</th>
            <th class="px-2 py-1 text-left" style="background-color: #f4f2ec; color: #4a4a4a; font-weight: 600; border: 1px solid rgba(0,0,0,0.12);">Hauteur totale</th>
            <th class="px-2 py-1 text-left" style="background-color: #f4f2ec; color: #4a4a4a; font-weight: 600; border: 1px solid rgba(0,0,0,0.12);">Commentaire</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(lvl, i) in s.levels" :key="i">
            <td class="px-2 py-1" style="border: 1px solid rgba(0,0,0,0.12);">{{ lvl.level_place || '—' }}</td>
            <td class="px-2 py-1" style="border: 1px solid rgba(0,0,0,0.12);">{{ lvl.level_snow_height_soft || '—' }}</td>
            <td class="px-2 py-1" style="border: 1px solid rgba(0,0,0,0.12);">{{ lvl.level_snow_height_total || '—' }}</td>
            <td class="px-2 py-1" style="border: 1px solid rgba(0,0,0,0.12);">{{ lvl.level_comment || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Regular cooked HTML body sanitized server-side. -->
      <div v-else class="prose max-w-none" v-html="s.html" />
    </section>
  </div>
</template>
