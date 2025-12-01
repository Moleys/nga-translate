import 'package:flutter/material.dart';

import '../data/forum_catalog.dart';
import '../data/models.dart';
import '../data/nga_api_client.dart';
import '../state/stores.dart';
import '../translate/local_translator.dart';
import 'widgets/states.dart';
import 'widgets/thread_card.dart';

class ForumsPage extends StatefulWidget {
  const ForumsPage({
    super.key,
    required this.client,
    required this.credentials,
    required this.onOpenThread,
    required this.favorites,
    required this.translator,
  });

  final NgaApiClient client;
  final Credentials credentials;
  final ValueChanged<ThreadSummary> onOpenThread;
  final FavoritesStore favorites;
  final LocalTranslator translator;

  @override
  State<ForumsPage> createState() => _ForumsPageState();
}

class _ForumsPageState extends State<ForumsPage> {
  final TextEditingController _fidController = TextEditingController(text: '2');
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _threadsKey = GlobalKey();
  ForumCatalog? _catalog;
  List<ForumEntry> _filtered = [];
  String _act = 'list';
  Future<ForumThreadsResponse>? _pending;
  String _title = '';

  // Translation cache
  Map<String, String> _translatedForumNames = {};
  Map<int, String> _translatedThreadTitles = {};
  bool _translating = false;

  @override
  void dispose() {
    _fidController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  Future<void> _loadCatalog() async {
    final catalog = await ForumCatalog.load();
    setState(() {
      _catalog = catalog;
      _filtered = catalog.search('');
    });
    // Auto-translate forum names
    _translateForumNames();
  }

  Future<void> _translateForumNames() async {
    if (_filtered.isEmpty) return;
    setState(() => _translating = true);
    try {
      final names = _filtered.map((f) => f.name).toList();
      final translated = await widget.translator.translateTexts(names);
      final Map<String, String> cache = {};
      for (int i = 0; i < _filtered.length; i++) {
        if (i < translated.length) {
          cache[_filtered[i].fid] = translated[i];
        }
      }
      if (mounted) {
        setState(() {
          _translatedForumNames = cache;
          _translating = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _translating = false);
    }
  }

  Future<void> _translateThreads(List<ThreadSummary> threads) async {
    if (threads.isEmpty) return;
    setState(() => _translating = true);
    try {
      final titles = threads.map((t) => t.title).toList();
      final translated = await widget.translator.translateTexts(titles);
      final Map<int, String> cache = {};
      for (int i = 0; i < threads.length; i++) {
        if (i < translated.length) {
          cache[threads[i].tid] = translated[i];
        }
      }
      if (mounted) {
        setState(() {
          _translatedThreadTitles = cache;
          _translating = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _translating = false);
    }
  }

  void _filter(String query) {
    final catalog = _catalog;
    if (catalog == null) return;
    setState(() {
      _filtered = catalog.search(query);
    });
    // Re-translate new filtered list
    _translateForumNames();
  }

  void _loadThreads() {
    final fid = _fidController.text.trim();
    if (fid.isEmpty) {
      _showError('Enter a forum FID first.');
      return;
    }
    setState(() {
      _translatedThreadTitles.clear();
      _pending = widget.client.fetchForumThreads(
        fid: fid,
        act: _act,
        page: 1,
        credentials: widget.credentials,
      ).then((response) {
        // Auto-translate threads after loading
        _translateThreads(response.threads);
        // Scroll to threads section
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToThreads();
        });
        return response;
      });
    });
  }

  void _scrollToThreads() {
    final context = _threadsKey.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_title.isEmpty ? 'Forums' : _title),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _pending == null ? null : _loadThreads,
          ),
        ],
      ),
      body: ListView(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        children: [
          if (_translating) const LinearProgressIndicator(minHeight: 2),
          const SizedBox(height: 8),
          TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              labelText: 'Search forum',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: _filter,
          ),
          const SizedBox(height: 16),
          // Show full forum list vertically with bookmarked first
          if (_catalog != null) ...[
            Text(
              'Forum List',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...() {
              // Sort: bookmarked forums first, then others
              final bookmarked = <ForumEntry>[];
              final others = <ForumEntry>[];
              for (final f in _filtered) {
                if (widget.favorites.isFavorite(f.fid)) {
                  bookmarked.add(f);
                } else {
                  others.add(f);
                }
              }
              final all = [...bookmarked, ...others];
              return all.map((f) {
                final translatedName = _translatedForumNames[f.fid];
                final isBookmarked = widget.favorites.isFavorite(f.fid);
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      isBookmarked ? Icons.star : Icons.forum_outlined,
                      color: isBookmarked ? Colors.amber : null,
                    ),
                    title: Text(
                      translatedName ?? f.name,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    subtitle: Text('FID: ${f.fid}'),
                    trailing: IconButton(
                      icon: Icon(
                        isBookmarked ? Icons.star : Icons.star_outline,
                        color: isBookmarked ? Colors.amber : null,
                      ),
                      onPressed: () {
                        widget.favorites.toggle(f);
                        setState(() {});
                      },
                    ),
                    onTap: () {
                      _fidController.text = f.fid;
                      _loadThreads();
                    },
                  ),
                );
              }).toList();
            }(),
            const SizedBox(height: 16),
          ] else
            const Center(child: CircularProgressIndicator()),
          Container(
            key: _threadsKey,
            child: const Divider(),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _fidController,
                  decoration: const InputDecoration(
                    labelText: 'FID',
                    hintText: 'e.g. 2',
                  ),
                  keyboardType: TextInputType.number,
                  onSubmitted: (_) => _loadThreads(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: DropdownMenu<String>(
                  initialSelection: _act,
                  label: const Text('Mode'),
                  onSelected: (val) {
                    if (val != null) {
                      setState(() => _act = val);
                    }
                  },
                  dropdownMenuEntries: const [
                    DropdownMenuEntry(value: 'list', label: 'Latest'),
                    DropdownMenuEntry(value: 'topped', label: 'Pinned'),
                    DropdownMenuEntry(value: 'hot', label: 'Hot'),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                onPressed: _loadThreads,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Load'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_pending == null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pick a forum to start',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Enter an NGA FID and choose list / pinned / hot.',
                    ),
                  ],
                ),
              ),
            )
          else
            FutureBuilder<ForumThreadsResponse>(
              future: _pending,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                if (snapshot.hasError) {
                  return ErrorCard(
                    message: snapshot.error.toString(),
                    onRetry: _loadThreads,
                  );
                }
                final data = snapshot.data;
                if (data == null || data.threads.isEmpty) {
                  return const ErrorCard(message: 'No threads found.');
                }
                if (data.forumName != null && data.forumName!.isNotEmpty) {
                  _title = data.forumName!;
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Page ${data.currentPage} / ${data.totalPages}',
                      style: theme.textTheme.labelLarge,
                    ),
                    const SizedBox(height: 8),
                    ...data.threads.map(
                      (thread) {
                        final translatedTitle = _translatedThreadTitles[thread.tid];
                        return ThreadCard(
                          thread: thread,
                          translatedTitle: translatedTitle,
                          showTranslationBadge: translatedTitle != null,
                          onTap: () => widget.onOpenThread(thread),
                        );
                      },
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}
