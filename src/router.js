import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Forums from './pages/Forums.vue';
import ForumDetail from './pages/ForumDetail.vue';
import ThreadPage from './pages/ThreadPage.vue';
import Search from './pages/Search.vue';
import Bookmarks from './pages/Bookmarks.vue';
import History from './pages/History.vue';
import Login from './pages/Login.vue';
import Glossary from './pages/Glossary.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/forums', component: Forums },
  { path: '/forum/:fid', component: ForumDetail, props: true },
  { path: '/thread/:tid', component: ThreadPage, props: true },
  { path: '/search', component: Search },
  { path: '/bookmarks', component: Bookmarks },
  { path: '/history', component: History },
  { path: '/login', component: Login },
  { path: '/glossary', component: Glossary },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; }
});
