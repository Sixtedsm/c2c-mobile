import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { del, get, keys, set } from 'idb-keyval';
import { useC2cApi } from '@/composables/useC2cApi';

const DOC_KEY = (type, id, lang) => `doc:${type}/${id}/${lang}`;
const FOLDER_KEY = (id) => `folder:${id}`;
const isDocKey = (k) => typeof k === 'string' && k.startsWith('doc:');
const isFolderKey = (k) => typeof k === 'string' && k.startsWith('folder:');

export const useOfflineStore = defineStore('offline', () => {
  const api = useC2cApi();

  const savedDocs = ref([]); // [{ type, id, lang, data, folderId, savedAt }]
  const folders = ref([]); // [{ id, name }]
  const downloadingKeys = ref(new Set());
  const lastHydrationAt = ref(null);

  const savedCount = computed(() => savedDocs.value.length);

  async function hydrate() {
    const allKeys = await keys();
    const docs = await Promise.all(allKeys.filter(isDocKey).map((k) => get(k)));
    const fols = await Promise.all(allKeys.filter(isFolderKey).map((k) => get(k)));
    savedDocs.value = docs.filter(Boolean).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    folders.value = fols.filter(Boolean);
    lastHydrationAt.value = Date.now();
  }

  function isSaved(type, id, lang) {
    return savedDocs.value.some(
      (d) => d.type === type && String(d.id) === String(id) && d.lang === lang
    );
  }

  function isDownloading(type, id, lang) {
    return downloadingKeys.value.has(`${type}/${id}/${lang}`);
  }

  async function saveDocument({ type, id, lang, folderId = null }) {
    const key = `${type}/${id}/${lang}`;
    if (downloadingKeys.value.has(key)) return;
    downloadingKeys.value = new Set([...downloadingKeys.value, key]);
    try {
      const data = await api.getCooked(type, id, lang);
      const entry = { type, id, lang, data, folderId, savedAt: Date.now() };
      await set(DOC_KEY(type, id, lang), entry);
      await hydrate();
    } finally {
      const next = new Set(downloadingKeys.value);
      next.delete(key);
      downloadingKeys.value = next;
    }
  }

  async function removeDocument(type, id, lang) {
    await del(DOC_KEY(type, id, lang));
    await hydrate();
  }

  async function getDocument(type, id, lang) {
    const entry = await get(DOC_KEY(type, id, lang));
    return entry?.data ?? null;
  }

  // Track in-flight folder creations so the UI can disable the button and we
  // can short-circuit duplicate clicks while the IDB write is pending.
  const creatingFolder = ref(false);

  async function createFolder(name) {
    if (creatingFolder.value) return null;
    creatingFolder.value = true;
    try {
      const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const folder = { id, name, createdAt: Date.now() };
      // Optimistic push so the new folder shows up in the list immediately —
      // hydrate() runs after the write to stay authoritative.
      folders.value = [...folders.value, folder];
      await set(FOLDER_KEY(id), folder);
      await hydrate();
      return id;
    } finally {
      creatingFolder.value = false;
    }
  }

  async function moveToFolder(type, id, lang, folderId) {
    const entry = await get(DOC_KEY(type, id, lang));
    if (!entry) return;
    entry.folderId = folderId;
    await set(DOC_KEY(type, id, lang), entry);
    await hydrate();
  }

  async function removeFolder(id) {
    // Loosen the assignments of every document that was in this folder.
    for (const entry of savedDocs.value) {
      if (entry.folderId === id) {
        await moveToFolder(entry.type, entry.id, entry.lang, null);
      }
    }
    await del(FOLDER_KEY(id));
    await hydrate();
  }

  async function estimateUsage() {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return { usage, quota };
    }
    return { usage: 0, quota: 0 };
  }

  return {
    savedDocs,
    folders,
    downloadingKeys,
    creatingFolder,
    savedCount,
    lastHydrationAt,
    hydrate,
    isSaved,
    isDownloading,
    saveDocument,
    removeDocument,
    getDocument,
    createFolder,
    moveToFolder,
    removeFolder,
    estimateUsage,
  };
});
