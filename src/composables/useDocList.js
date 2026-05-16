import { ref, isRef, onMounted, onBeforeUnmount, unref } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';

/**
 * Reusable list controller for any C2C document type. Handles pagination,
 * filter-driven reloads, and infinite scroll via IntersectionObserver.
 *
 * `type` may be a string ('route', 'outing', …) or a ref that switches the
 * doc type dynamically — useful for views that toggle between e.g. routes
 * and waypoints. The caller must call `reload()` when the type changes.
 *
 * `buildParams` returns the current API query params (filters, search, etc.)
 * and is invoked fresh on every load.
 */
export function useDocList(type, buildParams) {
  const api = useC2cApi();
  const PAGE_SIZE = 30;

  const docs = ref([]);
  const loading = ref(true);
  const loadingMore = ref(false);
  const error = ref(null);
  const offset = ref(0);
  const hasMore = ref(true);
  const sentinel = ref(null);

  function currentType() {
    return isRef(type) ? unref(type) : type;
  }

  async function load(reset = true) {
    if (reset) {
      loading.value = true;
      error.value = null;
      offset.value = 0;
      hasMore.value = true;
    } else {
      if (!hasMore.value || loadingMore.value) return;
      loadingMore.value = true;
    }
    try {
      const params = { limit: PAGE_SIZE, offset: offset.value, ...buildParams() };
      const result = await api.listDocuments(currentType(), params);
      const fresh = result.documents || [];
      docs.value = reset ? fresh : docs.value.concat(fresh);
      if (fresh.length < PAGE_SIZE) hasMore.value = false;
    } catch (e) {
      if (reset) {
        error.value = e?.message || 'Chargement impossible.';
        docs.value = [];
      }
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  function reload() {
    return load(true);
  }

  function loadMore() {
    offset.value += PAGE_SIZE;
    return load(false);
  }

  let observer = null;
  onMounted(() => {
    load(true);
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );
    setTimeout(() => {
      if (sentinel.value) observer.observe(sentinel.value);
    }, 0);
  });

  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });

  return {
    docs,
    loading,
    loadingMore,
    error,
    hasMore,
    sentinel,
    reload,
    loadMore,
  };
}

/**
 * Build C2C API query params from a filter object (matches the shape stored
 * by the preferences store and AdvancedFilters component).
 */
export function filtersToParams(filters) {
  const params = {};
  if (!filters) return params;
  if (filters.activities?.length) params.act = filters.activities.join(',');
  if (filters.waypointTypes?.length) params.wtyp = filters.waypointTypes.join(',');
  if (filters.articleCategories?.length) params.acat = filters.articleCategories.join(',');
  if (filters.areas?.length) params.a = filters.areas.map((a) => a.document_id).join(',');
  if (filters.elevationMin != null) params.hmin = filters.elevationMin;
  if (filters.elevationMax != null) params.hmax = filters.elevationMax;
  if (filters.globalRatingMin || filters.globalRatingMax) {
    params.grat = `${filters.globalRatingMin || ''},${filters.globalRatingMax || ''}`;
  }
  if (filters.skiRatingMin || filters.skiRatingMax) {
    params.srat = `${filters.skiRatingMin || ''},${filters.skiRatingMax || ''}`;
  }
  if (filters.rockFreeMin || filters.rockFreeMax) {
    params.frat = `${filters.rockFreeMin || ''},${filters.rockFreeMax || ''}`;
  }
  if (filters.engagementMin || filters.engagementMax) {
    params.erat = `${filters.engagementMin || ''},${filters.engagementMax || ''}`;
  }
  if (filters.orientations?.length) params.fac = filters.orientations.join(',');
  if (filters.q?.trim()) params.q = filters.q.trim();
  return params;
}
