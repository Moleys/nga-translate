import 'package:flutter/material.dart';

import '../data/models.dart';
import '../data/nga_api_client.dart';
import '../state/stores.dart';
import '../translate/local_translator.dart';
import 'widgets/states.dart';
import 'widgets/thread_card.dart';

enum DisplayMode { original, translated }

class SearchPage extends StatefulWidget {
  const SearchPage({
    super.key,
    required this.client,
    required this.credentials,
    required this.onOpenThread,
    required this.translator,
    required this.glossary,
  });

  final NgaApiClient client;
  final Credentials credentials;
  final ValueChanged<ThreadSummary> onOpenThread;
  final LocalTranslator translator;
  final GlossaryStore glossary;

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _queryController = TextEditingController();
  final TextEditingController _fidController = TextEditingController();
  Future<List<ThreadSummary>>? _pending;
  DisplayMode _mode = DisplayMode.translated; // Default to translated
  bool _translating = false;
  List<ThreadSummary>? _translated;

  @override
  void dispose() {
    _queryController.dispose();
    _fidController.dispose();
    super.dispose();
  }

  void _search() {
    final query = _queryController.text.trim();
    if (query.isEmpty) {
      _showError('Enter a keyword.');
      return;
    }
    setState(() {
      _translated = null;
      _pending = widget.client.searchThreads(
        query,
        fid: _fidController.text.trim(),
        page: 1,
        credentials: widget.credentials,
      );
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<List<ThreadSummary>> _getDisplayData(List<ThreadSummary> list) async {
    if (_mode == DisplayMode.original) return list;
    if (_translated != null) return _translated!;
    setState(() {
      _translating = true;
    });
    try {
      final texts = list.map((e) => e.title).toList();
      final translated = await widget.translator.translateTexts(texts);
      final merged = <ThreadSummary>[];
      for (var i = 0; i < list.length; i++) {
        final title = i < translated.length ? translated[i] : list[i].title;
        merged.add(
          ThreadSummary(
            tid: list[i].tid,
            title: title,
            author: list[i].author,
            lastPoster: list[i].lastPoster,
            replies: list[i].replies,
            postDate: list[i].postDate,
            lastPost: list[i].lastPost,
            thumbnailUrl: list[i].thumbnailUrl,
            forumId: list[i].forumId,
            forumName: list[i].forumName,
          ),
        );
      }
      _translated = merged;
      return merged;
    } finally {
      if (mounted) {
        setState(() {
          _translating = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Wrap(
              spacing: 8,
              children: [
                FilterChip(
                  label: const Text('Original'),
                  selected: _mode == DisplayMode.original,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _mode = DisplayMode.original;
                        _translated = null;
                      });
                    }
                  },
                ),
                FilterChip(
                  label: const Text('Translated'),
                  selected: _mode == DisplayMode.translated,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _mode = DisplayMode.translated;
                        _translated = null;
                      });
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_translating) const LinearProgressIndicator(minHeight: 2),
          TextField(
            controller: _queryController,
            decoration: const InputDecoration(
              labelText: 'Keyword or NGA URL',
              hintText: 'Enter thread title or URL',
            ),
            onSubmitted: (_) => _search(),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _fidController,
            decoration: const InputDecoration(
              labelText: 'Limit by FID (optional)',
            ),
            onSubmitted: (_) => _search(),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _search,
            icon: const Icon(Icons.search),
            label: const Text('Search'),
          ),
          const SizedBox(height: 16),
          if (_pending == null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Search', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    const Text('Search threads and optionally filter by FID.'),
                  ],
                ),
              ),
            )
          else
            FutureBuilder<List<ThreadSummary>>(
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
                    onRetry: _search,
                  );
                }
                final baseResults = snapshot.data ?? [];
                if (baseResults.isEmpty) {
                  return const ErrorCard(message: 'No results found.');
                }
                return FutureBuilder<List<ThreadSummary>>(
                  future: _getDisplayData(baseResults),
                  builder: (context, displaySnap) {
                    final list = displaySnap.data ?? baseResults;
                    return Column(
                      children: list
                          .map(
                            (thread) => ThreadCard(
                              thread: thread,
                              onTap: () => widget.onOpenThread(thread),
                            ),
                          )
                          .toList(),
                    );
                  },
                );
              },
            ),
        ],
      ),
    );
  }
}
