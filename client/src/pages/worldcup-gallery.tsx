import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";
import { ArrowRight, Home, Play, Plus, Sparkles, Trophy } from "lucide-react";
import {
  featuredWorldCups,
  getMyWorldCups,
  selectWorldCup,
  WorldCupLibraryEntry,
} from "@/lib/worldcup-library";

const cardEmoji = ["🍽️", "✈️", "🍿", "✨", "🏆", "🎯"];

export default function WorldCupGalleryPage() {
  const [, setLocation] = useLocation();
  const [mine, setMine] = useState<WorldCupLibraryEntry[]>([]);

  useSEO({
    title: "취향 월드컵 - 인기 월드컵 플레이",
    description: "다른 사람들이 만든 인기 취향 월드컵을 골라 바로 플레이하세요",
    keywords: "취향월드컵, 이상형월드컵, 인기월드컵",
  });

  useEffect(() => setMine(getMyWorldCups()), []);

  const play = (entry: WorldCupLibraryEntry) => {
    selectWorldCup(entry);
    setLocation("/bracket/worldcup/play");
  };

  const renderCards = (entries: WorldCupLibraryEntry[], startIndex = 0) => (
    <div className="grid sm:grid-cols-2 gap-5">
      {entries.map((entry, index) => (
        <article
          key={entry.id}
          onClick={() => play(entry)}
          className="bg-white rounded-3xl p-6 border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/30 group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl">
              {cardEmoji[(startIndex + index) % cardEmoji.length]}
            </div>
            <span className="text-xs text-gray-500 border rounded-full px-3 py-1">{entry.round}강</span>
          </div>
          <h3 className="text-2xl font-bold mt-5">{entry.title}</h3>
          <p className="text-gray-500 mt-2">{entry.creator} 제작 · {entry.plays.toLocaleString()}회 플레이</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {entry.items.slice(0, 4).map(item => <span key={item.id} className="text-xs bg-gray-50 rounded-full px-3 py-1.5">{item.name}</span>)}
            {entry.items.length > 4 && <span className="text-xs text-gray-500 px-1 py-1.5">+{entry.items.length - 4}</span>}
          </div>
          <div className="flex items-center mt-6 text-sm font-semibold text-blue-500 group-hover:gap-2 transition-all">
            <Play className="w-4 h-4 mr-2" /> 바로 시작 <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/bracket")} className="bg-white/20 text-white border-white/30">
          <Home className="w-4 h-4 mr-2" /> 뒤로가기
        </Button>

        <header className="py-14 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-sm border border-white/15 bg-white/10 rounded-full px-4 py-2 text-gray-300">
            <Sparkles className="w-4 h-4" /> 지금 인기 있는 선택
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mt-6 tracking-tight">오늘은 무엇을<br />골라볼까요?</h1>
          <p className="text-lg md:text-xl text-gray-400 mt-5">다른 사람들이 만든 월드컵을 골라 바로 시작하세요.</p>
        </header>

        <section>
          <div className="flex items-center gap-3 mb-6"><Trophy className="w-6 h-6" /><h2 className="text-2xl font-bold">인기 월드컵</h2></div>
          {renderCards(featuredWorldCups)}
        </section>

        {mine.length > 0 && <section className="mt-14">
          <h2 className="text-2xl font-bold mb-6">내가 만든 월드컵</h2>
          {renderCards(mine, featuredWorldCups.length)}
        </section>}

        <section className="mt-16 bg-white rounded-3xl border p-8 md:p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center"><Plus className="w-7 h-7" /></div>
          <h2 className="text-3xl font-bold mt-5">원하는 월드컵이 없습니까?</h2>
          <p className="text-gray-400 mt-3">직접 항목을 추가하고 나만의 취향 월드컵을 만들어보세요.</p>
          <Button onClick={() => setLocation("/bracket/worldcup/create")} className="mt-7 px-7 h-12 rounded-full">
            월드컵 만들기 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </section>

        <Footer />
      </div>
    </div>
  );
}
