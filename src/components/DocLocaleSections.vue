<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Localized cooked content from the C2C API. Either the locales array
  // (`doc.locales`) or a specific locale object.
  doc: { type: Object, required: true },
  lang: { type: String, default: 'fr' },
});

// Pick the locale matching the requested language, or fall back to the first
// one — the C2C API guarantees at least one locale per document.
const locale = computed(() => {
  const locales = props.doc?.locales;
  if (Array.isArray(locales) && locales.length) {
    return locales.find((l) => l.lang === props.lang) || locales[0];
  }
  return props.doc?.cooked || {};
});

// Section taxonomy — order mirrors camptocamp.org. Each row is rendered only
// if the locale carries a non-empty value for that key.
const SECTION_ORDER = [
  { key: 'description', label: 'Description' },
  { key: 'access', label: 'Accès' },
  { key: 'access_period', label: 'Période d\'accès' },
  { key: 'approach', label: 'Approche' },
  { key: 'route_history', label: 'Historique' },
  { key: 'gear', label: 'Matériel' },
  { key: 'remarks', label: 'Remarques' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'conditions_levels', label: 'Niveaux de conditions' },
  { key: 'weather', label: 'Météo' },
  { key: 'timing', label: 'Timing' },
  { key: 'avalanche_signs', label: 'Signes d\'avalanche' },
  { key: 'access_comment', label: 'Accès — commentaire' },
  { key: 'hut_comment', label: 'Refuge — commentaire' },
  { key: 'participants', label: 'Participants' },
  { key: 'motivations', label: 'Motivations' },
  { key: 'route_study', label: 'Étude de la course' },
  { key: 'training', label: 'Préparation' },
  { key: 'group_management', label: 'Gestion du groupe' },
  { key: 'risk', label: 'Risque' },
  { key: 'time_management', label: 'Gestion du temps' },
  { key: 'safety', label: 'Sécurité' },
  { key: 'reduce_impact', label: 'Réduction d\'impact' },
  { key: 'increase_impact', label: 'Amplification' },
  { key: 'modifications', label: 'Modifications' },
  { key: 'other_comments', label: 'Autres commentaires' },
  { key: 'external_resources', label: 'Ressources externes' },
];

const sections = computed(() => {
  const l = locale.value;
  if (!l) return [];
  return SECTION_ORDER
    .map((s) => ({ ...s, html: l[s.key] }))
    .filter((s) => typeof s.html === 'string' && s.html.trim().length);
});
</script>

<template>
  <div class="space-y-5">
    <section v-if="locale?.summary" class="prose prose-zinc max-w-none text-sm dark:prose-invert">
      <p class="lead text-base italic text-zinc-600 dark:text-zinc-400">{{ locale.summary }}</p>
    </section>

    <section
      v-for="s in sections"
      :key="s.key"
      class="space-y-2"
    >
      <h2 class="text-base font-semibold tracking-tight">{{ s.label }}</h2>
      <!-- Cooked HTML is sanitized server-side by the C2C API. -->
      <div class="prose prose-zinc max-w-none text-sm dark:prose-invert" v-html="s.html" />
    </section>
  </div>
</template>
