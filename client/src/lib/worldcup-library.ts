import { WorldCupData, serializeWorldCupData } from "@/lib/worldcup-logic";

export interface WorldCupLibraryEntry extends WorldCupData {
  id: string;
  creator: string;
  plays: number;
  featured?: boolean;
}

const makeItems = (names: string[]) => names.map((name, index) => ({ id: index + 1, name, imageUrl: "" }));

export const featuredWorldCups: WorldCupLibraryEntry[] = [
  {
    id: "featured-kfood", creator: "맛잘알 민지", plays: 1284, featured: true,
    title: "최애 한식 월드컵", round: 8, createdAt: "2026-06-12T00:00:00.000Z",
    items: makeItems(["김치찌개", "삼겹살", "비빔밥", "불고기", "떡볶이", "냉면", "치킨", "갈비찜"]),
  },
  {
    id: "featured-travel", creator: "여행자 준", plays: 932, featured: true,
    title: "지금 떠나고 싶은 여행지", round: 8, createdAt: "2026-06-24T00:00:00.000Z",
    items: makeItems(["제주", "도쿄", "파리", "뉴욕", "방콕", "발리", "런던", "로마"]),
  },
  {
    id: "featured-snack", creator: "간식연구소", plays: 768, featured: true,
    title: "편의점 최강 간식", round: 8, createdAt: "2026-07-02T00:00:00.000Z",
    items: makeItems(["컵라면", "삼각김밥", "핫바", "샌드위치", "아이스크림", "초콜릿", "젤리", "감자칩"]),
  },
  {
    id: "featured-weekend", creator: "주말만 기다려", plays: 541, featured: true,
    title: "완벽한 주말 보내기", round: 8, createdAt: "2026-07-08T00:00:00.000Z",
    items: makeItems(["늦잠", "영화 정주행", "맛집 탐방", "근교 여행", "게임", "운동", "카페", "친구 만나기"]),
  },
];

const STORAGE_KEY = "worldcup_library";

export function getMyWorldCups(): WorldCupLibraryEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyWorldCup(data: WorldCupData): void {
  const previous = getMyWorldCups().filter(entry => entry.title !== data.title);
  const entry: WorldCupLibraryEntry = {
    ...data,
    id: `mine-${Date.now()}`,
    creator: "나",
    plays: 0,
  };
  const next = [entry, ...previous].slice(0, 12);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    const withoutImages = next.map(item => ({ ...item, items: item.items.map(candidate => ({ ...candidate, imageUrl: "" })) }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutImages));
  }
}

export function selectWorldCup(entry: WorldCupLibraryEntry): void {
  const data: WorldCupData = {
    title: entry.title,
    items: entry.items,
    round: entry.round,
    createdAt: entry.createdAt,
  };
  localStorage.setItem("worldcup_current", serializeWorldCupData(data));
}
