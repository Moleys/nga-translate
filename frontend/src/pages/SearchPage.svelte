<script>
  export let keyword = "";
</script>

<div class="max-w-6xl mx-auto">
  <!-- Header Section -->
  <div class="mb-8">
    <div class="flex items-center gap-4 mb-2">
      <div
        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                  flex items-center justify-center text-white text-2xl shadow-lg"
      >
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">
          Search Results
        </h1>
        {#if keyword}
          <p class="text-gray-500">
            Searching for: <strong class="text-[#5a9d8a]">{keyword}</strong>
          </p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="mb-6">
    <ul
      class="flex gap-1 p-1 bg-gray-100/50 rounded-xl w-fit"
      id="search-tabs"
      role="tablist"
    >
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active px-5 py-2.5 rounded-lg font-medium text-gray-600
                       hover:text-[#5a9d8a] hover:bg-white/50 transition-all duration-200
                       data-[bs-toggle]:bg-white data-[bs-toggle]:text-[#5a9d8a] data-[bs-toggle]:shadow-md"
          id="threads-tab"
          data-bs-toggle="tab"
          data-bs-target="#threads"
          type="button"
          role="tab"
          aria-controls="threads"
          aria-selected="true"
        >
          <i class="fa-solid fa-comment-dots mr-2"></i>Threads
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link px-5 py-2.5 rounded-lg font-medium text-gray-600
                       hover:text-[#5a9d8a] hover:bg-white/50 transition-all duration-200"
          id="forums-tab"
          data-bs-toggle="tab"
          data-bs-target="#forums"
          type="button"
          role="tab"
          aria-controls="forums"
          aria-selected="false"
        >
          <i class="fa-solid fa-folder mr-2"></i>Forums
        </button>
      </li>
    </ul>
  </div>

  <!-- Tab Content -->
  <div class="tab-content" id="search-tab-content">
    <!-- Threads Tab -->
    <div
      class="tab-pane fade show active"
      id="threads"
      role="tabpanel"
      aria-labelledby="threads-tab"
    >
      <div id="thread-results">
        <div class="text-center py-16">
          <div
            class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"
          ></div>
          <p class="text-gray-500">Searching threads...</p>
        </div>
      </div>

      <div id="thread-sentinel" class="text-center py-6">
        <div
          class="spinner-border spinner-border-sm text-success"
          role="status"
          style="display: none;"
        >
          <span class="visually-hidden">Loading more...</span>
        </div>
        <p
          class="mt-2 text-gray-400 text-sm"
          id="thread-sentinel-text"
          style="display: none;"
        >
          Loading more...
        </p>
      </div>

      <div
        id="thread-end"
        class="text-center py-6 text-gray-400"
        style="display: none;"
      >
        <i class="fa-solid fa-circle-check text-[#5a9d8a] mr-2"></i>
        No more results
      </div>
    </div>

    <!-- Forums Tab -->
    <div
      class="tab-pane fade"
      id="forums"
      role="tabpanel"
      aria-labelledby="forums-tab"
    >
      <div id="forum-results">
        <div class="text-center py-16">
          <div
            class="inline-block w-12 h-12 border-4 border-gray-200 border-t-[#5a9d8a] rounded-full animate-spin mb-4"
          ></div>
          <p class="text-gray-500">Searching forums...</p>
        </div>
      </div>

      <div id="forum-sentinel" class="text-center py-6">
        <div
          class="spinner-border spinner-border-sm text-success"
          role="status"
          style="display: none;"
        >
          <span class="visually-hidden">Loading more...</span>
        </div>
        <p
          class="mt-2 text-gray-400 text-sm"
          id="forum-sentinel-text"
          style="display: none;"
        >
          Loading more...
        </p>
      </div>

      <div
        id="forum-end"
        class="text-center py-6 text-gray-400"
        style="display: none;"
      >
        <i class="fa-solid fa-circle-check text-[#5a9d8a] mr-2"></i>
        No more results
      </div>
    </div>
  </div>
</div>
