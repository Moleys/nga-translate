<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import forumList from "../legacy/forum-list.js";

  let { fid = "" } = $props();

  let forumName = $state("Loading...");
  let threads = $state([]);
  let loading = $state(false);
  let currentPage = $state(1);
  let currentAct = $state("list");
  let hasMore = $state(true);
  let attachPrefix = $state("");
  let observer = $state(null);

  onMount(() => {
    loadForumName();
    loadThreads();
    setupInfiniteScroll();
  });

  async function loadForumName() {
    // Find forum in local forum-list.js data
    let name = null;
    for (const category of forumList) {
      const forum = category.forums.find((f) => f.fid === fid);
      if (forum) {
        name = forum.name;
        break;
      }
    }

    if (!name) {
      forumName = "Forum";
      return;
    }

    // Translate forum name
    if (typeof TranslationUtil !== "undefined" && TranslationUtil.enabled) {
      try {
        const translated = await TranslationUtil.translateVietphrase([name]);
        if (translated && translated[0]?.translations?.[0]?.text) {
          forumName = TranslationUtil.formatTranslatedText(
            translated[0].translations[0].text
          );
          return;
        }
      } catch (e) {
        console.error("[Forum] Translation error:", e);
      }
    }

    forumName = name;
  }

  async function loadThreads(append = false) {
    if (loading) return;

    loading = true;

    try {
      const url = `/api/forum/${fid}/threads?page=${currentPage}&act=${currentAct}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse API response structure
      let newThreads = [];
      if (data.result && data.result.data) {
        newThreads = data.result.data;
      } else if (Array.isArray(data.result)) {
        newThreads = data.result;
      }

      const totalPages = data.totalPage || data.result?.totalPage || 1;
      const currentPageNum = data.currentPage || data.result?.currentPage || 1;
      attachPrefix = data.attachPrefix || data.result?.attachPrefix || "";

      hasMore = currentPageNum < totalPages;

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
            if (thread.lastposter) {
              textMap.push({
                type: "lastposter",
                idx,
                index: textsToTranslate.length,
              });
              textsToTranslate.push(thread.lastposter);
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
          console.error("[Forum] Translation error:", error);
        }
      }

      // Update threads array
      if (append) {
        threads = [...threads, ...newThreads];
      } else {
        threads = newThreads;
      }
    } catch (error) {
      console.error("[Forum] Load threads error:", error);
    } finally {
      loading = false;
    }
  }

  function changeFilter(act) {
    if (act === currentAct) return;
    currentAct = act;
    currentPage = 1;
    hasMore = true;
    threads = [];
    loadThreads();
  }

  function setupInfiniteScroll() {
    const sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            currentPage++;
            loadThreads(true);
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);
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
    if (!timestamp || isNaN(timestamp)) return "";
    // Handle both seconds and milliseconds
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  }
</script>

<div class="max-w-screen-xl mx-auto space-y-6">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">
        {#if forumName === "Loading..."}
          <span
            class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"
          ></span>
        {/if}
        {forumName}
      </h1>
      <p class="text-muted-foreground text-sm">Forum ID: {fid}</p>
    </div>
    <Button href="/" variant="outline">
      <i class="fa-solid fa-arrow-left mr-2"></i>
      Back to Forums
    </Button>
  </div>

  <!-- Filter Buttons -->
  <Card.Root>
    <Card.Content class="py-3">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Filter threads">
        <Button
          variant={currentAct === "list" ? "default" : "outline"}
          size="sm"
          onclick={() => changeFilter("list")}
        >
          <i class="fa-solid fa-list-ul mr-2"></i>Latest
        </Button>
        <Button
          variant={currentAct === "topped" ? "default" : "outline"}
          size="sm"
          onclick={() => changeFilter("topped")}
        >
          <i class="fa-solid fa-thumbtack mr-2"></i>Topped
        </Button>
        <Button
          variant={currentAct === "hot" ? "default" : "outline"}
          size="sm"
          onclick={() => changeFilter("hot")}
        >
          <i class="fa-solid fa-fire mr-2"></i>Hot
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Threads List -->
  <div class="space-y-3">
    {#if threads.length === 0 && !loading}
      <div class="rounded-lg border bg-muted/50 p-8 text-center">
        <i class="fa-solid fa-inbox text-4xl text-muted-foreground mb-3"></i>
        <p class="text-muted-foreground">No threads found</p>
      </div>
    {:else}
      {#each threads as thread, index}
        {@const hasAttachment = thread.attachs && thread.attachs.length > 0}
        {@const thumbnailUrl = hasAttachment
          ? attachPrefix + thread.attachs[0].attachurl
          : ""}
        {@const isTopped = thread.topicmisc && thread.topicmisc.includes("topped")}
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
              <div class="flex items-start gap-2 mb-2">
                {#if isTopped}
                  <Badge variant="secondary" class="bg-amber-100 text-amber-800">
                    <i class="fa-solid fa-thumbtack mr-1"></i>Topped
                  </Badge>
                {/if}
                <a
                  href="/thread/{thread.tid}"
                  class="font-medium hover:text-primary transition-colors line-clamp-2 group-hover:underline"
                  {...getTitleStyle(thread.titlefont_api)}
                >
                  {#if hasAttachment}
                    <i class="fa-solid fa-image text-muted-foreground mr-1 text-sm"></i>
                  {/if}
                  {thread.subject || "Untitled"}
                </a>
              </div>
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
                {#if thread.lastposter}
                  <span class="inline-flex items-center gap-1">
                    <i class="fa-solid fa-reply text-xs"></i>
                    {thread.lastposter}
                    {#if thread.lastpost}({formatDate(thread.lastpost)}){/if}
                  </span>
                {/if}
              </div>
              <div class="mt-2">
                <Badge variant="secondary" class="bg-primary/10 text-primary">
                  <i class="fa-solid fa-comment-dots mr-1"></i>
                  {thread.replies || 0}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Infinite Scroll Sentinel -->
  <div id="scroll-sentinel" class="text-center py-6">
    {#if loading && threads.length > 0}
      <div
        class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
      ></div>
      <p class="mt-2 text-muted-foreground text-sm">Loading more threads...</p>
    {/if}
  </div>

  <!-- End of Results -->
  {#if !hasMore && threads.length > 0}
    <div class="text-center py-6 text-muted-foreground">
      <i class="fa-solid fa-circle-check text-primary mr-2"></i>
      No more threads
    </div>
  {/if}

  <!-- Initial Loading State -->
  {#if loading && threads.length === 0}
    <Card.Root>
      <Card.Content class="flex items-center justify-center py-16">
        <div class="text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
          ></div>
          <p class="text-muted-foreground">Loading threads...</p>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
