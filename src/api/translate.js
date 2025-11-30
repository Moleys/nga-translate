import { invoke } from '@tauri-apps/api/core';

export async function translateText(text, glossary = []) {
  const payload = { text, glossary };
  const res = await invoke('translate_text', { payload });
  return res.translated_text || '';
}
