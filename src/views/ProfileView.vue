<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useC2cApi } from '@/composables/useC2cApi';
import { useOfflineStore } from '@/stores/offline';
import DocCard from '@/components/DocCard.vue';

const auth = useAuthStore();
const api = useC2cApi();
const offlineStore = useOfflineStore();
const router = useRouter();

const profile = ref(null);
const myOutings = ref([]);
const profileLoading = ref(false);
const outingsLoading = ref(false);
const storage = ref({ usage: 0, quota: 0 });

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

async function loadProfile() {
  if (!auth.isLoggedIn || !auth.id) return;
  profileLoading.value = true;
  try {
    profile.value = await api.getProfile(auth.id, auth.lang);
  } catch {
    profile.value = null;
  } finally {
    profileLoading.value = false;
  }
}

async function loadMyOutings() {
  if (!auth.isLoggedIn || !auth.id) return;
  outingsLoading.value = true;
  try {
    const result = await api.listDocuments('outing', { u: auth.id, limit: 20 });
    myOutings.value = result.documents || [];
  } catch {
    myOutings.value = [];
  } finally {
    outingsLoading.value = false;
  }
}

async function signIn() {
  router.push({ name: 'login' });
}

async function signOut() {
  await api.logout();
  await auth.signOutLocal();
  profile.value = null;
  myOutings.value = [];
}

const displayName = computed(() => {
  if (profile.value?.cooked?.title) return profile.value.cooked.title;
  if (auth.name) return auth.name;
  return auth.username || 'Utilisateur';
});

const summary = computed(() => {
  if (profile.value?.locales?.[0]?.summary) return profile.value.locales[0].summary;
  return null;
});

onMounted(async () => {
  await auth.hydrate();
  await offlineStore.hydrate();
  storage.value = await offlineStore.estimateUsage();
  if (auth.isLoggedIn) {
    loadProfile();
    loadMyOutings();
  }
});
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Moi</h1>
    </header>

    <section class="space-y-3 p-3">
      <!-- Non logged-in: just the login CTA. -->
      <template v-if="!auth.isLoggedIn">
        <div class="card flex flex-col items-center gap-3 p-6 text-center">
          <div class="flex h-16 w-16 items-center justify-center bg-zinc-100" style="border-radius: 50%;">
            <svg class="h-8 w-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 14a4 4 0 1 0-8 0m12 7c0-3.314-3.582-6-8-6s-8 2.686-8 6m16 0H4" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-c2c-text">Non connecté</p>
            <p class="mt-1 text-xs text-zinc-500">
              Connecte-toi avec ton compte Camptocamp pour retrouver tes sorties,
              tes itinéraires et tes contributions.
            </p>
          </div>
          <button class="btn-primary w-full" @click="signIn">
            Se connecter
          </button>
        </div>
      </template>

      <!-- Logged-in: user info + my outings + offline stats. -->
      <template v-else>
        <div class="card flex items-center gap-3 p-4">
          <div
            class="flex h-14 w-14 flex-none items-center justify-center text-xl font-bold text-white"
            style="background: linear-gradient(135deg, #ff9933, #b26f1e); border-radius: 50%;"
          >
            {{ (auth.username || '?')[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold text-c2c-text">{{ displayName }}</p>
            <p class="text-xs text-zinc-500">@{{ auth.username }}</p>
            <p v-if="auth.roles.length" class="mt-0.5 text-[10px] uppercase tracking-wider text-brand-700">
              {{ auth.roles.join(' · ') }}
            </p>
          </div>
          <button class="btn-secondary !px-3 !py-2 text-sm" @click="signOut">
            Déconnexion
          </button>
        </div>

        <div v-if="summary" class="card p-4">
          <p class="text-sm text-c2c-text">{{ summary }}</p>
        </div>

        <!-- My outings — really fetched from C2C with u=<user_id>. -->
        <section>
          <header class="flex items-center justify-between px-1 pb-1.5">
            <h2 class="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Mes sorties
            </h2>
            <router-link
              :to="{ name: 'search' }"
              class="text-xs"
              style="color: #337ab7;"
            >
              Voir tout →
            </router-link>
          </header>

          <div v-if="outingsLoading" class="space-y-2">
            <div v-for="i in 3" :key="i" class="list-row animate-pulse">
              <div class="h-14 w-14 flex-none bg-zinc-200" />
              <div class="flex-1 space-y-1.5">
                <div class="h-4 w-3/4 bg-zinc-200" />
                <div class="h-3 w-1/2 bg-zinc-200" />
              </div>
            </div>
          </div>

          <div v-else-if="!myOutings.length" class="bg-white p-4 text-center text-sm text-zinc-500" style="border: 1px solid rgba(0,0,0,0.12);">
            Aucune sortie publiée pour l'instant.
          </div>

          <ul v-else class="space-y-2">
            <li v-for="doc in myOutings" :key="doc.document_id">
              <DocCard :doc="doc" type="outing" variant="compact" :show-save="true" />
            </li>
          </ul>
        </section>

        <!-- Offline storage stats (local to this device). -->
        <section>
          <h2 class="px-1 pb-1.5 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Stockage hors-ligne
          </h2>
          <div class="card divide-y" style="border-color: rgba(0,0,0,0.12);">
            <div class="flex items-center justify-between p-3">
              <span class="text-sm">Topos sauvegardés</span>
              <span class="font-semibold tabular-nums">{{ offlineStore.savedCount }}</span>
            </div>
            <div class="flex items-center justify-between p-3">
              <span class="text-sm">Espace utilisé</span>
              <span class="font-semibold tabular-nums">{{ formatBytes(storage.usage) }}</span>
            </div>
            <div class="flex items-center justify-between p-3">
              <span class="text-sm">Quota navigateur</span>
              <span class="font-semibold tabular-nums">{{ formatBytes(storage.quota) }}</span>
            </div>
          </div>
        </section>
      </template>
    </section>
  </div>
</template>
