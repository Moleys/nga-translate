<script>
  import { onMount, onDestroy } from "svelte";
  import Home from "./pages/Home.svelte";
  import Forums from "./pages/Forums.svelte";
  import ForumView from "./pages/ForumView.svelte";
  import ReadView from "./pages/ReadView.svelte";
  import Bookmarks from "./pages/Bookmarks.svelte";
  import HistoryPage from "./pages/History.svelte";
  import GlossaryPage from "./pages/GlossaryPage.svelte";
  import LoginPage from "./pages/LoginPage.svelte";
  import SearchPage from "./pages/SearchPage.svelte";
  import NotFound from "./pages/NotFound.svelte";

  const routes = [
    { match: /^\/?$/, component: Home, title: "NGA Forums - Favorites" },
    { match: /^\/forums\/?$/, component: Forums, title: "All Forums - NGA" },
    {
      match: /^\/history\/?$/,
      component: HistoryPage,
      title: "Reading History - NGA",
    },
    {
      match: /^\/bookmarks\/?$/,
      component: Bookmarks,
      title: "Bookmarked Threads - NGA",
    },
    { match: /^\/login\/?$/, component: LoginPage, title: "Login - NGA" },
    {
      match: /^\/glossary\/?$/,
      component: GlossaryPage,
      title: "Glossary - NGA",
    },
    {
      match: /^\/forum\/([^/?#]+)\/?$/,
      component: ForumView,
      title: "Forum Threads",
      props: (match) => ({ fid: decodeURIComponent(match[1]) }),
    },
    {
      match: /^\/thread\/([^/?#]+)\/?$/,
      component: ReadView,
      title: "Thread",
      props: (match) => ({ tid: decodeURIComponent(match[1]) }),
    },
    {
      match: /^\/search\/?$/,
      component: SearchPage,
      title: "Search Results",
      props: () => ({
        keyword: new URLSearchParams(window.location.search).get("q") || "",
      }),
    },
  ];

  const resolveRoute = (pathname) => {
    for (const route of routes) {
      const match = pathname.match(route.match);
      if (match) {
        return {
          component: route.component,
          title: route.title,
          props: route.props ? route.props(match) : {},
        };
      }
    }
    return { component: NotFound, title: "Page Not Found", props: {} };
  };

  let currentPath = window.location.pathname;
  let current = resolveRoute(currentPath);
  let currentComponent = current.component;
  let currentProps = current.props;
  let pageTitle = current.title || "NGA Forums";

  const handlePop = () => {
    currentPath = window.location.pathname;
    current = resolveRoute(currentPath);
    currentComponent = current.component;
    currentProps = current.props;
    pageTitle = current.title || "NGA Forums";
  };

  onMount(() => {
    window.addEventListener("popstate", handlePop);
  });

  onDestroy(() => {
    window.removeEventListener("popstate", handlePop);
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<!-- Premium Navbar -->
<nav
  class="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-[#5a9d8a] to-[#4a8d7a] shadow-lg"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Brand -->
      <a
        href="/"
        class="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition-opacity"
      >
        <div
          class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
        >
          <i class="fa-solid fa-comments"></i>
        </div>
        <span class="hidden sm:block">NGA Forums</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden lg:flex items-center gap-1">
        <a
          href="/"
          class="px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fa-solid fa-house"></i>
          <span>Home</span>
        </a>
        <a
          href="/forums"
          class="px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fa-solid fa-table-cells"></i>
          <span>Forums</span>
        </a>
        <a
          href="/history"
          class="px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span>History</span>
        </a>
        <a
          href="/bookmarks"
          class="px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fa-solid fa-bookmark"></i>
          <span>Bookmarks</span>
        </a>
        <a
          href="/glossary"
          class="px-4 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
        >
          <i class="fa-solid fa-book"></i>
          <span>Glossary</span>
        </a>
        <span id="navbar-auth-status"></span>
        <button
          id="translate-toggle"
          class="ml-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200"
          type="button"
          title="Toggle translation"
        >
          <i class="fa-solid fa-language"></i>
        </button>
      </div>

      <!-- Search Form -->
      <form
        class="hidden md:flex items-center gap-2 ml-4"
        id="search-form"
        role="search"
      >
        <div class="relative">
          <input
            type="search"
            id="search-input"
            class="w-48 lg:w-64 px-4 py-2 pl-10 rounded-xl bg-white/20 border border-white/30
                        text-white placeholder-white/70 focus:bg-white/30 focus:border-white/50
                        focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
            placeholder="Search..."
          />
          <i
            class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
          ></i>
        </div>
        <button
          class="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200"
          type="submit"
        >
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </form>

      <!-- Mobile Menu Button -->
      <button
        class="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <i class="fa-solid fa-bars text-xl"></i>
      </button>
    </div>

    <!-- Mobile Navigation -->
    <div class="collapse lg:hidden" id="navbarNav">
      <div class="py-4 space-y-1 border-t border-white/20">
        <a
          href="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <i class="fa-solid fa-house"></i> Home
        </a>
        <a
          href="/forums"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <i class="fa-solid fa-table-cells"></i> Forums
        </a>
        <a
          href="/history"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <i class="fa-solid fa-clock-rotate-left"></i> History
        </a>
        <a
          href="/bookmarks"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <i class="fa-solid fa-bookmark"></i> Bookmarks
        </a>
        <a
          href="/glossary"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <i class="fa-solid fa-book"></i> Glossary
        </a>

        <!-- Mobile Search -->
        <form
          class="flex items-center gap-2 px-4 py-3"
          id="search-form-mobile"
          role="search"
        >
          <input
            type="search"
            class="flex-1 px-4 py-2 rounded-xl bg-white/20 border border-white/30
                        text-white placeholder-white/70 focus:bg-white/30 focus:outline-none"
            placeholder="Search..."
          />
          <button
            class="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white"
            type="submit"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>
      </div>
    </div>
  </div>
</nav>

<!-- Main Content -->
<main class="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
  <svelte:component this={currentComponent} {...currentProps} />
</main>

<!-- Premium Footer -->
<footer
  class="bg-gradient-to-r from-[#e8efed] to-[#f8fbfa] border-t border-gray-200"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 text-gray-600">
        <div
          class="w-10 h-10 bg-gradient-to-br from-[#5a9d8a] to-[#4a8d7a] rounded-xl
                    flex items-center justify-center text-white shadow-md"
        >
          <i class="fa-solid fa-comments"></i>
        </div>
        <span class="font-medium">NGA Forums Reader</span>
      </div>
      <p class="text-gray-500 text-sm">
        © 2025 NGA Forums. All rights reserved.
      </p>
    </div>
  </div>
</footer>

<style>
  /* Styles are defined in app.css */
</style>
