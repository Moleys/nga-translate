<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  let bookmarks = $state([]);

  onMount(() => {
    loadBookmarks();
  });

  function loadBookmarks() {
    const stored = localStorage.getItem("nga_thread_bookmarks");
    bookmarks = stored ? JSON.parse(stored) : [];
    translateBookmarks();
  }

  async function translateBookmarks() {
    if (
      typeof TranslationUtil === "undefined" ||
      !TranslationUtil.enabled ||
      bookmarks.length === 0
    ) {
      return;
    }

    try {
      let textsToTranslate = [];
      let textMap = [];

      bookmarks.forEach((bookmark, idx) => {
        if (bookmark.subject) {
          textMap.push({ type: "subject", idx, index: textsToTranslate.length });
          textsToTranslate.push(bookmark.subject);
        }
        if (bookmark.author) {
          textMap.push({ type: "author", idx, index: textsToTranslate.length });
          textsToTranslate.push(bookmark.author);
        }
        if (bookmark.forumName) {
          textMap.push({ type: "forumName", idx, index: textsToTranslate.length });
          textsToTranslate.push(bookmark.forumName);
        }
      });

      if (textsToTranslate.length > 0) {
        const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

        textMap.forEach((mapping) => {
          const translatedText =
            translated[mapping.index]?.translations?.[0]?.text ||
            textsToTranslate[mapping.index];
          const formattedText = TranslationUtil.formatTranslatedText(translatedText);
          bookmarks[mapping.idx][mapping.type] = formattedText;
        });
      }
    } catch (error) {
      console.error("[Bookmarks] Translation failed:", error);
    }
  }

  function clearBookmarks() {
    if (confirm("Are you sure you want to clear all bookmarks?")) {
      bookmarks = [];
      localStorage.setItem("nga_thread_bookmarks", JSON.stringify([]));
    }
  }

  function removeBookmark(tid) {
    if (confirm("Remove this bookmark?")) {
      bookmarks = bookmarks.filter((b) => b.tid !== tid);
      localStorage.setItem("nga_thread_bookmarks", JSON.stringify(bookmarks));
    }
  }

  function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (days < 30)
      return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  function getTitleStyle(titlefont_api) {
    if (!titlefont_api) return "";
    const styles = [];
    if (titlefont_api.color) styles.push(`color: ${titlefont_api.color} !important`);
    if (titlefont_api.bold) styles.push("font-weight: bold");
    if (titlefont_api.italic) styles.push("font-style: italic");
    if (titlefont_api.underline) styles.push("text-decoration: underline");
    return styles.length > 0 ? `style="${styles.join("; ")}"` : "";
  }
</script>

<div class="space-y-6">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Bookmarked Threads</h1>
      <p class="text-muted-foreground">Your saved threads for later reading</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary" class="text-sm">
        {bookmarks.length === 1 ? "1 thread" : `${bookmarks.length} threads`}
      </Badge>
      {#if bookmarks.length > 0}
        <Button variant="destructive" size="sm" onclick={clearBookmarks}>
          <i class="fa-solid fa-trash mr-2"></i>
          Clear All
        </Button>
      {/if}
    </div>
  </div>

  <!-- Bookmarks List -->
  {#if bookmarks.length === 0}
    <Card.Root class="text-center py-16">
      <Card.Content class="pt-6">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
        >
          <i class="fa-regular fa-bookmark text-3xl text-muted-foreground"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">No Bookmarked Threads</h3>
        <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
          Start bookmarking threads to save them for later! Click the bookmark icon on
          any thread to add it here.
        </p>
        <Button href="/">
          <i class="fa-solid fa-house mr-2"></i>
          Go Home
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-3">
      {#each bookmarks as bookmark, index}
        {@const timeAgo = getTimeAgo(bookmark.timestamp)}
        {@const fullDate = new Date(bookmark.timestamp).toLocaleString()}
        <div
          class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md animate-fade-in"
          style="animation-delay: {index * 50}ms"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid fa-bookmark text-amber-500"></i>
                <a
                  href="/thread/{bookmark.tid}"
                  class="text-lg font-semibold hover:underline line-clamp-2"
                  {...getTitleStyle(bookmark.titlefont_api)}
                >
                  {bookmark.subject}
                </a>
              </div>
              <div
                class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              >
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-user text-xs"></i>
                  {bookmark.author}
                </span>
                {#if bookmark.forumName}
                  <span class="text-border">•</span>
                  <span class="inline-flex items-center gap-1">
                    <i class="fa-solid fa-folder text-xs"></i>
                    {bookmark.forumName}
                  </span>
                {/if}
              </div>
              <div
                class="flex items-center gap-2 text-xs text-muted-foreground mt-2"
              >
                <i class="fa-solid fa-clock"></i>
                <span>Bookmarked {timeAgo}</span>
                <span class="text-border">•</span>
                <span title={fullDate}>{fullDate}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onclick={() => removeBookmark(bookmark.tid)}
              title="Remove bookmark"
              class="hover:bg-destructive hover:text-destructive-foreground"
            >
              <i class="fa-solid fa-trash"></i>
            </Button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
