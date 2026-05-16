<script setup>
// Two-select min/max picker for ordinal scales (cotations: F→ED7, ski, libre, etc.)
// and for free numeric ranges (altitude, dénivelé). Lightweight by design —
// a true dual-handle slider would feel right on the site but adds DOM weight.
// Selects are accessible, easy to thumb on mobile, and match what the site
// falls back to when JS isn't available.

const props = defineProps({
  // Label shown above the row.
  label: { type: String, required: true },
  // Either ordinal (list of strings) or numeric (placeholder shown + input number).
  values: { type: Array, default: null },
  min: { type: [String, Number, null], default: null },
  max: { type: [String, Number, null], default: null },
  // Numeric-mode hints.
  numericPlaceholderMin: { type: String, default: 'Min' },
  numericPlaceholderMax: { type: String, default: 'Max' },
  step: { type: Number, default: 1 },
  inputMode: { type: String, default: 'numeric' },
});

const emit = defineEmits(['update:min', 'update:max']);

function onMin(v) {
  emit('update:min', v === '' ? null : v);
}
function onMax(v) {
  emit('update:max', v === '' ? null : v);
}
</script>

<template>
  <div>
    <p class="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{{ label }}</p>

    <!-- Ordinal mode: two selects from the same list -->
    <div v-if="values" class="flex items-center gap-2">
      <select
        :value="min ?? ''"
        class="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        @change="onMin($event.target.value)"
      >
        <option value="">Min</option>
        <option v-for="v in values" :key="`min-${v}`" :value="v">{{ v }}</option>
      </select>
      <span class="text-zinc-400">→</span>
      <select
        :value="max ?? ''"
        class="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        @change="onMax($event.target.value)"
      >
        <option value="">Max</option>
        <option v-for="v in values" :key="`max-${v}`" :value="v">{{ v }}</option>
      </select>
    </div>

    <!-- Numeric mode: two number inputs -->
    <div v-else class="flex items-center gap-2">
      <input
        :value="min ?? ''"
        type="number"
        :inputmode="inputMode"
        :step="step"
        :placeholder="numericPlaceholderMin"
        class="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        @input="onMin(($event.target.value !== '' ? Number($event.target.value) : ''))"
      />
      <span class="text-zinc-400">→</span>
      <input
        :value="max ?? ''"
        type="number"
        :inputmode="inputMode"
        :step="step"
        :placeholder="numericPlaceholderMax"
        class="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        @input="onMax(($event.target.value !== '' ? Number($event.target.value) : ''))"
      />
    </div>
  </div>
</template>
