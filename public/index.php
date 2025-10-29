<?php

require __DIR__ . '/../vendor/autoload.php';

use Latte\Engine;
use App\NgaApi;

// Initialize Latte engine
$latte = new Engine();
$latte->setTempDirectory(__DIR__ . '/../temp');

// Register Latte with Flight
Flight::map('render', function($template, $data = []) use ($latte) {
    $templatePath = __DIR__ . '/../app/views/' . $template;
    $latte->render($templatePath, $data);
});

// Home - Favorite forums and thread history
Flight::route('/', function() {
    Flight::render('home.latte', [
        'title' => 'NGA Forums - Favorites'
    ]);
});

// Forum list page - Browse all forums
Flight::route('/forums', function() {
    Flight::render('forum-list.latte', [
        'title' => 'All Forums - NGA'
    ]);
});

// Reading history page
Flight::route('/history', function() {
    Flight::render('history.latte', [
        'title' => 'Reading History - NGA'
    ]);
});

// Bookmarked threads page
Flight::route('/bookmarks', function() {
    Flight::render('bookmarks.latte', [
        'title' => 'Bookmarked Threads - NGA'
    ]);
});

// Login page
Flight::route('/login', function() {
    Flight::render('login.latte', [
        'title' => 'Login - NGA'
    ]);
});

// Forum detail page
Flight::route('/forum/@fid', function($fid) {
    Flight::render('forum.latte', [
        'title' => 'Forum Threads',
        'fid' => $fid
    ]);
});

// Thread reading page
Flight::route('/thread/@tid', function($tid) {
    Flight::render('read.latte', [
        'title' => 'Thread',
        'tid' => $tid
    ]);
});

// API: Get threads from forum
Flight::route('GET /api/forum/@fid/threads', function($fid) {
    header('Content-Type: application/json');

    $page = Flight::request()->query->page ?? 1;
    $act = Flight::request()->query->act ?? 'list';

    // Read auth from cookies
    $access_uid = $_COOKIE['nga_access_uid'] ?? '';
    $access_token = $_COOKIE['nga_access_token'] ?? '';

    $nga = new NgaApi($access_uid, $access_token);
    $data = $nga->fetchSubjectList($fid, $page, $act);

    echo json_encode($data);
});

// API: Get thread posts
Flight::route('GET /api/thread/@tid/posts', function($tid) {
    header('Content-Type: application/json');

    $page = Flight::request()->query->page ?? 1;

    // Read auth from cookies
    $access_uid = $_COOKIE['nga_access_uid'] ?? '';
    $access_token = $_COOKIE['nga_access_token'] ?? '';

    $nga = new NgaApi($access_uid, $access_token);
    $data = $nga->fetchThreadPosts($tid, $page);

    echo json_encode($data);
});

// API: Search threads
Flight::route('GET /api/search/threads', function() {
    header('Content-Type: application/json');

    $keyword = Flight::request()->query->q ?? '';
    $page = Flight::request()->query->page ?? 1;
    $fid = Flight::request()->query->fid ?? '';

    if (empty($keyword)) {
        echo json_encode(['error' => 'Keyword required']);
        return;
    }

    // Read auth from cookies
    $access_uid = $_COOKIE['nga_access_uid'] ?? '';
    $access_token = $_COOKIE['nga_access_token'] ?? '';

    $nga = new NgaApi($access_uid, $access_token);
    $data = $nga->searchThreads($keyword, $page, $fid);

    echo json_encode($data);
});

// API: Search forums
Flight::route('GET /api/search/forums', function() {
    header('Content-Type: application/json');

    $keyword = Flight::request()->query->q ?? '';
    $page = Flight::request()->query->page ?? 1;

    if (empty($keyword)) {
        echo json_encode(['error' => 'Keyword required']);
        return;
    }

    // Read auth from cookies
    $access_uid = $_COOKIE['nga_access_uid'] ?? '';
    $access_token = $_COOKIE['nga_access_token'] ?? '';

    $nga = new NgaApi($access_uid, $access_token);
    $data = $nga->searchForums($keyword, $page);

    echo json_encode($data);
});

// Search results page
Flight::route('/search', function() {
    $keyword = Flight::request()->query->q ?? '';

    Flight::render('search.latte', [
        'title' => 'Search Results',
        'keyword' => $keyword
    ]);
});



// Start the application
Flight::start();
