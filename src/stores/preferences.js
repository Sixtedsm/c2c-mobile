import { defineStore } from 'pinia';
import { get, set } from 'idb-keyval';
import { emptyFilters, filtersToParams, PARAM_OVERRIDES } from '@/composables/useFilters';

const STORAGE_KEY = 'c2c-preferences-v2';

// User preferences are stored as a regular filter object (same shape as
// AdvancedFilters) plus an `enabled` master flag. This lets us reuse the same
// AdvancedFilters sheet and `filtersToParams` for both ad-hoc filtering and
// persistent prefs.
function defaultState() {
  return { enabled: false, ...emptyFilters() };
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    prefs: defaultState(),
    hydrated: false,
  }),

  getters: {
    isEnabled: (state) => state.prefs.enabled,

    // Build API params from the prefs, optionally typed to a doc kind so the
    // right param-name overrides apply.
    apiParams: (state) => (docType = 'outing') => {
      const filters = { ...state.prefs };
      delete filters.enabled;
      return filtersToParams(filters, PARAM_OVERRIDES[docType] || {});
    },

    activeFilterCount: (state) => {
      const filters = { ...state.prefs };
      delete filters.enabled;
      // Re-use the shared counter so behavior matches what AdvancedFilters shows.
      let n = 0;
      for (const v of Object.values(filters)) {
        if (Array.isArray(v) && v.length) n += 1;
        else if (typeof v === 'string' && v.trim()) n += 1;
        else if (typeof v === 'number' && v != null) n += 1;
        else if (v === true) n += 1;
      }
      return n;
    },
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      const stored = await get(STORAGE_KEY);
      if (stored && typeof stored === 'object') {
        // Merge with defaults so newly-added keys get a sensible value.
        this.prefs = { ...defaultState(), ...stored };
      }
      this.hydrated = true;
    },

    async persist() {
      await set(STORAGE_KEY, { ...this.prefs });
    },

    async update(patch) {
      // Persist the full filter shape — patch is the result of an Apply on
      // the AdvancedFilters sheet (already a complete filter object), or a
      // partial override.
      this.prefs = { ...this.prefs, ...patch };
      await this.persist();
    },

    async setEnabled(v) {
      this.prefs.enabled = !!v;
      await this.persist();
    },

    async reset() {
      this.prefs = defaultState();
      await this.persist();
    },
  },
});
