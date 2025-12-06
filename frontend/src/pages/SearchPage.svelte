<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";

  let { keyword = "" } = $props();

  let threads = $state([]);
  let forums = $state([]);
  let threadPage = $state(1);
  let forumPage = $state(1);
  let loadingThreads = $state(false);
  let loadingForums = $state(false);
  let hasMoreThreads = $state(true);
  let hasMoreForums = $state(true);
  let attachPrefix = $state("");
  let errorMessage = $state("");

  onMount(() => {
    // Check if keyword is an NGA thread URL and redirect
    const ngaThreadInfo = extractNgaThreadId(keyword);
    if (ngaThreadInfo) {
      const redirectUrl = ngaThreadInfo.page
        ? `/thread/${ngaThreadInfo.tid}?page=${ngaThreadInfo.page}`
        : `/thread/${ngaThreadInfo.tid}`;
      window.location.href = redirectUrl;
      return;
    }

    if (!keyword) {
      errorMessage = "Please enter a search keyword";
      return;
    }

    searchThreads();
    setupInfiniteScroll();
  });

  function extractNgaThreadId(kw) {
    const tidMatch = kw.match(/[?&]tid=(\d+)/i);
    const pageMatch = kw.match(/[?&]page=(\d+)/i);
    const ngaDomainPattern =
      /https?:\/\/(?:ngabbs\.com|nga\.178\.com|bbs\.nga\.cn)\//i;
    const isDomainMatch = ngaDomainPattern.test(kw);

    if (tidMatch && tidMatch[1] && isDomainMatch) {
      return { tid: tidMatch[1], page: pageMatch?.[1] || null };
    }
    return null;
  }

  function setupInfiniteScroll() {
    const threadSentinel = document.getElementById("thread-sentinel");
    if (threadSentinel) {
      const threadObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMoreThreads && !loadingThreads) {
              threadPage++;
              searchThreads(true);
            }
          });
        },
        { rootMargin: "100px" }
      );
      threadObserver.observe(threadSentinel);
    }

    const forumSentinel = document.getElementById("forum-sentinel");
    if (forumSentinel) {
      const forumObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && hasMoreForums && !loadingForums) {
              forumPage++;
              searchForums(true);
            }
          });
        },
        { rootMargin: "100px" }
      );
      forumObserver.observe(forumSentinel);
    }
  }

  async function searchThreads(append = false) {
    if (loadingThreads || !keyword) return;

    loadingThreads = true;
    errorMessage = "";

    try {
      const url = `/api/search/threads?q=${encodeURIComponent(keyword)}&page=${threadPage}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error || data.code !== 0) {
        errorMessage = data.error || data.msg || "Search failed";
        loadingThreads = false;
        return;
      }

      let newThreads =
        data.result?.data ||
        (Array.isArray(data.result) ? data.result : []);
      attachPrefix = data.attachPrefix || data.result?.attachPrefix || "";
      const totalPages = data.totalPage || data.result?.totalPage || 1;
      const currentPage = data.currentPage || data.result?.currentPage || 1;

      hasMoreThreads = currentPage < totalPages;

      // Translate threads
      if (
        typeof TranslationUtil !== "undefined" &&
        TranslationUtil.enabled &&
        newThreads.length > 0
      ) {
        try {
          let textsToTranslate = [];
          let textMap = [];

          newThreads.forEach((thread, idx) => {
            if (thread.subject) {
              textMap.push({
                type: "subject",
                idx,
                index: textsToTranslate.length,
              });
              textsToTranslate.push(thread.subject);
            }
            if (thread.author) {
              textMap.push({
                type: "author",
                idx,
                index: textsToTranslate.length,
              });
              textsToTranslate.push(thread.author);
            }
          });

          if (textsToTranslate.length > 0) {
            const translated =
              await TranslationUtil.translateVietphrase(textsToTranslate);

            textMap.forEach((mapping) => {
              const translatedText =
                translated[mapping.index]?.translations?.[0]?.text ||
                textsToTranslate[mapping.index];
              newThreads[mapping.idx][mapping.type] =
                TranslationUtil.formatTranslatedText(translatedText);
            });
          }
        } catch (error) {
          console.error("[Search] Translation error:", error);
        }
      }

      if (append) {
        threads = [...threads, ...newThreads];
      } else {
        threads = newThreads;
      }
    } catch (error) {
      console.error("[Search] Thread search error:", error);
      errorMessage = error.message;
    } finally {
      loadingThreads = false;
    }
  }

  async function searchForums(append = false) {
    if (loadingForums || !keyword) return;

    loadingForums = true;

    try {
      const url = `/api/search/forums?q=${encodeURIComponent(keyword)}&page=${forumPage}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error || data.code !== 0) {
        console.error("[Search] Forum search error:", data.error || data.msg);
        loadingForums = false;
        return;
      }

      let newForums =
        data.result?.data ||
        (Array.isArray(data.result) ? data.result : []);
      const totalPages = data.totalPage || data.result?.totalPage || 1;
      const currentPage = data.currentPage || data.result?.currentPage || 1;

      hasMoreForums = currentPage < totalPages;

      // Translate forums
      if (
        typeof TranslationUtil !== "undefined" &&
        TranslationUtil.enabled &&
        newForums.length > 0
      ) {
        try {
          let textsToTranslate = [];
          let textMap = [];

          newForums.forEach((forum, idx) => {
            if (forum.name) {
              textMap.push({ type: "name", idx, index: textsToTranslate.length });
              textsToTranslate.push(forum.name);
            }
            if (forum.info || forum.description) {
              textMap.push({
                type: "description",
                idx,
                index: textsToTranslate.length,
              });
              textsToTranslate.push(forum.info || forum.description);
            }
          });

          if (textsToTranslate.length > 0) {
            const translated =
              await TranslationUtil.translateVietphrase(textsToTranslate);

            textMap.forEach((mapping) => {
              const translatedText =
                translated[mapping.index]?.translations?.[0]?.text ||
                textsToTranslate[mapping.index];
              if (mapping.type === "description") {
                newForums[mapping.idx].description =
                  TranslationUtil.formatTranslatedText(translatedText);
              } else {
                newForums[mapping.idx][mapping.type] =
                  TranslationUtil.formatTranslatedText(translatedText);
              }
            });
          }
        } catch (error) {
          console.error("[Search] Forum translation error:", error);
        }
      }

      if (append) {
        forums = [...forums, ...newForums];
      } else {
        forums = newForums;
      }
    } catch (error) {
      console.error("[Search] Forum search error:", error);
    } finally {
      loadingForums = false;
    }
  }

  function getTitleStyle(titlefont_api) {
    if (!titlefont_api) return "";
    try {
      const font = JSON.parse(titlefont_api);
      let style = "";
      if (font.color) style += `color:${font.color};`;
      if (font.size) style += `font-size:${font.size}px;`;
      if (font.bold) style += "font-weight:bold;";
      if (font.italic) style += "font-style:italic;";
      if (font.underline) style += "text-decoration:underline;";
      return style ? `style="${style}"` : "";
    } catch (e) {
      return "";
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleString();
  }
</script>

<div class="space-y-6">
  <!-- Header Section -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Search Results</h1>
    {#if keyword}
      <p class="text-muted-foreground">
        Searching for: <strong>{keyword}</strong>
      </p>
    {/if}
  </div>

  <!-- Error Message -->
  {#if errorMessage}
    <Alert.Root class="border-amber-200 bg-amber-50">
      <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
      <Alert.Description class="text-amber-800">
        {errorMessage}
      </Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Tabs -->
  {#if !errorMessage}
    <Tabs.Root value="threads" class="w-full">
      <Tabs.List>
        <Tabs.Trigger value="threads">
          <i class="fa-solid fa-comment-dots mr-2"></i>Threads
        </Tabs.Trigger>
        <Tabs.Trigger value="forums" onclick={() => !forums.length && searchForums()}>
          <i class="fa-solid fa-folder mr-2"></i>Forums
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="threads" class="mt-6">
        {#if loadingThreads && threads.length === 0}
          <Card.Root>
            <Card.Content class="flex items-center justify-center py-16">
              <div class="text-center">
                <div
                  class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
                ></div>
                <p class="text-muted-foreground">Searching threads...</p>
              </div>
            </Card.Content>
          </Card.Root>
        {:else if threads.length === 0}
          <div class="rounded-lg border bg-muted/50 p-8 text-center">
            <i class="fa-solid fa-search text-4xl text-muted-foreground mb-3"
            ></i>
            <p class="text-muted-foreground">No threads found</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each threads as thread, index}
              {@const hasAttachment = thread.attachs && thread.attachs.length > 0}
              {@const thumbnailUrl = hasAttachment
                ? attachPrefix + thread.attachs[0].attachurl
                : ""}
              <div
                class="group rounded-lg border bg-card p-4 hover:shadow-md transition-all duration-200 animate-fade-in"
                style="animation-delay: {index * 30}ms"
              >
                <div class="flex gap-4">
                  {#if hasAttachment}
                    <div class="flex-shrink-0">
                      <img
                        src="https://wsrv.nl/?url={thumbnailUrl}&w=80&h=80&fit=cover&a=attention"
                        alt="Thumbnail"
                        class="w-20 h-20 object-cover rounded-lg border"
                        loading="lazy"
                      />
                    </div>
                  {/if}
                  <div class="flex-1 min-w-0">
                    <a
                      href="/thread/{thread.tid}"
                      class="font-medium hover:text-primary transition-colors line-clamp-2 group-hover:underline mb-2 block"
                      {...getTitleStyle(thread.titlefont_api)}
                    >
                      {#if hasAttachment}
                        <i
                          class="fa-solid fa-image text-muted-foreground mr-1 text-sm"
                        ></i>
                      {/if}
                      {thread.subject || "Untitled"}
                    </a>
                    <div
                      class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
                    >
                      <span class="inline-flex items-center gap-1">
                        <i class="fa-solid fa-user text-xs"></i>
                        {thread.author || "Unknown"}
                      </span>
                      {#if thread.postdate}
                        <span class="inline-flex items-center gap-1">
                          <i class="fa-solid fa-calendar text-xs"></i>
                          {formatDate(thread.postdate)}
                        </span>
                      {/if}
                      {#if thread.fid}
                        <a
                          href="/forum/{thread.fid}"
                          class="inline-flex items-center gap-1 hover:text-primary"
                        >
                          <i class="fa-solid fa-folder text-xs"></i>
                          View Forum
                        </a>
                      {/if}
                    </div>
                    <div class="mt-2">
                      <Badge variant="secondary" class="bg-primary/10 text-primary">
                        <i class="fa-solid fa-comment-dots mr-1"></i>
                        {thread.replies || 0}
                        {thread.replies === 1 ? "reply" : "replies"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Infinite Scroll Sentinel -->
        <div id="thread-sentinel" class="text-center py-6">
          {#if loadingThreads && threads.length > 0}
            <div
              class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
            ></div>
            <p class="mt-2 text-muted-foreground text-sm">Loading more...</p>
          {/if}
        </div>

        <!-- End of Results -->
        {#if !hasMoreThreads && threads.length > 0}
          <div class="text-center py-6 text-muted-foreground">
            <i class="fa-solid fa-circle-check text-primary mr-2"></i>
            No more results
          </div>
        {/if}
      </Tabs.Content>

      <Tabs.Content value="forums" class="mt-6">
        {#if loadingForums && forums.length === 0}
          <Card.Root>
            <Card.Content class="flex items-center justify-center py-16">
              <div class="text-center">
                <div
                  class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
                ></div>
                <p class="text-muted-foreground">Searching forums...</p>
              </div>
            </Card.Content>
          </Card.Root>
        {:else if forums.length === 0}
          <div class="rounded-lg border bg-muted/50 p-8 text-center">
            <i
              class="fa-solid fa-folder-open text-4xl text-muted-foreground mb-3"
            ></i>
            <p class="text-muted-foreground">No forums found</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each forums as forum, index}
              {@const fid = forum.fid || forum.id}
              {@const description = forum.description || forum.info || ""}
              <a
                href="/forum/{fid}"
                class="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200 no-underline animate-fade-in"
                style="animation-delay: {index * 30}ms"
              >
                <div
                  class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"
                >
                  <i class="fa-solid fa-folder text-xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div
                    class="font-medium group-hover:text-primary transition-colors"
                  >
                    {forum.name || "Unnamed Forum"}
                  </div>
                  {#if description}
                    <p class="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {description}
                    </p>
                  {/if}
                </div>
                <i
                  class="fa-solid fa-chevron-right text-muted-foreground group-hover:text-primary transition-colors"
                ></i>
              </a>
            {/each}
          </div>
        {/if}

        <!-- Infinite Scroll Sentinel -->
        <div id="forum-sentinel" class="text-center py-6">
          {#if loadingForums && forums.length > 0}
            <div
              class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
            ></div>
            <p class="mt-2 text-muted-foreground text-sm">Loading more...</p>
          {/if}
        </div>

        <!-- End of Results -->
        {#if !hasMoreForums && forums.length > 0}
          <div class="text-center py-6 text-muted-foreground">
            <i class="fa-solid fa-circle-check text-primary mr-2"></i>
            No more results
          </div>
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  {/if}
</div>
