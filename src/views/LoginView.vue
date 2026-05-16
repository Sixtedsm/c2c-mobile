<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useC2cApi } from '@/composables/useC2cApi';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const api = useC2cApi();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const busy = ref(false);
const error = ref(null);
const forgotEmailSent = ref(false);
const showForgot = ref(false);

async function submit() {
  if (!username.value.trim() || !password.value || busy.value) return;
  busy.value = true;
  error.value = null;
  forgotEmailSent.value = false;
  try {
    const data = await api.login({
      username: username.value.trim(),
      password: password.value,
    });
    // Apply state immediately so the rest of the app sees the session even
    // if the persist write to IDB hasn't flushed yet, then navigate before
    // any further work — Sixte's bug was a window where the success arrived
    // but the view still showed the login form, looking like a failure.
    auth.applyLoginResponse(data);
    const redirect = route.query.redirect;
    if (typeof redirect === 'string' && redirect.startsWith('/')) {
      router.replace(redirect);
    } else {
      router.replace({ name: 'profile' });
    }
    // Persist in background — failure to write IDB shouldn't block UX.
    auth.persist().catch(() => {});
  } catch (e) {
    if (e?.response?.status === 403) {
      error.value = 'Identifiants invalides.';
    } else if (e?.code === 'ERR_NETWORK') {
      error.value = "Impossible de joindre Camptocamp (réseau ou CORS bloqué).";
    } else {
      error.value = e?.response?.data?.errors?.[0]?.description
        || e?.message
        || 'Erreur lors de la connexion.';
    }
  } finally {
    busy.value = false;
  }
}

async function askPasswordReset() {
  if (!username.value.includes('@')) {
    error.value = 'Entre ton email pour réinitialiser le mot de passe.';
    return;
  }
  busy.value = true;
  error.value = null;
  try {
    await api.requestPasswordChange(username.value.trim());
    forgotEmailSent.value = true;
  } catch (e) {
    error.value = e?.message || 'Erreur.';
  } finally {
    busy.value = false;
  }
}

function back() {
  if (window.history.length > 1) router.back();
  else router.replace({ name: 'profile' });
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <header class="flex items-center gap-2 px-4 py-3" style="border-bottom: 1px solid rgba(0,0,0,0.1);">
      <button
        class="inline-flex h-9 w-9 items-center justify-center text-c2c-text hover:bg-zinc-100"
        aria-label="Retour"
        @click="back"
        style="border-radius: 3px;"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <h1 class="page-title">Connexion</h1>
    </header>

    <form class="space-y-4 p-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-c2c-text" for="username">
          Pseudo ou email
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          required
          class="w-full bg-white px-3 py-2.5 text-base placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none"
          style="border: 1px solid rgba(0,0,0,0.18); border-radius: 3px;"
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-c2c-text" for="password">
          Mot de passe
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full bg-white px-3 py-2.5 text-base placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none"
          style="border: 1px solid rgba(0,0,0,0.18); border-radius: 3px;"
        />
      </div>

      <div v-if="error" class="p-3 text-sm text-red-700" style="background-color: #fff5f5; border: 1px solid #fed7d7;">
        {{ error }}
      </div>

      <div v-if="forgotEmailSent" class="p-3 text-sm text-emerald-800" style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
        Email de réinitialisation envoyé.
      </div>

      <button
        type="submit"
        class="btn-primary w-full"
        :disabled="busy || !username.trim() || !password"
        :class="(busy || !username.trim() || !password) ? 'opacity-60 cursor-not-allowed' : ''"
      >
        <svg v-if="busy" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" />
        </svg>
        <span>{{ busy ? 'Connexion…' : 'Se connecter' }}</span>
      </button>

      <div class="text-center text-xs">
        <button
          type="button"
          class="underline"
          style="color: #337ab7;"
          @click="showForgot = !showForgot"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div v-if="showForgot" class="p-3" style="background-color: #fbfaf6; border: 1px solid rgba(0,0,0,0.12);">
        <p class="mb-2 text-xs text-c2c-text">
          Entre ton email dans le champ "Pseudo ou email" ci-dessus, puis clique :
        </p>
        <button
          type="button"
          class="btn-secondary w-full text-sm"
          :disabled="busy"
          @click="askPasswordReset"
        >
          Envoyer le lien de réinitialisation
        </button>
      </div>

      <p class="pt-4 text-center text-xs text-zinc-500">
        Pas de compte ?
        <a href="https://www.camptocamp.org/auth#register" target="_blank" rel="noopener" style="color: #337ab7;">
          Inscription sur camptocamp.org
        </a>
      </p>
    </form>
  </div>
</template>
