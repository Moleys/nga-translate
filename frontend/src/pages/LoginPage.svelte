<div class="max-w-5xl mx-auto">
  <!-- Header Section -->
  <div class="text-center mb-10">
    <div
      class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#5a9d8a] to-emerald-600
                flex items-center justify-center text-white shadow-xl"
    >
      <i class="fa-solid fa-lock text-3xl"></i>
    </div>
    <h2 class="text-3xl font-bold text-gray-800 mb-2">NGA Account Login</h2>
    <p class="text-gray-500">Enter your NGA authentication credentials</p>
  </div>

  <div
    class="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100/50
              shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8 md:p-10"
  >
    <!-- Status Alert -->
    <div
      id="login-status"
      class="hidden mb-6 p-4 rounded-xl"
      role="alert"
    ></div>

    <form id="login-form" class="space-y-6">
      <!-- User ID -->
      <div>
        <label
          for="access_uid"
          class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
        >
          <i class="fa-solid fa-id-badge text-[#5a9d8a]"></i>
          User ID (access_uid)
        </label>
        <input
          type="text"
          id="access_uid"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80
                      focus:ring-4 focus:ring-[#5a9d8a]/20 focus:border-[#5a9d8a]
                      placeholder:text-gray-400 transition-all duration-200"
          placeholder="e.g., 64326084"
          required
        />
        <p class="text-xs text-gray-400 mt-2">Your NGA user ID</p>
      </div>

      <!-- Access Token -->
      <div>
        <label
          for="access_token"
          class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
        >
          <i class="fa-solid fa-key text-[#5a9d8a]"></i>
          Access Token
        </label>
        <input
          type="text"
          id="access_token"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80
                      focus:ring-4 focus:ring-[#5a9d8a]/20 focus:border-[#5a9d8a]
                      placeholder:text-gray-400 transition-all duration-200"
          placeholder="e.g., X9bibk3o63p3eao96qb1i5..."
          required
        />
        <p class="text-xs text-gray-400 mt-2">
          Your NGA access token (alphanumeric string)
        </p>
      </div>

      <!-- App ID -->
      <div>
        <label
          for="app_id"
          class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"
        >
          <i class="fa-solid fa-mobile-screen-button text-[#5a9d8a]"></i>
          App ID
        </label>
        <input
          type="text"
          id="app_id"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80
                      focus:ring-4 focus:ring-[#5a9d8a]/20 focus:border-[#5a9d8a]
                      placeholder:text-gray-400 transition-all duration-200"
          value="1010"
          required
        />
        <p class="text-xs text-gray-400 mt-2">Usually 1010 (default)</p>
      </div>

      <!-- Buttons -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                       font-semibold text-white bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a]
                       shadow-lg hover:shadow-xl hover:shadow-[#5a9d8a]/25
                       transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          <i class="fa-solid fa-right-to-bracket"></i>
          Save Credentials
        </button>
        <button
          type="button"
          id="logout-btn"
          class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                       font-medium text-gray-600 bg-gray-100 hover:bg-gray-200
                       border border-gray-200 hover:border-gray-300 transition-all duration-200"
        >
          <i class="fa-solid fa-right-from-bracket"></i>
          Clear Credentials
        </button>
      </div>
    </form>

    <!-- Help Section -->
    <div class="mt-8 p-6 bg-[#f8fbfa] rounded-2xl border border-[#e8efed]">
      <h6 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-[#5a9d8a]"></i>
        How to get your credentials:
      </h6>
      <ol class="space-y-2 text-sm text-gray-600 list-decimal list-inside">
        <li>Use NGA official Android app</li>
        <li>Login to your account</li>
        <li>Use network monitoring tool (e.g., HTTP Canary, Charles Proxy)</li>
        <li>
          Capture API requests to find <code
            class="px-1.5 py-0.5 bg-gray-100 rounded text-[#5a9d8a]"
            >access_uid</code
          >
          and
          <code class="px-1.5 py-0.5 bg-gray-100 rounded text-[#5a9d8a]"
            >access_token</code
          >
        </li>
        <li>Copy these values here</li>
      </ol>
    </div>
  </div>
</div>
