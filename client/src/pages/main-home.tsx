import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useSEO, getHomeSEO } from "@/hooks/use-seo";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
// Images temporarily disabled for deployment
// import boardGameCollection from "@assets/generated_images/Colorful_board_game_collection_b62010fc.png";
// import boardGamePieces from "@assets/generated_images/Board_game_pieces_variety_5429783a.png";
// import quizShowGame from "@assets/generated_images/Quiz_show_board_game_227373d9.png";

export default function MainHomePage() {
  const [, setLocation] = useLocation();

  // SEO 메타데이터 설정
  useSEO(getHomeSEO());

  const services = [
    {
      id: "bracket",
      title: "대진표 작성",
      emoji: "📊",
      description: "토너먼트 대진표를 쉽게 작성하고 관리하세요",
      available: true,
      link: "/bracket"
    },
    {
      id: "quiz",
      title: "예능 퀴즈",
      emoji: "🎮",
      description: "다양한 퀴즈로 재미있게 즐기세요",
      available: true,
      link: "/sitemap"
    },
    {
      id: "coming1",
      title: "Coming Soon",
      emoji: "🎯",
      description: "곧 새로운 서비스가 출시됩니다",
      available: false
    },
    {
      id: "coming2",
      title: "Coming Soon",
      emoji: "🏆",
      description: "기대해주세요!",
      available: false
    }
  ];

  const handleServiceClick = (service: typeof services[0]) => {
    if (service.available && service.link) {
      setLocation(service.link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-4 py-12 relative overflow-hidden">
      {/* 배경 장식 요소들 - 임시로 CSS로 대체 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-48 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg transform rotate-12"></div>
        <div className="absolute top-20 right-10 w-40 h-30 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg transform -rotate-6"></div>
        <div className="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-r from-pink-400 to-red-500 rounded-full transform rotate-45"></div>
        <div className="absolute bottom-10 right-20 w-44 h-28 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg transform -rotate-12"></div>
      </div>
      
      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-8">
          <h1 className="text-7xl font-bold text-white mb-6">
            🎲 Welcome!
          </h1>
          <p className="text-2xl text-white/90 mb-4">
            재미있는 게임과 퀴즈로 즐거운 시간을 보내세요
          </p>
          <p className="text-lg text-white/70">
            친구들과 함께 경쟁하고, 실력을 뽐내보세요!
          </p>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className={`bg-white rounded-3xl p-10 shadow-xl transition-all duration-300 min-h-[320px] flex flex-col ${
                service.available
                  ? 'hover:scale-105 hover:shadow-2xl cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
              data-testid={`service-${service.id}`}
            >
              <div className="flex-1">
                <div className="text-8xl mb-6 text-center">{service.emoji}</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                  {service.title}
                </h3>
                <p className="text-lg text-gray-600 text-center leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>
              
              {service.available ? (
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
              💡 더 많은 서비스가 곧 추가될 예정입니다
            </p>
            <p className="text-white/70 text-sm">
              지금 바로 예능 퀴즈를 시작해보세요!
            </p>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
