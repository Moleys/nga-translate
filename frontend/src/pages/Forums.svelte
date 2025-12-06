<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import forumList from "../legacy/forum-list.js";

  let categories = $state([]);
  let favorites = $state([]);
  let loading = $state(true);

  onMount(() => {
    loadFavorites();
    loadForums();
  });

  function loadFavorites() {
    const stored = localStorage.getItem("nga_forum_favorites");
    favorites = stored ? JSON.parse(stored) : [];
  }

  function saveFavorites() {
    localStorage.setItem("nga_forum_favorites", JSON.stringify(favorites));
  }

  function isFavorite(fid) {
    return favorites.some((f) => f.fid === fid);
  }

  function toggleFavorite(forum) {
    const index = favorites.findIndex((f) => f.fid === forum.fid);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push({
        fid: forum.fid,
        name: forum.name,
        subject: forum.subject || "",
        avatar: forum.avatar || "",
      });
    }
    favorites = [...favorites]; // Trigger reactivity
    saveFavorites();
  }

  async function loadForums() {
    loading = true;

    try {
      // Transform local forum-list.js data
      const transformed = forumList.map((category) => ({
        name: category.category,
        forums: category.forums,
      }));

      categories = transformed;
      await translateCategories();
    } catch (error) {
      console.error("[Forums] Load error:", error);
    } finally {
      loading = false;
    }
  }

  async function translateCategories() {
    if (
      typeof TranslationUtil === "undefined" ||
      !TranslationUtil.enabled ||
      categories.length === 0
    ) {
      return;
    }

    try {
      let textsToTranslate = [];
      let textMap = [];

      // Translate category names
      categories.forEach((category, catIdx) => {
        if (category.name) {
          textMap.push({
            type: "categoryName",
            catIdx,
            index: textsToTranslate.length,
          });
          textsToTranslate.push(category.name);
        }

        // Translate forum names and subjects
        category.forums.forEach((forum, forumIdx) => {
          if (forum.name) {
            textMap.push({
              type: "forumName",
              catIdx,
              forumIdx,
              index: textsToTranslate.length,
            });
            textsToTranslate.push(forum.name);
          }
          if (forum.subject) {
            textMap.push({
              type: "forumSubject",
              catIdx,
              forumIdx,
              index: textsToTranslate.length,
            });
            textsToTranslate.push(forum.subject);
          }
        });
      });

      if (textsToTranslate.length > 0) {
        const translated =
          await TranslationUtil.translateVietphrase(textsToTranslate);

        textMap.forEach((mapping) => {
          const translatedText =
            translated[mapping.index]?.translations?.[0]?.text ||
            textsToTranslate[mapping.index];
          const formattedText =
            TranslationUtil.formatTranslatedText(translatedText);

          if (mapping.type === "categoryName") {
            categories[mapping.catIdx].name = formattedText;
          } else if (mapping.type === "forumName") {
            categories[mapping.catIdx].forums[mapping.forumIdx].name =
              formattedText;
          } else if (mapping.type === "forumSubject") {
            categories[mapping.catIdx].forums[mapping.forumIdx].subject =
              formattedText;
          }
        });
      }
    } catch (error) {
      console.error("[Forums] Translation error:", error);
    }
  }
</script>

<div class="space-y-6">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">All Forums</h1>
      <p class="text-muted-foreground">Browse all available forums</p>
    </div>
    <Button href="/" variant="outline">
      <i class="fa-solid fa-star mr-2"></i>
      My Favorites
    </Button>
  </div>

  <!-- Forum Categories -->
  {#if loading}
    <Card.Root>
      <Card.Content class="flex items-center justify-center py-16">
        <div class="text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
          ></div>
          <p class="text-muted-foreground">Loading forums...</p>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-8">
      {#each categories as category, groupIndex}
        {@const forumsInGroup = category.forums || []}
        {#if forumsInGroup.length > 0}
          <div
            class="animate-fade-in"
            style="animation-delay: {groupIndex * 100}ms"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="h-8 w-1 bg-primary rounded-full"></div>
              <h2 class="text-lg font-semibold">{category.name}</h2>
              <span class="text-muted-foreground text-sm"
                >({forumsInGroup.length})</span
              >
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each forumsInGroup as forum, index}
                {@const isFav = isFavorite(forum.fid)}
                <div
                  class="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all duration-200 animate-fade-in"
                  style="animation-delay: {index * 30}ms"
                >
                  <img
                    src="https://wsrv.nl/?url={forum.avatar}"
                    alt={forum.name}
                    class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border"
                    onerror={(e) => e.target.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2240%22 height=%2240%22/%3E%3C/svg%3E'}
                  />
                  <div class="flex-1 min-w-0">
                    <a
                      href="/forum/{forum.fid}"
                      class="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {forum.name}
                    </a>
                    <p class="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {forum.subject || ""}
                    </p>
                  </div>
                  <button
                    class="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors {isFav
                      ? 'text-amber-500'
                      : 'text-muted-foreground'}"
                    onclick={() => toggleFavorite(forum)}
                    title={isFav
                      ? "Remove from favorites"
                      : "Add to favorites"}
                  >
                    <i class="fa-{isFav ? 'solid' : 'regular'} fa-star"></i>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>
