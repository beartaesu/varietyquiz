import "server-only";

export interface RebuiltContentStats {
  contentId: string;
  voteCount: number;
  candidates: Array<{
    candidateId: string;
    selectionCount: number;
    matchupCount: number;
    championshipCount: number;
  }>;
}

/**
 * 원본 votes를 기준으로 파생 집계를 완전히 다시 만드는 계약입니다.
 * 구현은 P0-05에서 투표 트랜잭션과 함께 추가합니다.
 */
export interface ContentStatsRebuilder {
  rebuild(contentId: string): Promise<RebuiltContentStats>;
}
