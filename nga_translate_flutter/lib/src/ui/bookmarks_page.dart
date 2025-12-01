import 'package:flutter/material.dart';

import '../data/models.dart';
import '../state/stores.dart';
import 'widgets/states.dart';
import 'widgets/thread_card.dart';

class BookmarksPage extends StatelessWidget {
  const BookmarksPage({
    super.key,
    required this.bookmarks,
    required this.onOpenThread,
  });

  final BookmarkStore bookmarks;
  final ValueChanged<ThreadSummary> onOpenThread;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bookmarks')),
      body: AnimatedBuilder(
        animation: bookmarks,
        builder: (context, _) {
          if (bookmarks.items.isEmpty) {
            return const EmptyState(
              title: 'No bookmarked threads.',
              icon: Icons.bookmark_border,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: bookmarks.items.length,
            itemBuilder: (context, index) {
              final thread = bookmarks.items[index];
              return ThreadCard(
                thread: thread,
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () => bookmarks.toggle(thread),
                ),
                onTap: () => onOpenThread(thread),
              );
            },
          );
        },
      ),
    );
  }
}
