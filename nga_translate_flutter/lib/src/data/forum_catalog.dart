import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

class ForumCatalog {
  const ForumCatalog({required this.categories});

  final List<ForumCategory> categories;

  static Future<ForumCatalog> load() async {
    final raw = await rootBundle.loadString('assets/forums.json');
    final decoded = json.decode(raw);
    if (decoded is! List) {
      throw const FormatException('Unexpected forum catalog format');
    }
    final categories = decoded
        .whereType<Map<String, dynamic>>()
        .map(ForumCategory.fromJson)
        .toList();
    return ForumCatalog(categories: categories);
  }

  List<ForumEntry> search(String query) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) {
      return categories.expand((c) => c.forums).toList();
    }
    return categories
        .expand((c) => c.forums)
        .where(
          (f) =>
              f.name.toLowerCase().contains(q) ||
              f.subject.toLowerCase().contains(q),
        )
        .toList();
  }
}

class ForumCategory {
  ForumCategory({required this.name, required this.forums});

  factory ForumCategory.fromJson(Map<String, dynamic> json) {
    final forumsRaw = json['forums'];
    final forums = forumsRaw is List
        ? forumsRaw
              .whereType<Map<String, dynamic>>()
              .map(ForumEntry.fromJson)
              .toList()
        : <ForumEntry>[];
    return ForumCategory(
      name: (json['category'] ?? '').toString(),
      forums: forums,
    );
  }

  final String name;
  final List<ForumEntry> forums;
}

class ForumEntry {
  ForumEntry({
    required this.fid,
    required this.name,
    required this.subject,
    required this.avatar,
  });

  factory ForumEntry.fromJson(Map<String, dynamic> json) {
    return ForumEntry(
      fid: (json['fid'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      subject: (json['subject'] ?? '').toString(),
      avatar: (json['avatar'] ?? '').toString(),
    );
  }

  final String fid;
  final String name;
  final String subject;
  final String avatar;

  Map<String, dynamic> toJson() => {
    'fid': fid,
    'name': name,
    'subject': subject,
    'avatar': avatar,
  };
}
