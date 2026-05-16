<script setup>
import { onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
});

const emit = defineEmits(['close']);

// Lock body scroll while the sheet is open — otherwise the page underneath
// can be scrolled away on mobile.
function lockScroll(lock) {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = lock ? 'hidden' : '';
}

watch(
  () => props.open,
  (v) => lockScroll(v),
  { immediate: true }
);

onBeforeUnmount(() => lockScroll(false));

function onBackdropClick() {
  emit('close');
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="sheet-backdrop" @click="onBackdropClick" />
  </transition>
  <transition name="slide-up">
    <div v-if="open" class="sheet animate-sheet-in" @click.stop>
      <div class="sheet-handle" />
      <header v-if="title || $slots.header" class="flex items-center justify-between px-4 pb-2 pt-1">
        <slot name="header">
          <h2 class="text-lg font-semibold">{{ title }}</h2>
        </slot>
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Fermer"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>
      <div class="max-h-[calc(90vh-3rem)] overflow-y-auto px-4 pb-6">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <slot name="footer" />
      </footer>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-leave-active {
  transition: transform 0.2s ease-in;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
