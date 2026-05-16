import { defineStore } from 'pinia';
import { del, get, set } from 'idb-keyval';

// Single source of truth for the user's C2C session. Persists the JWT and
// the minimal user metadata returned by POST /users/login so the session
// survives a page reload (or an iOS PWA standalone relaunch).
const STORAGE_KEY = 'c2c-auth-v1';

function isExpired(expire) {
  if (!expire) return true;
  // C2C's `expire` field is seconds since epoch.
  return Date.now() / 1000 >= expire;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    expire: null,      // epoch seconds
    id: null,
    username: null,
    name: null,
    forumUsername: null,
    roles: [],
    lang: 'fr',
    hydrated: false,
    error: null,
    busy: false,
  }),

  getters: {
    isLoggedIn(state) {
      return !!state.token && !isExpired(state.expire);
    },
    needsRenewal(state) {
      if (!state.token || !state.expire) return false;
      // Renew when less than 24h left on the token.
      const remaining = state.expire - Date.now() / 1000;
      return remaining > 0 && remaining < 86400;
    },
    authHeader(state) {
      return state.token ? `JWT token="${state.token}"` : null;
    },
  },

  actions: {
    async hydrate() {
      if (this.hydrated) return;
      const stored = await get(STORAGE_KEY);
      if (stored && stored.token && !isExpired(stored.expire)) {
        this.$patch({
          token: stored.token,
          expire: stored.expire,
          id: stored.id,
          username: stored.username,
          name: stored.name,
          forumUsername: stored.forumUsername,
          roles: stored.roles || [],
          lang: stored.lang || 'fr',
        });
      } else if (stored) {
        // Stale token — wipe it.
        await del(STORAGE_KEY);
      }
      this.hydrated = true;
    },

    async persist() {
      if (!this.token) {
        await del(STORAGE_KEY);
        return;
      }
      await set(STORAGE_KEY, {
        token: this.token,
        expire: this.expire,
        id: this.id,
        username: this.username,
        name: this.name,
        forumUsername: this.forumUsername,
        roles: this.roles,
        lang: this.lang,
      });
    },

    applyLoginResponse(data) {
      // Shape mirrors POST /users/login response.
      this.$patch({
        token: data.token,
        expire: data.expire,
        id: data.id,
        username: data.username,
        name: data.name,
        forumUsername: data.forum_username,
        roles: data.roles || [],
        lang: data.lang || 'fr',
        error: null,
      });
    },

    async signOutLocal() {
      this.$patch({
        token: null,
        expire: null,
        id: null,
        username: null,
        name: null,
        forumUsername: null,
        roles: [],
        error: null,
      });
      await this.persist();
    },
  },
});
