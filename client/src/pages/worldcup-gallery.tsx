import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Coffee, Gamepad2, Plane, Play, Plus, Trophy, Utensils } from "lucide-react";
import { HubBackdrop, HubNav } from "@/components/HubNav";
import { useSEO } from "@/hooks/use-seo";
import { featuredWorldCups, getMyWorldCups, selectWorldCup, WorldCupLibraryEntry } from "@/lib/worldcup-library";

type Filter = "all" | "food" | "travel" | "lifestyle";
const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "전체" }, { id: "food", label: "음식" }, { id: "travel", label: "여행" }, { id: "lifestyle", label: "라이프" },
];

function categoryFor(entry: WorldCupLibraryEntry): Filter {
  if (entry.id.includes("food") || entry.id.includes("snack")) return "food";
  if (entry.id.includes("travel")) return "travel";
  return "lifestyle";
}

function WorldCupIcon({ entry }: { entry: WorldCupLibraryEntry }) {
  const category = categoryFor(entry);
  if (category === "food") return <Utensils />;
  if (category === "travel") return <Plane />;
  if (entry.id.includes("weekend")) return <Coffee />;
  return <Gamepad2 />;
}

export default function WorldCupGalleryPage() {
  const [, setLocation] = useLocation();
  const [mine, setMine] = useState<WorldCupLibraryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useSEO({ title: "취향 월드컵 | 버라이어티 퀴즈", description: "준비된 취향 월드컵을 플레이하거나 직접 만들어보세요.", keywords: "취향월드컵, 이상형월드컵, 월드컵만들기" });
  useEffect(() => setMine(getMyWorldCups()), []);

  const play = (entry: WorldCupLibraryEntry) => { selectWorldCup(entry); setLocation("/bracket/worldcup/play"); };
  const visible = filter === "all" ? featuredWorldCups : featuredWorldCups.filter(entry => categoryFor(entry) === filter);

  return (
    <main className="home-shell hub-page worldcup-page">
      <HubBackdrop />
      <div className="home-container">
        <HubNav />
        <section className="worldcup-hero">
          <div><span className="hub-kicker">PICK YOUR FAVORITE</span><h1>오늘은 무엇을<br />골라볼까요?</h1><p>준비된 월드컵을 시작하거나 나만의 대결을 만들어보세요.</p></div>
          <button onClick={() => setLocation("/bracket/worldcup/create")}><Plus /> 월드컵 만들기</button>
        </section>

        <div className="worldcup-layout">
          <section className="worldcup-library">
            <div className="worldcup-section-head">
              <h2><Trophy /> 기본 제공 월드컵</h2>
              <div>{filters.map(item => <button key={item.id} className={filter === item.id ? "is-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
            </div>
            {visible.length > 0 ? <div className="worldcup-card-grid">
              {visible.map((entry, index) => (
                <article key={entry.id} className={`worldcup-card worldcup-art-${index % 4}`}>
                  <button className="worldcup-card-hitbox" onClick={() => play(entry)} aria-label={`${entry.title} 바로 시작`} />
                  <div className="worldcup-art"><WorldCupIcon entry={entry} /><span>{entry.round}강</span></div>
                  <div className="worldcup-card-body"><h3>{entry.title}</h3><p>{entry.items.slice(0, 3).map(item => item.name).join(" · ")}</p><div><span>바로 시작</span><ArrowRight /></div></div>
                </article>
              ))}
            </div> : <div className="worldcup-empty">이 카테고리에는 아직 기본 월드컵이 없어요.</div>}
          </section>

          <aside className="worldcup-mine">
            <div className="worldcup-mine-head"><div><span className="hub-kicker">MY LIBRARY</span><h2>내가 만든 월드컵</h2></div><span>{mine.length}</span></div>
            <div className="worldcup-mine-list">
              {mine.length === 0 ? <div className="worldcup-mine-empty"><Trophy /><b>아직 만든 월드컵이 없어요</b><p>나만의 후보를 추가해 첫 대결을 만들어보세요.</p></div> : mine.slice(0, 4).map(entry => (
                <button key={entry.id} onClick={() => play(entry)}><span><Trophy /></span><div><b>{entry.title}</b><small>{entry.round}강 · {entry.items.length}개 후보</small></div><Play /></button>
              ))}
            </div>
            <button className="worldcup-create-tile" onClick={() => setLocation("/bracket/worldcup/create")}><Plus /><span>새로운 월드컵 만들기</span></button>
          </aside>
        </div>
      </div>
    </main>
  );
}
