<div class="max-w-6xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 
                  flex items-center justify-center text-white text-2xl shadow-lg">
        <i class="fa-solid fa-bookmark"></i>
      </div>
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Bookmarked Threads</h1>
        <p class="text-gray-500">Your saved threads for later reading</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                   bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold shadow-md"
            id="bookmarks-count">
        0 threads
      </span>
      <button class="px-4 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 
                     font-medium transition-all duration-200 flex items-center gap-2"
              id="clear-bookmarks-btn">
        <i class="fa-solid fa-trash"></i>
        Clear All
      </button>
    </div>
  </div>

  <!-- Bookmarks List -->
  <div id="thread-bookmarks-list"></div>

  <!-- Empty State -->
  <div id="empty-bookmarks-state" style="display: none;" 
       class="text-center py-20 px-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-100">
    <div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gray-100 flex items-center justify-center">
      <i class="fa-regular fa-bookmark text-5xl text-gray-300"></i>
    </div>
    <h3 class="text-2xl font-bold text-gray-700 mb-2">No Bookmarked Threads</h3>
    <p class="text-gray-500 mb-8 max-w-md mx-auto">
      Start bookmarking threads to save them for later! Click the bookmark icon on any thread to add it here.
    </p>
    <a href="/" 
       class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a] shadow-lg hover:shadow-xl
              hover:shadow-[#5a9d8a]/25 transform hover:-translate-y-0.5 transition-all duration-200">
      <i class="fa-solid fa-house"></i>
      Go Home
    </a>
  </div>
</div>
