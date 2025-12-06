<script>
  export let fid = "";
</script>

<div class="max-w-6xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800" id="forum-name">
        <span
          class="inline-block w-6 h-6 border-3 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mr-3"
        ></span>
        Loading...
      </h1>
      <p class="text-gray-400 text-sm mt-1">Forum ID: {fid}</p>
    </div>
    <a
      href="/"
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
              text-gray-600 bg-gray-100 hover:bg-gray-200
              border border-gray-200 hover:border-gray-300 transition-all duration-200"
    >
      <i class="fa-solid fa-arrow-left"></i>
      Back to Forums
    </a>
  </div>

  <!-- Subforums Section -->
  <div id="subforum-container" class="mb-6" style="display: none;">
    <div
      class="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50
                shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] overflow-hidden"
    >
      <div class="px-5 py-3 bg-[#f8fbfa] border-b border-gray-100">
        <h6 class="font-bold text-gray-700 flex items-center gap-2 m-0">
          <i class="fa-solid fa-folder text-[#5a9d8a]"></i>
          Subforums
        </h6>
      </div>
      <div class="p-5">
        <div id="subforum-list" class="flex flex-wrap gap-2"></div>
      </div>
    </div>
  </div>

  <!-- Filter Buttons -->
  <div
    class="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50
              shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-4 mb-6"
  >
    <div class="flex flex-wrap gap-2" role="group" aria-label="Filter threads">
      <button
        type="button"
        class="filter-btn active inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                     text-[#5a9d8a] bg-[#e8efed] border border-[#5a9d8a]/20
                     hover:bg-[#5a9d8a] hover:text-white hover:border-[#5a9d8a]
                     transition-all duration-200"
        data-act="list"
      >
        <i class="fa-solid fa-list-ul"></i> Latest
      </button>
      <button
        type="button"
        class="filter-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                     text-gray-600 bg-gray-100 border border-gray-200
                     hover:bg-[#5a9d8a] hover:text-white hover:border-[#5a9d8a]
                     transition-all duration-200"
        data-act="topped"
      >
        <i class="fa-solid fa-thumbtack"></i> Topped
      </button>
      <button
        type="button"
        class="filter-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
                     text-gray-600 bg-gray-100 border border-gray-200
                     hover:bg-[#5a9d8a] hover:text-white hover:border-[#5a9d8a]
                     transition-all duration-200"
        data-act="hot"
      >
        <i class="fa-solid fa-fire"></i> Hot
      </button>
    </div>
  </div>

  <!-- Threads List -->
  <div id="forum-threads" data-fid={fid}>
    <div id="threads-list">
      <div class="text-center py-16">
        <div
          class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"
        ></div>
        <p class="text-gray-500">Loading threads...</p>
      </div>
    </div>

    <div id="scroll-sentinel" class="text-center py-6">
      <div
        class="spinner-border spinner-border-sm text-success"
        role="status"
        style="display: none;"
      >
        <span class="visually-hidden">Loading more...</span>
      </div>
      <p
        class="mt-2 text-gray-400 text-sm"
        id="sentinel-text"
        style="display: none;"
      >
        Loading more threads...
      </p>
    </div>

    <div
      id="scroll-end"
      class="text-center py-6 text-gray-400"
      style="display: none;"
    >
      <i class="fa-solid fa-circle-check text-[#5a9d8a] mr-2"></i>
      No more threads
    </div>
  </div>
</div>
