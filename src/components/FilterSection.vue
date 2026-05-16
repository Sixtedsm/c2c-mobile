<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  // Number of active values inside this section — shown as a small badge so
  // the user knows which sections currently affect the result.
  active: { type: Number, default: 0 },
  // Open by default? Most sections start collapsed to keep the sheet short;
  // a few (activités, massifs) open by default.
  defaultOpen: { type: Boolean, default: false },
});

const open = ref(props.defaultOpen);
function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <section class="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
    <button
      type="button"
      class="flex w-full items-center gap-2 py-3 text-left"
      :aria-expanded="open"
      @click="toggle"
    >
      <h3 class="flex-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {{ title }}
      </h3>
      <span
        v-if="active"
        class="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white"
      >{{ active }}</span>
      <svg
        class="h-4 w-4 text-zinc-400 transition-transform"
        :class="{ 'rotate-180': open }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <div v-show="open" class="pb-3">
      <slot />
    </div>
  </section>
</template>
