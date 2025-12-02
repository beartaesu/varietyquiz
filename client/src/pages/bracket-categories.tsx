import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import boardGameCollection from "@assets/generated_images/Colorful_board_game_collection_b62010fc.png";
import boardGamePieces from "@assets/generated_images/Board_game_pieces_variety_5429783a.png";
import quizShowGame from "@assets/generated_images/Quiz_show_board_game_227373d9.png";

export default function BracketCategoriesPage() {
  const [, setLocation] = useLocation();

  useSEO({
    title: "대진표 작성 - 예능 퀴즈",
    description: "토너먼트 대진표를 쉽게 작성하고 관리하세요",
    keywords: "대진표, 토너먼트, 배드민턴"
  });

  const categories = [
    {
      id: "badminton",
      title: "배드민턴",
      emoji: "🏸",
      description: "배드민턴 팀을 공정하게 매칭하세요",
      available: true,
      link: "/bracket/badminton"
    },
    {
      id: "coming1",
      title: "준비중",
      emoji: "🎯",
      description: "곧 새로운 서비스가 출시됩니다",
      available: false
    },
    {
      id: "coming2",
      title: "준비중",
      emoji: "🏆",
      description: "기대해주세요!",
      available: false
    }
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (category.available && category.link) {
      setLocation(category.link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-4 py-12 relative overflow-hidden">
      {/* 배경 보드게임 이미지들 */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src={boardGameCollection} 
          alt="보드게임 배경" 
          className="absolute top-10 left-10 w-48 h-32 object-cover rounded-lg transform rotate-12"
        />
        <img 
          src={boardGamePieces} 
          alt="게임 조각들" 
          className="absolute top-20 right-10 w-40 h-30 object-cover rounded-lg transform -rotate-6"
        />
        <img 
          src={quizShowGame} 
          alt="퀴즈 게임" 
          className="absolute bottom-20 left-20 w-36 h-36 object-cover rounded-full transform rotate-45"
        />
        <img 
          src={boardGameCollection} 
          alt="보드게임" 
          className="absolute bottom-10 right-20 w-44 h-28 object-cover rounded-lg transform -rotate-12"
        />
      </div>
      
      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
          >
            ← 홈으로
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-6xl font-bold text-white mb-6">
            📊 대진표 작성
          </h1>
          <p className="text-2xl text-white/90 mb-4">
            토너먼트 대진표를 쉽게 작성하고 관리하세요
          </p>
          <p className="text-lg text-white/70">
            공정하고 균형잡힌 팀 매칭을 자동으로!
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`bg-white rounded-3xl p-10 shadow-xl transition-all duration-300 min-h-[320px] flex flex-col ${
                category.available
                  ? 'hover:scale-105 hover:shadow-2xl cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              data-testid={`bracket-category-${category.id}`}
            >
              <div className="flex-1">
                <div className="text-8xl mb-6 text-center">{category.emoji}</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                  {category.title}
                </h3>
                <p className="text-lg text-gray-600 text-center leading-relaxed mb-6">
                  {category.description}
                </p>
              </div>
              
              {category.available ? (
                <div className="flex items-center justify-center text-primary font-semibold group">
                  <span className="mr-2">시작하기</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 font-medium">
                  <span>준비중...</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto">
            <p className="text-white/90 text-lg mb-4">
              💡 더 많은 종목의 대진표가 곧 추가될 예정입니다
            </p>
            <p className="text-white/70 text-sm">
              지금 바로 배드민턴 팀 매칭을 시작해보세요!
            </p>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
