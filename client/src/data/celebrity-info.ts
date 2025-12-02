// 연예인 해설 정보 (대표작, 데뷔년도, 활동 정보)
export const celebrityInfo: Record<string, {
  debut?: string;
  works?: string[];
  info?: string;
}> = {
  "아이유": {
    debut: "2008년",
    works: ["좋은날", "팔레트", "라일락", "드라마 호텔 델루나"],
    info: "대한민국을 대표하는 가수이자 배우. 국민 여동생이라는 별명으로 불리며 음원차트를 석권하는 히트곡을 다수 보유하고 있습니다."
  },
  "뷔": {
    debut: "2013년",
    works: ["BTS 멤버", "Singularity", "Sweet Night", "드라마 화랑"],
    info: "BTS의 멤버로 독보적인 비주얼과 깊은 음색으로 유명합니다. 본명은 김태형입니다."
  },
  "공유": {
    debut: "2001년",
    works: ["도깨비", "부산행", "82년생 김지영"],
    info: "본명은 공지철입니다. 영화와 드라마를 아우르는 대한민국 최고의 배우 중 한 명입니다."
  },
  "김우빈": {
    debut: "2009년",
    works: ["상속자들", "학교 2013", "우리들의 블루스"],
    info: "본명은 김현중입니다. 모델 출신 배우로 훤칠한 키와 카리스마 넘치는 연기로 사랑받고 있습니다."
  },
  "박서준": {
    debut: "2011년",
    works: ["이태원 클라쓰", "김비서가 왜 그럴까", "기생충"],
    info: "본명은 박용규입니다. 로맨틱 코미디부터 액션까지 다양한 장르를 소화하는 배우입니다."
  },
  "로제": {
    debut: "2016년",
    works: ["BLACKPINK 멤버", "On The Ground", "GONE", "APT."],
    info: "BLACKPINK의 메인보컬. 본명은 박채영(Roseanne Park)이며 뉴질랜드 출신입니다."
  },
  "리사": {
    debut: "2016년",
    works: ["BLACKPINK 멤버", "LALISA", "MONEY"],
    info: "BLACKPINK의 메인댄서. 본명은 라리사 마노반이며 태국 출신입니다."
  },
  "슈가": {
    debut: "2013년",
    works: ["BTS 멤버", "Daechwita", "Seesaw", "AgustD"],
    info: "BTS의 리드래퍼. 본명은 민윤기이며 프로듀싱 능력도 뛰어납니다."
  },
  "유재석": {
    debut: "1991년",
    works: ["무한도전", "런닝맨", "놀면 뭐하니"],
    info: "대한민국 국민 MC. 30년 넘게 예능계를 이끌어온 레전드 MC입니다."
  },
  "강호동": {
    debut: "1993년",
    works: ["강심장", "신서유기", "아는형님"],
    info: "전 씨름선수 출신 예능인. 파워풀한 진행으로 유명합니다."
  }
};

// 기본 해설 (정보가 없는 경우)
export function getDefaultExplanation(name: string, category: string): string {
  const categoryTexts: Record<string, string> = {
    "female_singer": "여자 가수",
    "male_singer": "남자 가수",
    "female_actress": "여자 배우",
    "male_actor": "남자 배우",
    "entertainer": "방송인"
  };
  
  return `${name}은(는) 대한민국의 인기 ${categoryTexts[category] || "연예인"}입니다.`;
}
