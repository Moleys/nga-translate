const GlossaryPage = {
  key: 'nga_glossary',

  init() {
    this.textarea = document.getElementById('glossary-text');
    this.fileInput = document.getElementById('glossary-file-input');

    this.load();
    this.bindEvents();
  },

  parse(text) {
    const lines = (text || '').split(/\r?\n/);
    const arr = [];
    lines.forEach(line => {
      const t = line.trim();
      if (!t) return;
      const idx = t.indexOf('=');
      if (idx <= 0) return;
      const raw = t.slice(0, idx).trim();
      const mean = t.slice(idx + 1).trim();
      if (raw) arr.push({ raw, mean });
    });
    return arr;
  },

  serialize(arr) {
    if (!Array.isArray(arr)) return '';
    return arr.map(it => `${it.raw}=${it.mean || ''}`).join('\n');
  },

  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return;
      const arr = JSON.parse(raw);
      this.textarea.value = this.serialize(arr);
    } catch {}
  },

  save() {
    try {
      const arr = this.parse(this.textarea.value);
      localStorage.setItem(this.key, JSON.stringify(arr));
      localStorage.setItem('nga_glossary_updated_at', String(Date.now()));
      alert('Saved glossary');
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    }
  },

  export() {
    try {
      const blob = new Blob([this.textarea.value || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glossary.txt';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e) { console.error(e); }
  },

  importFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      // only keep lines with '='
      this.textarea.value = text.split(/\r?\n/).filter(l => l.includes('=')).join('\n');
    };
    reader.readAsText(file);
  },

  clear() {
    if (!confirm('Clear all glossary entries?')) return;
    localStorage.removeItem(this.key);
    this.textarea.value = '';
  },

  bindEvents() {
    const saveBtn = document.getElementById('glossary-save-btn-page');
    const exportBtn = document.getElementById('glossary-export-btn');
    const importBtn = document.getElementById('glossary-import-btn');
    const clearBtn = document.getElementById('glossary-clear-btn');

    saveBtn?.addEventListener('click', () => this.save());
    exportBtn?.addEventListener('click', () => this.export());
    importBtn?.addEventListener('click', () => this.fileInput?.click());
    clearBtn?.addEventListener('click', () => this.clear());
    this.fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.importFromFile(file);
      e.target.value = '';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('glossary-text')) GlossaryPage.init();
});

