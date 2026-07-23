import { useLocation } from "wouter";
import { ArrowRight, Clock3, Grid2X2, Repeat2, Scale, UsersRound } from "lucide-react";
import { HubBackdrop, HubNav } from "@/components/HubNav";
import { useSEO } from "@/hooks/use-seo";

const modes = [
  {
    id: "badminton",
    title: "배드민턴 매칭",
    description: "단식과 복식, 실력과 휴식 순서까지 고려해요.",
    path: "/bracket/badminton",
    tone: "blue",
    icon: Grid2X2,
    tags: ["단식·복식", "실력 균형", "휴식 순환"],
    button: "배드민턴으로 시작",
  },
  {
    id: "free",
    title: "자유 매칭",
    description: "어떤 게임이든 인원과 그룹 크기에 맞춰 나눠요.",
    path: "/matching/free",
    tone: "violet",
    icon: UsersRound,
    tags: ["인원 설정", "그룹 설정", "공정한 순환"],
    button: "자유롭게 시작",
  },
] as const;

export default function MatchingChoicePage() {
  const [, setLocation] = useLocation();
  useSEO({ title: "게임 매칭 방식 선택 | 버라이어티 퀴즈", description: "배드민턴 또는 자유 매칭 방식을 선택하세요.", keywords: "게임매칭, 팀나누기, 배드민턴매칭" });

  return (
    <main className="home-shell hub-page">
      <HubBackdrop />
      <div className="home-container">
        <HubNav />
        <div className="hub-breadcrumb"><button onClick={() => setLocation("/")}>홈</button><span>/</span><b>게임 매칭</b></div>
        <section className="matching-hero">
          <span className="hub-kicker">MATCH YOUR WAY</span>
          <h1>어떤 방식으로 매칭할까요?</h1>
          <p>게임에 맞는 방식을 선택하면 공정하게 팀을 구성해드려요.</p>
        </section>
        <section className="matching-mode-grid">
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <article key={mode.id} className={`matching-mode-card matching-${mode.tone}`}>
                <div className="matching-mode-icon"><Icon /></div>
                <div>
                  <span className="home-eyebrow">{mode.id === "badminton" ? "SPORTS MODE" : "FLEXIBLE MODE"}</span>
                  <h2>{mode.title}</h2>
                  <p>{mode.description}</p>
                </div>
                <div className="matching-tags">{mode.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                <button onClick={() => setLocation(mode.path)}>{mode.button}<ArrowRight /></button>
              </article>
            );
          })}
        </section>
        <section className="matching-benefits" aria-label="매칭 특징">
          <div><Scale /><span><b>공정한 배정</b>참여와 휴식 횟수를 고르게</span></div>
          <div><Repeat2 /><span><b>반복 최소화</b>같은 조합이 이어지지 않게</span></div>
          <div><Clock3 /><span><b>빠른 시작</b>설정 후 바로 첫 라운드 생성</span></div>
        </section>
      </div>
    </main>
  );
}
