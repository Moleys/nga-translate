<div class="max-w-5xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-4">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600
                  flex items-center justify-center text-white text-xl shadow-lg"
      >
        <i class="fa-solid fa-book"></i>
      </div>
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-gray-800">Glossary</h1>
        <p class="text-sm text-gray-500" id="glossary-stats">0 entries</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                     text-white bg-gradient-to-r from-[#5a9d8a] to-emerald-600
                     shadow-md hover:shadow-lg transition-all duration-200"
        id="glossary-export-btn"
      >
        <i class="fa-solid fa-download"></i>
        Export
      </button>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                     text-white bg-gradient-to-r from-[#5a9d8a] to-emerald-600
                     shadow-md hover:shadow-lg transition-all duration-200"
        id="glossary-import-btn"
      >
        <i class="fa-solid fa-upload"></i>
        Import
      </button>
      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                     text-red-600 bg-red-50 hover:bg-red-100
                     transition-all duration-200"
        id="glossary-clear-btn"
      >
        <i class="fa-solid fa-trash"></i>
        Clear
      </button>
    </div>
  </div>

  <!-- Description -->
  <div
    class="bg-[#f8fbfa] border border-[#e8efed] rounded-xl p-4 mb-6 text-sm text-gray-600"
  >
    <i class="fa-solid fa-circle-info text-[#5a9d8a] mr-2"></i>
    Format: one entry per line as
    <code class="px-1.5 py-0.5 bg-white rounded text-[#5a9d8a] border"
      >Raw=Meaning</code
    >. This glossary is used to assist translation.
  </div>

  <!-- Textarea -->
  <div
    class="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50
              shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-2"
  >
    <textarea
      id="glossary-text"
      class="w-full min-h-[400px] p-4 rounded-xl border-0 bg-transparent
                     focus:ring-0 focus:outline-none resize-y
                     font-mono text-sm text-gray-700 placeholder:text-gray-400"
      spellcheck="false"
      placeholder="玩=chơi&#10;主角=nhân vật chính&#10;游戏=game"
    ></textarea>
  </div>

  <!-- Save Button -->
  <div class="mt-6 flex justify-end">
    <button
      class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold
                   text-white bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a]
                   shadow-lg hover:shadow-xl hover:shadow-[#5a9d8a]/25
                   transform hover:-translate-y-0.5 transition-all duration-200"
      id="glossary-save-btn-page"
    >
      <i class="fa-solid fa-floppy-disk"></i>
      Save Glossary
    </button>
  </div>

  <!-- Hidden file input -->
  <input
    type="file"
    id="glossary-file-input"
    accept="text/plain"
    style="display:none"
  />
</div>
