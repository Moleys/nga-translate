# NGA Forums Viewer

A lightweight PHP web application for browsing NGA forums, built with Flight micro-framework, Latte templating engine, and Bootstrap 5.

## Features

- **Flight PHP** - Fast and simple micro-framework
- **Latte** - Secure templating engine with intuitive syntax
- **Bootstrap 5** - Modern, responsive CSS framework
- **NGA API Integration** - Browse forums and threads from ngabbs.com
- **Dynamic Filtering** - Filter threads by Latest, Topped, or Hot
- **AJAX Loading** - Smooth, dynamic content loading with JavaScript

## Installation

1. Install dependencies:
```bash
composer install
```

2. Start the development server:
```bash
php -S localhost:8000 -t public
```

3. Open your browser and visit:
```
http://localhost:8000
```

## Project Structure

```
├── app/
│   ├── controllers/    # Controller classes
│   └── views/          # Latte templates
├── config/             # Configuration files
├── public/             # Public web directory
│   ├── index.php       # Application entry point
│   └── .htaccess       # Apache rewrite rules
├── temp/               # Latte cache directory
└── composer.json       # Dependencies
```

## Usage

1. **Home Page**: Browse available forums (e.g., Whirlpool Academy)
2. **Forum Page**: Click on a forum to view threads
3. **Filters**: Use Latest, Topped, or Hot buttons to filter threads
4. **External Links**: Click thread titles to view on ngabbs.com

## API Endpoints

- `GET /api/forum/{fid}/threads?act={list|topped|hot}&page={number}` - Get forum threads

## Adding More Forums

Edit `public/index.php` to add more forums:

```php
$forums = [
    ['id' => 524, 'name' => 'Whirlpool Academy', 'description' => 'NGA Forum'],
    ['id' => 123, 'name' => 'Another Forum', 'description' => 'Description'],
];
```

## Requirements

- PHP >= 7.4
- Composer
