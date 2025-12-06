<script>
  import { onMount } from "svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";

  let accessUid = $state("");
  let accessToken = $state("");
  let appId = $state("1010");

  let statusMessage = $state("");
  let statusType = $state("info"); // success, error, warning, info
  let isLoggedIn = $state(false);
  let savedAt = $state(null);

  onMount(() => {
    loadExistingCredentials();
    updateLoginStatus();
  });

  function loadExistingCredentials() {
    const uid = Cookies.get("nga_access_uid");
    const token = Cookies.get("nga_access_token");
    const app = Cookies.get("nga_app_id") || "1010";

    if (uid) accessUid = uid;
    if (token) accessToken = token;
    if (app) appId = app;
  }

  function getAuth() {
    const uid = Cookies.get("nga_access_uid");
    const token = Cookies.get("nga_access_token");
    const app = Cookies.get("nga_app_id");
    const saved = Cookies.get("nga_auth_saved_at");

    if (uid && token) {
      return {
        access_uid: uid,
        access_token: token,
        app_id: app || "1010",
        saved_at: saved ? parseInt(saved) : null,
      };
    }

    return null;
  }

  function updateLoginStatus() {
    const auth = getAuth();
    isLoggedIn = !!auth;
    savedAt = auth?.saved_at || null;
    statusMessage = "";
  }

  function saveCredentials(e) {
    e.preventDefault();

    const uid = accessUid.trim();
    const token = accessToken.trim();
    const app = appId.trim();

    if (!uid || !token || !app) {
      showStatus("Please fill in all required fields", "warning");
      return;
    }

    try {
      Cookies.set("nga_access_uid", uid, { expires: 365, sameSite: "Lax" });
      Cookies.set("nga_access_token", token, { expires: 365, sameSite: "Lax" });
      Cookies.set("nga_app_id", app, { expires: 365, sameSite: "Lax" });
      Cookies.set("nga_auth_saved_at", Date.now(), {
        expires: 365,
        sameSite: "Lax",
      });

      showStatus("Credentials saved successfully!", "success");
      updateLoginStatus();

      window.dispatchEvent(new Event("nga_auth_updated"));

      setTimeout(() => {
        updateLoginStatus();
      }, 3000);
    } catch (error) {
      showStatus("Failed to save credentials: " + error.message, "error");
    }
  }

  function clearCredentials() {
    if (confirm("Are you sure you want to clear all saved credentials?")) {
      try {
        Cookies.remove("nga_access_uid");
        Cookies.remove("nga_access_token");
        Cookies.remove("nga_app_id");
        Cookies.remove("nga_auth_saved_at");

        accessUid = "";
        accessToken = "";
        appId = "1010";

        showStatus("Credentials cleared successfully", "info");
        updateLoginStatus();

        window.dispatchEvent(new Event("nga_auth_updated"));

        setTimeout(() => {
          updateLoginStatus();
        }, 3000);
      } catch (error) {
        showStatus("Failed to clear credentials: " + error.message, "error");
      }
    }
  }

  function showStatus(message, type) {
    statusMessage = message;
    statusType = type;
  }

  function maskToken(token) {
    if (!token) return "";
    if (token.length <= 8) return token;
    return token.substring(0, 6) + "..." + token.substring(token.length - 6);
  }

  function getSavedDateString() {
    return savedAt ? new Date(savedAt).toLocaleString() : "Unknown";
  }
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <!-- Header Section -->
  <div class="text-center">
    <div
      class="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground mb-4"
    >
      <i class="fa-solid fa-lock text-2xl"></i>
    </div>
    <h1 class="text-3xl font-bold tracking-tight">NGA Account Login</h1>
    <p class="text-muted-foreground">
      Enter your NGA authentication credentials
    </p>
  </div>

  <Card.Root>
    <Card.Content class="pt-6 space-y-6">
      <!-- Status Alert -->
      {#if statusMessage}
        <Alert.Root
          class="{statusType === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : statusType === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : statusType === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'}"
        >
          <i
            class="fa-solid {statusType === 'success'
              ? 'fa-circle-check text-green-600'
              : statusType === 'error'
                ? 'fa-circle-exclamation text-red-600'
                : statusType === 'warning'
                  ? 'fa-triangle-exclamation text-amber-600'
                  : 'fa-info-circle text-blue-600'}"
          ></i>
          <Alert.Description>{statusMessage}</Alert.Description>
        </Alert.Root>
      {:else if isLoggedIn}
        <Alert.Root class="border-green-200 bg-green-50">
          <i class="fa-solid fa-circle-check text-green-600"></i>
          <Alert.Title class="text-green-800">Logged in</Alert.Title>
          <Alert.Description class="text-green-700">
            <div class="space-y-1 text-sm mt-2">
              <div>
                User ID: <code
                  class="px-1.5 py-0.5 bg-green-100 rounded text-xs"
                  >{accessUid}</code
                >
              </div>
              <div>
                Token: <code class="px-1.5 py-0.5 bg-green-100 rounded text-xs"
                  >{maskToken(accessToken)}</code
                >
              </div>
              <div>Saved: {getSavedDateString()}</div>
            </div>
          </Alert.Description>
        </Alert.Root>
      {:else}
        <Alert.Root class="border-amber-200 bg-amber-50">
          <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
          <Alert.Description class="text-amber-800">
            <strong>Not logged in</strong> - Enter your credentials below
          </Alert.Description>
        </Alert.Root>
      {/if}

      <form onsubmit={saveCredentials} class="space-y-4">
        <!-- User ID -->
        <div class="space-y-2">
          <label for="access_uid" class="text-sm font-medium">
            User ID (access_uid)
          </label>
          <Input
            type="text"
            id="access_uid"
            bind:value={accessUid}
            placeholder="e.g., 64326084"
            required
          />
          <p class="text-xs text-muted-foreground">Your NGA user ID</p>
        </div>

        <!-- Access Token -->
        <div class="space-y-2">
          <label for="access_token" class="text-sm font-medium">
            Access Token
          </label>
          <Input
            type="text"
            id="access_token"
            bind:value={accessToken}
            placeholder="e.g., X9bibk3o63p3eao96qb1i5..."
            required
          />
          <p class="text-xs text-muted-foreground">
            Your NGA access token (alphanumeric string)
          </p>
        </div>

        <!-- App ID -->
        <div class="space-y-2">
          <label for="app_id" class="text-sm font-medium"> App ID </label>
          <Input type="text" id="app_id" bind:value={appId} required />
          <p class="text-xs text-muted-foreground">Usually 1010 (default)</p>
        </div>

        <!-- Buttons -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <Button type="submit" class="flex-1">
            <i class="fa-solid fa-right-to-bracket mr-2"></i>
            Save Credentials
          </Button>
          <Button
            type="button"
            variant="outline"
            onclick={clearCredentials}
            class="flex-1"
          >
            <i class="fa-solid fa-right-from-bracket mr-2"></i>
            Clear Credentials
          </Button>
        </div>
      </form>

      <Separator />

      <!-- Help Section -->
      <Alert.Root>
        <i class="fa-solid fa-circle-info"></i>
        <Alert.Title>How to get your credentials</Alert.Title>
        <Alert.Description>
          <ol class="list-decimal list-inside space-y-1 mt-2 text-sm">
            <li>Use NGA official Android app</li>
            <li>Login to your account</li>
            <li>
              Use network monitoring tool (e.g., HTTP Canary, Charles Proxy)
            </li>
            <li>
              Capture API requests to find <code class="bg-muted px-1 rounded"
                >access_uid</code
              >
              and <code class="bg-muted px-1 rounded">access_token</code>
            </li>
            <li>Copy these values here</li>
          </ol>
        </Alert.Description>
      </Alert.Root>
    </Card.Content>
  </Card.Root>
</div>
