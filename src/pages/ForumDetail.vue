<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-h1">Forum {{ fid }}</h1>
        <p class="muted text-sm">Threads pulled directly from NGA mobile API.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost text-xs" :class="{ 'text-mint': act === 'list' }" @click="changeAct('list')">Latest</button>
        <button class="btn btn-ghost text-xs" :class="{ 'text-mint': act === 'topped' }" @click="changeAct('topped')">Topped</button>
        <button class="btn btn-ghost text-xs" :class="{ 'text-mint': act === 'hot' }" @click="changeAct('hot')">Hot</button>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="badge">Page {{ page }}</span>
          <span class="badge" v-if="forumName">{{ forumName }}</span>
        </div>
        <button class="btn btn-primary" @click="translateTitles" :disabled="loadingTranslate">{{ loadingTranslate ? 'Translating…' : 'Translate titles' }}</button>
      </div>
      <div v-if="error" class="text-rose-300 text-sm">{{ error }}</div>
      <div v-else-if="loading" class="muted">Loading threads…</div>
      <div v-else class="space-y-3">
        <div v-for="thread in threads" :key="thread.tid || thread.tpcurl || thread.__id" class="p-3 rounded-2xl bg-moss/20 border border-moss/40">
          <div class="flex items-start gap-3">
            <div class="pill text-xs">{{ thread.author || thread.authorid || 'anon' }}</div>
            <div class="flex-1 min-w-0">
              <router-link :to="`/thread/${thread.tid || thread.tpcurl || thread.__id}`" class="font-semibold text-fog block truncate">{{ thread.subject || thread.__subject || 'Untitled' }}</router-link>
              <div class="text-xs text-smoke flex gap-3 mt-1">
                <span>{{ thread.replies || thread.tpcurl || 0 }} replies</span>
                <span>fid {{ thread.fid || fid }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-ghost" :disabled="page === 1 || loading" @click="prevPage">Prev</button>
          <button class="btn btn-primary" :disabled="loading" @click="nextPage">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { fetchForumThreads } from '../api/nga';
import { translateText } from '../api/translate';
import { useDataStore } from '../stores/useDataStore';

const props = defineProps({ fid: { type: String, required: true } });
const { state } = useDataStore();

const loading = ref(false);
const loadingTranslate = ref(false);
const error = ref('');
const page = ref(1);
const act = ref('list');
const threads = ref([]);
const forumName = ref('');

const normalizeThreads = (resp) => {
  if (!resp) return [];
  if (resp.forumname) forumName.value = resp.forumname;
  if (resp.result) {
    if (Array.isArray(resp.result.data)) return resp.result.data;
    if (Array.isArray(resp.result)) return resp.result;
    if (resp.result.__T) return Object.values(resp.result.__T);
  }
  if (Array.isArray(resp)) return resp;
  return [];
};

const loadThreads = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchForumThreads({ fid: props.fid, page: page.value, act: act.value, uid: state.auth.uid, token: state.auth.token });
    threads.value = normalizeThreads(data);
  } catch (err) {
    error.value = err?.message || String(err);
    threads.value = [];
  } finally {
    loading.value = false;
  }
};

const translateTitles = async () => {
  if (!threads.value.length) return;
  loadingTranslate.value = true;
  try {
    const texts = threads.value.map(t => t.subject || t.__subject || '');
    const translated = await translateText(texts.join('\n'));
    const lines = translated.split('\n');
    threads.value = threads.value.map((t, idx) => ({ ...t, subject: lines[idx] || t.subject }));
  } finally {
    loadingTranslate.value = false;
  }
};

const nextPage = () => { page.value += 1; loadThreads(); };
const prevPage = () => { if (page.value > 1) { page.value -= 1; loadThreads(); } };
const changeAct = (val) => { act.value = val; page.value = 1; loadThreads(); };

watch(() => props.fid, () => { page.value = 1; loadThreads(); });

onMounted(() => loadThreads());
</script>
