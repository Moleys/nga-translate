<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="title-h1">Forums</h1>
      <input v-model="filter" class="input max-w-xs" placeholder="Filter" />
    </div>
    <div class="space-y-4">
      <div v-for="category in filtered" :key="category.category" class="card space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="section-title">{{ category.category }}</h2>
          <span class="badge">{{ category.forums.length }} forums</span>
        </div>
        <div class="grid-cards">
          <div v-for="forum in category.forums" :key="forum.fid" class="flex gap-3 border border-moss/60 rounded-2xl p-3 bg-moss/10">
            <img :src="forum.avatar" class="h-12 w-12 rounded-xl object-cover" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <router-link :to="`/forum/${forum.fid}`" class="font-semibold text-fog truncate">{{ forum.name }}</router-link>
                <button class="text-smoke" @click="toggle(forum)">
                  <span v-if="isFavorite(forum.fid)">★</span><span v-else>☆</span>
                </button>
              </div>
              <div class="text-xs text-smoke truncate">{{ forum.subject }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import forumList from '../data/forum-list.json';
import { useDataStore } from '../stores/useDataStore';

const { state, toggleFavorite, isFavorite } = useDataStore();
const filter = ref('');

const filtered = computed(() => {
  if (!filter.value.trim()) return forumList;
  const term = filter.value.toLowerCase();
  return forumList
    .map(cat => ({
      ...cat,
      forums: cat.forums.filter(f => f.name.toLowerCase().includes(term) || f.subject.toLowerCase().includes(term)),
    }))
    .filter(cat => cat.forums.length > 0);
});

const toggle = (forum) => {
  toggleFavorite({ fid: forum.fid, name: forum.name, subject: forum.subject, avatar: forum.avatar });
};
</script>
