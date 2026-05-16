import { createRouter, createWebHashHistory } from 'vue-router';

// Lazy-loaded so each tab/section only pulls its chunk on first visit.
const SearchView = () => import('@/views/SearchView.vue');
const RecentOutingsView = () => import('@/views/RecentOutingsView.vue');
const SavedView = () => import('@/views/SavedView.vue');
const ProfileView = () => import('@/views/ProfileView.vue');
const MoreView = () => import('@/views/MoreView.vue');
const TopoDetailView = () => import('@/views/TopoDetailView.vue');

const ToposView = () => import('@/views/ToposView.vue');
const ArticlesView = () => import('@/views/ArticlesView.vue');
const BooksView = () => import('@/views/BooksView.vue');
const XreportsView = () => import('@/views/XreportsView.vue');
const ForumView = () => import('@/views/ForumView.vue');
const ForumCategoryView = () => import('@/views/ForumCategoryView.vue');
const ForumTopicView = () => import('@/views/ForumTopicView.vue');
const DiscussionsView = () => import('@/views/DiscussionsView.vue');

const routes = [
  { path: '/', redirect: '/search' },
  // Legacy redirects kept so any shared link from the first iteration still resolves.
  { path: '/explorer', redirect: '/search' },
  { path: '/map', redirect: '/saved' },

  // Bottom-nav tabs
  { path: '/search', name: 'search', component: SearchView, meta: { tab: 'search' } },
  { path: '/recent', name: 'recent', component: RecentOutingsView, meta: { tab: 'recent' } },
  { path: '/saved', name: 'saved', component: SavedView, meta: { tab: 'saved' } },
  { path: '/me', name: 'profile', component: ProfileView, meta: { tab: 'profile' } },
  { path: '/more', name: 'more', component: MoreView, meta: { tab: 'more' } },

  // "Plus" hub sub-views — internal, no jumps to camptocamp.org.
  { path: '/topos', name: 'topos', component: ToposView, meta: { tab: 'more' } },
  { path: '/articles', name: 'articles', component: ArticlesView, meta: { tab: 'more' } },
  { path: '/books', name: 'books', component: BooksView, meta: { tab: 'more' } },
  { path: '/xreports', name: 'xreports', component: XreportsView, meta: { tab: 'more' } },
  { path: '/forum', name: 'forum', component: ForumView, meta: { tab: 'more' } },
  {
    path: '/forum/c/:slug/:id',
    name: 'forum-category',
    component: ForumCategoryView,
    props: true,
    meta: { tab: 'more' },
  },
  {
    path: '/forum/t/:id/:slug?',
    name: 'forum-topic',
    component: ForumTopicView,
    props: true,
    meta: { tab: 'more' },
  },
  { path: '/discussions', name: 'discussions', component: DiscussionsView, meta: { tab: 'more' } },

  // Generic document detail (any C2C type).
  {
    path: '/topo/:type/:id/:lang?',
    name: 'topo',
    component: TopoDetailView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

export default router;
