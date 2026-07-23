import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSEO, getCategorySEO } from "@/hooks/use-seo";
import { checkAnswer as checkAnswerSimilarity } from "@/utils/string-similarity";
import { AdSenseSidebar } from "@/components/AdSense";
import { celebrityInfo, getDefaultExplanation } from "@/data/celebrity-info";
import { Footer } from "@/components/Footer";
import { Home } from "lucide-react";

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  realName?: string | null;
  imageUrl?: string;
  difficulty: number;
  celebCategory?: string;
}

export default function QuizGamePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category, setCategory] = useState<string>("person");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  // URL에서 카테고리와 문제수 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('category') || 'person';
    const count = parseInt(urlParams.get('count') || '10');
    setCategory(cat);
    loadQuestions(cat, count);
  }, []);

  // SEO 메타데이터 설정 (카테고리별로 동적 업데이트)
  useSEO(getCategorySEO(category));

  // 퀴즈 데이터 로드
  const loadQuestions = async (cat: string, questionCount: number = 10) => {
    try {
      setLoading(true);
      console.log('🚀 퀴즈 데이터 로드 중... 카테고리:', cat);
      
      let selectedQuestions: QuizQuestion[] = [];
      
      if (cat === 'person') {
        // 인물퀴즈 = 서버의 연예인 데이터 사용
        const response = await fetch(`/api/celebrities/random/${questionCount}`);
        if (!response.ok) throw new Error(`연예인 API 오류: ${response.status}`);
        const selectedCelebrities = await response.json();

        if (!Array.isArray(selectedCelebrities) || selectedCelebrities.length === 0) {
          throw new Error('연예인 데이터를 찾을 수 없습니다');
        }

        selectedQuestions = selectedCelebrities.map((celeb: any, index: number) => ({
          id: String(celeb.id || `${celeb.name}-${index}`),
          category: 'person',
          question: '이 연예인은 누구일까요?',
          answer: celeb.name,
          realName: celeb.realName || null,
          imageUrl: celeb.imageUrl || celeb.image,
          difficulty: 1,
          celebCategory: celeb.category || 'entertainer'
        }));

        console.log(`✅ 연예인 API 데이터 로드 성공: ${selectedQuestions.length}명`);
        console.log(`🎯 선택된 연예인들:`, selectedQuestions.map(q => q.answer).join(', '));
      } else {
        // 다른 카테고리는 목 데이터 사용
        const mockQuestions = generateMockQuestions(cat);
        selectedQuestions = mockQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, questionCount);
        
        console.log(`✅ 목 데이터 로드 성공: ${selectedQuestions.length}문제`);
      }
      
      setQuestions(selectedQuestions);
      setCurrentIndex(0);
      setScore(0);
      setTimeLeft(5);
      setGameOver(false);
      setShowResult(false);
      setLastCorrect(null);
    } catch (error) {
      console.error('❌ 퀴즈 데이터 로드 실패:', error);
      toast({
        title: "오류",
        description: "퀴즈 데이터를 불러올 수 없습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 목 데이터 생성
  const generateMockQuestions = (cat: string): QuizQuestion[] => {
    const questionSets: Record<string, QuizQuestion[]> = {
      person: [
        { id: "1", category: "person", question: "대한민국의 초대 대통령은?", answer: "이승만", difficulty: 1 },
        { id: "2", category: "person", question: "조선의 4대 왕으로 한글을 창제한 인물은?", answer: "세종대왕", difficulty: 1 },
        { id: "3", category: "person", question: "임진왜란 때 활약한 조선의 명장은?", answer: "이순신", difficulty: 1 },
        { id: "4", category: "person", question: "고구려의 전성기를 이끈 왕은?", answer: "광개토대왕", difficulty: 2 },
        { id: "5", category: "person", question: "조선 후기 실학자로 '북학의'를 저술한 인물은?", answer: "박지원", difficulty: 3 },
      ],
      capital: [
        { id: "1", category: "capital", question: "일본의 수도는?", answer: "도쿄", difficulty: 1 },
        { id: "2", category: "capital", question: "중국의 수도는?", answer: "베이징", difficulty: 1 },
        { id: "3", category: "capital", question: "미국의 수도는?", answer: "워싱턴", difficulty: 1 },
        { id: "4", category: "capital", question: "캐나다의 수도는?", answer: "오타와", difficulty: 3 },
        { id: "5", category: "capital", question: "호주의 수도는?", answer: "캔버라", difficulty: 3 },
      ],
      landmark: [
        { id: "1", category: "landmark", question: "프랑스 파리에 있는 유명한 탑은?", answer: "에펠탑", difficulty: 1 },
        { id: "2", category: "landmark", question: "중국에 있는 긴 성벽은?", answer: "만리장성", difficulty: 1 },
        { id: "3", category: "landmark", question: "인도에 있는 흰색 대리석 무덤은?", answer: "타지마할", difficulty: 2 },
        { id: "4", category: "landmark", question: "페루에 있는 잉카 유적지는?", answer: "마추픽추", difficulty: 2 },
        { id: "5", category: "landmark", question: "그리스 아테네에 있는 고대 신전은?", answer: "파르테논신전", difficulty: 3 },
      ],
      idiom: [
        { id: "1", category: "idiom", question: "천 리 길도 한 걸음부터라는 뜻의 사자성어는?", answer: "천리지행", difficulty: 2 },
        { id: "2", category: "idiom", question: "백 번 듣는 것보다 한 번 보는 것이 낫다는 뜻의 사자성어는?", answer: "백문불여일견", difficulty: 2 },
        { id: "3", category: "idiom", question: "고생 끝에 낙이 온다는 뜻의 사자성어는?", answer: "고진감래", difficulty: 2 },
        { id: "4", category: "idiom", question: "물방울이 바위를 뚫는다는 뜻의 사자성어는?", answer: "수적천석", difficulty: 3 },
        { id: "5", category: "idiom", question: "급할수록 돌아가라는 뜻의 사자성어는?", answer: "급행완보", difficulty: 3 },
      ],
      proverb: [
        { id: "1", category: "proverb", question: "가는 말이 고와야 오는 말이 ___ 다", answer: "곱다", difficulty: 1 },
        { id: "2", category: "proverb", question: "고래 싸움에 ___ 등 터진다", answer: "새우", difficulty: 1 },
        { id: "3", category: "proverb", question: "우물 안 ___", answer: "개구리", difficulty: 1 },
        { id: "4", category: "proverb", question: "원숭이도 나무에서 ___", answer: "떨어진다", difficulty: 1 },
        { id: "5", category: "proverb", question: "닭 쫓던 개 ___ 쳐다본다", answer: "지붕", difficulty: 2 },
      ]
    };

    return questionSets[cat] || questionSets.person;
  };

  // 타이머
  useEffect(() => {
    if (loading || showResult || gameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          checkAnswer('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showResult, gameOver, loading, currentIndex]);

  // 답변 체크 (본명 + 예명 + 유사도 매칭)
  const checkAnswer = (userAnswer: string) => {
    if (showResult || gameOver || !questions[currentIndex]) return;

    const currentQuestion = questions[currentIndex];
    
    // 인물퀴즈인 경우 유사도 매칭 적용
    if (category === 'person') {
      const result = checkAnswerSimilarity(
        userAnswer,
        currentQuestion.answer,
        currentQuestion.realName || null,
        0.75  // 75% 유사도 임계값 (오타 2-3개까지 허용)
      );
      
      console.log('📝 답변:', userAnswer, '| 예명:', currentQuestion.answer, '| 본명:', currentQuestion.realName || '없음');
      console.log('🎯 결과:', result.matchType, '| 유사도:', (result.similarity! * 100).toFixed(0) + '%');

      if (result.isCorrect) {
        setScore(prev => prev + 1);
        
        // 매칭 타입에 따라 피드백 메시지
        if (result.matchType.includes('본명')) {
          toast({
            title: "정답! 🎉",
            description: `본명으로 맞추셨네요! (예명: ${currentQuestion.answer})`,
          });
        } else if (result.matchType.includes('유사')) {
          toast({
            title: "정답! 👍",
            description: `오타가 있지만 정답 인정! (${result.matchType})`,
          });
        }
      }

      setLastCorrect(result.isCorrect);
    } else {
      // 다른 카테고리는 정확한 매칭만
      const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
      console.log('📝 답변:', userAnswer, '정답:', currentQuestion.answer, '결과:', isCorrect);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      
      setLastCorrect(isCorrect);
    }

    setShowResult(true);
    setAnswer('');

    // 2초 후 다음 문제
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        setGameOver(true);
      } else {
        setCurrentIndex(nextIndex);
        setTimeLeft(5);
        setShowResult(false);
        setLastCorrect(null);
      }
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || showResult) return;
    checkAnswer(answer);
  };

  const restartGame = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const count = parseInt(urlParams.get('count') || '10');
    loadQuestions(category, count);
  };

  const goHome = () => {
    setLocation('/');
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      person: "인물퀴즈",
      capital: "수도퀴즈", 
      landmark: "랜드마크퀴즈",
      idiom: "사자성어",
      proverb: "속담"
    };
    return names[cat] || "퀴즈";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-white text-xl">퀴즈를 준비중입니다...</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">퀴즈를 준비할 수 없습니다</h2>
          <Button onClick={goHome} className="w-full">홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (gameOver) {
    const percentage = Math.round((score / questions.length) * 100);
    const getMessage = () => {
      if (percentage === 100) return "완벽합니다! 🏆";
      if (percentage >= 80) return "훌륭해요! 🌟";
      if (percentage >= 60) return "잘했어요! 👍";
      if (percentage >= 40) return "괜찮아요! 💪";
      return "다시 도전해보세요! 💫";
    };

    const getDetailedFeedback = () => {
      if (percentage === 100) {
        return "모든 문제를 맞히셨네요! 놀라운 집중력과 지식을 보여주셨습니다. 이 카테고리의 달인이시군요. 다른 카테고리에도 도전해서 전 분야 마스터가 되어보세요!";
      } else if (percentage >= 80) {
        return "대부분의 문제를 정확히 맞히셨습니다. 뛰어난 실력입니다! 틀린 문제를 복습하고 다시 도전하면 곧 만점에 도달할 수 있을 거예요. 조금만 더 집중하면 완벽해질 수 있습니다.";
      } else if (percentage >= 60) {
        return "절반 이상을 맞히셨네요! 기본기가 탄탄합니다. 틀린 문제들을 꼼꼼히 복습하고, 취약한 부분을 보완하면 더 높은 점수를 얻을 수 있습니다. 꾸준한 학습으로 실력을 키워보세요.";
      } else if (percentage >= 40) {
        return "좋은 시작입니다! 기초를 다지는 단계입니다. 틀린 문제들을 다시 한번 확인하고, 각 문제의 해설을 읽어보세요. 반복 학습을 통해 점차 익숙해지면 점수가 크게 향상될 것입니다.";
      } else {
        return "포기하지 마세요! 처음에는 누구나 어렵게 느껴집니다. 이번 결과를 바탕으로 부족한 부분을 파악하고, 하나씩 천천히 학습해 나가세요. 반복적으로 도전하다 보면 어느새 실력이 쌓여있을 겁니다. 화이팅!";
      }
    };

    const getLearningStrategy = () => {
      if (category === 'person') {
        return "K-연예인 퀴즈는 사진을 보고 빠르게 인물을 떠올리는 순발력이 중요합니다. 평소 드라마, 예능, 영화 등을 시청하며 연예인들의 얼굴과 이름을 익혀두세요. 특히 최근 인기 있는 작품의 출연진을 정리해두면 도움이 됩니다. 연예인의 대표작, 데뷔 시기, 소속사 등 추가 정보도 함께 기억하면 더욱 효과적입니다.";
      } else {
        return "퀴즈 실력 향상을 위해서는 꾸준한 학습과 반복이 핵심입니다. 매일 조금씩이라도 문제를 풀어보고, 틀린 문제는 반드시 복습하세요. 카테고리별 특성을 파악하고, 자주 나오는 유형을 정리하면 효율적으로 학습할 수 있습니다.";
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4 gap-6">
        <div className="bg-white rounded-2xl p-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">🎉 퀴즈 완료!</h2>
          <div className="text-6xl font-bold text-primary mb-4">
            {score}/{questions.length}
          </div>
          <p className="text-xl text-gray-600 mb-2">
            {getCategoryName(category)}
          </p>
          <p className="text-lg text-gray-500 mb-2">
            정답률: {percentage}%
          </p>
          <p className="text-2xl font-bold text-primary mb-6">
            {getMessage()}
          </p>
          
          {/* 상세 분석 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-gray-800 mb-3">📊 상세 분석</h3>
            <div className="space-y-2 text-sm text-gray-700 mb-3">
              <p>• 총 문제 수: {questions.length}개</p>
              <p>• 정답 문제: {score}개 ({percentage}%)</p>
              <p>• 오답 문제: {questions.length - score}개 ({100 - percentage}%)</p>
              <p>• 평균 응답 시간: 문제당 약 5초</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {getDetailedFeedback()}
            </p>
          </div>

          {/* 학습 전략 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-blue-800 mb-3">💡 학습 전략 가이드</h3>
            <p className="text-sm text-blue-700 leading-relaxed mb-3">
              {getLearningStrategy()}
            </p>
            <div className="text-sm text-blue-600 space-y-1">
              <p>✓ 매일 10분씩 꾸준히 연습하기</p>
              <p>✓ 틀린 문제 다시 풀어보기</p>
              <p>✓ 해설을 꼼꼼히 읽고 이해하기</p>
              <p>✓ 다양한 카테고리에 도전하기</p>
            </div>
          </div>

          {/* 추천 학습 */}
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-green-800 mb-2">🎯 다음 단계 추천</h3>
            <p className="text-sm text-green-700">
              {percentage >= 80 
                ? "현재 카테고리를 마스터하셨습니다! 이제 다른 카테고리에도 도전해보세요. 폭넓은 지식을 쌓으면 더욱 재미있습니다."
                : percentage >= 60
                ? "같은 카테고리를 한 번 더 풀어보세요. 반복 학습을 통해 80점 이상을 목표로 해보세요!"
                : "기초부터 차근차근 다시 시작해보세요. 각 문제의 해설을 읽으며 천천히 학습하면 실력이 향상됩니다."}
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={restartGame} className="w-full">
              다시 하기
            </Button>
            <Button variant="outline" onClick={goHome} className="w-full">
              홈으로
            </Button>
          </div>
        </div>

        {/* 사이드 광고 (데스크톱 - 결과 화면에만 표시) */}
        <div className="hidden lg:block w-64">
          <AdSenseSidebar 
            adSlot="9876543210"
            className="sticky top-4"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary p-4">
      {/* 플레이 화면에는 광고 표시하지 않음 (AdSense 정책 준수) */}
      <div className="max-w-2xl mx-auto">
        {/* 홈 버튼 */}
        <div className="flex justify-start mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goHome} 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            data-testid="button-home"
          >
            <Home className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </div>
        
        {/* 상단 정보 */}
        <div className="text-center text-white mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium">
              {currentIndex + 1} / {questions.length}
            </div>
            <div className="text-lg font-medium">
              {getCategoryName(category)}
            </div>
            <div className="text-lg font-medium">
              점수: {score}
            </div>
          </div>
          
          {/* 타이머 */}
          <div className="flex justify-center mb-6">
            <div className={`text-5xl font-bold ${timeLeft <= 2 ? 'text-red-300' : 'text-white'}`}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* 퀴즈 카드 */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {showResult ? (
              // 결과 화면 (해설 포함)
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {lastCorrect ? '✅' : '❌'}
                </div>
                <h3 className={`text-2xl font-bold mb-4 ${lastCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {lastCorrect ? '정답!' : '오답!'}
                </h3>
                <div className="text-xl text-gray-700 space-y-2 mb-4">
                  <p>
                    정답: <strong>{currentQuestion.answer}</strong>
                  </p>
                  {category === 'person' && currentQuestion.realName && currentQuestion.realName !== currentQuestion.answer && (
                    <p className="text-base text-gray-500">
                      본명: {currentQuestion.realName}
                    </p>
                  )}
                </div>

                {/* 연예인 해설 */}
                {category === 'person' && (() => {
                  const info = celebrityInfo[currentQuestion.answer];
                  if (info) {
                    return (
                      <div className="bg-blue-50 rounded-lg p-4 text-left space-y-2">
                        <h4 className="font-bold text-blue-900 text-sm">📝 상세 정보</h4>
                        {info.debut && (
                          <p className="text-sm text-blue-800">
                            <strong>데뷔:</strong> {info.debut}
                          </p>
                        )}
                        {info.works && info.works.length > 0 && (
                          <p className="text-sm text-blue-800">
                            <strong>대표작:</strong> {info.works.join(', ')}
                          </p>
                        )}
                        {info.info && (
                          <p className="text-sm text-blue-700 leading-relaxed">
                            {info.info}
                          </p>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        {getDefaultExplanation(currentQuestion.answer, currentQuestion.celebCategory || 'entertainer')}
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              // 문제 화면 
              <>
                <h2 className="text-2xl font-bold text-center mb-8">
                  {currentQuestion.question}
                </h2>

                {/* 연예인 이미지 (인물퀴즈인 경우) */}
                {category === 'person' && currentQuestion.imageUrl && (
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <img 
                        src={currentQuestion.imageUrl}
                        alt="연예인 사진" 
                        className="w-80 h-96 object-cover rounded-xl shadow-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='384' viewBox='0 0 320 384'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' font-size='24' fill='%23666'%3E🎭%3C/text%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' font-size='16' fill='%23999'%3E연예인 사진%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 답변 입력 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="답을 입력하세요"
                      className="flex-1 text-lg p-4"
                      autoFocus
                    />
                    <Button 
                      type="submit" 
                      disabled={!answer.trim()}
                      className="px-8 py-4 text-lg"
                    >
                      제출
                    </Button>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    {category === 'person' 
                      ? '예명 또는 본명을 입력하세요 (오타 허용, 5초 제한)' 
                      : '정확한 답을 입력해주세요 (5초 제한)'}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      
      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <Footer />
      </div>
      </div>
    </div>
  );
}
