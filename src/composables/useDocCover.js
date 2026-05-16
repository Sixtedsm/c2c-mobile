import { ref, watch } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';

// Listing endpoints (`/routes`, `/outings`, …) don't carry the document's
// images — only `img_count`. The naive `/images?d=…` filter is silently
// ignored by the API and always returns the latest 3 site-wide uploads.
//
// What works: `GET /<type>s/<id>` (without `?cook=`) returns the full doc
// with `associations.images` — verified live. It's substantially lighter
// than the cooked variant since it skips the rendered locales HTML, so we
// can afford to fetch one per visible card. A small concurrency cap keeps
// listings from bursting 30 parallel requests.

const coverCache = new Map();    // docId -> { filename, document_id } | null
const pendingCache = new Map();  // docId -> Promise

const TYPE_TO_ENDPOINT = {
  r: 'routes',
  o: 'outings',
  w: 'waypoints',
  a: 'articles',
  b: 'books',
  x: 'xreports',
  i: 'images',
  u: 'profiles',
};

function endpointFor(doc) {
  const code = doc?.type;
  return TYPE_TO_ENDPOINT[code] || null;
}

// Concurrency cap — high enough to keep a visible page feeling fast, low
// enough to stay polite with the API.
const MAX_INFLIGHT = 8;
let inFlight = 0;
const queue = [];

function drain() {
  while (inFlight < MAX_INFLIGHT && queue.length) {
    const { fn, resolve } = queue.shift();
    inFlight += 1;
    fn()
      .then((r) => resolve(r))
      .catch(() => resolve(null))   // never let one bad fetch starve the queue
      .finally(() => {
        inFlight -= 1;
        drain();
      });
  }
}

function enqueue(fn) {
  return new Promise((resolve) => {
    queue.push({ fn, resolve });
    drain();
  });
}

function readDirectImage(doc) {
  const assoc = doc?.associations?.images;
  if (Array.isArray(assoc) && assoc.length) {
    return { filename: assoc[0].filename, document_id: assoc[0].document_id };
  }
  return null;
}

async function fetchCover(api, doc) {
  const docId = doc.document_id;
  if (coverCache.has(docId)) return coverCache.get(docId);
  if (pendingCache.has(docId)) return pendingCache.get(docId);

  const endpoint = endpointFor(doc);
  if (!endpoint) {
    coverCache.set(docId, null);
    return null;
  }

  const p = enqueue(async () => {
    try {
      // Important: NO `cook` param — the bare-doc shape carries
      // associations.images and is much lighter than the cooked one.
      const { data } = await api.http.get(`/${endpoint}/${docId}`, { timeout: 10000 });
      const cover = readDirectImage(data);
      coverCache.set(docId, cover);
      return cover;
    } catch {
      coverCache.set(docId, null);
      return null;
    } finally {
      pendingCache.delete(docId);
    }
  });
  pendingCache.set(docId, p);
  return p;
}

/**
 * Reactive cover-image URL for a C2C document. Resolves synchronously when
 * the doc already exposes images (detail views, some search payloads),
 * otherwise fires a lazy fetch with a concurrency cap.
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
    if (cached) {
      url.value = api.imageUrl(cached, size);
      return;
    }
    if (cached === null) {
      url.value = null;
      return;
    }
    fetchCover(api, d).then((entry) => {
      if (entry) url.value = api.imageUrl(entry, size);
      else url.value = null;
    });
  }

  watch(() => doc?.value ?? doc, () => resolve(), { immediate: true, deep: false });

  return { url };
}
