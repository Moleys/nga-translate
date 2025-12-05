<?php
// Front controller for the SPA build output.
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$query = $_SERVER['QUERY_STRING'] ?? '';

// Let the PHP built-in server serve existing files directly.
if (php_sapi_name() === 'cli-server') {
    $fullPath = __DIR__ . $uri;
    if ($uri !== '/' && is_file($fullPath)) {
        return false;
    }
}

// Redirect legacy local API calls to the new remote API base.
if (strpos($uri, '/api/') === 0) {
    $target = 'https://nga.nhimmeo.ovh' . $uri . ($query ? '?' . $query : '');
    header('Location: ' . $target, true, 307);
    exit;
}

$indexFile = __DIR__ . '/index.html';
if (is_file($indexFile)) {
    readfile($indexFile);
    exit;
}

http_response_code(404);
echo 'Build output missing (index.html not found).';
