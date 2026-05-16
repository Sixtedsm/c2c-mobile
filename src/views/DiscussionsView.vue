<script setup>
// "Discussions diverses" is a specific category on the C2C forum. We
// auto-discover it on load (by name match) and reuse the forum category
// view so the rendering stays consistent. If no match, we fall back to
// the latest topics feed.
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useC2cApi } from '@/composables/useC2cApi';

const router = useRouter();
const api = useC2cApi();
const error = ref(null);
const status = ref('Recherche de la catégorie « Discussions diverses »…');

const KEYWORDS = ['discussion', 'divers', 'café', 'cafe'];

async function findAndRedirect() {
  try {
    const data = await api.forumCategories();
    const cats = data.category_list?.categories || [];
    // Look for a category whose name contains any of the keywords.
    const match = cats.find((c) => {
      const name = (c.name || '').toLowerCase();
      return KEYWORDS.some((k) => name.includes(k));
    });
    if (match) {
      router.replace({
        name: 'forum-category',
        params: { slug: match.slug, id: match.id },
      });
    } else {
      // Fallback: route to the forum index so the user still gets somewhere
      // useful instead of an empty screen.
      status.value = 'Catégorie introuvable, retour à l\'index du forum.';
      router.replace({ name: 'forum' });
    }
  } catch (e) {
    error.value =
      e?.code === 'ERR_NETWORK'
        ? 'Forum non accessible directement depuis l\'application (CORS).'
        : e?.message || 'Impossible de joindre le forum.';
  }
}

onMounted(findAndRedirect);
</script>

<template>
  <div class="flex flex-col">
    <header class="page-header">
      <h1 class="page-title">Discussions diverses</h1>
    </header>
    <section class="p-4">
      <div v-if="error" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <p class="font-semibold">Forum indisponible</p>
        <p class="mt-1 opacity-90">{{ error }}</p>
      </div>
      <div v-else class="rounded-2xl bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {{ status }}
      </div>
    </section>
  </div>
</template>
