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

// API: Get threads from forum
Flight::route('GET /api/forum/@fid/threads', function($fid) {
    header('Content-Type: application/json');
    
    $page = Flight::request()->query->page ?? 1;
    $act = Flight::request()->query->act ?? 'list';
    
    $nga = new NgaApi();
    $data = $nga->fetchSubjectList($fid, $page, $act);
    
    echo json_encode($data);
});

Flight::route('/about', function() {
    Flight::render('about.latte', [
        'title' => 'About'
    ]);
});

// Start the application
Flight::start();
