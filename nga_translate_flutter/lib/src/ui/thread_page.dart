import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import '../data/models.dart';
import '../data/nga_api_client.dart';
import '../state/stores.dart';
import '../translate/local_translator.dart';
import '../utils/bbcode_parser.dart';
import '../utils/time.dart';
import 'widgets/states.dart';

class ThreadPage extends StatefulWidget {
  const ThreadPage({
    super.key,
    required this.client,
    required this.thread,
    required this.credentials,
    required this.bookmarks,
    required this.translator,
    required this.glossary,
  });

  final NgaApiClient client;
  final ThreadSummary thread;
  final Credentials credentials;
  final BookmarkStore bookmarks;
  final LocalTranslator translator;
  final GlossaryStore glossary;

  @override
  State<ThreadPage> createState() => _ThreadPageState();
}

class _ThreadPageState extends State<ThreadPage> {
  Future<ThreadPostsResponse>? _pending;
  int _page = 1;
  bool _translate = true; // Default to translated
  bool _translating = false;
  ThreadPostsResponse? _translatedCache;
  bool _autoTranslateTriggered = false;
  final TextRecognizer _recognizer = TextRecognizer(
    script: TextRecognitionScript.chinese,
  );
  bool _ocrBusy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _recognizer.close();
    super.dispose();
  }

  void _load() {
    setState(() {
      _translatedCache = null;
      _translate = true; // Keep translation enabled by default
      _autoTranslateTriggered = false;
      _pending = widget.client.fetchThreadPosts(
        tid: widget.thread.tid.toString(),
        page: _page,
        credentials: widget.credentials,
      );
    });
    // Auto-trigger translation when data loads
    _pending!.then((_) {
      if (mounted && !_autoTranslateTriggered) {
        _autoTranslateTriggered = true;
        _toggleTranslate();
      }
    }).catchError((_) {
      // Ignore errors - FutureBuilder will handle them
    });
  }

  Future<void> _toggleTranslate() async {
    if (_translatedCache != null) {
      setState(() {
        _translate = !_translate;
      });
      return;
    }
    setState(() {
      _translate = true;
      _translating = true;
    });
    final current = await _pending;
    if (!mounted || current == null) {
      setState(() {
        _translating = false;
      });
      return;
    }
    try {
      final texts = <String>[];

      // Thread title
      texts.add(current.threadTitle);

      // Regular posts
      for (var i = 0; i < current.posts.length; i++) {
        texts.add(current.posts[i].content);
      }

      // Hot posts
      for (var i = 0; i < current.hotPosts.length; i++) {
        texts.add(current.hotPosts[i].content);
      }

      final translated = await widget.translator.translateTexts(texts);

      // Translate regular posts
      final posts = <ThreadPost>[];
      for (var i = 0; i < current.posts.length; i++) {
        final translatedContent = i + 1 < translated.length
            ? translated[i + 1]
            : null;
        posts.add(
          ThreadPost(
            pid: current.posts[i].pid,
            author: current.posts[i].author,
            content: translatedContent ?? current.posts[i].content,
            floor: current.posts[i].floor,
            postDate: current.posts[i].postDate,
            voteGood: current.posts[i].voteGood,
            voteBad: current.posts[i].voteBad,
            isHot: current.posts[i].isHot,
          ),
        );
      }

      // Translate hot posts
      final hotPosts = <ThreadPost>[];
      final hotStartIndex = 1 + current.posts.length;
      for (var i = 0; i < current.hotPosts.length; i++) {
        final translatedContent = hotStartIndex + i < translated.length
            ? translated[hotStartIndex + i]
            : null;
        hotPosts.add(
          ThreadPost(
            pid: current.hotPosts[i].pid,
            author: current.hotPosts[i].author,
            content: translatedContent ?? current.hotPosts[i].content,
            floor: current.hotPosts[i].floor,
            postDate: current.hotPosts[i].postDate,
            voteGood: current.hotPosts[i].voteGood,
            voteBad: current.hotPosts[i].voteBad,
            isHot: true,
          ),
        );
      }

      final title = translated.isNotEmpty ? translated[0] : current.threadTitle;
      setState(() {
        _translatedCache = ThreadPostsResponse(
          posts: posts,
          currentPage: current.currentPage,
          totalPages: current.totalPages,
          threadTitle: title,
          forumName: current.forumName,
          hotPosts: hotPosts,
        );
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Translate failed: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _translating = false;
        });
      }
    }
  }

  void _next() {
    setState(() {
      _page += 1;
    });
    _load();
  }

  void _previous() {
    if (_page <= 1) return;
    setState(() {
      _page -= 1;
    });
    _load();
  }

  void _goToPage(int page) {
    if (page < 1) return;
    setState(() {
      _page = page;
    });
    _load();
  }

  void _showPageJumpDialog(int totalPages) {
    final controller = TextEditingController(text: _page.toString());
    showDialog<void>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Jump to Page'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: 'Page (1-$totalPages)',
              border: const OutlineInputBorder(),
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                final page = int.tryParse(controller.text);
                if (page != null && page >= 1 && page <= totalPages) {
                  Navigator.pop(context);
                  _goToPage(page);
                }
              },
              child: const Text('Go'),
            ),
          ],
        );
      },
    );
  }

  /// Get display data - returns translated cache if translate is enabled, otherwise original
  ThreadPostsResponse _getDisplayData(ThreadPostsResponse? original) {
    if (original == null) {
      throw StateError('No data available');
    }
    return _translate && _translatedCache != null ? _translatedCache! : original;
  }

  @override
  Widget build(BuildContext context) {
    final isBookmarked = widget.bookmarks.contains(widget.thread.tid);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.thread.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(isBookmarked ? Icons.bookmark : Icons.bookmark_border),
            tooltip: 'Bookmark',
            onPressed: () {
              widget.bookmarks.toggle(widget.thread);
              setState(() {});
            },
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Wrap(
              spacing: 4,
              children: [
                FilterChip(
                  label: const Text('Original'),
                  selected: !_translate,
                  onSelected: (selected) {
                    if (selected && _translate) {
                      setState(() => _translate = false);
                    }
                  },
                ),
                FilterChip(
                  label: const Text('Translated'),
                  selected: _translate,
                  onSelected: (selected) {
                    if (selected && !_translate) {
                      _toggleTranslate();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
      body: FutureBuilder<ThreadPostsResponse>(
        future: _pending,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorCard(
              message: snapshot.error.toString(),
              onRetry: _load,
            );
          }
          final data = snapshot.data;
          if (data == null || data.posts.isEmpty) {
            return const ErrorCard(message: 'No posts found.');
          }
          final display = _getDisplayData(data);
          return Column(
            children: [
              if (_translating) const LinearProgressIndicator(minHeight: 2),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            transitionBuilder: (child, animation) {
                              return FadeTransition(
                                opacity: animation,
                                child: SlideTransition(
                                  position: Tween<Offset>(
                                    begin: const Offset(0, 0.1),
                                    end: Offset.zero,
                                  ).animate(animation),
                                  child: child,
                                ),
                              );
                            },
                            child: Text(
                              display.threadTitle.isNotEmpty
                                  ? display.threadTitle
                                  : widget.thread.title,
                              key: ValueKey(_translate),
                              style: Theme.of(context).textTheme.titleMedium,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.thread.author,
                            style: Theme.of(context).textTheme.labelMedium,
                          ),
                        ],
                      ),
                    ),
                    FilledButton.tonal(
                      onPressed: _page > 1 ? _previous : null,
                      child: const Text('Prev'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _page < data.totalPages ? _next : null,
                      child: const Text('Next'),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: display.posts.length + (_page == 1 && display.hotPosts.isNotEmpty ? 1 : 0),
                  itemBuilder: (context, index) {
                    // Show hot posts after OP (floor 0) on page 1
                    if (_page == 1 && index == 1 && display.hotPosts.isNotEmpty) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            child: Row(
                              children: [
                                const Icon(Icons.whatshot, color: Colors.red, size: 20),
                                const SizedBox(width: 4),
                                Text(
                                  'Hot Comments',
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                        fontWeight: FontWeight.bold,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          ...display.hotPosts.map((hotPost) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.3),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.red,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                'HOT',
                                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              '#${hotPost.floor}',
                                              style: Theme.of(context).textTheme.labelMedium,
                                            ),
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            if (hotPost.voteGood > 0) ...[
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.green,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Row(
                                                  children: [
                                                    const Icon(Icons.thumb_up, color: Colors.white, size: 12),
                                                    const SizedBox(width: 2),
                                                    Text(
                                                      '${hotPost.voteGood}',
                                                      style: const TextStyle(color: Colors.white, fontSize: 10),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                            ],
                                            if (hotPost.voteBad > 0)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.grey,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Row(
                                                  children: [
                                                    const Icon(Icons.thumb_down, color: Colors.white, size: 12),
                                                    const SizedBox(width: 2),
                                                    Text(
                                                      '${hotPost.voteBad}',
                                                      style: const TextStyle(color: Colors.white, fontSize: 10),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      hotPost.author,
                                      style: Theme.of(context).textTheme.titleSmall,
                                    ),
                                    const SizedBox(height: 12),
                                    _PostContent(
                                      key: ValueKey('hot_${hotPost.pid}'),
                                      html: BbcodeParser.toHtml(hotPost.content),
                                      onImageTap: _runOcrOnImage,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      );
                    }

                    // Adjust index if hot posts were shown
                    final postIndex = (_page == 1 && display.hotPosts.isNotEmpty && index > 0) ? index - 1 : index;
                    final post = display.posts[postIndex];
                    final isOp = post.floor == 0;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: isOp ? Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3) : null,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    if (isOp) ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.primary,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'OP',
                                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    Text(
                                      '#${post.floor}',
                                      style: Theme.of(context).textTheme.labelMedium,
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    if (post.voteGood > 0 || post.voteBad > 0) ...[
                                      if (post.voteGood > 0) ...[
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.green,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.thumb_up, color: Colors.white, size: 12),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${post.voteGood}',
                                                style: const TextStyle(color: Colors.white, fontSize: 10),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                      ],
                                      if (post.voteBad > 0)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.grey,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(Icons.thumb_down, color: Colors.white, size: 12),
                                              const SizedBox(width: 2),
                                              Text(
                                                '${post.voteBad}',
                                                style: const TextStyle(color: Colors.white, fontSize: 10),
                                              ),
                                            ],
                                          ),
                                        ),
                                      const SizedBox(width: 8),
                                    ],
                                    Text(
                                      formatDateTime(post.postDate),
                                      style: Theme.of(context).textTheme.labelMedium,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              post.author,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            const SizedBox(height: 12),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 250),
                              transitionBuilder: (child, animation) {
                                return FadeTransition(
                                  opacity: animation,
                                  child: child,
                                );
                              },
                              child: _PostContent(
                                key: ValueKey('${post.pid}_$_translate'),
                                html: BbcodeParser.toHtml(post.content),
                                onImageTap: _runOcrOnImage,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => _showPageJumpDialog(display.totalPages),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: Theme.of(context).colorScheme.outline),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Page $_page / ${display.totalPages}',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        FilledButton.tonal(
                          onPressed: _page > 1 ? _previous : null,
                          child: const Text('Prev'),
                        ),
                        const SizedBox(width: 8),
                        FilledButton(
                          onPressed: _page < display.totalPages ? _next : null,
                          child: const Text('Next'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (_ocrBusy)
                const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: LinearProgressIndicator(minHeight: 2),
                ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _runOcrOnImage(String url) async {
    setState(() {
      _ocrBusy = true;
    });
    try {
      final bytes = await http.readBytes(Uri.parse(url));
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/ocr_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
      await file.writeAsBytes(bytes);
      final inputImage = InputImage.fromFile(file);
      final result = await _recognizer.processImage(inputImage);
      if (!mounted) return;

      // Translate OCR text
      String? translated;
      if (result.text.isNotEmpty) {
        try {
          translated = await widget.translator.translateText(result.text);
        } catch (e) {
          // Translation failed, continue without it
        }
      }

      if (!mounted) return;

      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        builder: (context) {
          return DraggableScrollableSheet(
            initialChildSize: 0.6,
            minChildSize: 0.4,
            maxChildSize: 0.9,
            expand: false,
            builder: (context, scrollController) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'OCR Text',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Original text
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.text_fields,
                                  size: 16,
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Original',
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelSmall
                                      ?.copyWith(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            SelectableText(
                              result.text.isEmpty ? '[No text]' : result.text,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      if (translated != null) ...[
                        const SizedBox(height: 12),
                        // Translated text
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color:
                                Theme.of(context).colorScheme.primaryContainer,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.translate,
                                    size: 16,
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onPrimaryContainer,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Translation',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onPrimaryContainer,
                                        ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              SelectableText(
                                translated,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onPrimaryContainer,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      // Action buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (translated != null)
                            OutlinedButton.icon(
                              onPressed: () {
                                Clipboard.setData(
                                  ClipboardData(text: translated!),
                                );
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Translation copied'),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.translate),
                              label: const Text('Copy Translation'),
                            ),
                          const SizedBox(width: 8),
                          FilledButton.icon(
                            onPressed: () {
                              Clipboard.setData(
                                ClipboardData(text: result.text),
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Text copied')),
                              );
                            },
                            icon: const Icon(Icons.copy),
                            label: const Text('Copy Text'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('OCR failed: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _ocrBusy = false;
        });
      }
    }
  }
}

class _PostContent extends StatelessWidget {
  const _PostContent({super.key, required this.html, required this.onImageTap});

  final String html;
  final void Function(String url) onImageTap;

  @override
  Widget build(BuildContext context) {
    if (html.trim().isEmpty) {
      return const Text('[No content]');
    }
    return Html(
      data: html,
      style: {
        'body': Style(margin: Margins.zero, padding: HtmlPaddings.zero),
        'blockquote': Style(
          backgroundColor: Theme.of(
            context,
          ).colorScheme.surfaceContainerHighest,
          padding: HtmlPaddings.all(8),
          margin: Margins.only(left: 0, top: 8, bottom: 8),
          border: Border(
            left: BorderSide(
              color: Theme.of(context).colorScheme.primary,
              width: 3,
            ),
          ),
        ),
      },
      extensions: [
        TagExtension(
          tagsToExtend: {'img'},
          builder: (ctx) {
            final url = ctx.attributes['src'] ?? '';
            if (url.isEmpty) return const SizedBox.shrink();
            return GestureDetector(
              onTap: () => onImageTap(url),
              child: Image.network(url, fit: BoxFit.cover),
            );
          },
        ),
      ],
    );
  }
}
