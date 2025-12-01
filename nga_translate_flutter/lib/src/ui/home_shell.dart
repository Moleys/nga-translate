import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/nga_api_client.dart';
import '../state/stores.dart';
import '../translate/local_translator.dart';
import 'forums_page.dart';
import 'glossary_page.dart';
import 'login_page.dart';
import 'saved_page.dart';
import 'search_page.dart';
import 'thread_page.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    required this.client,
    required this.bookmarks,
    required this.history,
    required this.glossary,
    required this.favorites,
    required this.credentials,
    required this.onCredentialsChanged,
    required this.baseUrl,
    required this.translator,
  });

  final NgaApiClient client;
  final BookmarkStore bookmarks;
  final HistoryStore history;
  final GlossaryStore glossary;
  final FavoritesStore favorites;
  final Credentials credentials;
  final ValueChanged<Credentials> onCredentialsChanged;
  final String baseUrl;
  final LocalTranslator translator;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  void _openThread(ThreadSummary thread) {
    widget.history.record(thread);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ThreadPage(
          client: widget.client,
          thread: thread,
          credentials: widget.credentials,
          bookmarks: widget.bookmarks,
          translator: widget.translator,
          glossary: widget.glossary,
        ),
      ),
    );
  }

  void _openGlossary() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GlossaryPage(store: widget.glossary),
      ),
    );
  }

  void _openSettings() {
    showModalBottomSheet(
      context: context,
      builder: (context) => _buildSettingsSheet(),
    );
  }

  Widget _buildSettingsSheet() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Settings',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.account_circle_outlined),
            title: const Text('Account'),
            subtitle: Text(
              widget.credentials.uid.isEmpty
                  ? 'Not logged in'
                  : 'UID: ${widget.credentials.uid}',
            ),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => LoginPage(
                    initialUid: widget.credentials.uid,
                    initialToken: widget.credentials.token,
                    baseUrl: widget.baseUrl,
                    onSave: (uid, token) {
                      widget.onCredentialsChanged(
                        Credentials(uid: uid, token: token),
                      );
                    },
                  ),
                ),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.star_outline),
            title: const Text('Favorite Forums'),
            subtitle: Text('${widget.favorites.items.length} favorites'),
            onTap: () {
              Navigator.pop(context);
              setState(() => _index = 0); // Navigate to Forums tab
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _switchTab(int index) {
    setState(() {
      _index = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      ForumsPage(
        client: widget.client,
        credentials: widget.credentials,
        onOpenThread: _openThread,
        favorites: widget.favorites,
        translator: widget.translator,
      ),
      SearchPage(
        client: widget.client,
        credentials: widget.credentials,
        onOpenThread: _openThread,
        translator: widget.translator,
        glossary: widget.glossary,
      ),
      SavedPage(
        bookmarks: widget.bookmarks,
        history: widget.history,
        onOpenThread: _openThread,
      ),
    ];

    // Responsive layout - use NavigationRail for tablets/desktop
    final screenWidth = MediaQuery.of(context).size.width;
    final useNavigationRail = screenWidth >= 600;

    if (useNavigationRail) {
      // Tablet/Desktop layout with NavigationRail
      return Scaffold(
        appBar: AppBar(
          title: const Text('NGA Translate'),
          actions: [
            IconButton(
              icon: const Icon(Icons.menu_book_outlined),
              tooltip: 'Glossary',
              onPressed: _openGlossary,
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              tooltip: 'Settings',
              onPressed: _openSettings,
            ),
          ],
        ),
        body: SafeArea(
          child: Row(
            children: [
              NavigationRail(
                selectedIndex: _index,
                onDestinationSelected: _switchTab,
                labelType: NavigationRailLabelType.all,
                destinations: const [
                  NavigationRailDestination(
                    icon: Icon(Icons.forum_outlined),
                    selectedIcon: Icon(Icons.forum),
                    label: Text('Forums'),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.search_outlined),
                    selectedIcon: Icon(Icons.search),
                    label: Text('Search'),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.bookmark_outline),
                    selectedIcon: Icon(Icons.bookmark),
                    label: Text('Saved'),
                  ),
                ],
              ),
              const VerticalDivider(thickness: 1, width: 1),
              Expanded(
                child: IndexedStack(index: _index, children: pages),
              ),
            ],
          ),
        ),
      );
    }

    // Phone layout with bottom navigation
    return Scaffold(
      appBar: AppBar(
        title: const Text('NGA Translate'),
        actions: [
          IconButton(
            icon: const Icon(Icons.menu_book_outlined),
            tooltip: 'Glossary',
            onPressed: _openGlossary,
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Settings',
            onPressed: _openSettings,
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _switchTab,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.forum_outlined),
            selectedIcon: Icon(Icons.forum),
            label: 'Forums',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Search',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_outline),
            selectedIcon: Icon(Icons.bookmark),
            label: 'Saved',
          ),
        ],
      ),
    );
  }
}
