import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Clock3, Crown, Globe2, Landmark, MessageCircle, ScrollText } from "lucide-react";
import { HubBackdrop, HubNav } from "@/components/HubNav";
import { useSEO } from "@/hooks/use-seo";

const categories = [
  { id: "person", name: "인물 퀴즈", desc: "한국 연예인을 맞혀보세요", icon: Crown, tone: "coral" },
  { id: "capital", name: "수도 퀴즈", desc: "세계 각국의 수도를 맞혀보세요", icon: Globe2, tone: "blue" },
  { id: "landmark", name: "랜드마크 퀴즈", desc: "유명한 랜드마크를 맞혀보세요", icon: Landmark, tone: "violet" },
  { id: "idiom", name: "사자성어 퀴즈", desc: "사자성어의 뜻을 맞혀보세요", icon: ScrollText, tone: "amber" },
  { id: "proverb", name: "속담 퀴즈", desc: "속담의 빈칸을 채워보세요", icon: MessageCircle, tone: "mint" },
] as const;

type CategoryId = typeof categories[number]["id"];

export default function SitemapPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("person");
  const [questionCount, setQuestionCount] = useState(10);
  const selected = useMemo(() => categories.find(category => category.id === selectedCategory)!, [selectedCategory]);

  useSEO({ title: "예능 퀴즈 | 버라이어티 퀴즈", description: "퀴즈 카테고리와 문제 수를 선택하고 바로 시작하세요.", keywords: "퀴즈, 인물퀴즈, 수도퀴즈, 랜드마크퀴즈" });

  const startQuiz = () => {
    localStorage.setItem("quiz_recent_selection", JSON.stringify({ category: selectedCategory, count: questionCount, playedAt: new Date().toISOString() }));
    setLocation(`/quiz?category=${selectedCategory}&count=${questionCount}`);
  };

  return (
    <main className="home-shell hub-page quiz-page">
      <HubBackdrop />
      <div className="home-container">
        <HubNav />
        <section className="quiz-hero"><span className="hub-kicker">QUICK CHALLENGE</span><h1>어떤 퀴즈에 도전할까요?</h1><p>카테고리와 문제 수를 고르면 바로 시작할 수 있어요.</p></section>
        <div className="quiz-layout">
          <section className="quiz-category-panel">
            <div className="quiz-panel-title"><div><span className="hub-kicker">01 · CATEGORY</span><h2>카테고리 선택</h2></div><span>{categories.length}개 퀴즈</span></div>
            <div className="quiz-category-grid">
              {categories.map(category => {
                const Icon = category.icon;
                return <button key={category.id} className={`quiz-category quiz-${category.tone} ${selectedCategory === category.id ? "is-selected" : ""}`} onClick={() => setSelectedCategory(category.id)} data-testid={`category-${category.id}`}><span className="quiz-category-icon"><Icon /></span><i>{selectedCategory === category.id ? "선택됨" : "선택"}</i><h3>{category.name}</h3><p>{category.desc}</p></button>;
              })}
            </div>
            <div className="quiz-tip"><Clock3 /><div><b>모든 퀴즈는 문제당 5초</b><span>빠르게 떠올리고 정답을 맞혀보세요.</span></div></div>
          </section>

          <aside className="quiz-settings">
            <span className="hub-kicker">02 · SETTINGS</span><h2>퀴즈 설정</h2>
            <div className="quiz-selected"><span className={`quiz-selected-icon quiz-${selected.tone}`}><selected.icon /></span><div><small>선택된 카테고리</small><b>{selected.name}</b></div></div>
            <div className="quiz-count"><label>문제 수 선택</label><div>{[5, 10, 20].map(count => <button key={count} className={questionCount === count ? "is-active" : ""} onClick={() => setQuestionCount(count)}>{count}문제</button>)}</div></div>
            <div className="quiz-summary"><span><Clock3 /> 예상 시간</span><strong>약 {Math.max(1, Math.ceil(questionCount * 5 / 60))}분</strong></div>
            <button className="quiz-start" onClick={startQuiz} data-testid="button-start-quiz">퀴즈 시작하기 <ArrowRight /></button>
            <p className="quiz-settings-note">시작하면 문제가 바로 표시됩니다.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
