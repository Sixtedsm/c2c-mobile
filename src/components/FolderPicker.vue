<script setup>
import { ref } from 'vue';
import BottomSheet from '@/components/BottomSheet.vue';
import { useOfflineStore } from '@/stores/offline';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Choisir un dossier' },
  // Currently selected folder id — null for "no folder".
  modelValue: { type: [String, null], default: null },
  // Show the "Retirer du hors-ligne" action at the bottom (move-mode only).
  showRemove: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'close', 'select', 'remove']);

const offlineStore = useOfflineStore();
const newName = ref('');

async function createAndSelect() {
  const n = newName.value.trim();
  if (!n) return;
  const id = await offlineStore.createFolder(n);
  newName.value = '';
  if (id) {
    emit('update:modelValue', id);
    emit('select', id);
  }
}

function selectFolder(id) {
  emit('update:modelValue', id);
  emit('select', id);
}
</script>

<template>
  <BottomSheet :open="open" :title="title" @close="emit('close')">
    <ul class="space-y-1 pb-2">
      <li>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          :class="modelValue == null ? 'bg-brand-50 dark:bg-brand-900/30' : ''"
          @click="selectFolder(null)"
        >
          <svg class="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span class="flex-1 text-sm font-medium">Sans dossier</span>
          <svg v-if="modelValue == null" class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </li>
      <li v-for="folder in offlineStore.folders" :key="folder.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800"
          :class="modelValue === folder.id ? 'bg-brand-50 dark:bg-brand-900/30' : ''"
          @click="selectFolder(folder.id)"
        >
          <svg class="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11Z" />
          </svg>
          <span class="flex-1 text-sm font-medium">{{ folder.name }}</span>
          <svg v-if="modelValue === folder.id" class="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </li>
    </ul>

    <!-- Inline create-folder field. Cheaper UX than nesting prompts. -->
    <div class="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Nouveau dossier
      </p>
      <div class="flex items-center gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="Mont-Blanc, été 2026…"
          class="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900"
          @keydown.enter.prevent="createAndSelect"
        />
        <button
          type="button"
          class="btn-primary !px-3 !py-2 text-sm"
          :disabled="!newName.trim() || offlineStore.creatingFolder"
          :class="(!newName.trim() || offlineStore.creatingFolder) ? 'opacity-50' : ''"
          @click="createAndSelect"
        >Créer</button>
      </div>
    </div>

    <template v-if="showRemove" #footer>
      <button type="button" class="btn-secondary w-full !text-red-600" @click="emit('remove')">
        Retirer du hors-ligne
      </button>
    </template>
  </BottomSheet>
</template>
