<script>
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<div class="max-w-md mx-auto">
  <Card.Root class="text-center py-16">
    <Card.Content class="pt-6">
      <div
        class="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"
      >
        <i class="fa-solid fa-question text-4xl text-muted-foreground"></i>
      </div>
      <h1 class="text-4xl font-bold mb-2">404</h1>
      <h2 class="text-xl font-semibold text-muted-foreground mb-4">
        Page Not Found
      </h2>
      <p class="text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button href="/">
        <i class="fa-solid fa-house mr-2"></i>
        Go Home
      </Button>
    </Card.Content>
  </Card.Root>
</div>
