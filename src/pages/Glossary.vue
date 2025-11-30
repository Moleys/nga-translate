<template>
  <div class="card space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-h1">Glossary</h1>
        <p class="muted text-sm">These terms are injected into translations first.</p>
      </div>
      <button class="btn btn-primary" @click="addEmpty">Add</button>
    </div>

    <div v-if="!entries.length" class="muted">No glossary entries yet.</div>
    <div v-else class="space-y-2">
      <div v-for="(entry, idx) in entries" :key="idx" class="flex gap-2 items-center">
        <input v-model="entry.raw" class="input" placeholder="Raw" />
        <input v-model="entry.mean" class="input" placeholder="Meaning" />
        <button class="btn btn-ghost text-xs" @click="remove(idx)">Remove</button>
      </div>
    </div>

    <button class="btn btn-primary" @click="save">Save</button>
    <span v-if="saved" class="text-mint text-sm">Saved</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDataStore } from '../stores/useDataStore';

const { state, setGlossary } = useDataStore();
const entries = ref(state.glossary.map(g => ({ ...g })));
const saved = ref(false);

const addEmpty = () => entries.value.push({ raw: '', mean: '' });
const remove = (idx) => entries.value.splice(idx, 1);
const save = () => {
  setGlossary(entries.value.filter(e => e.raw && e.mean));
  saved.value = true;
  setTimeout(() => saved.value = false, 1500);
};
</script>
