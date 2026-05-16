import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

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

// Inject the JWT on every authenticated request. The interceptor reads the
// auth store fresh each time so a login mid-session takes effect on the next
// call without re-instantiating the axios client.
http.interceptors.request.use((config) => {
  try {
    const auth = useAuthStore();
    if (auth.isLoggedIn && auth.authHeader) {
      config.headers = config.headers || {};
      config.headers.Authorization = auth.authHeader;
    }
  } catch {
    // Pinia not installed in some edge contexts — non-fatal.
  }
  return config;
});

const DOCUMENT_TYPES = [
  'article', 'book', 'image', 'outing', 'route', 'waypoint',
  'xreport', 'area', 'map', 'profile',
];

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

    async searchAreas(q) {
      if (!q || q.length < 2) return [];
      const { data } = await http.get('/search', {
        params: { q, t: 'a', pl: 'fr', limit: 10 },
      });
      return data.areas?.documents || [];
    },

    async getCooked(type, id, lang) {
      if (!DOCUMENT_TYPES.includes(type)) {
        throw new Error(`Unknown document type: ${type}`);
      }
      const { data } = await http.get(`/${pluralize(type)}/${id}`, {
        params: { cook: lang },
      });
      return data;
    },

    async getComments(type, id) {
      try {
        const { data } = await http.get(`/${pluralize(type)}/${id}/comments`);
        return data;
      } catch (e) {
        return null;
      }
    },

    // ---------- Auth -----------------------------------------------------
    async login({ username, password }) {
      const { data } = await http.post('/users/login', {
        username,
        password,
        // Skip Discourse SSO flow — we only need the JWT for the API.
        discourse: false,
        // Some accounts require explicit Terms-of-Service acceptance on every
        // login (typically after a TOS update). Setting this avoids a 403
        // for users who have already accepted them on the website.
        accept_tos: true,
      });
      return data;
    },

    async logout() {
      try {
        await http.post('/users/logout', { discourse: false });
      } catch {
        // Logout is best-effort: if the server can't be reached we still
        // wipe local state in the caller.
      }
    },

    async renewToken() {
      const { data } = await http.post('/users/renew');
      return data;
    },

    async requestPasswordChange(email) {
      const { data } = await http.post('/users/request_password_change', { email });
      return data;
    },

    /** Fetch the authenticated user's own preferences (followed activities, etc.). */
    async getMyPreferences() {
      const { data } = await http.get('/users/preferences');
      return data;
    },

    /** Fetch a user profile (the public part) by id. */
    async getProfile(id, lang = 'fr') {
      const { data } = await http.get(`/profiles/${id}`, { params: { cook: lang } });
      return data;
    },

    // ---------- Forum (Discourse) ----------------------------------------
    async forumLatest(opts = {}) {
      const { data } = await forumHttp.get('/latest.json', {
        params: { page: opts.page ?? 0 },
      });
      return data;
    },

    async forumCategories() {
      const { data } = await forumHttp.get('/categories.json');
      return data;
    },

    async forumCategory(slug, id, opts = {}) {
      const { data } = await forumHttp.get(`/c/${slug}/${id}.json`, {
        params: { page: opts.page ?? 0 },
      });
      return data;
    },

    async forumTopic(id, opts = {}) {
      const { data } = await forumHttp.get(`/t/${id}.json`, { params: opts });
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
