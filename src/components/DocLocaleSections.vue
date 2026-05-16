<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Cooked C2C document.
  doc: { type: Object, required: true },
  // C2C doc type ('route', 'outing', 'waypoint', 'article', 'book', 'xreport').
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
// Source: c2c_ui/src/views/document/{Route,Outing,Waypoint,…}View.vue
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
    { key: 'conditions_levels', label: 'Niveaux de conditions' },
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

const sections = computed(() => {
  const order = ORDER_BY_TYPE[props.type] || ORDER_BY_TYPE.route;
  const l = locale.value;
  if (!l) return [];
  return order
    .map((s) => ({ ...s, html: l[s.key] }))
    .filter((s) => typeof s.html === 'string' && s.html.trim().length);
});
</script>

<template>
  <div class="space-y-5">
    <section
      v-for="s in sections"
      :key="s.key"
      class="space-y-2"
    >
      <h2
        class="text-base font-semibold uppercase tracking-wide"
        style="color: #4a4a4a; border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 4px;"
      >
        {{ s.label }}
      </h2>
      <!-- Cooked HTML sanitized server-side by the C2C API. -->
      <div
        class="prose prose-zinc max-w-none text-sm"
        style="color: #4a4a4a;"
        v-html="s.html"
      />
    </section>
  </div>
</template>
