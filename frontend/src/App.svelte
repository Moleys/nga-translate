<script>
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

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

  let currentPath = $state(window.location.pathname);
  let current = $derived(resolveRoute(currentPath));
  let mobileMenuOpen = $state(false);
  let searchQuery = $state("");
  let darkMode = $state(false);

  function handlePopState() {
    currentPath = window.location.pathname;
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nga_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nga_dark_mode', 'false');
    }
  }

  onMount(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('nga_dark_mode');
    if (savedDarkMode === 'true' || (!savedDarkMode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      darkMode = true;
      document.documentElement.classList.add('dark');
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });
</script>

<svelte:head>
  <title>{current.title || "NGA Forums"}</title>
</svelte:head>

<!-- Navigation -->
<header
  class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container flex h-14 max-w-screen-2xl items-center px-4 mx-auto">
    <!-- Brand -->
    <a href="/" class="mr-6 flex items-center space-x-2">
      <i class="fa-solid fa-comments text-xl text-primary"></i>
      <span class="hidden font-bold sm:inline-block">NGA Forums</span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="hidden md:flex items-center gap-1 text-sm">
      <a
        href="/"
        class="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <i class="fa-solid fa-house mr-1.5"></i>Home
      </a>
      <a
        href="/forums"
        class="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <i class="fa-solid fa-table-cells mr-1.5"></i>Forums
      </a>
      <a
        href="/history"
        class="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <i class="fa-solid fa-clock-rotate-left mr-1.5"></i>History
      </a>
      <a
        href="/bookmarks"
        class="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <i class="fa-solid fa-bookmark mr-1.5"></i>Bookmarks
      </a>
      <a
        href="/glossary"
        class="px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <i class="fa-solid fa-book mr-1.5"></i>Glossary
      </a>
    </nav>

    <div class="flex flex-1 items-center justify-end gap-2">
      <!-- Search -->
      <form onsubmit={handleSearch} class="hidden sm:flex items-center gap-2">
        <div class="relative">
          <i
            class="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          ></i>
          <Input
            type="search"
            placeholder="Search..."
            class="w-48 pl-8"
            bind:value={searchQuery}
          />
        </div>
      </form>

      <!-- Auth & Translate -->
      <span id="navbar-auth-status"></span>
      <Button
        variant="ghost"
        size="icon"
        id="translate-toggle"
        title="Toggle translation"
      >
        <i class="fa-solid fa-language"></i>
      </Button>

      <!-- Dark Mode Toggle -->
      <Button
        variant="ghost"
        size="icon"
        onclick={toggleDarkMode}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <i class="fa-solid {darkMode ? 'fa-sun' : 'fa-moon'}"></i>
      </Button>

      <!-- Mobile Menu Button -->
      <Button
        variant="ghost"
        size="icon"
        class="md:hidden"
        onclick={toggleMobileMenu}
      >
        <i class="fa-solid {mobileMenuOpen ? 'fa-times' : 'fa-bars'}"></i>
      </Button>
    </div>
  </div>

  <!-- Mobile Navigation -->
  {#if mobileMenuOpen}
    <div class="border-t md:hidden">
      <nav class="container flex flex-col gap-1 p-4">
        <a
          href="/"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          onclick={() => (mobileMenuOpen = false)}
        >
          <i class="fa-solid fa-house"></i>Home
        </a>
        <a
          href="/forums"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          onclick={() => (mobileMenuOpen = false)}
        >
          <i class="fa-solid fa-table-cells"></i>Forums
        </a>
        <a
          href="/history"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          onclick={() => (mobileMenuOpen = false)}
        >
          <i class="fa-solid fa-clock-rotate-left"></i>History
        </a>
        <a
          href="/bookmarks"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          onclick={() => (mobileMenuOpen = false)}
        >
          <i class="fa-solid fa-bookmark"></i>Bookmarks
        </a>
        <a
          href="/glossary"
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
          onclick={() => (mobileMenuOpen = false)}
        >
          <i class="fa-solid fa-book"></i>Glossary
        </a>
        <Separator class="my-2" />
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent w-full text-left"
          onclick={toggleDarkMode}
        >
          <i class="fa-solid {darkMode ? 'fa-sun' : 'fa-moon'}"></i>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <form onsubmit={handleSearch} class="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search..."
            class="flex-1"
            bind:value={searchQuery}
          />
          <Button type="submit" size="icon">
            <i class="fa-solid fa-magnifying-glass"></i>
          </Button>
        </form>
      </nav>
    </div>
  {/if}
</header>

<!-- Main Content -->
<main class="container max-w-screen-xl mx-auto py-6 px-4">
  <svelte:component this={current.component} {...current.props} />
</main>

<!-- Footer -->
<footer class="border-t py-6 md:py-0">
  <div
    class="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row max-w-screen-xl mx-auto px-4"
  >
    <div class="flex items-center gap-2 text-muted-foreground">
      <i class="fa-solid fa-comments text-primary"></i>
      <span class="text-sm font-medium">NGA Forums Reader</span>
    </div>
    <p class="text-sm text-muted-foreground">
      © 2025 NGA Forums. All rights reserved.
    </p>
  </div>
</footer>
