<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  let favorites = $state([]);
  let history = $state([]);

  onMount(() => {
    loadFavorites();
    loadHistory();
  });

  function loadFavorites() {
    const stored = localStorage.getItem("nga_forum_favorites");
    favorites = stored ? JSON.parse(stored) : [];
    translateFavorites();
  }

  function loadHistory() {
    const stored = localStorage.getItem("nga_thread_history");
    history = stored ? JSON.parse(stored) : [];
    translateHistory();
  }

  async function translateFavorites() {
    if (
      typeof TranslationUtil === "undefined" ||
      !TranslationUtil.enabled ||
      favorites.length === 0
    ) {
      return;
    }

    try {
      let textsToTranslate = [];
      let textMap = [];

      favorites.forEach((forum, idx) => {
        if (forum.name) {
          textMap.push({ type: "name", idx, index: textsToTranslate.length });
          textsToTranslate.push(forum.name);
        }
        if (forum.subject) {
          textMap.push({ type: "subject", idx, index: textsToTranslate.length });
          textsToTranslate.push(forum.subject);
        }
      });

      if (textsToTranslate.length > 0) {
        const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

        textMap.forEach((mapping) => {
          const translatedText =
            translated[mapping.index]?.translations?.[0]?.text ||
            textsToTranslate[mapping.index];
          const formattedText = TranslationUtil.formatTranslatedText(translatedText);
          favorites[mapping.idx][mapping.type] = formattedText;
        });
      }
    } catch (error) {
      console.error("[Favorites] Translation error:", error);
    }
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

      history.slice(0, 10).forEach((thread, idx) => {
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
        const translated = await TranslationUtil.translateVietphrase(textsToTranslate);

        textMap.forEach((mapping) => {
          const translatedText =
            translated[mapping.index]?.translations?.[0]?.text ||
            textsToTranslate[mapping.index];
          const formattedText = TranslationUtil.formatTranslatedText(translatedText);
          history[mapping.idx][mapping.type] = formattedText;
        });
      }
    } catch (error) {
      console.error("[History] Translation error:", error);
    }
  }

  function saveFavorites() {
    localStorage.setItem("nga_forum_favorites", JSON.stringify(favorites));
  }

  function moveUp(index) {
    if (index > 0) {
      const temp = favorites[index];
      favorites[index] = favorites[index - 1];
      favorites[index - 1] = temp;
      favorites = [...favorites]; // Trigger reactivity
      saveFavorites();
    }
  }

  function moveDown(index) {
    if (index < favorites.length - 1) {
      const temp = favorites[index];
      favorites[index] = favorites[index + 1];
      favorites[index + 1] = temp;
      favorites = [...favorites]; // Trigger reactivity
      saveFavorites();
    }
  }

  function deleteFavorite(index) {
    favorites.splice(index, 1);
    favorites = [...favorites]; // Trigger reactivity
    saveFavorites();
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

<div class="space-y-8">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">My Favorite Forums</h1>
      <p class="text-muted-foreground">Quick access to your favorite forums</p>
    </div>
    <Button href="/forums" variant="outline">
      <i class="fa-solid fa-table-cells mr-2"></i>
      Browse All Forums
    </Button>
  </div>

  <!-- Favorites Grid -->
  {#if favorites.length === 0}
    <Card.Root class="text-center py-16">
      <Card.Content class="pt-6">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
        >
          <i class="fa-regular fa-star text-3xl text-muted-foreground"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">No Favorites Yet</h3>
        <p class="text-muted-foreground mb-6 max-w-sm mx-auto">
          Browse all forums and click the star icon to add your favorites for quick
          access!
        </p>
        <Button href="/forums">
          <i class="fa-solid fa-table-cells mr-2"></i>
          Explore Forums
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each favorites as forum, index}
        {@const isFirst = index === 0}
        {@const isLast = index === favorites.length - 1}
        <div
          class="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md animate-fade-in"
          style="animation-delay: {index * 50}ms"
        >
          <div class="flex items-start gap-3">
            <img
              src="https://wsrv.nl/?url={forum.avatar}"
              alt={forum.name}
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
              onerror={(e) => e.target.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2248%22 height=%2248%22/%3E%3C/svg%3E'}
            />
            <div class="flex-1 min-w-0">
              <a
                href="/forum/{forum.fid}"
                class="font-semibold hover:underline line-clamp-1"
              >
                {forum.name}
              </a>
              <p class="text-sm text-muted-foreground line-clamp-2 mt-1">
                {forum.subject || ""}
              </p>
              <div class="flex items-center gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  disabled={isFirst}
                  onclick={() => moveUp(index)}
                  title="Move up"
                >
                  <i class="fa-solid fa-arrow-up text-sm"></i>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  disabled={isLast}
                  onclick={() => moveDown(index)}
                  title="Move down"
                >
                  <i class="fa-solid fa-arrow-down text-sm"></i>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 ml-auto hover:bg-destructive hover:text-destructive-foreground"
                  onclick={() => deleteFavorite(index)}
                  title="Remove favorite"
                >
                  <i class="fa-solid fa-trash text-sm"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <Separator />

  <!-- Recently Viewed Section -->
  <div>
    <div class="flex items-center gap-2 mb-4">
      <i class="fa-solid fa-clock-rotate-left text-muted-foreground"></i>
      <h2 class="text-xl font-semibold">Recently Viewed Threads</h2>
    </div>
    <Card.Root>
      <Card.Content class="p-4">
        {#if history.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <i
              class="fa-solid fa-clock-rotate-left text-3xl mb-3 block opacity-50"
            ></i>
            <p>No thread history yet</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each history.slice(0, 10) as thread, index}
              {@const timeAgo = getTimeAgo(thread.timestamp)}
              <a
                href="/thread/{thread.tid}"
                class="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent transition-colors no-underline"
                style="animation: fadeIn 0.2s ease-out {index * 30}ms both"
              >
                <div class="flex-1 min-w-0">
                  <span
                    class="text-sm font-medium line-clamp-1"
                    {...getTitleStyle(thread.titlefont_api)}
                  >
                    {thread.subject}
                  </span>
                  <div
                    class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5"
                  >
                    <span class="inline-flex items-center gap-1">
                      <i class="fa-solid fa-user"></i>
                      {thread.author}
                    </span>
                    {#if thread.forumName}
                      <span>•</span>
                      <span class="inline-flex items-center gap-1">
                        <i class="fa-solid fa-folder"></i>
                        {thread.forumName}
                      </span>
                    {/if}
                  </div>
                </div>
                <span class="text-xs text-muted-foreground flex-shrink-0"
                  >{timeAgo}</span
                >
              </a>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
