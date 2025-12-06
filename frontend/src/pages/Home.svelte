<div class="max-w-6xl mx-auto">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-4">
      <div
        class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500
                  flex items-center justify-center text-white text-2xl shadow-lg
                  animate-pulse"
      >
        <i class="fa-solid fa-star"></i>
      </div>
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800">
          My Favorite Forums
        </h1>
        <p class="text-gray-500">Quick access to your favorite forums</p>
      </div>
    </div>
  </div>

  <!-- Favorites Grid -->
  <div id="favorite-forums"></div>

  <!-- Empty State -->
  <div
    id="empty-state"
    style="display: none;"
    class="text-center py-20 px-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-100"
  >
    <div
      class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-amber-50 flex items-center justify-center"
    >
      <i class="fa-regular fa-star text-5xl text-amber-300"></i>
    </div>
    <h3 class="text-2xl font-bold text-gray-700 mb-2">No Favorites Yet</h3>
    <p class="text-gray-500 mb-8 max-w-md mx-auto">
      Browse all forums and click the star icon to add your favorites for quick
      access!
    </p>
    <a
      href="/forums"
      class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a] shadow-lg hover:shadow-xl
              hover:shadow-[#5a9d8a]/25 transform hover:-translate-y-0.5 transition-all duration-200"
    >
      <i class="fa-solid fa-table-cells"></i>
      Explore Forums
    </a>
  </div>

  <!-- Recently Viewed Section -->
  <div class="mt-12">
    <div class="flex items-center gap-3 mb-6">
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500
                  flex items-center justify-center text-white shadow-md"
      >
        <i class="fa-solid fa-clock-rotate-left"></i>
      </div>
      <h2 class="text-xl font-bold text-gray-700">Recently Viewed Threads</h2>
    </div>
    <div
      id="thread-history"
      class="bg-white/40 backdrop-blur-sm rounded-2xl border border-gray-100 p-4"
    ></div>
  </div>
</div>
