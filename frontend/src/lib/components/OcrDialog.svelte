<script>
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  let {
    open = $bindable(false),
    imageUrl = $bindable(""),
  } = $props();

  let ocrText = $state("");
  let translation = $state("Waiting...");
  let progress = $state(0);
  let isProcessing = $state(false);

  $effect(() => {
    if (open && imageUrl) {
      runOcr();
    }
  });

  async function runOcr() {
    if (!imageUrl || isProcessing) return;

    isProcessing = true;
    ocrText = "";
    translation = "Waiting...";
    progress = 0;

    try {
      // Update progress
      progress = 30;

      // Use Tesseract.js for OCR
      if (typeof Tesseract !== "undefined") {
        const result = await Tesseract.recognize(imageUrl, "chi_sim", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              progress = 30 + Math.floor(m.progress * 60);
            }
          },
        });

        ocrText = result.data.text;
        progress = 100;
      } else {
        console.error("[OCR] Tesseract not loaded");
        ocrText = "OCR library not available";
      }
    } catch (error) {
      console.error("[OCR] Recognition error:", error);
      ocrText = "OCR failed: " + error.message;
    } finally {
      isProcessing = false;
    }
  }

  function fix_breaks(text) {
    if (!text) return "";
    return text.replace(/([^\n])\n([^\n])/g, "$1 $2");
  }

  function handleFixBreaks() {
    ocrText = fix_breaks(ocrText);
  }

  async function handleTranslate() {
    if (!ocrText.trim()) return;

    translation = "Translating...";

    try {
      if (typeof TranslationUtil !== "undefined") {
        const results = await TranslationUtil.translateVietphrase([ocrText]);
        if (results && results[0]?.translations?.[0]?.text) {
          translation = results[0].translations[0].text;
        } else {
          translation = "Translation failed";
        }
      } else {
        translation = "Translation service not available";
      }
    } catch (error) {
      console.error("[OCR] Translation error:", error);
      translation = "Translation failed: " + error.message;
    }
  }

  function handleCopyText() {
    navigator.clipboard.writeText(ocrText);
  }

  function handleCopyTranslation() {
    navigator.clipboard.writeText(translation);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-3xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Image OCR</Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- Progress Bar -->
      <div class="w-full bg-secondary rounded-full h-1.5">
        <div
          class="bg-primary h-1.5 rounded-full transition-all duration-300"
          style="width: {progress}%"
        ></div>
      </div>

      <!-- Image Preview -->
      {#if imageUrl}
        <div class="flex justify-center">
          <img
            src={imageUrl}
            alt="OCR Source"
            class="max-w-full max-h-48 object-contain rounded-lg border"
          />
        </div>
      {/if}

      <!-- OCR Text Section -->
      <div>
        <label class="text-sm font-medium mb-2 block" for="ocr-text">
          OCR Text
        </label>
        <textarea
          bind:value={ocrText}
          class="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
          rows="6"
          placeholder={isProcessing ? "Recognizing..." : "OCR text will appear here"}
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onclick={handleCopyText}>
          Copy Text
        </Button>
        <Button variant="outline" size="sm" onclick={handleFixBreaks}>
          Fix Line Breaks
        </Button>
        <Button
          variant="default"
          size="sm"
          onclick={handleTranslate}
          disabled={!ocrText.trim() || isProcessing}
        >
          Translate
        </Button>
      </div>

      <hr class="border-border" />

      <!-- Translation Section -->
      <div>
        <p class="text-sm font-medium mb-2">Translation</p>
        <div
          class="border border-border rounded-md p-3 min-h-[120px] whitespace-pre-wrap"
        >
          {translation}
        </div>
        <div class="mt-2">
          <Button
            variant="outline"
            size="sm"
            onclick={handleCopyTranslation}
            disabled={translation === "Waiting..." || translation === "Translating..."}
          >
            Copy Translation
          </Button>
        </div>
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

