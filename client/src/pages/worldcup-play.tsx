import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { Footer } from "@/components/Footer";
import { Home, RotateCcw, Trophy, Share2 } from "lucide-react";
import {
  WorldCupItem,
  WorldCupData,
  RankEntry,
  TournamentState,
  getRoundName,
  initializeRound,
  calculateRankings,
  handleSelection,
  deserializeWorldCupData,
} from "@/lib/worldcup-logic";

export default function WorldCupPlayPage() {
  const [, setLocation] = useLocation();
  const [worldCupData, setWorldCupData] = useState<WorldCupData | null>(null);
  const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);
  const [animating, setAnimating] = useState<"left" | "right" | null>(null);

  useSEO({
    title: worldCupData ? `${worldCupData.title} - 취향 월드컵` : "취향 월드컵",
    description: "취향 월드컵을 플레이하세요",
    keywords: "이상형월드컵, 취향월드컵"
  });

  useEffect(() => {
    const saved = localStorage.getItem("worldcup_current");
    if (!saved) {
      alert("월드컵 데이터가 없습니다. 먼저 월드컵을 만들어주세요.");
      setLocation("/bracket/worldcup");
      return;
    }

    const data = deserializeWorldCupData(saved);
    if (!data) {
      alert("월드컵 데이터를 불러올 수 없습니다. 다시 만들어주세요.");
      setLocation("/bracket/worldcup");
      return;
    }

    setWorldCupData(data);
    startTournament(data);
  }, []);

  const startTournament = (data: WorldCupData) => {
    const selected = initializeRound(data.items, data.round);

    const initialState: TournamentState = {
      currentRound: selected,
      nextRound: [],
      currentPair: [selected[0], selected[1]],
      matchIndex: 0,
      currentMatchInRound: 0,
      roundName: getRoundName(data.round),
      isFinished: false,
      winner: null,
      rankings: [],
      winCounts: {},
    };

    setTournamentState(initialState);
    setTotalMatches(data.round - 1);
  };

  const handleSelect = (selected: WorldCupItem, side: "left" | "right") => {
    if (animating || !tournamentState) return;

    setAnimating(side);

    setTimeout(() => {
      setAnimating(null);

      const newState = handleSelection(tournamentState, selected.id);
      setTournamentState(newState);
    }, 400);
  };

  const restart = () => {
    if (worldCupData) {
      startTournament(worldCupData);
    }
  };

  if (!worldCupData || !tournamentState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
        <p className="text-white text-xl">로딩 중...</p>
      </div>
    );
  }

  // 결과 화면
  if (tournamentState.isFinished && tournamentState.winner) {
    const { winner, rankings } = tournamentState;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🏆 {worldCupData.title}</h1>
            <p className="text-xl text-white/90">최종 결과</p>
          </div>

          {/* 우승자 */}
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-6 text-center">
            <div className="text-6xl mb-4">👑</div>
            {winner.imageUrl && (
              <img
                src={winner.imageUrl}
                alt={winner.name}
                className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 shadow-lg"
              />
            )}
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{winner.name}</h2>
            <p className="text-lg text-orange-500 font-semibold">🥇 우승!</p>
          </div>

          {/* 전체 순위 */}
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 전체 순위</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {rankings.map((entry, idx) => (
                <div
                  key={entry.item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    idx === 0 ? "bg-yellow-50 border border-yellow-200" :
                    idx === 1 ? "bg-gray-50 border border-gray-200" :
                    idx === 2 ? "bg-orange-50 border border-orange-200" :
                    "bg-white border border-gray-100"
                  }`}
                >
                  <span className="text-lg font-bold w-8 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${entry.rank}`}
                  </span>
                  {entry.item.imageUrl && (
                    <img
                      src={entry.item.imageUrl}
                      alt={entry.item.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  )}
                  <span className="flex-1 font-medium text-gray-800">{entry.item.name}</span>
                  <span className="text-sm text-gray-500">{entry.eliminatedRound}</span>
                  <span className="text-sm text-blue-500 font-medium">{entry.wins}승</span>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={restart}
              className="bg-white text-orange-500 hover:bg-orange-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시하기
            </Button>
            <Button
              onClick={() => setLocation("/bracket/worldcup")}
              className="bg-white text-pink-500 hover:bg-pink-50"
            >
              <Home className="w-4 h-4 mr-2" />
              새로 만들기
            </Button>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

  // 플레이 화면
  const { currentPair, currentRound, currentMatchInRound, matchIndex, roundName } = tournamentState;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">{worldCupData.title}</h1>
          <div className="flex items-center justify-center gap-4 text-white/80">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
              {roundName}
            </span>
            <span className="text-sm">
              {currentMatchInRound + 1} / {Math.floor(currentRound.length / 2)}
            </span>
          </div>
        </div>

        {/* VS Display */}
        {currentPair && (
          <div className="flex items-stretch gap-4 md:gap-8 justify-center">
            {/* Left */}
            <button
              onClick={() => handleSelect(currentPair[0], "left")}
              disabled={!!animating}
              className={`flex-1 max-w-[280px] md:max-w-[350px] bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                animating === "left" ? "scale-110 ring-4 ring-yellow-400" :
                animating === "right" ? "opacity-30 scale-95" : ""
              }`}
            >
              {currentPair[0].imageUrl ? (
                <div className="aspect-square">
                  <img
                    src={currentPair[0].imageUrl}
                    alt={currentPair[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                  <span className="text-6xl">🅰️</span>
                </div>
              )}
              <div className="p-4 text-center">
                <h3 className="text-xl font-bold text-gray-800 truncate">{currentPair[0].name}</h3>
              </div>
            </button>

            {/* VS */}
            <div className="flex items-center">
              <div className="bg-red-500 text-white font-black text-2xl w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
                VS
              </div>
            </div>

            {/* Right */}
            <button
              onClick={() => handleSelect(currentPair[1], "right")}
              disabled={!!animating}
              className={`flex-1 max-w-[280px] md:max-w-[350px] bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                animating === "right" ? "scale-110 ring-4 ring-yellow-400" :
                animating === "left" ? "opacity-30 scale-95" : ""
              }`}
            >
              {currentPair[1].imageUrl ? (
                <div className="aspect-square">
                  <img
                    src={currentPair[1].imageUrl}
                    alt={currentPair[1].name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-6xl">🅱️</span>
                </div>
              )}
              <div className="p-4 text-center">
                <h3 className="text-xl font-bold text-gray-800 truncate">{currentPair[1].name}</h3>
              </div>
            </button>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${((matchIndex + 1) / totalMatches) * 100}%` }}
            />
          </div>
          <p className="text-center text-white/70 text-sm mt-2">
            전체 진행률: {Math.round(((matchIndex + 1) / totalMatches) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
