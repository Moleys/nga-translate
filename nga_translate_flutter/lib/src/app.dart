import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/models.dart';
import 'data/nga_api_client.dart';
import 'state/stores.dart';
import 'translate/local_translator.dart';
import 'theme/app_theme.dart';
import 'ui/home_shell.dart';

const String _ngaBaseUrl = 'https://ngabbs.com';

class NgaTranslateApp extends StatefulWidget {
  const NgaTranslateApp({super.key});

  @override
  State<NgaTranslateApp> createState() => _NgaTranslateAppState();
}

class _NgaTranslateAppState extends State<NgaTranslateApp> {
  late final NgaApiClient _client;
  late final LocalTranslator _translator;
  late final GlossaryStore _glossary;
  final BookmarkStore _bookmarks = BookmarkStore();
  final HistoryStore _history = HistoryStore();
  final FavoritesStore _favorites = FavoritesStore();

  Credentials _credentials = const Credentials();
  SharedPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    _client = NgaApiClient();
    _translator = LocalTranslator();
    _glossary = GlossaryStore(translator: _translator);
    _hydrate();
  }

  Future<void> _hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    _bookmarks.bindPrefs(prefs);
    _history.bindPrefs(prefs);
    _glossary.bindPrefs(prefs);
    _favorites.bindPrefs(prefs);

    setState(() {
      _prefs = prefs;
      _credentials = Credentials(
        uid: prefs.getString('nga_access_uid') ?? '',
        token: prefs.getString('nga_access_token') ?? '',
      );
    });
  }

  void _updateCredentials(Credentials next) {
    setState(() {
      _credentials = next;
    });
    final prefs = _prefs;
    if (prefs != null) {
      prefs.setString('nga_access_uid', next.uid);
      prefs.setString('nga_access_token', next.token);
    }
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NGA Translate',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      home: HomeShell(
        client: _client,
        translator: _translator,
        bookmarks: _bookmarks,
        history: _history,
        glossary: _glossary,
        favorites: _favorites,
        credentials: _credentials,
        onCredentialsChanged: _updateCredentials,
        baseUrl: _ngaBaseUrl,
      ),
    );
  }
}
