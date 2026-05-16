import { ref, watch } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';

// Listing endpoints (`/routes`, `/outings`, …) don't carry the document's
// images — only `img_count`. The `/images?d=…` query I tried earlier IGNORED
// the d param and returned the latest 3 site-wide images for every doc, which
// is why every card showed the same photo. The only reliable way to get a
// doc's cover is to fetch the doc itself (`/<type>s/<id>?cook=<lang>`),
// which carries `associations.images`. We do that lazily, with a small
// concurrency cap so we don't spam the API when a listing renders 20 cards.

const coverCache = new Map();    // docId -> { filename, document_id } | null
const pendingCache = new Map();  // docId -> Promise

// Map the short `type` codes returned in listings to the plural API path.
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

function endpointFor(typeHint, doc) {
  // Listings expose `type` as a one-letter code; cooked docs also do.
  const code = doc?.type || typeHint;
  return TYPE_TO_ENDPOINT[code] || null;
}

// Concurrency-limited queue so a listing of 30 outings doesn't burst 30
// parallel requests to api.camptocamp.org.
const MAX_INFLIGHT = 4;
let inFlight = 0;
const queue = [];

function drain() {
  while (inFlight < MAX_INFLIGHT && queue.length) {
    const { fn, resolve, reject } = queue.shift();
    inFlight += 1;
    fn().then(resolve, reject).finally(() => {
      inFlight -= 1;
      drain();
    });
  }
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
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

async function fetchCover(api, doc, lang) {
  const docId = doc.document_id;
  if (coverCache.has(docId)) return coverCache.get(docId);
  if (pendingCache.has(docId)) return pendingCache.get(docId);

  const endpoint = endpointFor(null, doc);
  if (!endpoint) {
    coverCache.set(docId, null);
    return null;
  }

  const p = enqueue(async () => {
    try {
      const { data } = await api.http.get(`/${endpoint}/${docId}`, {
        params: { cook: lang },
      });
      const cover = readDirectImage(data);
      coverCache.set(docId, cover);
      return cover;
    } catch (e) {
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
 * the doc already exposes images, otherwise fires a lazy fetch with a
 * concurrency cap.
 */
export function useDocCover(doc, size = 'MI', lang = 'fr') {
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
      // Confirmed no cover.
      url.value = null;
      return;
    }
    // Cache miss — fire and forget; resolve url when the fetch lands.
    fetchCover(api, d, lang).then((entry) => {
      if (entry) url.value = api.imageUrl(entry, size);
      else url.value = null;
    });
  }

  watch(() => doc?.value ?? doc, () => resolve(), { immediate: true, deep: false });

  return { url };
}
