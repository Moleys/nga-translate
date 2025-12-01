import 'package:flutter/material.dart';

import '../../data/models.dart';
import '../../utils/time.dart';

class ThreadCard extends StatelessWidget {
  const ThreadCard({
    super.key,
    required this.thread,
    this.onTap,
    this.trailing,
    this.translatedTitle,
    this.showTranslationBadge = false,
  });

  final ThreadSummary thread;
  final VoidCallback? onTap;
  final Widget? trailing;
  final String? translatedTitle;
  final bool showTranslationBadge;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final replies = thread.replies;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (thread.thumbnailUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    thread.thumbnailUrl!,
                    width: 72,
                    height: 72,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 72,
                      height: 72,
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: const Icon(Icons.image_not_supported_outlined),
                    ),
                  ),
                ),
              if (thread.thumbnailUrl != null) const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Original title (always show if no translation, or show dimmed if translated)
                    if (translatedTitle == null)
                      Text(
                        thread.title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      )
                    else ...[
                      // Show original title dimmed
                      Text(
                        thread.title,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      // Show translated title with badge
                      Row(
                        children: [
                          if (showTranslationBadge) ...[
                            Icon(
                              Icons.translate,
                              size: 16,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: 4),
                          ],
                          Expanded(
                            child: Text(
                              translatedTitle!,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: theme.colorScheme.primary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 12,
                      runSpacing: 4,
                      children: [
                        _InfoChip(
                          icon: Icons.person_outline,
                          label: thread.author,
                        ),
                        _InfoChip(
                          icon: Icons.reply_outlined,
                          label: '$replies replies',
                        ),
                        if (thread.lastPost != null)
                          _InfoChip(
                            icon: Icons.schedule,
                            label: formatDateTime(thread.lastPost),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
      visualDensity: VisualDensity.compact,
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    );
  }
}
