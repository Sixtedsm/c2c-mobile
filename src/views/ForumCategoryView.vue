<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useC2cApi } from '@/composables/useC2cApi';

const route = useRoute();
const router = useRouter();
const api = useC2cApi();

const topics = ref([]);
const users = ref({});
const category = ref(null);
const loading = ref(true);
const error = ref(null);

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return d;
  }
}

function topicPoster(topic) {
  const first = topic.posters?.[0];
  if (!first) return null;
  return users.value[first.user_id] || null;
}

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const data = await api.forumCategory(route.params.slug, route.params.id);
    category.value = data.category || {
      name: data.topic_list?.category?.name || route.params.slug,
    };
    topics.value = data.topic_list?.topics || [];
    users.value = Object.fromEntries(
      (data.users || []).map((u) => [u.id, u])
    );
  } catch (e) {
    error.value = e?.message || 'Catégorie introuvable.';
  } finally {
    loading.value = false;
  }
}

watch(() => route.fullPath, load);
onMounted(load);
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="flex items-center gap-2">
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Retour"
          @click="router.back()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 class="page-title">{{ category?.name || 'Catégorie' }}</h1>
      </div>
    </header>

    <section class="space-y-2 p-3">
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="list-row animate-pulse">
          <div class="h-10 w-10 flex-none rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div class="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <p class="font-semibold">Indisponible</p>
        <p class="mt-1 opacity-90">{{ error }}</p>
        <button class="btn-secondary mt-3" @click="load">Réessayer</button>
      </div>

      <template v-else>
        <router-link
          v-for="topic in topics"
          :key="topic.id"
          :to="{ name: 'forum-topic', params: { id: topic.id, slug: topic.slug } }"
          class="list-row"
        >
          <div class="h-10 w-10 flex-none overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <img
              v-if="topicPoster(topic)?.avatar_template"
              :src="api.forumAvatar(topicPoster(topic).avatar_template, 48)"
              :alt="topicPoster(topic).username"
              loading="lazy"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-medium">{{ topic.fancy_title || topic.title }}</h3>
            <p class="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ topicPoster(topic)?.username || 'Anonyme' }}
              · {{ topic.posts_count }} messages
              · {{ formatDate(topic.last_posted_at || topic.created_at) }}
            </p>
          </div>
        </router-link>
      </template>
    </section>
  </div>
</template>
