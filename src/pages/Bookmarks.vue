<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="title-h1">Bookmarks</h1>
      <span class="badge">{{ bookmarks.length }} saved</span>
    </div>
    <div class="card space-y-2">
      <div v-if="!bookmarks.length" class="muted">No bookmarks yet.</div>
      <div v-else class="space-y-2">
        <div v-for="item in bookmarks" :key="item.tid" class="flex items-center gap-3 bg-moss/20 p-3 rounded-xl">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-fog truncate">{{ item.subject }}</div>
            <div class="text-xs text-smoke">{{ item.fid }} • {{ new Date(item.savedAt).toLocaleString() }}</div>
          </div>
          <router-link :to="`/thread/${item.tid}`" class="btn btn-ghost text-xs">Open</router-link>
          <button class="btn btn-ghost text-xs" @click="remove(item.tid)">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useDataStore } from '../stores/useDataStore';

const { state, removeBookmark } = useDataStore();
const bookmarks = computed(() => state.bookmarks);
const remove = (tid) => removeBookmark(tid);
</script>
