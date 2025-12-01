import 'dart:math';

int _asInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is double) return value.round();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

String _asString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  return value.toString();
}

DateTime? _asDate(dynamic value) {
  final raw = _asInt(value, -1);
  if (raw <= 0) return null;
  final milliseconds = raw > pow(10, 11) ? raw : raw * 1000;
  return DateTime.fromMillisecondsSinceEpoch(
    milliseconds,
    isUtc: true,
  ).toLocal();
}

Map<String, dynamic>? _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, val) => MapEntry(key.toString(), val));
  }
  return null;
}

class Credentials {
  const Credentials({this.uid = '', this.token = ''});

  final String uid;
  final String token;

  bool get isEmpty => uid.isEmpty || token.isEmpty;

  Credentials copyWith({String? uid, String? token}) {
    return Credentials(uid: uid ?? this.uid, token: token ?? this.token);
  }
}

class ThreadSummary {
  const ThreadSummary({
    required this.tid,
    required this.title,
    required this.author,
    required this.lastPoster,
    required this.replies,
    this.postDate,
    this.lastPost,
    this.thumbnailUrl,
    this.forumId = '',
    this.forumName = '',
  });

  factory ThreadSummary.fromApi(
    Map<String, dynamic> json, {
    String? attachPrefix,
  }) {
    final attachments = json['attachs'];
    String? thumbnail;

    if (attachments is List && attachments.isNotEmpty && attachPrefix != null) {
      final first = attachments.first;
      final attachPath = _asMap(first)?['attachurl'] ?? first;
      final cleaned = _asString(attachPath);
      if (cleaned.isNotEmpty) {
        thumbnail = attachPrefix + cleaned;
      }
    }

    return ThreadSummary(
      tid: _asInt(json['tid'], -1),
      title: _asString(json['subject'], 'Untitled'),
      author: _asString(json['author'], 'Unknown'),
      lastPoster: _asString(
        json['lastposter'],
        _asString(json['author'], 'Unknown'),
      ),
      replies: _asInt(json['replies']),
      postDate: _asDate(json['postdate']),
      lastPost: _asDate(json['lastpost']),
      thumbnailUrl: thumbnail,
      forumId: _asString(json['fid'], ''),
      forumName: _asString(json['forum_name'], ''),
    );
  }

  factory ThreadSummary.fromStorage(Map<String, dynamic> json) {
    return ThreadSummary(
      tid: _asInt(json['tid']),
      title: _asString(json['title'], 'Untitled'),
      author: _asString(json['author'], 'Unknown'),
      lastPoster: _asString(json['lastPoster'], ''),
      replies: _asInt(json['replies']),
      thumbnailUrl: _asString(json['thumbnailUrl'], ''),
      forumId: _asString(json['forumId'], ''),
      forumName: _asString(json['forumName'], ''),
      postDate: _asDate(json['postDate']),
      lastPost: _asDate(json['lastPost']),
    );
  }

  final int tid;
  final String title;
  final String author;
  final String lastPoster;
  final int replies;
  final DateTime? postDate;
  final DateTime? lastPost;
  final String? thumbnailUrl;
  final String forumId;
  final String forumName;

  Map<String, dynamic> toStorageJson() {
    return {
      'tid': tid,
      'title': title,
      'author': author,
      'lastPoster': lastPoster,
      'replies': replies,
      'postDate': postDate?.millisecondsSinceEpoch,
      'lastPost': lastPost?.millisecondsSinceEpoch,
      'thumbnailUrl': thumbnailUrl,
      'forumId': forumId,
      'forumName': forumName,
    };
  }
}

class ForumThreadsResponse {
  ForumThreadsResponse({
    required this.threads,
    required this.currentPage,
    required this.totalPages,
    this.forumName,
    this.attachPrefix,
  });

  factory ForumThreadsResponse.fromJson(Map<String, dynamic> json) {
    final result = json['result'];
    final attachPrefixRaw = _asString(
      result is Map ? result['attachPrefix'] : json['attachPrefix'],
      '',
    );
    final attachPrefix = attachPrefixRaw.isEmpty
        ? null
        : attachPrefixRaw.trim();

    final rawThreads = result is Map && result['data'] is List
        ? result['data'] as List
        : result is List
        ? result
        : <dynamic>[];

    final threads = rawThreads
        .map(_asMap)
        .whereType<Map<String, dynamic>>()
        .map((e) => ThreadSummary.fromApi(e, attachPrefix: attachPrefix))
        .toList();

    final currentPage = _asInt(
      json['currentPage'] ?? (result is Map ? result['currentPage'] : null),
      1,
    );
    final totalPages = _asInt(
      json['totalPage'] ?? (result is Map ? result['totalPage'] : null),
      1,
    );
    final forumName = _asString(json['forumname'], '');

    return ForumThreadsResponse(
      threads: threads,
      currentPage: currentPage,
      totalPages: totalPages,
      forumName: forumName.isEmpty ? null : forumName,
      attachPrefix: attachPrefix,
    );
  }

  final List<ThreadSummary> threads;
  final int currentPage;
  final int totalPages;
  final String? forumName;
  final String? attachPrefix;
}

class ThreadPost {
  const ThreadPost({
    required this.pid,
    required this.author,
    required this.content,
    required this.floor,
    this.postDate,
    this.voteGood = 0,
    this.voteBad = 0,
    this.isHot = false,
  });

  factory ThreadPost.fromApi(Map<String, dynamic> json, {required int floor, bool isHot = false}) {
    final authorInfo = json['author'];
    final authorName = authorInfo is Map
        ? _asString(authorInfo['username'], 'Unknown')
        : _asString(authorInfo, 'Unknown');

    return ThreadPost(
      pid: _asInt(json['pid'], floor),
      author: authorName,
      content: _stripHtml(_asString(json['content'], '')),
      floor: json['lou'] != null ? _asInt(json['lou']) : floor,
      postDate: _asDate(json['postdate']),
      voteGood: _asInt(json['vote_good'], 0),
      voteBad: _asInt(json['vote_bad'], 0),
      isHot: isHot,
    );
  }

  final int pid;
  final String author;
  final String content;
  final int floor;
  final DateTime? postDate;
  final int voteGood;
  final int voteBad;
  final bool isHot;
}

class ThreadPostsResponse {
  ThreadPostsResponse({
    required this.posts,
    required this.currentPage,
    required this.totalPages,
    this.threadTitle = '',
    this.forumName = '',
    this.hotPosts = const [],
  });

  factory ThreadPostsResponse.fromJson(Map<String, dynamic> json) {
    final postsRaw = json['result'] is List
        ? json['result'] as List
        : <dynamic>[];
    final currentPage = _asInt(json['currentPage'], 1);
    final totalPages = _asInt(json['totalPage'], 1);

    final posts = <ThreadPost>[];
    for (var i = 0; i < postsRaw.length; i++) {
      final map = _asMap(postsRaw[i]);
      if (map == null) continue;
      posts.add(ThreadPost.fromApi(map, floor: ((currentPage - 1) * 20) + i));
    }

    // Parse hot posts (only on first page)
    final hotPostsRaw = json['hot_post'] is List
        ? json['hot_post'] as List
        : <dynamic>[];
    final hotPosts = <ThreadPost>[];
    for (var i = 0; i < hotPostsRaw.length; i++) {
      final map = _asMap(hotPostsRaw[i]);
      if (map == null) continue;
      final floor = _asInt(map['lou'], i);
      hotPosts.add(ThreadPost.fromApi(map, floor: floor, isHot: true));
    }

    return ThreadPostsResponse(
      posts: posts,
      currentPage: currentPage,
      totalPages: totalPages,
      threadTitle: _asString(json['tsubject'], ''),
      forumName: _asString(json['forum_name'], ''),
      hotPosts: hotPosts,
    );
  }

  final List<ThreadPost> posts;
  final int currentPage;
  final int totalPages;
  final String threadTitle;
  final String forumName;
  final List<ThreadPost> hotPosts;
}

class ForumSearchResult {
  const ForumSearchResult({
    required this.fid,
    required this.name,
    required this.description,
  });

  factory ForumSearchResult.fromJson(Map<String, dynamic> json) {
    return ForumSearchResult(
      fid: _asString(json['fid']),
      name: _asString(json['name'] ?? json['1'], 'Forum'),
      description: _asString(json['info'] ?? json['2'], ''),
    );
  }

  final String fid;
  final String name;
  final String description;

  static List<ForumSearchResult> listFromJson(Map<String, dynamic> json) {
    final result = json['result'];
    final list = result is List ? result : <dynamic>[];
    return list
        .map(_asMap)
        .whereType<Map<String, dynamic>>()
        .map(ForumSearchResult.fromJson)
        .toList();
  }
}

String _stripHtml(String value) {
  return value
      .replaceAll(RegExp(r'<[^>]*>'), '')
      .replaceAll('&nbsp;', ' ')
      .trim();
}
