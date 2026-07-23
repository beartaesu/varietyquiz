import { useLocation } from "wouter";
import { useSEO, getHomeSEO } from "@/hooks/use-seo";
import {
  ArrowRight,
  CircleHelp,
  Dice5,
  Play,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";

const services = [
  {
    id: "matching",
    eyebrow: "FAIR PLAY",
    title: "게임 매칭",
    description: "인원과 코트에 맞춰 공정한 팀을 빠르게 구성해요.",
    link: "/matching",
    icon: UsersRound,
    tone: "blue",
    preview: (
      <div className="home-match-preview" aria-hidden="true">
        <div><span>전체 인원</span><strong>12명</strong></div>
        <div><span>코트 수</span><strong>3개</strong></div>
        <div><span>참여 인원</span><strong>4명</strong></div>
      </div>
    ),
  },
  {
    id: "worldcup",
    eyebrow: "PICK YOUR FAVORITE",
    title: "취향 월드컵",
    description: "두 선택지 중 하나를 고르며 나만의 최애를 찾아보세요.",
    link: "/bracket/worldcup",
    icon: Trophy,
    tone: "violet",
    preview: (
      <div className="home-bracket-preview" aria-hidden="true">
        <i /><i /><i /><i /><span /><span /><b />
      </div>
    ),
  },
  {
    id: "quiz",
    eyebrow: "QUICK CHALLENGE",
    title: "예능 퀴즈",
    description: "가볍게 시작해서 제대로 몰입하는 다양한 퀴즈를 만나보세요.",
    link: "/sitemap",
    icon: CircleHelp,
    tone: "coral",
    preview: (
      <div className="home-quiz-preview" aria-hidden="true">
        <div><strong>Q.</strong><span /></div>
        <div className="home-answer-grid"><i>A</i><i>B</i><i>C</i><i>D</i></div>
      </div>
    ),
  },
] as const;

export default function MainHomePage() {
  const [, setLocation] = useLocation();

  useSEO(getHomeSEO());

  const navigateTo = (path: string) => setLocation(path);
  const scrollToGames = () => document.getElementById("games")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="home-shell">
      <div className="home-aurora home-aurora-blue" />
      <div className="home-aurora home-aurora-coral" />
      <div className="home-noise" />

      <div className="home-container">
        <header className="home-nav hub-simple-nav">
          <button className="home-brand" onClick={() => setLocation("/")} aria-label="홈으로 이동">
            <span className="home-brand-mark"><Dice5 /></span>
            <span>버라이어티 퀴즈</span>
          </button>

          <span className="home-nav-label">PLAY YOUR WAY</span>
        </header>

        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-kicker"><Sparkles /> PLAY YOUR WAY</div>
            <h1>오늘은<br /><span>뭐하고 놀까?</span></h1>
            <p>취향 대결부터 게임 매칭까지.<br className="home-mobile-break" /> 고민 없이, 가볍게 시작해요.</p>
            <div className="home-hero-actions">
              <button className="home-primary-action" onClick={scrollToGames}>
                게임 둘러보기 <ArrowRight />
              </button>
              <button className="home-secondary-action" onClick={() => navigateTo("/bracket/worldcup")}>
                <Play /> 바로 플레이
              </button>
            </div>
          </div>

          <div className="home-visual" aria-hidden="true">
            <div className="home-visual-glow" />
            <div className="home-trophy"><Trophy /></div>
            <div className="home-question">?</div>
            <div className="home-die"><span>●</span><span>●</span><span>●</span></div>
            <div className="home-token home-token-one" />
            <div className="home-token home-token-two" />
            <div className="home-pawn home-pawn-one" />
            <div className="home-pawn home-pawn-two" />
            <div className="home-platform" />
          </div>
        </section>

        <section className="home-games" id="games">
          <div className="home-section-heading">
            <div>
              <span>CHOOSE A GAME</span>
              <h2>지금 바로 시작</h2>
            </div>
            <p>설치 없이 바로 즐길 수 있어요</p>
          </div>

          <div className="home-service-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.id} className={`home-service-card home-service-${service.tone}`}>
                  <button
                    className="home-card-hitbox"
                    onClick={() => navigateTo(service.link)}
                    aria-label={`${service.title} 시작하기`}
                  />
                  <div className="home-card-top">
                    <span className="home-service-icon"><Icon /></span>
                    <span className="home-card-arrow"><ArrowRight /></span>
                  </div>
                  <span className="home-eyebrow">{service.eyebrow}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  {service.preview}
                  <div className="home-card-footer">
                    <span>시작하기</span><ArrowRight />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="home-footer">
          <div className="home-brand home-brand-footer">
            <span className="home-brand-mark"><Dice5 /></span>
            <span>버라이어티 퀴즈</span>
          </div>
          <p>같이 놀면 더 재미있으니까.</p>
          <a href="mailto:varietyquizquiz@gmail.com">문의하기</a>
        </footer>
      </div>
    </main>
  );
}
