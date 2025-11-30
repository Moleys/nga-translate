<template>
  <div class="card space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="section-title">Translator (Rust VietPhrase)</h2>
      <span v-if="language" class="badge">Detected: {{ language }}</span>
    </div>
    <div class="grid gap-3 md:grid-cols-2">
      <div class="space-y-2">
        <label class="text-sm text-smoke">Source</label>
        <textarea v-model="text" rows="8" class="input min-h-[160px] resize-y"></textarea>
      </div>
      <div class="space-y-2">
        <label class="text-sm text-smoke">Glossary (raw=mean per line)</label>
        <textarea v-model="glossary" rows="8" class="input min-h-[160px] resize-y" placeholder="比如: 北京=Beijing"></textarea>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button class="btn btn-primary" :disabled="loading" @click="runTranslate">{{ loading ? 'Translating…' : 'Translate' }}</button>
      <button class="btn btn-ghost" type="button" @click="loadSample">Sample</button>
      <p v-if="error" class="text-rose-300 text-sm">{{ error }}</p>
    </div>
    <div class="space-y-2">
      <label class="text-sm text-smoke">Result</label>
      <textarea :value="result" rows="8" class="input min-h-[160px] resize-y" readonly></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { translateText } from '../api/translate';
import { useDataStore } from '../stores/useDataStore';

const { state } = useDataStore();
const text = ref('');
const glossary = ref('');
const result = ref('');
const language = ref('');
const loading = ref(false);
const error = ref('');

const parseGlossary = () => {
  const merged = [...state.glossary];
  glossary.value.split(/\r?\n/).forEach((line) => {
    const [raw, mean] = line.split('=');
    if (raw && mean) merged.push({ raw: raw.trim(), mean: mean.trim() });
  });
  return merged;
};

const runTranslate = async () => {
  if (!text.value.trim()) {
    error.value = 'Text is required';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const translated = await translateText(text.value, parseGlossary());
    result.value = translated;
    language.value = 'zh';
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

const loadSample = () => {
  text.value = '欢迎来到NGA。这是一个本地翻译示例。';
  glossary.value = 'NGA=NGA论坛';
  result.value = '';
  language.value = '';
};
</script>
