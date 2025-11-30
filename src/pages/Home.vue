<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 card">
      <div class="flex items-center gap-3">
        <div class="h-12 w-12 rounded-2xl bg-moss/40 border border-moss/60 grid place-items-center text-mint font-bold">N</div>
        <div>
          <h1 class="title-h1">NGA Translate Desktop</h1>
          <p class="muted">Vue + Tailwind + Tauri with local Rust VietPhrase translator.</p>
        </div>
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        <input v-model="keyword" @keyup.enter="goSearch" class="input" placeholder="Search threads or paste NGA URL" />
        <select v-model="target" class="input">
          <option value="threads">Threads</option>
          <option value="forums">Forums</option>
        </select>
        <button class="btn btn-primary" @click="goSearch">Search</button>
      </div>
    </div>

    <Translator />

    <div class="grid gap-4 md:grid-cols-2">
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title">Favorites</h2>
          <router-link to="/forums" class="nav-link nav-active">Manage</router-link>
        </div>
        <div v-if="!favorites.length" class="muted text-sm">No favorites yet.</div>
        <div v-else class="space-y-2">
          <div v-for="fav in favorites" :key="fav.fid" class="flex items-center gap-3 bg-moss/20 p-3 rounded-xl">
            <img :src="fav.avatar" class="h-10 w-10 rounded-lg object-cover" />
            <div class="flex-1">
              <div class="text-sm font-semibold">{{ fav.name }}</div>
              <div class="text-xs text-smoke">{{ fav.subject }}</div>
            </div>
            <router-link :to="`/forum/${fav.fid}`" class="btn btn-ghost text-xs">Open</router-link>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title">History</h2>
          <router-link to="/history" class="nav-link nav-active">View all</router-link>
        </div>
        <div v-if="!history.length" class="muted text-sm">No history yet.</div>
        <div v-else class="space-y-2">
          <div v-for="item in history.slice(0,6)" :key="item.tid" class="flex items-center gap-3 bg-moss/20 p-3 rounded-xl">
            <div class="flex-1">
              <div class="text-sm font-semibold truncate">{{ item.subject }}</div>
              <div class="text-xs text-smoke">{{ item.fid }} • {{ timeAgo(item.visitedAt) }}</div>
            </div>
            <router-link :to="`/thread/${item.tid}`" class="btn btn-ghost text-xs">Resume</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Translator from '../components/Translator.vue';
import { useRouter } from 'vue-router';
import { useDataStore } from '../stores/useDataStore';
import { timeAgo } from '../utils/format';

const router = useRouter();
const { state } = useDataStore();
const favorites = computed(() => state.favorites);
const history = computed(() => state.history);
const keyword = ref('');
const target = ref('threads');

const goSearch = () => {
  if (!keyword.value.trim()) return;
  router.push({ path: '/search', query: { q: keyword.value, type: target.value } });
};
</script>
