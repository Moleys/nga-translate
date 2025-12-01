import 'package:flutter/material.dart';

import '../data/models.dart';
import '../state/stores.dart';
import 'glossary_page.dart';
import 'login_page.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({
    super.key,
    required this.baseUrl,
    required this.credentials,
    required this.onCredentialsChanged,
    required this.onNavigate,
    required this.onOpenOcr,
    required this.glossary,
    required this.favorites,
  });

  final String baseUrl;
  final Credentials credentials;
  final ValueChanged<Credentials> onCredentialsChanged;
  final void Function(int) onNavigate;
  final VoidCallback onOpenOcr;
  final GlossaryStore glossary;
  final FavoritesStore favorites;

  Future<void> _editCredentials(BuildContext context) async {
    final updated = await showCredentialsSheet(
      context,
      credentials: credentials,
    );
    if (!context.mounted) return;
    if (updated != null) {
      onCredentialsChanged(updated);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Saved NGA access UID/token')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('NGA Translate (Flutter)')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Backend',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(baseUrl, style: theme.textTheme.bodyLarge),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'NGA Access UID',
                              style: theme.textTheme.labelMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              credentials.uid.isEmpty
                                  ? 'Not set'
                                  : credentials.uid,
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Access Token',
                              style: theme.textTheme.labelMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              credentials.token.isEmpty
                                  ? 'Not set'
                                  : '••••••••',
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined),
                        tooltip: 'Update NGA credentials',
                        onPressed: () => _editCredentials(context),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Quick actions',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _QuickAction(
                label: 'Browse forums',
                icon: Icons.forum,
                onTap: () => onNavigate(1),
              ),
              _QuickAction(
                label: 'Search',
                icon: Icons.search,
                onTap: () => onNavigate(2),
              ),
              _QuickAction(
                label: 'History',
                icon: Icons.history,
                onTap: () => onNavigate(4),
              ),
              _QuickAction(
                label: 'Bookmarks',
                icon: Icons.bookmark,
                onTap: () => onNavigate(3),
              ),
              _QuickAction(
                label: 'OCR (ML Kit)',
                icon: Icons.document_scanner_outlined,
                onTap: onOpenOcr,
              ),
              _QuickAction(
                label: 'Glossary',
                icon: Icons.translate,
                onTap: () => _openGlossary(context),
              ),
              _QuickAction(
                label: 'Favorites',
                icon: Icons.star,
                onTap: () => onNavigate(1),
              ),
              _QuickAction(
                label: 'Login',
                icon: Icons.login,
                onTap: () => _openLogin(context),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openGlossary(BuildContext context) {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => GlossaryPage(store: glossary)));
  }

  void _openLogin(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LoginPage(
          initialUid: credentials.uid,
          initialToken: credentials.token,
          baseUrl: baseUrl,
          onSave: (uid, token) {
            onCredentialsChanged(Credentials(uid: uid, token: token));
          },
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 140,
      child: FilledButton.tonalIcon(
        onPressed: onTap,
        icon: Icon(icon),
        label: Text(label),
      ),
    );
  }
}

Future<Credentials?> showCredentialsSheet(
  BuildContext context, {
  required Credentials credentials,
}) {
  final uidController = TextEditingController(text: credentials.uid);
  final tokenController = TextEditingController(text: credentials.token);

  return showModalBottomSheet<Credentials>(
    context: context,
    isScrollControlled: true,
    builder: (context) {
      return Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('NGA Access', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            TextField(
              controller: uidController,
              decoration: const InputDecoration(labelText: 'nga_access_uid'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: tokenController,
              decoration: const InputDecoration(labelText: 'nga_access_token'),
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: () {
                  Navigator.of(context).pop(
                    Credentials(
                      uid: uidController.text.trim(),
                      token: tokenController.text.trim(),
                    ),
                  );
                },
                child: const Text('Save'),
              ),
            ),
          ],
        ),
      );
    },
  );
}
