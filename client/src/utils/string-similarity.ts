/**
 * 레벤슈타인 거리 계산 (두 문자열 간의 편집 거리)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // 초기화
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // DP로 거리 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 삭제
        matrix[i][j - 1] + 1,      // 삽입
        matrix[i - 1][j - 1] + cost // 대체
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 문자열 유사도 계산 (0.0 ~ 1.0)
 * 1.0 = 완전히 같음, 0.0 = 완전히 다름
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * 정규화된 문자열 (공백 제거, 소문자 변환)
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')           // 모든 공백 제거
    .replace(/[()（）]/g, '')      // 괄호 제거
    .trim();
}

/**
 * 정답 체크 (본명, 예명, 유사도 매칭 포함)
 * 
 * @param userAnswer - 사용자가 입력한 답
 * @param stageName - 연예인 예명
 * @param realName - 연예인 본명 (null 가능)
 * @param similarityThreshold - 유사도 임계값 (기본 0.8 = 80%)
 * @returns { isCorrect: boolean, matchType: string, similarity?: number }
 */
export function checkAnswer(
  userAnswer: string,
  stageName: string,
  realName: string | null,
  similarityThreshold: number = 0.8
): { isCorrect: boolean; matchType: string; similarity?: number } {
  const normalizedAnswer = normalizeString(userAnswer);
  const normalizedStageName = normalizeString(stageName);
  const normalizedRealName = realName ? normalizeString(realName) : null;
  
  // 1. 예명과 정확히 일치
  if (normalizedAnswer === normalizedStageName) {
    return { isCorrect: true, matchType: '예명 정확', similarity: 1.0 };
  }
  
  // 2. 본명과 정확히 일치
  if (normalizedRealName && normalizedAnswer === normalizedRealName) {
    return { isCorrect: true, matchType: '본명 정확', similarity: 1.0 };
  }
  
  // 3. 예명과 유사도 매칭 (오타 허용)
  const stageNameSimilarity = calculateSimilarity(normalizedAnswer, normalizedStageName);
  if (stageNameSimilarity >= similarityThreshold) {
    return { 
      isCorrect: true, 
      matchType: '예명 유사', 
      similarity: stageNameSimilarity 
    };
  }
  
  // 4. 본명과 유사도 매칭 (오타 허용)
  if (normalizedRealName) {
    const realNameSimilarity = calculateSimilarity(normalizedAnswer, normalizedRealName);
    if (realNameSimilarity >= similarityThreshold) {
      return { 
        isCorrect: true, 
        matchType: '본명 유사', 
        similarity: realNameSimilarity 
      };
    }
  }
  
  // 5. 부분 일치 체크 (3글자 이상)
  if (normalizedAnswer.length >= 3) {
    if (normalizedStageName.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedStageName)) {
      return { isCorrect: true, matchType: '예명 부분일치', similarity: 0.9 };
    }
    
    if (normalizedRealName && (normalizedRealName.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedRealName))) {
      return { isCorrect: true, matchType: '본명 부분일치', similarity: 0.9 };
    }
  }
  
  // 오답
  const maxSimilarity = normalizedRealName 
    ? Math.max(stageNameSimilarity, calculateSimilarity(normalizedAnswer, normalizedRealName))
    : stageNameSimilarity;
  
  return { 
    isCorrect: false, 
    matchType: '오답', 
    similarity: maxSimilarity 
  };
}
