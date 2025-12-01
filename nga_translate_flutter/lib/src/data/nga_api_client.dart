import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

import 'models.dart';

class NgaApiClient {
  NgaApiClient({http.Client? client}) : _client = client ?? http.Client();

  static const _appId = '1010';
  static const _secret = '392e916a6d1d8b7523e2701470000c30bc2165a1';
  static const _baseUrl = 'https://ngabbs.com/app_api.php';

  final http.Client _client;

  Future<ForumThreadsResponse> fetchForumThreads({
    required String fid,
    String act = 'list',
    int page = 1,
    Credentials? credentials,
    String orderBy = 'postdatedesc',
  }) {
    final t = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final sign = _makeSign(fid, credentials, t);
    final payload = <String, String>{
      'page': '$page',
      '__output': '14',
      '__inchst': 'utf-8',
      'app_id': _appId,
      'access_uid': credentials?.uid ?? '',
      'access_token': credentials?.token ?? '',
      't': '$t',
      'sign': sign,
    };

    if (act == 'topped') {
      payload['topped'] = fid;
    } else {
      payload['fid'] = fid;
      if (act == 'list') {
        payload['order_by'] = orderBy;
      }
    }

    final uri = Uri.parse('$_baseUrl?__lib=subject&__act=$act');
    return _post(uri, payload, (json) => ForumThreadsResponse.fromJson(json));
  }

  Future<ThreadPostsResponse> fetchThreadPosts({
    required String tid,
    int page = 1,
    Credentials? credentials,
  }) {
    final t = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final sign = _makeSign(tid, credentials, t);
    final payload = <String, String>{
      'tid': tid,
      'page': '$page',
      '__output': '14',
      '__inchst': 'utf-8',
      'app_id': _appId,
      'access_uid': credentials?.uid ?? '',
      'access_token': credentials?.token ?? '',
      't': '$t',
      'sign': sign,
    };
    final uri = Uri.parse('$_baseUrl?__lib=post&__act=list');
    return _post(uri, payload, (json) => ThreadPostsResponse.fromJson(json));
  }

  Future<List<ThreadSummary>> searchThreads(
    String keyword, {
    String fid = '',
    int page = 1,
    Credentials? credentials,
  }) {
    final t = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final sign = _makeSign(keyword, credentials, t);
    final payload = <String, String>{
      'key': keyword,
      'page': '$page',
      'table': '7',
      'fid': fid,
      'recommend': '',
      '__output': '14',
      '__inchst': 'utf-8',
      'app_id': _appId,
      'access_uid': credentials?.uid ?? '',
      'access_token': credentials?.token ?? '',
      't': '$t',
      'sign': sign,
    };
    final uri = Uri.parse('$_baseUrl?__lib=subject&__act=search');
    return _post(
      uri,
      payload,
      (json) => ForumThreadsResponse.fromJson(json).threads,
    );
  }

  Future<List<ForumSearchResult>> searchForums(
    String keyword, {
    int page = 1,
    Credentials? credentials,
  }) {
    final t = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final sign = _makeSign(keyword, credentials, t);
    final payload = <String, String>{
      'key': keyword,
      'page': '$page',
      '__output': '14',
      '__inchst': 'utf-8',
      'app_id': _appId,
      'access_uid': credentials?.uid ?? '',
      'access_token': credentials?.token ?? '',
      't': '$t',
      'sign': sign,
    };
    final uri = Uri.parse('$_baseUrl?__lib=forum&__act=search');
    return _post(uri, payload, ForumSearchResult.listFromJson);
  }

  Future<T> _post<T>(
    Uri uri,
    Map<String, String> body,
    T Function(Map<String, dynamic>) parser,
  ) async {
    final response = await _client.post(
      uri,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://ngabbs.com/',
        'User-Agent':
            'Mozilla/5.0 (Linux; Android 10.0; Device Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.97 Mobile Safari/537.36',
        'X-USER-AGENT': 'Nga_Official/90954(Android 10.0)',
      },
      body: body,
    );

    if (response.statusCode != 200) {
      throw NgaApiException(
        'HTTP ${response.statusCode}: ${response.reasonPhrase ?? 'Unknown'}',
      );
    }

    final decoded = json.decode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const NgaApiException('Unexpected response format');
    }
    if (decoded['error'] != null && decoded['error'].toString().isNotEmpty) {
      throw NgaApiException(decoded['error'].toString());
    }
    if (decoded['code'] != null && decoded['code'] != 0) {
      final message = decoded['msg']?.toString() ?? 'API error';
      throw NgaApiException(message);
    }
    return parser(decoded);
  }

  String _makeSign(String signParams, Credentials? credentials, int t) {
    final uid = credentials?.uid ?? '';
    final token = credentials?.token ?? '';
    final raw = '$_appId$uid$token$signParams$t$_secret';
    final digest = md5.convert(utf8.encode(raw));
    return digest.toString();
  }

  void close() {
    _client.close();
  }
}

class NgaApiException implements Exception {
  const NgaApiException(this.message);
  final String message;

  @override
  String toString() => message;
}
