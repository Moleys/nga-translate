<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  let history = $state([]);

  onMount(() => {
    loadHistory();
  });

  function loadHistory() {
    const stored = localStorage.getItem("nga_thread_history");
    history = stored ? JSON.parse(stored) : [];
    translateHistory();
  }

  async function translateHistory() {
    if (
      typeof TranslationUtil === "undefined" ||
      !TranslationUtil.enabled ||
      history.length === 0
    ) {
      return;
    }

    try {
      let textsToTranslate = [];
      let textMap = [];

      history.forEach((thread, idx) => {
        if (thread.subject) {
          textMap.push({ type: "subject", idx, index: textsToTranslate.length });
          textsToTranslate.push(thread.subject);
        }
        if (thread.author) {
          textMap.push({ type: "author", idx, index: textsToTranslate.length });
          textsToTranslate.push(thread.author);
        }
        if (thread.forumName) {
          textMap.push({ type: "forumName", idx, index: textsToTranslate.length });
          textsToTranslate.push(thread.forumName);
        }
      });

      if (textsToTranslate.length > 0) {
        const translated =
          await TranslationUtil.translateVietphrase(textsToTranslate);

        textMap.forEach((mapping) => {
          const translatedText =
            translated[mapping.index]?.translations?.[0]?.text ||
            textsToTranslate[mapping.index];
          const formattedText = TranslationUtil.formatTranslatedText(translatedText);
          history[mapping.idx][mapping.type] = formattedText;
        });
      }
    } catch (error) {
      console.error("[History] Translation failed:", error);
    }
  }

  function clearHistory() {
    if (confirm("Are you sure you want to clear all reading history?")) {
      history = [];
      localStorage.setItem("nga_thread_history", JSON.stringify([]));
    }
  }

  function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;

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
      <h1 class="text-3xl font-bold tracking-tight">Reading History</h1>
      <p class="text-muted-foreground">Your recently viewed threads (max 60)</p>
    </div>
    <div class="flex items-center gap-3">
      <Badge variant="secondary" class="text-sm">
        {history.length === 1 ? "1 thread" : `${history.length} threads`}
      </Badge>
      {#if history.length > 0}
        <Button variant="destructive" size="sm" onclick={clearHistory}>
          <i class="fa-solid fa-trash mr-2"></i>
          Clear All
        </Button>
      {/if}
    </div>
  </div>

  <!-- History List -->
  {#if history.length === 0}
    <Card.Root class="text-center py-16">
      <Card.Content class="pt-6">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
        >
          <i class="fa-solid fa-clock-rotate-left text-3xl text-muted-foreground"
          ></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">No Reading History</h3>
        <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
          Start browsing threads to build your reading history! Your recently viewed
          threads will appear here.
        </p>
        <Button href="/">
          <i class="fa-solid fa-house mr-2"></i>
          Go Home
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-2">
      {#each history as thread, index}
        {@const timeAgo = getTimeAgo(thread.timestamp)}
        {@const fullDate = new Date(thread.timestamp).toLocaleString()}
        <a
          href="/thread/{thread.tid}"
          class="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors no-underline animate-fade-in"
          style="animation-delay: {index * 30}ms"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground text-xs font-medium flex-shrink-0"
              >
                #{index + 1}
              </span>
              <span
                class="font-medium line-clamp-1 hover:text-primary transition-colors"
                {...getTitleStyle(thread.titlefont_api)}
              >
                {thread.subject}
              </span>
            </div>
            <div
              class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
            >
              <span class="inline-flex items-center gap-1">
                <i class="fa-solid fa-user"></i>
                {thread.author}
              </span>
              {#if thread.forumName}
                <span class="text-border">•</span>
                <span class="inline-flex items-center gap-1">
                  <i class="fa-solid fa-folder"></i>
                  {thread.forumName}
                </span>
              {/if}
            </div>
          </div>
          <span
            class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs flex-shrink-0"
            title={fullDate}
          >
            <i class="fa-solid fa-clock"></i>
            {timeAgo}
          </span>
        </a>
      {/each}
    </div>
  {/if}
</div>
