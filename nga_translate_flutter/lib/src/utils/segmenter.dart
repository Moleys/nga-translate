import 'package:jieba_flutter/analysis/jieba_segmenter.dart';

class Segmenter {
  Segmenter._internal();

  static final Segmenter instance = Segmenter._internal();
  final JiebaSegmenter _jieba = JiebaSegmenter();
  Future<void>? _initFuture;

  Future<void> _ensureInitialized() {
    _initFuture ??= JiebaSegmenter.init();
    return _initFuture!;
  }

  Future<List<String>> cut(String text) async {
    await _ensureInitialized();
    if (text.trim().isEmpty) return const [];
    final tokens = _jieba.process(text, SegMode.SEARCH);
    return tokens.map((t) => t.word).toList();
  }
}
