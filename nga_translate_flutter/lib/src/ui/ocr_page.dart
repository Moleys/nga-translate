import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

import '../utils/segmenter.dart';

class OcrPage extends StatefulWidget {
  const OcrPage({super.key});

  @override
  State<OcrPage> createState() => _OcrPageState();
}

class _OcrPageState extends State<OcrPage> {
  final ImagePicker _picker = ImagePicker();
  late final TextRecognizer _recognizer = TextRecognizer(
    script: TextRecognitionScript.chinese,
  );

  XFile? _file;
  String? _text;
  String? _error;
  bool _busy = false;
  List<String> _segments = const [];

  @override
  void dispose() {
    _recognizer.close();
    super.dispose();
  }

  Future<void> _pick(ImageSource source) async {
    setState(() {
      _error = null;
    });
    try {
      final file = await _picker.pickImage(source: source, imageQuality: 85);
      if (file == null) return;
      setState(() {
        _file = file;
        _text = null;
        _busy = true;
        _segments = const [];
      });
      await _runOcr(file);
    } catch (e) {
      setState(() {
        _error = 'Failed to pick image: $e';
      });
    } finally {
      setState(() {
        _busy = false;
      });
    }
  }

  Future<void> _runOcr(XFile file) async {
    try {
      final input = InputImage.fromFilePath(file.path);
      final recognized = await _recognizer.processImage(input);
      setState(() {
        _text = recognized.text;
      });
      await _segment(recognized.text);
    } catch (e) {
      setState(() {
        _error = 'OCR failed: $e';
      });
    }
  }

  Future<void> _segment(String text) async {
    final segs = await Segmenter.instance.cut(text);
    if (!mounted) return;
    setState(() {
      _segments = segs;
    });
  }

  Future<void> _copy() async {
    if (_text == null || _text!.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: _text!));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Copied recognized text')));
  }

  void _clear() {
    setState(() {
      _file = null;
      _text = null;
      _error = null;
      _segments = const [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('OCR (ML Kit)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Clear',
            onPressed: _file == null && _text == null ? null : _clear,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton.icon(
                onPressed: _busy ? null : () => _pick(ImageSource.gallery),
                icon: const Icon(Icons.photo_library_outlined),
                label: const Text('Pick from gallery'),
              ),
              FilledButton.tonalIcon(
                onPressed: _busy ? null : () => _pick(ImageSource.camera),
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Use camera'),
              ),
              OutlinedButton.icon(
                onPressed: (_text?.isNotEmpty ?? false) ? _copy : null,
                icon: const Icon(Icons.copy_outlined),
                label: const Text('Copy text'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_busy) ...[
            const Center(child: CircularProgressIndicator()),
            const SizedBox(height: 16),
          ],
          if (_file != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.file(
                File(_file!.path),
                height: 240,
                fit: BoxFit.cover,
              ),
            ),
          if (_file != null) const SizedBox(height: 16),
          if (_error != null)
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  _error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
                ),
              ),
            ),
          if (_text != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SelectableText(
                  _text!.isEmpty ? '[No text recognized]' : _text!,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
            ),
          if (_segments.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _segments
                      .map(
                        (w) => Chip(
                          label: Text(w),
                          visualDensity: VisualDensity.compact,
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          if (_file == null && !_busy && _text == null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'How it works',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Pick an image or use the camera. Text is extracted on-device with Google ML Kit (supports Chinese/Latin).',
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
