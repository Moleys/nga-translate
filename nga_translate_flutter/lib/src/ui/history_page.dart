import 'package:flutter/material.dart';

import '../data/models.dart';
import '../state/stores.dart';
import 'widgets/states.dart';
import 'widgets/thread_card.dart';

class HistoryPage extends StatelessWidget {
  const HistoryPage({
    super.key,
    required this.history,
    required this.onOpenThread,
  });

  final HistoryStore history;
  final ValueChanged<ThreadSummary> onOpenThread;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined),
            tooltip: 'Clear history',
            onPressed: history.items.isEmpty
                ? null
                : () {
                    history.clear();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('History cleared')),
                    );
                  },
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: history,
        builder: (context, _) {
          if (history.items.isEmpty) {
            return const EmptyState(
              title: 'No history yet.',
              icon: Icons.history_toggle_off,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: history.items.length,
            itemBuilder: (context, index) {
              final thread = history.items[index];
              return ThreadCard(
                thread: thread,
                onTap: () => onOpenThread(thread),
              );
            },
          );
        },
      ),
    );
  }
}
