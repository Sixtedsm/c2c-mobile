<script setup>
import { computed } from 'vue';
import DocCard from '@/components/DocCard.vue';

const props = defineProps({
  doc: { type: Object, required: true },
});

// Each block is shown only if there's something to display. Keeps the page
// tight on documents that have few associations.
const associations = computed(() => {
  const a = props.doc?.associations || {};
  return [
    { key: 'routes', type: 'route', label: 'Itinéraires associés', items: a.routes },
    { key: 'outings', type: 'outing', label: 'Dernières sorties', items: a.outings },
    { key: 'waypoints', type: 'waypoint', label: 'Points de passage', items: a.waypoints },
    { key: 'articles', type: 'article', label: 'Articles associés', items: a.articles },
    { key: 'books', type: 'book', label: 'Topoguides', items: a.books },
    { key: 'xreports', type: 'xreport', label: 'Récits Sérac liés', items: a.xreports },
  ].filter((b) => Array.isArray(b.items) && b.items.length);
});
</script>

<template>
  <div class="space-y-5">
    <section v-for="block in associations" :key="block.key" class="space-y-2">
      <h2 class="px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {{ block.label }}
      </h2>
      <ul class="space-y-2">
        <li v-for="item in block.items" :key="item.document_id">
          <DocCard :doc="item" :type="block.type" variant="compact" :show-save="false" />
        </li>
      </ul>
    </section>
  </div>
</template>
