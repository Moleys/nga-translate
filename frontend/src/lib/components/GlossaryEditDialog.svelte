<script>
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

  let {
    open = $bindable(false),
    rawText = $bindable(""),
    onSave = () => {},
  } = $props();

  let fullText = $state("");
  let startIndex = $state(0);
  let leftText = $state("");
  let middleText = $state("");
  let rightText = $state("");
  let meaningInput = $state("");
  let wordSuggestions = $state([]);

  $effect(() => {
    if (open && rawText) {
      initializeText(rawText);
    }
  });

  function initializeText(text) {
    fullText = text.trim();
    startIndex = 0;
    middleText = fullText;
    leftText = "";
    rightText = "";
    meaningInput = getGlossaryMeaning(fullText);
    setTranslationSuggestion();
  }

  function getGlossaryMeaning(text) {
    try {
      const glossary =
        JSON.parse(localStorage.getItem("nga_glossary")) || {};
      return glossary[text] || "";
    } catch (e) {
      return "";
    }
  }

  function saveToGlossary() {
    if (!middleText.trim()) return;

    try {
      const glossary =
        JSON.parse(localStorage.getItem("nga_glossary")) || {};
      glossary[middleText.trim()] = meaningInput.trim();
      localStorage.setItem("nga_glossary", JSON.stringify(glossary));

      onSave();
      open = false;
    } catch (e) {
      console.error("[Glossary] Save error:", e);
    }
  }

  function navigatePrevLeft() {
    if (leftText.length > 0) {
      startIndex--;
      const lastChar = leftText.slice(-1);
      middleText = lastChar + middleText;
      leftText = leftText.slice(0, -1);
      setTranslationSuggestion();
    }
  }

  function navigatePrevRight() {
    if (middleText.length > 1) {
      startIndex++;
      const firstChar = middleText.charAt(0);
      middleText = middleText.slice(1);
      leftText = leftText + firstChar;
      setTranslationSuggestion();
    }
  }

  function navigateNextLeft() {
    if (middleText.length > 1) {
      const lastChar = middleText.slice(-1);
      middleText = middleText.slice(0, -1);
      rightText = lastChar + rightText;
      setTranslationSuggestion();
    }
  }

  function navigateNextRight() {
    if (rightText.length > 0) {
      const firstChar = rightText.charAt(0);
      middleText = middleText + firstChar;
      rightText = rightText.slice(1);
      setTranslationSuggestion();
    }
  }

  function setIndexToText(start, end) {
    end++;
    startIndex = start;
    const slicedText = fullText.slice(start, end);
    middleText = slicedText;
    leftText = fullText.slice(0, start);
    rightText = fullText.slice(end);
    setTranslationSuggestion();
  }

  async function setTranslationSuggestion() {
    if (!middleText.trim()) return;

    // Get translation suggestion
    try {
      if (typeof TranslationUtil !== "undefined") {
        const results = await TranslationUtil.translateVietphrase([
          middleText,
        ]);
        if (results && results[0]?.translations?.[0]?.text) {
          meaningInput = results[0].translations[0].text;
        }
      }
    } catch (e) {
      console.error("[Glossary] Translation error:", e);
    }

    // Word segmentation
    await cutString();
  }

  async function cutString() {
    if (!middleText.trim()) return;

    try {
      const segments = await segmentLine(middleText);
      if (segments.length === 0) return;

      // Translate segments
      const translated =
        await TranslationUtil.translateVietphrase(segments);

      wordSuggestions = segments.map((seg, i) => ({
        text: translated[i]?.translations?.[0]?.text || seg,
        start: startIndex + segments.slice(0, i).join("").length,
        length: seg.length,
      }));
    } catch (e) {
      console.error("[Glossary] Segmentation error:", e);
    }
  }

  async function segmentLine(text) {
    // Simple segmentation - in production, use proper Chinese word segmentation
    return text.split("");
  }

  function emptyInput() {
    meaningInput = "";
  }

  function copyRaw() {
    navigator.clipboard.writeText(middleText);
  }

  function capWords(mode) {
    const words = meaningInput.split(" ");
    switch (mode) {
      case 0:
        meaningInput = meaningInput.toLowerCase();
        break;
      case 1:
        meaningInput =
          meaningInput.charAt(0).toUpperCase() +
          meaningInput.slice(1).toLowerCase();
        break;
      case 2:
      case 3:
        meaningInput = words
          .map((w, i) =>
            i < mode
              ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
              : w.toLowerCase()
          )
          .join(" ");
        break;
      case 30:
        meaningInput = meaningInput.toUpperCase();
        break;
    }
  }

  async function translatePhienAm() {
    if (typeof PhienAm === "undefined") return;

    const characters = Array.from(middleText);
    const phonetics = characters.map((char) => {
      if (char.trim() === "" || /[\p{P}\p{S}]/u.test(char)) return char;
      const entry = PhienAm.find((item) => item.zh === char);
      return entry ? entry.vi : char;
    });

    meaningInput = phonetics.join(" ").replace(/\s+/g, " ").trim();
  }

  async function translateMoldich() {
    try {
      const response = await fetch(
        "https://cors.moldich.eu.org/?q=https://jpname.tomatomtl.com/translate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: middleText }),
        }
      );
      const data = await response.json();
      meaningInput = data.translation?.toUpperCase() || middleText;
    } catch (e) {
      console.error("[Glossary] Moldich error:", e);
    }
  }

  function openExternalLink(type) {
    const encodedText = encodeURIComponent(middleText);
    const urls = {
      googleTranslate: `https://translate.google.com/?sl=zh-CN&tl=en&text=${encodedText}`,
      google: `https://www.google.com/search?q=${encodedText}`,
      hanzii: `https://hanzii.net/search/word/${encodedText}`,
      mdbg: `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodedText}`,
    };
    if (urls[type]) window.open(urls[type], "_blank");
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Edit Glossary</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- Navigation Controls -->
      <div class="flex items-center gap-2">
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onclick={navigatePrevLeft}
            title="Expand left"
          >
            <i class="fa fa-chevron-left"></i>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={navigatePrevRight}
            title="Shrink left"
          >
            <i class="fa fa-chevron-right"></i>
          </Button>
        </div>

        <div class="flex-grow overflow-x-auto whitespace-nowrap text-sm">
          <span class="text-red-300">{leftText}</span>
          <span class="font-bold text-pink-500">{middleText}</span>
          <span class="text-red-300">{rightText}</span>
        </div>

        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onclick={navigateNextLeft}
            title="Shrink right"
          >
            <i class="fa fa-chevron-left"></i>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onclick={navigateNextRight}
            title="Expand right"
          >
            <i class="fa fa-chevron-right"></i>
          </Button>
        </div>
      </div>

      <hr class="border-border" />

      <!-- Word Suggestions -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-wrap gap-1">
          {#each wordSuggestions as suggestion, i}
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() =>
                setIndexToText(
                  suggestion.start,
                  suggestion.start + suggestion.length - 1
                )}
            >
              {suggestion.text}
            </Badge>
          {/each}
        </div>
        <div class="flex gap-1">
          <Button
            variant="destructive"
            size="sm"
            class="h-8 w-8 p-0"
            title="Empty"
            onclick={emptyInput}
          >
            <i class="fa fa-eraser"></i>
          </Button>
          <Button
            variant="default"
            size="sm"
            class="h-8 w-8 p-0"
            title="Copy text raw"
            onclick={copyRaw}
          >
            <i class="fa fa-copy"></i>
          </Button>
        </div>
      </div>

      <textarea
        bind:value={meaningInput}
        rows="2"
        class="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
        placeholder="Enter translation"
      ></textarea>

      <!-- Action Buttons -->
      <div class="space-y-2 text-sm">
        <!-- Capitalize -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <i class="fa fa-text-height"></i>
            <span>Capitalize:</span>
          </div>
          <div class="flex gap-1">
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => capWords(1)}
            >
              1
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => capWords(2)}
            >
              2
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => capWords(3)}
            >
              3
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => capWords(30)}
            >
              All
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => capWords(0)}
            >
              None
            </Badge>
          </div>
        </div>

        <!-- Translate -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <i class="fa fa-language"></i>
            <span>Translate:</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={translatePhienAm}
            >
              Phiên Âm
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={translateMoldich}
            >
              🇯🇵 Moldich
            </Badge>
          </div>
        </div>

        <!-- Search -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1">
            <i class="fa fa-search"></i>
            <span>Search:</span>
          </div>
          <div class="flex gap-1">
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => openExternalLink("googleTranslate")}
            >
              GTrans
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => openExternalLink("google")}
            >
              Google
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => openExternalLink("hanzii")}
            >
              Hanzii
            </Badge>
            <Badge
              class="cursor-pointer"
              variant="secondary"
              onclick={() => openExternalLink("mdbg")}
            >
              Mdbg
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}
        >Cancel</Button
      >
      <Button onclick={saveToGlossary}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

