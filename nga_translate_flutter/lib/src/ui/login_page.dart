import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    required this.initialUid,
    required this.initialToken,
    required this.onSave,
    required this.baseUrl,
  });

  final String initialUid;
  final String initialToken;
  final void Function(String uid, String token) onSave;
  final String baseUrl;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  late final TextEditingController _uid;
  late final TextEditingController _token;
  bool _validating = false;
  String? _status;

  @override
  void initState() {
    super.initState();
    _uid = TextEditingController(text: widget.initialUid);
    _token = TextEditingController(text: widget.initialToken);
  }

  @override
  void dispose() {
    _uid.dispose();
    _token.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    widget.onSave(_uid.text.trim(), _token.text.trim());
    Navigator.of(context).pop();
  }

  Future<void> _validate() async {
    setState(() {
      _validating = true;
      _status = null;
    });
    try {
      final host = widget.baseUrl.endsWith('/')
          ? widget.baseUrl.substring(0, widget.baseUrl.length - 1)
          : widget.baseUrl;
      final resp = await http.get(
        Uri.parse('$host/api/search/forums?q=test'),
        headers: {
          'Cookie':
              'nga_access_uid=${_uid.text.trim()}; nga_access_token=${_token.text.trim()}',
        },
      );
      if (resp.statusCode != 200) {
        setState(() {
          _status = 'HTTP ${resp.statusCode}';
        });
        return;
      }
      final decoded = json.decode(resp.body);
      final code = decoded is Map && decoded['code'] != null
          ? decoded['code']
          : 0;
      if (code == 0) {
        setState(() {
          _status = 'Valid credentials';
        });
      } else {
        setState(() {
          _status = 'API returned code $code';
        });
      }
    } catch (e) {
      setState(() {
        _status = 'Validation failed: $e';
      });
    } finally {
      setState(() {
        _validating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('NGA Login')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _uid,
            decoration: const InputDecoration(labelText: 'nga_access_uid'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _token,
            decoration: const InputDecoration(labelText: 'nga_access_token'),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: _save,
                  child: const Text('Save'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.tonal(
                  onPressed: _validating ? null : _validate,
                  child: _validating
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Validate'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_status != null)
            Text(_status!, style: Theme.of(context).textTheme.labelMedium),
        ],
      ),
    );
  }
}
