import { reactive, watch } from 'vue';

const STORAGE_KEY = 'nga-desktop-state-v1';

const defaults = {
  auth: { uid: '', token: '' },
  favorites: [],
  bookmarks: [],
  history: [],
  glossary: [],
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch (err) {
    console.warn('state load failed', err);
    return { ...defaults };
  }
}

const state = reactive(load());

watch(state, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}, { deep: true });

export function useDataStore() {
  const setAuth = (uid, token) => {
    state.auth.uid = uid || '';
    state.auth.token = token || '';
  };

  const toggleFavorite = (forum) => {
    const idx = state.favorites.findIndex((f) => f.fid === forum.fid);
    if (idx >= 0) state.favorites.splice(idx, 1);
    else state.favorites.push(forum);
  };

  const isFavorite = (fid) => state.favorites.some((f) => f.fid === fid);

  const addBookmark = (item) => {
    const exists = state.bookmarks.find((b) => b.tid === item.tid);
    if (!exists) {
      state.bookmarks.unshift({ ...item, savedAt: Date.now() });
      if (state.bookmarks.length > 100) state.bookmarks.pop();
    }
  };

  const removeBookmark = (tid) => {
    const idx = state.bookmarks.findIndex((b) => b.tid === tid);
    if (idx >= 0) state.bookmarks.splice(idx, 1);
  };

  const addHistory = (item) => {
    const existsIdx = state.history.findIndex((h) => h.tid === item.tid);
    if (existsIdx >= 0) state.history.splice(existsIdx, 1);
    state.history.unshift({ ...item, visitedAt: Date.now() });
    if (state.history.length > 60) state.history.pop();
  };

  const setGlossary = (entries) => {
    state.glossary = entries.map((g) => ({ raw: g.raw, mean: g.mean }));
  };

  return {
    state,
    setAuth,
    toggleFavorite,
    isFavorite,
    addBookmark,
    removeBookmark,
    addHistory,
    setGlossary,
  };
}
