<script setup>
import { onMounted, ref } from 'vue';
import { useC2cApi } from '@/composables/useC2cApi';

const api = useC2cApi();

const categories = ref([]);
const latest = ref([]);
const users = ref({}); // id -> user object
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

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const [cats, lat] = await Promise.all([
      api.forumCategories(),
      api.forumLatest(),
    ]);
    categories.value = cats.category_list?.categories || [];
    latest.value = lat.topic_list?.topics || [];
    users.value = Object.fromEntries(
      (lat.users || []).map((u) => [u.id, u])
    );
  } catch (e) {
    // Discourse instances often don't allow cross-origin reads without a
    // proxy. Surface the error so the user knows why the forum is empty.
    error.value =
      e?.code === 'ERR_NETWORK'
        ? 'Forum non accessible directement depuis l\'application (CORS). Un proxy serveur sera ajouté.'
        : e?.message || 'Impossible de charger le forum.';
  } finally {
    loading.value = false;
  }
}

function topicPoster(topic) {
  const first = topic.posters?.[0];
  if (!first) return null;
  return users.value[first.user_id] || null;
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Forum</h1>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">
        Discussions de la communauté Camptocamp
      </p>
    </header>

    <section class="space-y-4 p-3">
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 6" :key="i" class="list-row animate-pulse">
          <div class="h-12 w-12 flex-none rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div class="flex-1 space-y-1.5">
            <div class="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div class="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <p class="font-semibold">Forum indisponible</p>
        <p class="mt-1 opacity-90">{{ error }}</p>
        <button class="btn-secondary mt-3" @click="load">Réessayer</button>
      </div>

      <template v-else>
        <!-- Categories -->
        <section v-if="categories.length">
          <h2 class="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Catégories
          </h2>
          <ul class="grid grid-cols-2 gap-2">
            <li v-for="cat in categories" :key="cat.id">
              <router-link
                :to="{ name: 'forum-category', params: { slug: cat.slug, id: cat.id } }"
                class="card flex h-full flex-col gap-1 p-3 transition-transform active:scale-[0.98]"
              >
                <div
                  class="h-2 w-8 rounded-full"
                  :style="{ backgroundColor: `#${cat.color || 'aaaaaa'}` }"
                />
                <h3 class="font-semibold leading-tight">{{ cat.name }}</h3>
                <p v-if="cat.description_text" class="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {{ cat.description_text }}
                </p>
                <p class="mt-auto text-xs text-zinc-400">
                  {{ cat.topic_count }} sujets
                </p>
              </router-link>
            </li>
          </ul>
        </section>

        <!-- Latest topics -->
        <section v-if="latest.length">
          <h2 class="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Discussions récentes
          </h2>
          <ul class="space-y-2">
            <li v-for="topic in latest" :key="topic.id">
              <router-link
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
            </li>
          </ul>
        </section>
      </template>
    </section>
  </div>
</template>
