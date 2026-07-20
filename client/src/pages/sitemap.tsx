import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSEO } from "@/hooks/use-seo";
import { AdSenseDisplay } from "@/components/AdSense";
import { Footer } from "@/components/Footer";
import { Home } from "lucide-react";
// Images temporarily disabled for deployment
// import boardGameCollection from "@assets/generated_images/Colorful_board_game_collection_b62010fc.png";
// import boardGamePieces from "@assets/generated_images/Board_game_pieces_variety_5429783a.png";
// import quizShowGame from "@assets/generated_images/Quiz_show_board_game_227373d9.png";

export default function SitemapPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<string>("10");

  // SEO 메타데이터 설정
  useSEO({
    title: "사이트맵 - 예능 퀴즈",
    description: "예능 퀴즈의 모든 카테고리를 한눈에 확인하고 선택하세요.",
    keywords: "퀴즈, 사이트맵, 카테고리"
  });

  const categories = [
    { id: "person", name: "인물퀴즈", emoji: "👑", desc: "한국 연예인을 맞혀보세요!" },
    { id: "capital", name: "수도퀴즈", emoji: "🏛️", desc: "세계 각국의 수도를 맞혀보세요!" },
    { id: "landmark", name: "랜드마크퀴즈", emoji: "🗼", desc: "유명한 랜드마크를 맞혀보세요!" },
    { id: "idiom", name: "사자성어", emoji: "📜", desc: "사자성어의 뜻을 맞혀보세요!" },
    { id: "proverb", name: "속담", emoji: "💭", desc: "속담의 빈칸을 채워보세요!" }
  ];

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const startQuiz = () => {
    if (selectedCategory) {
      setLocation(`/quiz?category=${selectedCategory}&count=${questionCount}`);
    }
  };

  if (selectedCategory) {
    // 게임 시작 설정 화면 - 광고 없음 (AdSense 정책: 행동 목적 화면)
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-start justify-center p-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-8xl mb-6">{selectedCategoryData?.emoji}</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {selectedCategoryData?.name}
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              {selectedCategoryData?.desc}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex justify-between items-center">
                  <span>문제 수:</span>
                  <Select value={questionCount} onValueChange={setQuestionCount} data-testid="select-question-count">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}문제</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <span>제한 시간:</span>
                  <span className="font-semibold">문제당 5초</span>
                </div>
                <div className="flex justify-between">
                  <span>난이도:</span>
                  <span className="font-semibold">쉬움 ~ 어려움</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startQuiz} 
                className="w-full py-4 text-lg font-semibold"
                data-testid="button-start-quiz"
              >
                🎯 퀴즈 시작하기
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCategory(null)} 
                className="w-full py-3"
                data-testid="button-back"
              >
                다른 카테고리 선택
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-4 py-8 relative overflow-hidden">
      {/* 배경 장식 요소들 - 임시로 CSS로 대체 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-48 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg transform rotate-12"></div>
        <div className="absolute top-20 right-10 w-40 h-30 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg transform -rotate-6"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-r from-pink-400 to-red-500 rounded-full transform rotate-45"></div>
        <div className="absolute bottom-10 right-20 w-44 h-28 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg transform -rotate-12"></div>
      </div>
      
      <div className="max-w-6xl w-full mx-auto relative z-10">
        <Button
          variant="outline"
          onClick={() => setLocation("/")}
          className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white"
        >
          <Home className="w-4 h-4 mr-2" /> 홈으로
        </Button>

        <div className="text-center mb-8 mt-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            🗺️ 사이트맵
          </h1>
          <p className="text-xl text-white/80">
            다양한 분야의 퀴즈로 지식을 테스트해보세요!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl p-8 shadow-2xl hover:scale-105 transition-transform cursor-pointer hover:shadow-3xl"
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`category-${category.id}`}
            >
              <div className="text-center">
                <div className="text-7xl mb-6">{category.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {category.desc}
                </p>
                <Button 
                  className="w-full py-3 text-lg font-medium"
                  data-testid={`button-select-${category.id}`}
                >
                  선택하기
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 mb-8">
          <div className="text-white/60 text-sm mb-6">
            💡 각 카테고리마다 다양한 난이도의 문제들이 준비되어 있습니다
          </div>
          
          {/* AdSense 디스플레이 광고 */}
          <div className="max-w-3xl mx-auto bg-white/5 rounded-lg p-3 backdrop-blur-sm">
            <AdSenseDisplay 
              adSlot="1234567890"
              adFormat="auto"
              fullWidthResponsive={true}
            />
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
