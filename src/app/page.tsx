const contentTypes = [
  {
    number: "01",
    title: "둘 중 하나, VS",
    description: "두 선택지를 비교하고 지금 사람들의 선택 비율을 확인합니다.",
    accent: "violet",
  },
  {
    number: "02",
    title: "최종 한 명, 월드컵",
    description: "16강과 32강 토너먼트를 거쳐 나만의 최종 우승을 정합니다.",
    accent: "coral",
  },
  {
    number: "03",
    title: "쌓이는 선택, 랭킹",
    description: "한 번의 결과가 끝나지 않고 전체·기간별 순위로 이어집니다.",
    accent: "mint",
  },
] as const;

const principles = [
  "설명과 선정 기준이 있는 공개 콘텐츠",
  "익명 참여와 중복 선택 완화",
  "모바일과 키보드 모두 편안한 경험",
] as const;

export default function Home() {
  return (
    <main>
      <header className="site-header" aria-label="사이트 헤더">
        <a className="brand" href="#top" aria-label="버라이어티퀴즈 홈">
          <span className="brand-mark" aria-hidden="true">VQ</span>
          <span>버라이어티퀴즈</span>
        </a>
        <span className="build-badge">V2 BUILDING</span>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true" /> CHOOSE · PLAY · COMPARE</p>
          <h1 id="hero-title">
            나의 선택이
            <br />
            <em>모두의 랭킹</em>이 됩니다.
          </h1>
          <p className="hero-description">
            짧게 즐기는 VS부터 32강 월드컵까지. 흥미로운 주제를 발견하고,
            직접 선택하고, 다른 사람들의 결과와 비교하는 참여형 콘텐츠 공간을 만들고 있습니다.
          </p>
          <div className="release-note" role="status">
            <span className="pulse" aria-hidden="true" />
            첫 공개 콘텐츠를 준비하고 있습니다
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="choice-card choice-a">
            <span>A</span>
            <strong>오늘은 새로운 도전</strong>
          </div>
          <div className="versus">VS</div>
          <div className="choice-card choice-b">
            <span>B</span>
            <strong>익숙한 최애 다시 보기</strong>
          </div>
          <div className="score-line"><i /> 선택은 곧 데이터가 됩니다</div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="content-title">
        <div className="section-heading">
          <p className="eyebrow">WHAT&apos;S COMING</p>
          <h2 id="content-title">한 번의 클릭을<br />재미있는 이야기로</h2>
        </div>
        <div className="content-grid">
          {contentTypes.map((item) => (
            <article className={`feature-card ${item.accent}`} key={item.number}>
              <span className="feature-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="principles" aria-labelledby="principles-title">
        <div>
          <p className="eyebrow">OUR STANDARD</p>
          <h2 id="principles-title">재미만큼 중요한<br />콘텐츠의 기본</h2>
        </div>
        <ol>
          {principles.map((principle, index) => (
            <li key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {principle}
            </li>
          ))}
        </ol>
      </section>

      <footer>
        <p>© 2026 Variety Quiz. V2 foundation.</p>
        <p>콘텐츠와 참여 기능을 차례대로 공개합니다.</p>
      </footer>
    </main>
  );
}
