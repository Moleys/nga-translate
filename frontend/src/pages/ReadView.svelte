<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import GlossaryEditDialog from "$lib/components/GlossaryEditDialog.svelte";
  import OcrDialog from "$lib/components/OcrDialog.svelte";
  import { onMount, onDestroy } from "svelte";

  let { tid = "" } = $props();

  let glossaryDialogOpen = $state(false);
  let glossaryRawText = $state("");
  let ocrDialogOpen = $state(false);
  let ocrImageUrl = $state("");

  let currentPage = $state(1);
  let totalPages = $state(1);
  let loading = $state(false);
  let error = $state("");

  let threadInfo = $state(null);
  let posts = $state([]);
  let hotPosts = $state([]);
  let attachPrefix = $state("");
  let isBookmarked = $state(false);

  onMount(() => {
    // Get page from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get("page")) || 1;

    loadPosts();
    updateBookmarkButton();

    // Add click handler for images to open OCR dialog
    document.addEventListener("click", handleImageClick);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleImageClick);
  });

  function handleImageClick(e) {
    const img = e.target.closest("img");
    if (!img) return;

    // Only handle images inside post content
    if (!img.closest(".post-content")) return;

    e.preventDefault();
    e.stopPropagation();

    // Open OCR dialog
    ocrImageUrl = img.getAttribute("src") || "";
    ocrDialogOpen = true;
  }

  function handleGlossarySave() {
    // Reload posts to reflect glossary changes
    loadPosts();
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;

    currentPage = page;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set("page", page);
    window.history.pushState({}, "", url);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Load posts
    loadPosts();
  }

  async function loadPosts() {
    if (loading) return;

    loading = true;
    error = "";

    try {
      const url = `/api/thread/${tid}/posts?page=${currentPage}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        error = data.error;
        loading = false;
        return;
      } else if (data.code !== 0) {
        error = data.msg || "API Error";
        loading = false;
        return;
      }

      // Parse thread info
      if (!threadInfo || currentPage === 1) {
        threadInfo = {
          subject: data.tsubject || "Untitled Thread",
          author: data.tauthor || "Unknown",
          replies: data.vrows || 0,
          fid: data.fid || null,
          forumName: data.forum_name || "Forum",
          titlefont_api: data.titlefont_api || null,
        };

        // Save to history (only once per thread)
        saveThreadToHistory();
      }

      // Parse posts
      posts = Array.isArray(data.result) ? data.result : [];
      hotPosts = currentPage === 1 ? data.hot_post || [] : [];
      attachPrefix = data.attachPrefix || "";
      totalPages = data.totalPage || 1;

      // Translate if enabled
      await translateContent(data);

      document.title = `${threadInfo.subject} - NGA Forums`;
    } catch (err) {
      console.error("[ReadView] Load error:", err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function translateContent(apiData) {
    if (
      typeof TranslationUtil === "undefined" ||
      !TranslationUtil.enabled ||
      typeof BBCodeTranslator === "undefined"
    ) {
      return;
    }

    try {
      let textsToTranslate = [];
      let textMap = [];

      // Thread info
      if (threadInfo.subject) {
        textMap.push({ type: "subject", index: textsToTranslate.length });
        textsToTranslate.push(apiData.tsubject);
      }
      if (threadInfo.author) {
        textMap.push({ type: "author", index: textsToTranslate.length });
        textsToTranslate.push(apiData.tauthor);
      }
      if (threadInfo.forumName) {
        textMap.push({ type: "forumName", index: textsToTranslate.length });
        textsToTranslate.push(apiData.forum_name);
      }

      // Posts authors and content with BBCode preservation
      posts.forEach((post, idx) => {
        // Store raw content before translation
        if (!post._raw_content) {
          post._raw_content = post.content || "";
        }

        if (post.author?.username || post.author) {
          textMap.push({ type: "postAuthor", idx, index: textsToTranslate.length });
          textsToTranslate.push(post.author?.username || post.author);
        }

        // Translate post content with BBCode structure preservation
        if (post.content) {
          const { textSegments, structure, emptyLines } =
            BBCodeTranslator.prepareBBCodeForTranslation(post.content);

          if (textSegments.length > 0) {
            textMap.push({
              type: "postContent",
              idx,
              index: textsToTranslate.length,
              count: textSegments.length,
              structure,
              emptyLines
            });
            textsToTranslate.push(...textSegments);
          }
        }
      });

      // Hot posts authors and content with BBCode preservation
      hotPosts.forEach((post, idx) => {
        // Store raw content before translation
        if (!post._raw_content) {
          post._raw_content = post.content || "";
        }

        if (post.author?.username || post.author) {
          textMap.push({ type: "hotAuthor", idx, index: textsToTranslate.length });
          textsToTranslate.push(post.author?.username || post.author);
        }

        // Translate hot post content with BBCode structure preservation
        if (post.content) {
          const { textSegments, structure, emptyLines } =
            BBCodeTranslator.prepareBBCodeForTranslation(post.content);

          if (textSegments.length > 0) {
            textMap.push({
              type: "hotContent",
              idx,
              index: textsToTranslate.length,
              count: textSegments.length,
              structure,
              emptyLines
            });
            textsToTranslate.push(...textSegments);
          }
        }
      });

      if (textsToTranslate.length > 0) {
        const translated =
          await TranslationUtil.translateVietphrase(textsToTranslate);

        let currentIndex = 0;
        textMap.forEach((mapping) => {
          if (mapping.type === "subject") {
            threadInfo.subject = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
          } else if (mapping.type === "author") {
            threadInfo.author = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
          } else if (mapping.type === "forumName") {
            threadInfo.forumName = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
          } else if (mapping.type === "postAuthor") {
            const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
            if (posts[mapping.idx].author?.username) {
              posts[mapping.idx].author.username = translatedText;
            } else {
              posts[mapping.idx].author = translatedText;
            }
          } else if (mapping.type === "postContent") {
            // Reconstruct translated BBCode with structure preserved
            const translatedSegments = [];
            for (let i = 0; i < mapping.count; i++) {
              const idx = mapping.index + i;
              let segmentText = translated[idx]?.translations?.[0]?.text || textsToTranslate[idx];
              // Format translated text
              if (typeof TranslationUtil !== "undefined" && TranslationUtil.formatTranslatedText) {
                segmentText = TranslationUtil.formatTranslatedText(segmentText);
              }
              translatedSegments.push(segmentText);
            }

            const translatedBBCode = BBCodeTranslator.restoreBBCodeAfterTranslation(
              translatedSegments,
              mapping.structure,
              mapping.emptyLines
            );

            // Overwrite post.content with translated BBCode (like legacy code)
            posts[mapping.idx].content = translatedBBCode;
          } else if (mapping.type === "hotAuthor") {
            const translatedText = translated[mapping.index]?.translations?.[0]?.text || textsToTranslate[mapping.index];
            if (hotPosts[mapping.idx].author?.username) {
              hotPosts[mapping.idx].author.username = translatedText;
            } else {
              hotPosts[mapping.idx].author = translatedText;
            }
          } else if (mapping.type === "hotContent") {
            // Reconstruct translated BBCode with structure preserved
            const translatedSegments = [];
            for (let i = 0; i < mapping.count; i++) {
              const idx = mapping.index + i;
              let segmentText = translated[idx]?.translations?.[0]?.text || textsToTranslate[idx];
              // Format translated text
              if (typeof TranslationUtil !== "undefined" && TranslationUtil.formatTranslatedText) {
                segmentText = TranslationUtil.formatTranslatedText(segmentText);
              }
              translatedSegments.push(segmentText);
            }

            const translatedBBCode = BBCodeTranslator.restoreBBCodeAfterTranslation(
              translatedSegments,
              mapping.structure,
              mapping.emptyLines
            );

            // Overwrite post.content with translated BBCode (like legacy code)
            hotPosts[mapping.idx].content = translatedBBCode;
          }
        });

        // Trigger reactivity
        threadInfo = { ...threadInfo };
        posts = [...posts];
        hotPosts = [...hotPosts];
      }
    } catch (err) {
      console.error("[ReadView] Translation error:", err);
    }
  }

  function stripBBCode(text) {
    if (!text) return "";
    // Remove BBCode tags but keep the text content
    return text
      .replace(/\[url[^\]]*\](.*?)\[\/url\]/gi, "$1")
      .replace(/\[img[^\]]*\](.*?)\[\/img\]/gi, "")
      .replace(/\[quote[^\]]*\](.*?)\[\/quote\]/gi, "$1")
      .replace(/\[code[^\]]*\](.*?)\[\/code\]/gi, "$1")
      .replace(/\[color[^\]]*\](.*?)\[\/color\]/gi, "$1")
      .replace(/\[size[^\]]*\](.*?)\[\/size\]/gi, "$1")
      .replace(/\[b\](.*?)\[\/b\]/gi, "$1")
      .replace(/\[i\](.*?)\[\/i\]/gi, "$1")
      .replace(/\[u\](.*?)\[\/u\]/gi, "$1")
      .replace(/\[s\](.*?)\[\/s\]/gi, "$1")
      .replace(/\[\/?[^\]]+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function saveThreadToHistory() {
    try {
      const history =
        JSON.parse(localStorage.getItem("nga_thread_history")) || [];

      // Remove if already exists
      const filtered = history.filter((item) => item.tid !== tid);

      // Add to front
      filtered.unshift({
        tid: tid,
        subject: threadInfo.subject,
        author: threadInfo.author,
        forumName: threadInfo.forumName,
        titlefont_api: threadInfo.titlefont_api,
        timestamp: Date.now(),
      });

      // Keep max 60 items
      const trimmed = filtered.slice(0, 60);

      localStorage.setItem("nga_thread_history", JSON.stringify(trimmed));
    } catch (err) {
      console.error("[ReadView] Save history error:", err);
    }
  }

  function updateBookmarkButton() {
    try {
      const bookmarks =
        JSON.parse(localStorage.getItem("nga_thread_bookmarks")) || [];
      isBookmarked = bookmarks.some((b) => b.tid === tid);
    } catch (err) {
      console.error("[ReadView] Check bookmark error:", err);
    }
  }

  function toggleBookmark() {
    try {
      let bookmarks =
        JSON.parse(localStorage.getItem("nga_thread_bookmarks")) || [];

      const index = bookmarks.findIndex((b) => b.tid === tid);

      if (index >= 0) {
        bookmarks.splice(index, 1);
        isBookmarked = false;
      } else {
        bookmarks.unshift({
          tid: tid,
          subject: threadInfo.subject,
          author: threadInfo.author,
          forumName: threadInfo.forumName,
          titlefont_api: threadInfo.titlefont_api,
          timestamp: Date.now(),
        });
        isBookmarked = true;
      }

      localStorage.setItem("nga_thread_bookmarks", JSON.stringify(bookmarks));
    } catch (err) {
      console.error("[ReadView] Toggle bookmark error:", err);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp || isNaN(timestamp)) return "";
    // Handle both seconds and milliseconds
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  function getAuthorInfo(author) {
    if (!author) return { name: "Unknown", uid: null };

    if (typeof author === "object") {
      return {
        name: author.username || author.name || "Unknown",
        uid: author.uid || null
      };
    }

    return { name: author, uid: null };
  }

  function getPageNumbers() {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }
</script>

<div class="max-w-screen-xl mx-auto space-y-6">
  <!-- Breadcrumb -->
  <nav class="flex items-center gap-2 text-sm text-muted-foreground">
    <a href="/" class="hover:text-foreground transition-colors">
      <i class="fa-solid fa-house"></i> Home
    </a>
    {#if threadInfo}
      <span>/</span>
      {#if threadInfo.fid}
        <a
          href="/forum/{threadInfo.fid}"
          class="hover:text-foreground transition-colors"
        >
          {threadInfo.forumName}
        </a>
      {/if}
    {/if}
  </nav>

  <!-- Thread Header -->
  <div class="space-y-4">
    <h1 class="text-2xl md:text-3xl font-bold">
      {#if threadInfo}
        {threadInfo.subject}
      {:else}
        Loading...
      {/if}
    </h1>
    <p class="text-sm text-muted-foreground">
      {#if threadInfo}
        <i class="fa-solid fa-user-circle"></i>
        <strong>{threadInfo.author}</strong>
        •
        <i class="fa-solid fa-comment-dots"></i>
        {threadInfo.replies}
        {threadInfo.replies === 1 ? "reply" : "replies"}
      {:else}
        Thread ID: {tid}
      {/if}
    </p>

    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" onclick={() => history.back()}>
        <i class="fa-solid fa-arrow-left mr-2"></i>Back
      </Button>
      <Button
        variant="outline"
        size="sm"
        onclick={toggleBookmark}
        title={isBookmarked
          ? "Remove from bookmarks"
          : "Bookmark this thread"}
      >
        <i class="fa-{isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
      </Button>
    </div>
  </div>

  <Separator />

  <!-- Error Message -->
  {#if error}
    <Card.Root class="border-destructive/50 bg-destructive/10">
      <Card.Content class="flex items-start gap-3 p-6">
        <i class="fa-solid fa-circle-exclamation text-destructive text-xl"></i>
        <div>
          <h5 class="font-semibold text-destructive mb-1">Error Loading Posts</h5>
          <p class="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Posts Container -->
  {#if loading && posts.length === 0}
    <Card.Root>
      <Card.Content class="flex items-center justify-center py-16">
        <div class="text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
          ></div>
          <p class="text-muted-foreground">Loading posts...</p>
        </div>
      </Card.Content>
    </Card.Root>
  {:else if posts.length > 0}
    <div class="space-y-3">
      {#each posts as post, index}
        {@const floor =
          post.lou !== undefined ? post.lou : (currentPage - 1) * 20 + index}
        {@const isOP = floor === 0}
        {@const authorInfo = getAuthorInfo(post.author)}
        {@const postDate = formatDate(post.postdate)}

        <Card.Root class={isOP ? 'border-primary/50 bg-primary/5' : ''}>
          <Card.Content class="p-4">
            <div class="flex justify-content-between align-items-start mb-3">
              <div class="flex-grow-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{authorInfo.name}</span>
                  {#if authorInfo.uid}
                    <Badge variant="secondary" class="text-xs" title="User ID: {authorInfo.uid}">
                      <i class="fa-solid fa-id-card mr-1"></i>
                      UID: {authorInfo.uid}
                    </Badge>
                  {/if}
                  {#if isOP}
                    <Badge class="bg-success">OP</Badge>
                  {/if}
                </div>
                <small class="text-muted-foreground text-sm">
                  <i class="fa-solid fa-clock"></i>
                  {postDate}
                </small>
              </div>
              <div class="flex flex-col items-end gap-2">
                <Badge variant="outline">#{floor}</Badge>
                {#if post.vote_good > 0 || post.vote_bad > 0}
                  <div class="flex items-center gap-1">
                    {#if post.vote_good > 0}
                      <Badge class="bg-success">
                        <i class="fa-solid fa-thumbs-up mr-1"></i>
                        {post.vote_good}
                      </Badge>
                    {/if}
                    {#if post.vote_bad > 0}
                      <Badge variant="secondary">
                        <i class="fa-solid fa-thumbs-down mr-1"></i>
                        {post.vote_bad}
                      </Badge>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
            <div class="post-content prose prose-sm max-w-none">
              {#if typeof BBCodeParser !== "undefined"}
                <!-- Parse and display BBCode content (translated if translation is enabled) -->
                <div
                  role="button"
                  tabindex="0"
                  class="translated-text cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                  data-raw={stripBBCode(post._raw_content || post.content || "")}
                  onclick={(e) => {
                    const raw = e.currentTarget.getAttribute("data-raw");
                    if (raw) {
                      glossaryRawText = raw;
                      glossaryDialogOpen = true;
                    }
                  }}
                  onkeypress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      const raw = e.currentTarget.getAttribute("data-raw");
                      if (raw) {
                        glossaryRawText = raw;
                        glossaryDialogOpen = true;
                      }
                    }
                  }}
                  title="Click to edit glossary"
                >
                  {@html BBCodeParser.parse(post.content || "", attachPrefix)}
                </div>
              {:else}
                <p class="text-muted-foreground">{post.content || "No content"}</p>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>

        <!-- Hot Posts Section (after OP, only on page 1) -->
        {#if isOP && currentPage === 1 && hotPosts.length > 0}
          <div class="my-6">
            <div
              class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-t-lg"
            >
              <i class="fa-solid fa-fire text-red-500 text-lg animate-pulse"></i>
              <span class="font-bold text-red-700 text-lg">Hot Comments</span>
              <Badge variant="destructive" class="ml-auto">{hotPosts.length}</Badge>
            </div>
            <div class="space-y-2">
              {#each hotPosts as hotPost}
                {@const hotAuthorInfo = getAuthorInfo(hotPost.author)}
                {@const hotDate = formatDate(hotPost.postdate)}
                {@const hotFloor = hotPost.lou || 0}

                <Card.Root class="border-red-100 bg-red-50/30 rounded-t-none shadow-sm hover:shadow-md transition-shadow">
                  <Card.Content class="p-3">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-semibold text-sm">{hotAuthorInfo.name}</span>
                          {#if hotAuthorInfo.uid}
                            <Badge variant="secondary" class="text-xs" title="User ID: {hotAuthorInfo.uid}">
                              <i class="fa-solid fa-id-card mr-1"></i>
                              UID: {hotAuthorInfo.uid}
                            </Badge>
                          {/if}
                          <Badge class="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs">
                            <i class="fa-solid fa-fire mr-1"></i>Hot
                          </Badge>
                          <Badge variant="outline" class="text-xs">#{hotFloor}</Badge>
                        </div>
                        <small class="text-muted-foreground text-xs flex items-center gap-1">
                          <i class="fa-solid fa-clock"></i>
                          {hotDate}
                        </small>
                      </div>
                      {#if hotPost.vote_good > 0 || hotPost.vote_bad > 0}
                        <div class="flex items-center gap-1">
                          {#if hotPost.vote_good > 0}
                            <Badge class="bg-green-500 text-white text-xs">
                              <i class="fa-solid fa-thumbs-up mr-1"></i>
                              {hotPost.vote_good}
                            </Badge>
                          {/if}
                          {#if hotPost.vote_bad > 0}
                            <Badge variant="secondary" class="text-xs">
                              <i class="fa-solid fa-thumbs-down mr-1"></i>
                              {hotPost.vote_bad}
                            </Badge>
                          {/if}
                        </div>
                      {/if}
                    </div>
                    <div class="post-content prose prose-sm max-w-none text-sm">
                      {#if typeof BBCodeParser !== "undefined"}
                        <!-- Parse and display BBCode content (translated if translation is enabled) -->
                        <div
                          role="button"
                          tabindex="0"
                          class="translated-text cursor-pointer hover:bg-red-100/50 p-2 rounded transition-colors"
                          data-raw={stripBBCode(hotPost._raw_content || hotPost.content || "")}
                          onclick={(e) => {
                            const raw = e.currentTarget.getAttribute("data-raw");
                            if (raw) {
                              glossaryRawText = raw;
                              glossaryDialogOpen = true;
                            }
                          }}
                          onkeypress={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              const raw = e.currentTarget.getAttribute("data-raw");
                              if (raw) {
                                glossaryRawText = raw;
                                glossaryDialogOpen = true;
                              }
                            }
                          }}
                          title="Click to edit glossary"
                        >
                          {@html BBCodeParser.parse(hotPost.content || "", attachPrefix)}
                        </div>
                      {:else}
                        <p class="text-muted-foreground text-sm">
                          {hotPost.content || "No content"}
                        </p>
                      {/if}
                    </div>
                  </Card.Content>
                </Card.Root>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex flex-col items-center gap-4 mt-6">
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onclick={() => goToPage(currentPage - 1)}
          >
            <i class="fa-solid fa-chevron-left mr-2"></i>
            Previous
          </Button>

          <div class="flex items-center gap-1">
            {#each getPageNumbers() as page}
              {#if page === "..."}
                <span class="px-2">...</span>
              {:else}
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onclick={() => goToPage(page)}
                  class="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              {/if}
            {/each}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onclick={() => goToPage(currentPage + 1)}
          >
            Next
            <i class="fa-solid fa-chevron-right ml-2"></i>
          </Button>
        </div>

        <!-- Page Jump Input -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">Jump to:</span>
          <form
            class="flex items-center gap-2"
            onsubmit={(e) => {
              e.preventDefault();
              const input = e.target.querySelector('input');
              const page = parseInt(input.value);
              if (page && page >= 1 && page <= totalPages) {
                goToPage(page);
              } else {
                input.value = currentPage;
              }
            }}
          >
            <input
              type="number"
              class="w-20 px-2 py-1 text-sm border border-input bg-background rounded-md"
              min="1"
              max={totalPages}
              value={currentPage}
              autocomplete="off"
            />
            <Button type="submit" size="sm">Go</Button>
          </form>
          <span class="text-muted-foreground">/ {totalPages}</span>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- shadcn Dialog Components -->
<GlossaryEditDialog
  bind:open={glossaryDialogOpen}
  bind:rawText={glossaryRawText}
  onSave={handleGlossarySave}
/>
<OcrDialog bind:open={ocrDialogOpen} bind:imageUrl={ocrImageUrl} />
