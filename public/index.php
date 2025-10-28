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

// Home - Forum list
Flight::route('/', function() {
    $forums = [
        ['id' => 524, 'name' => 'Whirlpool Academy', 'description' => 'NGA Forum'],
    ];
    
    Flight::render('home.latte', [
        'title' => 'NGA Forums',
        'forums' => $forums
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

    $nga = new NgaApi();
    $data = $nga->fetchSubjectList($fid, $page, $act);

    echo json_encode($data);
});

// API: Get thread posts
Flight::route('GET /api/thread/@tid/posts', function($tid) {
    header('Content-Type: application/json');

    $page = Flight::request()->query->page ?? 1;

    $nga = new NgaApi();
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

    $nga = new NgaApi();
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

    $nga = new NgaApi();
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

Flight::route('/about', function() {
    Flight::render('about.latte', [
        'title' => 'About'
    ]);
});

// Start the application
Flight::start();
