<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useC2cApi } from '@/composables/useC2cApi';

const route = useRoute();
const router = useRouter();
const api = useC2cApi();

const topic = ref(null);
const loading = ref(true);
const error = ref(null);

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

const posts = computed(() => topic.value?.post_stream?.posts || []);
const title = computed(() => topic.value?.fancy_title || topic.value?.title || '');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    topic.value = await api.forumTopic(route.params.id);
  } catch (e) {
    error.value = e?.message || 'Sujet introuvable.';
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load);
onMounted(load);
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <div class="flex items-center gap-2">
        <button
          class="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Retour"
          @click="router.back()"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 class="line-clamp-2 text-lg font-bold leading-tight">{{ title }}</h1>
      </div>
    </header>

    <section class="space-y-3 p-3">
      <div v-if="loading" class="space-y-2">
        <div v-for="i in 3" :key="i" class="card animate-pulse space-y-2 p-3">
          <div class="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div class="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div v-else-if="error" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <p class="font-semibold">Indisponible</p>
        <p class="mt-1 opacity-90">{{ error }}</p>
        <button class="btn-secondary mt-3" @click="load">Réessayer</button>
      </div>

      <template v-else>
        <article
          v-for="post in posts"
          :key="post.id"
          class="card p-3"
        >
          <header class="flex items-center gap-2.5 pb-2">
            <div class="h-9 w-9 flex-none overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <img
                v-if="post.avatar_template"
                :src="api.forumAvatar(post.avatar_template, 48)"
                :alt="post.username"
                loading="lazy"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">
                {{ post.name || post.username }}
                <span v-if="post.moderator || post.admin" class="ml-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                  {{ post.admin ? 'Admin' : 'Modérateur' }}
                </span>
              </p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ formatDate(post.created_at) }}
              </p>
            </div>
          </header>
          <!-- Discourse delivers cooked HTML (sanitized server-side). -->
          <div class="prose prose-zinc max-w-none text-sm dark:prose-invert" v-html="post.cooked" />
        </article>
      </template>
    </section>
  </div>
</template>
