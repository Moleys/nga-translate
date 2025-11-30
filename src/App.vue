<template>
  <div>
    <header class="sticky top-0 z-40 bg-midnight/90 backdrop-blur border-b border-moss/50">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <router-link to="/" class="flex items-center gap-3 text-fog font-semibold">
          <div class="h-10 w-10 rounded-2xl bg-moss/50 border border-moss/60 grid place-items-center text-mint font-bold">N</div>
          <div>
            <div class="text-sm text-smoke">NGA Translate</div>
            <div class="text-xs text-smoke/70">Desktop • Rust VietPhrase</div>
          </div>
        </router-link>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link" :class="{ 'nav-active': isActive(link.to) }">
            {{ link.label }}
          </RouterLink>
        </nav>
        <div class="flex-1" />
        <router-link to="/login" class="btn btn-ghost text-sm">Auth</router-link>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 pb-16 pt-6">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const links = [
  { to: '/', label: 'Home' },
  { to: '/forums', label: 'Forums' },
  { to: '/search', label: 'Search' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/history', label: 'History' },
  { to: '/glossary', label: 'Glossary' },
];

const route = useRoute();
const isActive = (to) => route.path === to;
</script>
