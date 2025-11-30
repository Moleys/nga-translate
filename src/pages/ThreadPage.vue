<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-h1 truncate">{{ header.subject || 'Thread ' + tid }}</h1>
        <p class="muted text-sm">{{ header.author || 'Unknown' }} • Replies {{ header.replies || posts.length }}</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost text-xs" @click="addBookmark">Bookmark</button>
        <button class="btn btn-primary text-xs" :disabled="loadingTranslate" @click="translatePosts">{{ loadingTranslate ? 'Translating…' : 'Translate' }}</button>
      </div>
    </div>

    <div class="card">
      <div v-if="error" class="text-rose-300 text-sm">{{ error }}</div>
      <div v-else-if="loading" class="muted">Loading posts…</div>
      <div v-else class="space-y-4">
        <div v-for="post in posts" :key="post.pid || post.__id" class="p-4 rounded-2xl bg-moss/20 border border-moss/40">
          <div class="flex items-center justify-between mb-2 text-xs text-smoke">
            <span>{{ post.author || post.uid || 'anon' }}</span>
            <span>#{{ post.floor || post.lou || post.__id }}</span>
          </div>
          <div class="text-sm leading-relaxed space-y-2" v-html="post.display || post.content || post.message || ''"></div>
          <div v-if="post.translated" class="mt-2 text-sm text-fog bg-moss/30 p-2 rounded-lg">{{ post.translated }}</div>
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
import { fetchThreadPosts } from '../api/nga';
import { translateText } from '../api/translate';
import { useRoute } from 'vue-router';
import { useDataStore } from '../stores/useDataStore';

const route = useRoute();
const tid = route.params.tid;
const { state, addBookmark: saveBookmark, addHistory } = useDataStore();

const loading = ref(false);
const loadingTranslate = ref(false);
const error = ref('');
const page = ref(1);
const posts = ref([]);
const header = ref({ subject: '', author: '', replies: 0 });

const normalizePosts = (resp) => {
  if (!resp) return [];
  if (resp.tsubject) header.value.subject = resp.tsubject;
  if (resp.tauthor) header.value.author = resp.tauthor;
  if (resp.vrows) header.value.replies = resp.vrows;

  if (Array.isArray(resp.result)) return resp.result;
  if (resp.result?.__R) return Object.values(resp.result.__R);
  if (resp.result?.data) return resp.result.data;
  return [];
};

const loadPosts = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchThreadPosts({ tid, page: page.value, uid: state.auth.uid, token: state.auth.token });
    posts.value = normalizePosts(data).map(p => ({ ...p, display: p.content || p.message }));
    addHistory({ tid, subject: header.value.subject || `Thread ${tid}`, fid: data?.fid || '' });
  } catch (err) {
    error.value = err?.message || String(err);
    posts.value = [];
  } finally {
    loading.value = false;
  }
};

const translatePosts = async () => {
  if (!posts.value.length) return;
  loadingTranslate.value = true;
  try {
    const joined = posts.value.map(p => stripHtml(p.content || p.message || '')).join('\n');
    const translated = await translateText(joined, state.glossary);
    const lines = translated.split('\n');
    posts.value = posts.value.map((p, idx) => ({ ...p, translated: lines[idx] || '' }));
  } finally {
    loadingTranslate.value = false;
  }
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, '');

const addBookmark = () => {
  saveBookmark({ tid, subject: header.value.subject || `Thread ${tid}`, fid: header.value.fid || '' });
};

const nextPage = () => { page.value += 1; loadPosts(); };
const prevPage = () => { if (page.value > 1) { page.value -= 1; loadPosts(); } };

watch(() => route.params.tid, () => { page.value = 1; loadPosts(); });

onMounted(() => loadPosts());
</script>
