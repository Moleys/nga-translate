import 'package:flutter/material.dart';

import '../state/stores.dart';

class GlossaryPage extends StatefulWidget {
  const GlossaryPage({super.key, required this.store});

  final GlossaryStore store;

  @override
  State<GlossaryPage> createState() => _GlossaryPageState();
}

class _GlossaryPageState extends State<GlossaryPage> {
  final TextEditingController _rawController = TextEditingController();
  final TextEditingController _meanController = TextEditingController();

  @override
  void dispose() {
    _rawController.dispose();
    _meanController.dispose();
    super.dispose();
  }

  void _save() {
    widget.store.upsert(_rawController.text, _meanController.text);
    _rawController.clear();
    _meanController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Glossary')),
      body: AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                controller: _rawController,
                decoration: const InputDecoration(labelText: 'Raw text'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _meanController,
                decoration: const InputDecoration(labelText: 'Meaning'),
              ),
              const SizedBox(height: 12),
              FilledButton(onPressed: _save, child: const Text('Add / Update')),
              const SizedBox(height: 16),
              if (widget.store.entries.isEmpty)
                const Text('No entries yet.')
              else
                ...widget.store.entries.map(
                  (e) => ListTile(
                    title: Text(e.raw),
                    subtitle: Text(e.meaning),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () => widget.store.remove(e.raw),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
