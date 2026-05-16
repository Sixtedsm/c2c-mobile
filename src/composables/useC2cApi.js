import axios from 'axios';

const BASE_URL = 'https://api.camptocamp.org';
const MEDIA_URL = 'https://media.camptocamp.org/c2corg-active';
const FORUM_URL = 'https://forum.camptocamp.org';

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const forumHttp = axios.create({
  baseURL: FORUM_URL,
  timeout: 15000,
});

const DOCUMENT_TYPES = ['article', 'book', 'image', 'outing', 'route', 'waypoint', 'xreport', 'area', 'map'];

function pluralize(type) {
  return `${type}s`;
}

export function useC2cApi() {
  return {
    /**
     * List documents of a given type, with optional filters. The C2C list
     * endpoints accept a wide range of query params — we don't enforce a
     * schema here, the caller is expected to pass valid keys.
     */
    async listDocuments(type, params = {}) {
      if (!DOCUMENT_TYPES.includes(type)) {
        throw new Error(`Unknown document type: ${type}`);
      }
      const { data } = await http.get(`/${pluralize(type)}`, { params });
      return data;
    },

    /**
     * Full-text search across C2C document types.
     */
    async search(q, opts = {}) {
      const types = opts.types?.length ? opts.types.join(',') : 'r,o,w';
      const { data } = await http.get('/search', {
        params: {
          q,
          t: types,
          pl: opts.lang || 'fr',
          limit: opts.limit ?? 20,
        },
      });
      return data;
    },

    /**
     * Autocomplete on areas (massifs/regions). Returns up to 10 matches.
     */
    async searchAreas(q) {
      if (!q || q.length < 2) return [];
      const { data } = await http.get('/search', {
        params: { q, t: 'a', pl: 'fr', limit: 10 },
      });
      return data.areas?.documents || [];
    },

    /**
     * Fetch a single cooked document (with localized HTML rendered).
     */
    async getCooked(type, id, lang) {
      if (!DOCUMENT_TYPES.includes(type)) {
        throw new Error(`Unknown document type: ${type}`);
      }
      const { data } = await http.get(`/${pluralize(type)}/${id}`, {
        params: { cook: lang },
      });
      return data;
    },

    /**
     * Comments on a document (where C2C supports them — outings, xreports).
     * They live in the Discourse forum and are linked via the document_id.
     */
    async getComments(type, id) {
      try {
        // C2C exposes /<type>s/<id>/comments → forwards to the Discourse forum
        // topic associated with the doc. Some types don't have comments.
        const { data } = await http.get(`/${pluralize(type)}/${id}/comments`);
        return data;
      } catch (e) {
        return null;
      }
    },

    /**
     * Discourse forum: latest topics (homepage feed).
     */
    async forumLatest(opts = {}) {
      const { data } = await forumHttp.get('/latest.json', {
        params: { page: opts.page ?? 0 },
      });
      return data;
    },

    /**
     * Discourse forum: list of top-level categories.
     */
    async forumCategories() {
      const { data } = await forumHttp.get('/categories.json');
      return data;
    },

    /**
     * Topics in a forum category.
     */
    async forumCategory(slug, id, opts = {}) {
      const { data } = await forumHttp.get(`/c/${slug}/${id}.json`, {
        params: { page: opts.page ?? 0 },
      });
      return data;
    },

    /**
     * Single topic with its posts.
     */
    async forumTopic(id, opts = {}) {
      const { data } = await forumHttp.get(`/t/${id}.json`, {
        params: opts,
      });
      return data;
    },

    forumUrl(path) {
      return `${FORUM_URL}${path.startsWith('/') ? path : `/${path}`}`;
    },

    forumAvatar(template, size = 48) {
      if (!template) return null;
      const path = template.replace('{size}', size);
      return path.startsWith('http') ? path : `${FORUM_URL}${path}`;
    },

    /**
     * Build a usable image URL for a C2C image document, at the requested size.
     * Size is one of SI (small/200px), MI (medium/400px), BI (big/full).
     */
    imageUrl(image, size = 'MI') {
      if (!image) return null;
      if (image.filename) {
        const sized = image.filename.replace('.', `${size}.`).replace('.svg', '.jpg');
        return `${MEDIA_URL}/${sized}`;
      }
      if (image.document_id) {
        return `${BASE_URL}/images/proxy/${image.document_id}?size=${size}`;
      }
      return null;
    },

    http,
    forumHttp,
    BASE_URL,
    MEDIA_URL,
    FORUM_URL,
    DOCUMENT_TYPES,
  };
}
