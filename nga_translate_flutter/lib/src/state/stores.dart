import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models.dart';
import '../translate/local_translator.dart';
import '../data/forum_catalog.dart';

class BookmarkStore extends ChangeNotifier {
  BookmarkStore({SharedPreferences? prefs}) : _prefs = prefs;

  static const _storageKey = 'bookmarks';

  final List<ThreadSummary> _items = [];
  SharedPreferences? _prefs;

  List<ThreadSummary> get items => List.unmodifiable(_items);

  void bindPrefs(SharedPreferences prefs) {
    _prefs = prefs;
    final raw = prefs.getStringList(_storageKey) ?? <String>[];
    _restore(raw);
    notifyListeners();
  }

  bool contains(int tid) => _items.any((e) => e.tid == tid);

  void toggle(ThreadSummary thread) {
    final existingIndex = _items.indexWhere((t) => t.tid == thread.tid);
    if (existingIndex >= 0) {
      _items.removeAt(existingIndex);
    } else {
      _items.insert(0, thread);
    }
    _persist();
    notifyListeners();
  }

  void _restore(List<String> entries) {
    _items
      ..clear()
      ..addAll(
        entries.map((e) {
          final decoded = jsonDecode(e);
          if (decoded is Map<String, dynamic>) {
            return ThreadSummary.fromStorage(decoded);
          }
          return null;
        }).whereType<ThreadSummary>(),
      );
  }

  void _persist() {
    _prefs?.setStringList(
      _storageKey,
      _items.map((e) => jsonEncode(e.toStorageJson())).toList(),
    );
  }
}

class HistoryStore extends ChangeNotifier {
  HistoryStore({this.limit = 60, SharedPreferences? prefs}) : _prefs = prefs;

  static const _storageKey = 'history';

  final List<ThreadSummary> _items = [];
  final int limit;
  SharedPreferences? _prefs;

  List<ThreadSummary> get items => List.unmodifiable(_items);

  void bindPrefs(SharedPreferences prefs) {
    _prefs = prefs;
    final raw = prefs.getStringList(_storageKey) ?? <String>[];
    _restore(raw);
    notifyListeners();
  }

  void record(ThreadSummary thread) {
    _items.removeWhere((t) => t.tid == thread.tid);
    _items.insert(0, thread);

    if (_items.length > limit) {
      _items.removeRange(limit, _items.length);
    }
    _persist();
    notifyListeners();
  }

  void clear() {
    _items.clear();
    _persist();
    notifyListeners();
  }

  void _restore(List<String> entries) {
    _items
      ..clear()
      ..addAll(
        entries.map((e) {
          final decoded = jsonDecode(e);
          if (decoded is Map<String, dynamic>) {
            return ThreadSummary.fromStorage(decoded);
          }
          return null;
        }).whereType<ThreadSummary>(),
      );
  }

  void _persist() {
    _prefs?.setStringList(
      _storageKey,
      _items.map((e) => jsonEncode(e.toStorageJson())).toList(),
    );
  }
}

class GlossaryStore extends ChangeNotifier {
  GlossaryStore({required LocalTranslator translator, SharedPreferences? prefs})
      : _translator = translator,
        _prefs = prefs;

  static const _storageKey = 'glossary';

  final List<GlossaryEntry> _entries = [];
  final LocalTranslator _translator;
  SharedPreferences? _prefs;

  List<GlossaryEntry> get entries => List.unmodifiable(_entries);

  void bindPrefs(SharedPreferences prefs) {
    _prefs = prefs;
    final raw = prefs.getStringList(_storageKey) ?? <String>[];
    _entries
      ..clear()
      ..addAll(
        raw.map((e) {
          final decoded = jsonDecode(e);
          if (decoded is Map<String, dynamic>) {
            return GlossaryEntry.fromJson(decoded);
          }
          return null;
        }).whereType<GlossaryEntry>(),
      );
    _rebuildTrie();
    notifyListeners();
  }

  void upsert(String raw, String meaning) {
    final trimmedRaw = raw.trim();
    final trimmedMeaning = meaning.trim();
    if (trimmedRaw.isEmpty || trimmedMeaning.isEmpty) return;

    final idx = _entries.indexWhere((e) => e.raw == trimmedRaw);
    if (idx >= 0) {
      _entries[idx] = GlossaryEntry(raw: trimmedRaw, meaning: trimmedMeaning);
    } else {
      _entries.insert(
        0,
        GlossaryEntry(raw: trimmedRaw, meaning: trimmedMeaning),
      );
    }
    _rebuildTrie();
    _persist();
    notifyListeners();
  }

  void remove(String raw) {
    _entries.removeWhere((e) => e.raw == raw);
    _rebuildTrie();
    _persist();
    notifyListeners();
  }

  void _rebuildTrie() {
    final trie = Trie();
    for (final e in _entries) {
      final key = e.raw.trim();
      final val = e.meaning.trim();
      if (key.isEmpty || val.isEmpty) continue;
      trie.insert(_translator.toSimplified(key), val);
    }
    _translator.setGlossaryTrie(trie);
  }

  void _persist() {
    _prefs?.setStringList(
      _storageKey,
      _entries.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }
}

class FavoritesStore extends ChangeNotifier {
  FavoritesStore({SharedPreferences? prefs}) : _prefs = prefs;

  static const _storageKey = 'favorite_forums';

  final List<ForumEntry> _items = [];
  SharedPreferences? _prefs;

  List<ForumEntry> get items => List.unmodifiable(_items);

  void bindPrefs(SharedPreferences prefs) {
    _prefs = prefs;
    final raw = prefs.getStringList(_storageKey) ?? <String>[];
    _items
      ..clear()
      ..addAll(
        raw.map((e) {
          final decoded = jsonDecode(e);
          if (decoded is Map<String, dynamic>) {
            return ForumEntry.fromJson(decoded);
          }
          return null;
        }).whereType<ForumEntry>(),
      );
    notifyListeners();
  }

  bool isFavorite(String fid) =>
      _items.any((entry) => entry.fid.toString() == fid.toString());

  void toggle(ForumEntry forum) {
    final idx = _items.indexWhere((f) => f.fid == forum.fid);
    if (idx >= 0) {
      _items.removeAt(idx);
    } else {
      _items.insert(0, forum);
    }
    _persist();
    notifyListeners();
  }

  void _persist() {
    _prefs?.setStringList(
      _storageKey,
      _items.map((e) => jsonEncode(e.toJson())).toList(),
    );
  }
}
