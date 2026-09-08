-- Text-only development data written for Variety Quiz V2.
-- No third-party images or unverified external assets are included.

INSERT INTO "categories" (
  "id", "slug", "name", "description", "display_order", "is_active"
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  'daily-life',
  '일상 취향',
  '누구나 가볍게 비교하고 이야기할 수 있는 일상 속 선택입니다.',
  0,
  true
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "tags" ("id", "slug", "name") VALUES
  ('20000000-0000-4000-8000-000000000001', 'weekend', '주말'),
  ('20000000-0000-4000-8000-000000000002', 'lifestyle', '라이프스타일')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "contents" (
  "id", "type", "status", "slug", "title", "summary", "body",
  "category_id", "ad_eligible", "published_at"
) VALUES (
  '30000000-0000-4000-8000-000000000001',
  'vs',
  'published',
  'weekend-plan-vs',
  '완벽한 주말 계획 VS',
  '새로운 장소로 떠나는 주말과 익숙한 공간에서 쉬는 주말 중 하나를 골라보세요.',
  '주말을 기다리는 이유는 사람마다 다릅니다. 이번 선택에서는 새로운 경험과 편안한 회복 중 지금 더 필요한 시간을 비교합니다.',
  '10000000-0000-4000-8000-000000000001',
  false,
  '2026-09-08T00:00:00Z'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "content_tags" ("content_id", "tag_id") VALUES
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO "candidates" (
  "id", "content_id", "name", "description", "rights_status", "rights_note", "display_order"
) VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '새로운 곳으로 떠나기',
    '가보지 않은 동네나 가까운 여행지에서 새로운 장면을 만납니다.',
    'original',
    'Variety Quiz V2 development copy',
    0
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '익숙한 곳에서 쉬기',
    '좋아하는 공간에서 속도를 늦추고 다음 주를 위한 여유를 채웁니다.',
    'original',
    'Variety Quiz V2 development copy',
    1
  )
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "content_stats" ("content_id") VALUES
  ('30000000-0000-4000-8000-000000000001')
ON CONFLICT ("content_id") DO NOTHING;

INSERT INTO "candidate_stats" ("candidate_id", "content_id") VALUES
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001')
ON CONFLICT ("candidate_id") DO NOTHING;
