<template>
  <div class="space-y-4">
    <div class="card space-y-3">
      <div class="flex items-center gap-3">
        <input v-model="keyword" @keyup.enter="runSearch" class="input" placeholder="Keyword or NGA URL" />
        <select v-model="type" class="input max-w-[140px]">
          <option value="threads">Threads</option>
          <option value="forums">Forums</option>
        </select>
        <button class="btn btn-primary" @click="runSearch">Search</button>
      </div>
      <div class="text-xs text-smoke">Auth UID/Token loaded from Settings; threads API may require valid NGA cookies.</div>
    </div>

    <div class="card space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="section-title">Results</h2>
        <span class="badge" v-if="results.length">{{ results.length }} items</span>
      </div>
      <div v-if="error" class="text-rose-300 text-sm">{{ error }}</div>
      <div v-else-if="loading" class="muted">Searching…</div>
      <div v-else-if="!results.length" class="muted">No results.</div>
      <div v-else class="space-y-2">
        <div v-for="item in results" :key="item.tid || item.fid || item.__id" class="p-3 rounded-2xl bg-moss/20 border border-moss/40">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold text-fog">{{ item.subject || item.name || 'Untitled' }}</div>
              <div class="text-xs text-smoke">{{ item.author || item.info || '' }}</div>
            </div>
            <router-link v-if="item.tid" :to="`/thread/${item.tid}`" class="btn btn-ghost text-xs">Open</router-link>
            <router-link v-else-if="item.fid" :to="`/forum/${item.fid}`" class="btn btn-ghost text-xs">Open</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { searchThreads, searchForums } from '../api/nga';
import { useRoute } from 'vue-router';
import { useDataStore } from '../stores/useDataStore';

const route = useRoute();
const { state } = useDataStore();
const keyword = ref(route.query.q || '');
const type = ref(route.query.type || 'threads');
const loading = ref(false);
const error = ref('');
const results = ref([]);

const normalize = (resp) => {
  if (!resp) return [];
  if (resp.result && Array.isArray(resp.result.data)) return resp.result.data;
  if (Array.isArray(resp.result)) return resp.result;
  if (resp.result?.__T) return Object.values(resp.result.__T);
  return [];
};

const runSearch = async () => {
  if (!keyword.value.trim()) return;
  loading.value = true;
  error.value = '';
  results.value = [];
  try {
    const payload = { keyword: keyword.value, page: 1, uid: state.auth.uid, token: state.auth.token };
    const data = type.value === 'forums' ? await searchForums(payload) : await searchThreads(payload);
    results.value = normalize(data);
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (keyword.value) runSearch();
});
</script>
