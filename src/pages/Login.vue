<template>
  <div class="card space-y-4 max-w-xl">
    <h1 class="title-h1">NGA Credentials</h1>
    <p class="muted text-sm">Paste your <code>nga_access_uid</code> and <code>nga_access_token</code> cookies. They stay local inside the Tauri app.</p>
    <div class="space-y-2">
      <label class="text-sm text-smoke">Access UID</label>
      <input v-model="uid" class="input" placeholder="nga_access_uid" />
    </div>
    <div class="space-y-2">
      <label class="text-sm text-smoke">Access Token</label>
      <input v-model="token" class="input" placeholder="nga_access_token" />
    </div>
    <div class="flex gap-3">
      <button class="btn btn-primary" @click="save">Save</button>
      <span class="text-sm text-mint" v-if="saved">Saved!</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDataStore } from '../stores/useDataStore';

const { state, setAuth } = useDataStore();
const uid = ref(state.auth.uid);
const token = ref(state.auth.token);
const saved = ref(false);

const save = () => {
  setAuth(uid.value, token.value);
  saved.value = true;
  setTimeout(() => saved.value = false, 1500);
};
</script>
