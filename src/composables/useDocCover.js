import { computed, ref, watch } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';

// The C2C listing endpoints don't include the associated images — only
// `img_count`. The detail endpoint (cooked) does include them. We close the
// gap by issuing a single `/images?d=<doc_id>&limit=1` per document with a
// non-zero img_count, cached for the session so subsequent renders are
// instant.
const coverCache = new Map(); // doc_id -> { state, filename, document_id }
const pendingCache = new Map(); // doc_id -> Promise

function readDirectImage(doc) {
  // If the doc already carries an associations.images entry (detail view, or
  // some search payloads), use it without any extra fetch.
  const assoc = doc?.associations?.images;
  if (Array.isArray(assoc) && assoc.length) {
    return { filename: assoc[0].filename, document_id: assoc[0].document_id };
  }
  return null;
}

async function fetchCover(api, docId) {
  if (coverCache.has(docId)) return coverCache.get(docId);
  if (pendingCache.has(docId)) return pendingCache.get(docId);

  const p = (async () => {
    try {
      // Cheapest probe: 1 image, sorted by default (most recent / best).
      const { data } = await api.http.get('/images', {
        params: { d: docId, limit: 1 },
      });
      const first = data?.documents?.[0];
      if (first) {
        const entry = { state: 'loaded', filename: first.filename, document_id: first.document_id };
        coverCache.set(docId, entry);
        return entry;
      }
      const empty = { state: 'loaded', filename: null, document_id: null };
      coverCache.set(docId, empty);
      return empty;
    } catch (e) {
      const errEntry = { state: 'error', filename: null, document_id: null };
      coverCache.set(docId, errEntry);
      return errEntry;
    } finally {
      pendingCache.delete(docId);
    }
  })();

  pendingCache.set(docId, p);
  return p;
}

/**
 * Reactive cover-image URL for a C2C document. Resolves synchronously when
 * the doc already exposes images, otherwise fires a lazy API call.
 *
 * @param {Ref<object>|object} doc the C2C document (listing or cooked shape)
 * @param {string} size 'SI' (200px), 'MI' (400px), 'BI' (full). Default 'MI'.
 */
export function useDocCover(doc, size = 'MI') {
  const api = useC2cApi();
  const url = ref(null);

  function resolve() {
    const d = doc?.value ?? doc;
    if (!d) {
      url.value = null;
      return;
    }
    const direct = readDirectImage(d);
    if (direct) {
      url.value = api.imageUrl(direct, size);
      return;
    }
    if (!d.img_count) {
      url.value = null;
      return;
    }
    const cached = coverCache.get(d.document_id);
    if (cached?.filename || cached?.document_id) {
      url.value = api.imageUrl(cached, size);
      return;
    }
    if (cached?.state === 'loaded' || cached?.state === 'error') {
      url.value = null;
      return;
    }
    // Fire the lazy fetch.
    fetchCover(api, d.document_id).then((entry) => {
      if (entry?.filename || entry?.document_id) {
        url.value = api.imageUrl(entry, size);
      } else {
        url.value = null;
      }
    });
  }

  // Re-resolve when the underlying doc changes (eg list pagination).
  watch(
    () => doc?.value ?? doc,
    () => resolve(),
    { immediate: true, deep: false }
  );

  return { url };
}

// Expose the size builder for callers that want a different size from the
// same resolved cover (eg thumbnail vs hero in different variants).
export function coverUrl(doc, size = 'MI') {
  const api = useC2cApi();
  const direct = readDirectImage(doc);
  if (direct) return api.imageUrl(direct, size);
  const cached = coverCache.get(doc?.document_id);
  if (cached?.filename || cached?.document_id) return api.imageUrl(cached, size);
  return null;
}
