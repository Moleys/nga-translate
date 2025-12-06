import './app.css';
import './setup/api.js';
import './setup/cookies.js';

import './legacy/config.js';
import './legacy/utils.js';
import './legacy/translate.js';
import './legacy/emoticons.js';
import './legacy/PhienAm.js';
import './legacy/auth.js';
import './legacy/main.js';
// import './legacy/favorite-forums.js'; // Replaced with Home.svelte
import './legacy/forum-list.js';
// import './legacy/forum-page.js'; // Replaced with Forums.svelte
// import './legacy/forum.js'; // Replaced with ForumView.svelte
// import './legacy/history-page.js'; // Replaced with History.svelte
// import './legacy/bookmarks-page.js'; // Replaced with Bookmarks.svelte
// import './legacy/login.js'; // Replaced with LoginPage.svelte
import './legacy/glossary.js';
// import './legacy/search.js'; // Replaced with SearchPage.svelte
import './legacy/read.js';
import './legacy/pwa.js';

import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')
});

export default app;
