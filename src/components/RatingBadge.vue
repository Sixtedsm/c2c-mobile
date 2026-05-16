<script setup>
import { computed } from 'vue';

// Difficulty badge mirroring the orange chip camptocamp.org uses to highlight
// the global rating of a route or outing. Falls back gracefully when no
// rating is available (rendered as nothing).

const props = defineProps({
  rating: { type: [String, Number], default: null },
  // Optional secondary rating shown muted next to the main one (e.g. ski +
  // global on the same route). Pass as a string.
  secondary: { type: [String, Number], default: null },
  size: { type: String, default: 'md' }, // 'sm' | 'md'
});

const visible = computed(() => props.rating != null && props.rating !== '');
</script>

<template>
  <span v-if="visible" class="inline-flex items-center gap-1 font-semibold leading-none"
    :class="size === 'sm' ? 'text-[10px]' : 'text-xs'"
  >
    <span
      :style="{
        backgroundColor: '#ff9933',
        color: 'white',
        padding: size === 'sm' ? '2px 5px' : '3px 7px',
        borderRadius: '2px',
      }"
    >
      {{ rating }}
    </span>
    <span
      v-if="secondary"
      :style="{
        color: '#9ca3af',
      }"
    >
      {{ secondary }}
    </span>
  </span>
</template>
