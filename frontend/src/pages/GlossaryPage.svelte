<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
</script>

<div class="space-y-6">
  <!-- Header Section -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Glossary</h1>
      <p class="text-muted-foreground">Manage your translation glossary</p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" id="glossary-stats">0 entries</Badge>
      <Button variant="outline" size="sm" id="glossary-export-btn">
        <i class="fa-solid fa-download mr-2"></i>Export
      </Button>
      <Button variant="outline" size="sm" id="glossary-import-btn">
        <i class="fa-solid fa-upload mr-2"></i>Import
      </Button>
      <Button variant="destructive" size="sm" id="glossary-clear-btn">
        <i class="fa-solid fa-trash mr-2"></i>Clear
      </Button>
    </div>
  </div>

  <!-- Description -->
  <Alert.Root>
    <i class="fa-solid fa-circle-info"></i>
    <Alert.Description>
      Format: one entry per line as <code class="bg-muted px-1 rounded"
        >Raw=Meaning</code
      >. This glossary is used to assist translation.
    </Alert.Description>
  </Alert.Root>

  <!-- Textarea -->
  <Card.Root>
    <Card.Content class="p-0">
      <textarea
        id="glossary-text"
        class="w-full min-h-[400px] p-4 bg-transparent border-0 focus:ring-0 focus:outline-none resize-y font-mono text-sm"
        spellcheck="false"
        placeholder="玩=play&#10;主角=protagonist&#10;游戏=game"
      ></textarea>
    </Card.Content>
  </Card.Root>

  <!-- Save Button -->
  <div class="flex justify-end">
    <Button id="glossary-save-btn-page">
      <i class="fa-solid fa-floppy-disk mr-2"></i>
      Save Glossary
    </Button>
  </div>

  <!-- Hidden file input -->
  <input
    type="file"
    id="glossary-file-input"
    accept="text/plain"
    style="display:none"
  />
</div>
