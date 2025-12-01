import 'package:flutter/material.dart';

import '../data/models.dart';
import '../state/stores.dart';
import 'widgets/states.dart';
import 'widgets/thread_card.dart';

enum SavedViewMode { bookmarks, history }

class SavedPage extends StatefulWidget {
  const SavedPage({
    super.key,
    required this.bookmarks,
    required this.history,
    required this.onOpenThread,
  });

  final BookmarkStore bookmarks;
  final HistoryStore history;
  final ValueChanged<ThreadSummary> onOpenThread;

  @override
  State<SavedPage> createState() => _SavedPageState();
}

class _SavedPageState extends State<SavedPage> {
  SavedViewMode _mode = SavedViewMode.bookmarks;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved'),
        actions: [
          if (_mode == SavedViewMode.history)
            IconButton(
              icon: const Icon(Icons.delete_sweep_outlined),
              tooltip: 'Clear history',
              onPressed: widget.history.items.isEmpty
                  ? null
                  : () {
                      widget.history.clear();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('History cleared')),
                      );
                    },
            ),
        ],
      ),
      body: Column(
        children: [
          // Segmented button to switch between bookmarks and history
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<SavedViewMode>(
              segments: const [
                ButtonSegment(
                  value: SavedViewMode.bookmarks,
                  icon: Icon(Icons.bookmark_outline),
                  label: Text('Bookmarks'),
                ),
                ButtonSegment(
                  value: SavedViewMode.history,
                  icon: Icon(Icons.history),
                  label: Text('History'),
                ),
              ],
              selected: {_mode},
              onSelectionChanged: (Set<SavedViewMode> newSelection) {
                setState(() {
                  _mode = newSelection.first;
                });
              },
            ),
          ),

          // Content area
          Expanded(
            child: _mode == SavedViewMode.bookmarks
                ? _buildBookmarks()
                : _buildHistory(),
          ),
        ],
      ),
    );
  }

  Widget _buildBookmarks() {
    return AnimatedBuilder(
      animation: widget.bookmarks,
      builder: (context, _) {
        if (widget.bookmarks.items.isEmpty) {
          return const EmptyState(
            title: 'No bookmarked threads.',
            icon: Icons.bookmark_border,
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: widget.bookmarks.items.length,
          itemBuilder: (context, index) {
            final thread = widget.bookmarks.items[index];
            return ThreadCard(
              thread: thread,
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () => widget.bookmarks.toggle(thread),
              ),
              onTap: () => widget.onOpenThread(thread),
            );
          },
        );
      },
    );
  }

  Widget _buildHistory() {
    return AnimatedBuilder(
      animation: widget.history,
      builder: (context, _) {
        if (widget.history.items.isEmpty) {
          return const EmptyState(
            title: 'No history yet.',
            icon: Icons.history_toggle_off,
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: widget.history.items.length,
          itemBuilder: (context, index) {
            final thread = widget.history.items[index];
            return ThreadCard(
              thread: thread,
              onTap: () => widget.onOpenThread(thread),
            );
          },
        );
      },
    );
  }
}
