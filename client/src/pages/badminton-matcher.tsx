import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSEO } from "@/hooks/use-seo";
import { Footer } from "@/components/Footer";
import { Trash2, Plus, Home, RotateCcw, Copy, Share2 } from "lucide-react";

type SkillLevel = "A" | "B" | "C" | "D" | "E" | "입문";

interface Player {
  id: number;
  name: string;
  gender: "male" | "female";
  skill: SkillLevel;
  isResting?: boolean; // 휴식 중 여부
}

interface Team {
  players: Player[];
  avgSkill: number;
}

interface Game {
  team1: Team;
  team2: Team;
}

interface BulkRow {
  id: number;
  name: string;
  gender: string;
  skill: string;
}

interface HistoryEntry {
  id: number;
  timestamp: string;
  games: Game[];
  playerCount: number;
  excludedPlayers?: Player[];
}

// 실력을 숫자로 변환 (계산용)
const skillToNumber = (skill: SkillLevel): number => {
  const map: Record<SkillLevel, number> = {
    "A": 5,
    "B": 4,
    "C": 3,
    "D": 2,
    "E": 1,
    "입문": 0
  };
  return map[skill];
};

// 플레이어 매칭 히스토리 추적
interface MatchHistory {
  [playerName: string]: Set<string>; // 각 플레이어가 함께 게임한 플레이어 이름들
}

// 매칭 빈도 추적 (개선: 중복 매칭 방지)
interface MatchFrequency {
  [key: string]: number; // "playerA-playerB" 형태의 키로 매칭 횟수 저장
}

export default function BadmintonMatcherPage() {
  const [, setLocation] = useLocation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [games, setGames] = useState<Game[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [skillMode, setSkillMode] = useState<"use" | "ignore">("use");
  const [balanceTeams, setBalanceTeams] = useState(true);
  const [avoidSoloRepeat, setAvoidSoloRepeat] = useState(true);
  const [gameType, setGameType] = useState<"mixed" | "separate" | "any">("mixed");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soloHistory, setSoloHistory] = useState<Set<string>>(new Set());
  const [matchHistory, setMatchHistory] = useState<MatchHistory>({});
  const [matchFrequency, setMatchFrequency] = useState<MatchFrequency>({}); // 매칭 빈도 추적
  const [lastExcludedPlayerIds, setLastExcludedPlayerIds] = useState<Set<number>>(new Set());
  const [secondLastExcludedPlayerIds, setSecondLastExcludedPlayerIds] = useState<Set<number>>(new Set());
  const [playerExclusionCount, setPlayerExclusionCount] = useState<Record<number, number>>({});
  const [courtCount, setCourtCount] = useState<number | null>(null);

  useSEO({
    title: "배드민턴 팀 매칭 - 대진표 작성",
    description: "공정하고 균형잡힌 배드민턴 팀을 자동으로 구성해드립니다",
    keywords: "배드민턴, 팀매칭, 대진표"
  });

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedPlayers = localStorage.getItem("badminton_players");
    const savedHistory = localStorage.getItem("badminton_history");
    const savedSoloHistory = localStorage.getItem("badminton_solo_history");
    const savedMatchHistory = localStorage.getItem("badminton_match_history");
    const savedMatchFrequency = localStorage.getItem("badminton_match_frequency");
    const savedExclusionCount = localStorage.getItem("badminton_exclusion_count");
    const savedCourtCount = localStorage.getItem("badminton_court_count");
    
    if (savedPlayers) {
      try {
        setPlayers(JSON.parse(savedPlayers));
      } catch (e) {
        console.error("Failed to load players", e);
      }
    }
    
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    if (savedSoloHistory) {
      try {
        setSoloHistory(new Set(JSON.parse(savedSoloHistory)));
      } catch (e) {
        console.error("Failed to load solo history", e);
      }
    }
    
    if (savedMatchHistory) {
      try {
        const parsed = JSON.parse(savedMatchHistory);
        const restored: MatchHistory = {};
        Object.keys(parsed).forEach(key => {
          restored[key] = new Set(parsed[key]);
        });
        setMatchHistory(restored);
      } catch (e) {
        console.error("Failed to load match history", e);
      }
    }
    
    if (savedMatchFrequency) {
      try {
        setMatchFrequency(JSON.parse(savedMatchFrequency));
      } catch (e) {
        console.error("Failed to load match frequency", e);
      }
    }
    
    if (savedExclusionCount) {
      try {
        setPlayerExclusionCount(JSON.parse(savedExclusionCount));
      } catch (e) {
        console.error("Failed to load exclusion count", e);
      }
    }
    
    if (savedCourtCount) {
      try {
        const count = JSON.parse(savedCourtCount);
        setCourtCount(count);
      } catch (e) {
        console.error("Failed to load court count", e);
      }
    }
  }, []);

  // 플레이어 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_players", JSON.stringify(players));
  }, [players]);

  // 히스토리 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_history", JSON.stringify(history));
  }, [history]);

  // 솔로 히스토리 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_solo_history", JSON.stringify(Array.from(soloHistory)));
  }, [soloHistory]);

  // 매칭 히스토리 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    const serializable: Record<string, string[]> = {};
    Object.keys(matchHistory).forEach(key => {
      serializable[key] = Array.from(matchHistory[key]);
    });
    localStorage.setItem("badminton_match_history", JSON.stringify(serializable));
  }, [matchHistory]);

  // 매칭 빈도 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_match_frequency", JSON.stringify(matchFrequency));
  }, [matchFrequency]);

  // 제외 횟수 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_exclusion_count", JSON.stringify(playerExclusionCount));
  }, [playerExclusionCount]);

  // 코트 수 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("badminton_court_count", JSON.stringify(courtCount));
  }, [courtCount]);

  const addBulkPlayers = () => {
    if (!bulkNames.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    // 쉼표나 공백으로 구분된 이름들을 파싱
    const names = bulkNames
      .split(/[,\s]+/) // 쉼표나 공백으로 분리
      .map(name => name.trim())
      .filter(name => name.length > 0); // 빈 문자열 제거

    if (names.length === 0) {
      alert("유효한 이름이 없습니다.");
      return;
    }

    const newPlayers: Player[] = [];
    const errors: string[] = [];
    const duplicates: string[] = [];

    names.forEach((name) => {
      // 이미 등록된 이름 체크
      if (players.some(player => player.name === name)) {
        duplicates.push(name);
        return;
      }

      // 리스트 내 중복 체크
      if (newPlayers.some(player => player.name === name)) {
        errors.push(`"${name}"이 입력 내에서 중복됩니다.`);
        return;
      }

      newPlayers.push({
        id: Date.now() + Math.random(),
        name,
        gender: "male", // 기본값
        skill: "입문" // 기본값
      });
    });

    if (duplicates.length > 0) {
      alert(`다음 이름은 이미 등록되어 있어 건너뛰었습니다:\n${duplicates.join(", ")}`);
    }

    if (errors.length > 0) {
      alert("다음 오류를 수정해주세요:\n\n" + errors.join("\n"));
      return;
    }

    if (newPlayers.length === 0) {
      alert("추가할 참가자가 없습니다.");
      return;
    }

    setPlayers([...players, ...newPlayers]);
    setBulkNames(""); // 입력 초기화
    alert(`${newPlayers.length}명의 참가자가 추가되었습니다.`);
  };

  const addPlayer = () => {
    if (!playerName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (players.some(p => p.name === playerName.trim())) {
      alert("이미 등록된 이름입니다.");
      return;
    }

    const newPlayer: Player = {
      id: Date.now(),
      name: playerName.trim(),
      gender: "male", // 기본값
      skill: "입문" // 기본값
    };

    setPlayers([...players, newPlayer]);
    setPlayerName("");
  };

  const updatePlayer = (id: number, field: "gender" | "skill", value: any) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const toggleResting = (id: number) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, isResting: !p.isResting } : p
    ));
  };

  const clearAll = () => {
    if (confirm("모든 참가자를 삭제하시겠습니까?")) {
      setPlayers([]);
      setGames([]);
      setShowResults(false);
      setPlayerExclusionCount({});
      setLastExcludedPlayerIds(new Set());
      setSecondLastExcludedPlayerIds(new Set());
    }
  };

  const clearGames = () => {
    if (confirm("게임 구성 결과를 초기화하시겠습니까? (참가자는 유지됩니다)")) {
      setGames([]);
      setShowResults(false);
      setPlayerExclusionCount({});
      setLastExcludedPlayerIds(new Set());
      setSecondLastExcludedPlayerIds(new Set());
    }
  };

  // 매칭 빈도 키 생성 (정렬하여 일관성 유지)
  const getMatchKey = (name1: string, name2: string): string => {
    return [name1, name2].sort().join("-");
  };

  // 두 플레이어의 매칭 빈도 가져오기
  const getMatchCount = (name1: string, name2: string): number => {
    return matchFrequency[getMatchKey(name1, name2)] || 0;
  };

  const generateTeams = () => {
    if (players.length < 4) {
      alert("최소 4명 이상의 참가자가 필요합니다.");
      return;
    }

    // 휴식 중이 아닌 플레이어만 필터링
    const activePlayers = players.filter(p => !p.isResting);
    
    if (activePlayers.length < 4) {
      alert("휴식 중이 아닌 참가자가 최소 4명 이상이어야 합니다.");
      return;
    }

    // 1. 게임 참여 가능한 총 인원 계산 (4의 배수로 맞춤)
    // 코트 수가 지정되어 있으면 코트 수 * 4로 제한
    let maxParticipants = Math.floor(activePlayers.length / 4) * 4;
    if (courtCount && courtCount > 0) {
      maxParticipants = Math.min(maxParticipants, courtCount * 4);
    }
    const excludeCount = activePlayers.length - maxParticipants;

    // 2. 미참여자 선택: 완전 공평한 방식 (0회 우선 → 1회 → 2회...)
    let excludedPlayers: Player[] = [];
    if (excludeCount > 0) {
      // 모든 플레이어를 미참여 횟수별로 그룹화
      const groupedByCount: { [count: number]: Player[] } = {};
      activePlayers.forEach(p => {
        const count = playerExclusionCount[p.id] || 0;
        if (!groupedByCount[count]) {
          groupedByCount[count] = [];
        }
        groupedByCount[count].push(p);
      });
      
      // 미참여 횟수를 오름차순으로 정렬
      const sortedCounts = Object.keys(groupedByCount).map(Number).sort((a, b) => a - b);
      
      // 최소 횟수부터 순차적으로 채워가기 (완전 랜덤)
      for (const count of sortedCounts) {
        if (excludedPlayers.length >= excludeCount) break;
        
        const candidates = groupedByCount[count];
        // 더 강력한 랜덤 셔플 (3번 섞기)
        let shuffled = [...candidates];
        for (let i = 0; i < 3; i++) {
          shuffled = shuffled.sort(() => Math.random() - 0.5);
        }
        
        const needed = excludeCount - excludedPlayers.length;
        
        // 필요한 만큼만 선택
        const selected = shuffled.slice(0, needed);
        excludedPlayers.push(...selected);
      }
      
      console.log(`🎯 휴식 배정: ${excludedPlayers.map(p => `${p.name}(${playerExclusionCount[p.id] || 0}회)`).join(', ')}`);
    }

    // 6. 게임 참여 플레이어
    const excludedIds = new Set(excludedPlayers.map(p => p.id));
    let availablePlayers = activePlayers.filter(p => !excludedIds.has(p.id));

    // 7. 참여 플레이어를 강력하게 랜덤 섞기 (5번 섞기)
    for (let i = 0; i < 5; i++) {
      availablePlayers = availablePlayers.sort(() => Math.random() - 0.5);
    }
    
    console.log(`🎮 게임 참여: ${availablePlayers.map(p => p.name).join(', ')}`);

    let teams: Team[] = [];

    // 경기 유형에 따른 필터링
    if (gameType === "separate") {
      const males = availablePlayers.filter(p => p.gender === "male");
      const females = availablePlayers.filter(p => p.gender === "female");
      
      // 각 성별로 팀 구성
      const maleTeams = createTeamsFromPlayers(males);
      const femaleTeams = createTeamsFromPlayers(females);
      
      teams = [...maleTeams, ...femaleTeams];
    } else if (gameType === "mixed") {
      // 혼복: 각 팀에 남녀가 하나씩
      const males = availablePlayers.filter(p => p.gender === "male");
      const females = availablePlayers.filter(p => p.gender === "female");
      
      teams = createMixedTeams(males, females);
    } else {
      // 성별 무관
      teams = createTeamsFromPlayers(availablePlayers);
    }

    // 팀들을 2개씩 묶어서 게임 생성
    const newGames: Game[] = [];
    
    if (skillMode === "use" && balanceTeams) {
      // 실력 고려 모드: 평균 실력 차이가 ±2 이내가 되도록 매칭
      const usedTeams = new Set<number>();
      
      for (let i = 0; i < teams.length; i++) {
        if (usedTeams.has(i)) continue;
        
        let bestMatchIndex = -1;
        let bestMatchDiff = Infinity;
        
        // 현재 팀과 가장 비슷한 실력의 팀 찾기
        for (let j = i + 1; j < teams.length; j++) {
          if (usedTeams.has(j)) continue;
          
          const diff = Math.abs(teams[i].avgSkill - teams[j].avgSkill);
          if (diff < bestMatchDiff) {
            bestMatchDiff = diff;
            bestMatchIndex = j;
          }
        }
        
        if (bestMatchIndex !== -1 && bestMatchDiff <= 2) {
          newGames.push({
            team1: teams[i],
            team2: teams[bestMatchIndex]
          });
          usedTeams.add(i);
          usedTeams.add(bestMatchIndex);
        } else if (bestMatchIndex !== -1) {
          // 차이가 2보다 크지만 남은 팀이 있으면 매칭
          newGames.push({
            team1: teams[i],
            team2: teams[bestMatchIndex]
          });
          usedTeams.add(i);
          usedTeams.add(bestMatchIndex);
        }
      }
    } else {
      // 실력 무시 모드: 순서대로 매칭
      for (let i = 0; i < teams.length; i += 2) {
        if (i + 1 < teams.length) {
          newGames.push({
            team1: teams[i],
            team2: teams[i + 1]
          });
        }
      }
    }

    setGames(newGames);
    setShowResults(true);

    // 현재 게임에 참여하지 못한 플레이어들을 추적
    const participatingPlayerIds = new Set<number>();
    newGames.forEach(game => {
      [...game.team1.players, ...game.team2.players].forEach(p => {
        participatingPlayerIds.add(p.id);
      });
    });
    
    const currentExcludedPlayers = players.filter(p => !participatingPlayerIds.has(p.id));
    const currentExcludedPlayerIds = new Set(currentExcludedPlayers.map(p => p.id));
    
    // 이전 제외자를 2번째로 밀어내고, 현재 제외자를 최근 제외자로 설정
    setSecondLastExcludedPlayerIds(lastExcludedPlayerIds);
    setLastExcludedPlayerIds(currentExcludedPlayerIds);

    // 제외된 플레이어들의 제외 횟수 증가
    if (currentExcludedPlayers.length > 0) {
      const newExclusionCount = { ...playerExclusionCount };
      currentExcludedPlayers.forEach(p => {
        newExclusionCount[p.id] = (newExclusionCount[p.id] || 0) + 1;
      });
      setPlayerExclusionCount(newExclusionCount);
    }
  };

  const createMixedTeams = (males: Player[], females: Player[]): Team[] => {
    const teams: Team[] = [];
    const usedMales = new Set<number>();
    const usedFemales = new Set<number>();
    
    // 강력한 랜덤 섞기
    let malesCopy = [...males];
    let femalesCopy = [...females];
    for (let i = 0; i < 3; i++) {
      malesCopy = malesCopy.sort(() => Math.random() - 0.5);
      femalesCopy = femalesCopy.sort(() => Math.random() - 0.5);
    }
    
    // 각 남성에 대해 여성 파트너를 찾기
    while (malesCopy.length > usedMales.size && femalesCopy.length > usedFemales.size) {
      const availableMales = malesCopy.filter(m => !usedMales.has(m.id));
      const availableFemales = femalesCopy.filter(f => !usedFemales.has(f.id));
      
      if (availableMales.length === 0 || availableFemales.length === 0) break;
      
      const male = availableMales[0];
      
      // 각 여성 후보에 대한 점수 계산
      const scores = availableFemales.map(female => {
        let score = 100;
        
        // 함께 게임한 적 없으면 큰 보너스 (확률 3배)
        const maleHistory = matchHistory[male.name] || new Set();
        if (!maleHistory.has(female.name)) {
          score += 200; // 안 만난 사람 확률 3배로 증가
        }
        
        // 실력 균형도 고려 (선택적)
        if (skillMode === "use") {
          const skillDiff = Math.abs(skillToNumber(male.skill) - skillToNumber(female.skill));
          score -= skillDiff * 5; // 실력 차이가 적을수록 점수 증가
        }
        
        // 랜덤 요소 추가 (±30점)
        score += Math.random() * 60 - 30;
        
        return { player: female, score };
      });
      
      // 점수 기반 가중치 랜덤 선택
      const totalScore = scores.reduce((sum, s) => sum + Math.max(s.score, 1), 0);
      let random = Math.random() * totalScore;
      let selectedFemale = scores[0].player;
      
      for (const { player, score } of scores) {
        random -= Math.max(score, 1);
        if (random <= 0) {
          selectedFemale = player;
          break;
        }
      }
      
      teams.push({
        players: [male, selectedFemale],
        avgSkill: (skillToNumber(male.skill) + skillToNumber(selectedFemale.skill)) / 2
      });
      
      usedMales.add(male.id);
      usedFemales.add(selectedFemale.id);
    }

    // 남은 플레이어들 처리
    const remainingMales = malesCopy.filter(m => !usedMales.has(m.id));
    const remainingFemales = femalesCopy.filter(f => !usedFemales.has(f.id));
    const remaining = [...remainingMales, ...remainingFemales];
    const remainingTeams = createTeamsFromPlayers(remaining);
    
    return [...teams, ...remainingTeams];
  };

  const createTeamsFromPlayers = (playerList: Player[]): Team[] => {
    const teams: Team[] = [];
    const usedPlayers = new Set<number>();

    // 강력한 랜덤 섞기 (3번)
    let playersCopy = [...playerList];
    for (let i = 0; i < 3; i++) {
      playersCopy = playersCopy.sort(() => Math.random() - 0.5);
    }

    // 실력 고려 모드 & 밸런스 모드일 때 안 만난 사람 우선 매칭
    if (skillMode === "use" && balanceTeams) {
      while (playersCopy.length - usedPlayers.size >= 2) {
        // 아직 팀에 배정되지 않은 플레이어 찾기
        const availablePlayers = playersCopy.filter(p => !usedPlayers.has(p.id));
        if (availablePlayers.length < 2) break;

        // 첫 번째 플레이어 선택
        const p1 = availablePlayers[0];
        
        // p1과 함께 팀을 이룰 p2 선택
        const candidates = availablePlayers.filter(p => p.id !== p1.id);
        
        // 각 후보에 대한 점수 계산
        const scores = candidates.map(p2 => {
          let score = 100;
          
          // 1. 함께 게임한 적 없으면 큰 보너스 (확률 3배)
          const p1History = matchHistory[p1.name] || new Set();
          if (!p1History.has(p2.name)) {
            score += 200; // 안 만난 사람 확률 3배로 증가
          }
          
          // 2. 실력 차등 적용
          const skillDiff = Math.abs(skillToNumber(p1.skill) - skillToNumber(p2.skill));
          const p1SkillNum = skillToNumber(p1.skill);
          
          // 실력 차이가 클수록 낮은 실력자는 점수 증가
          if (skillDiff > 0 && p1SkillNum > skillToNumber(p2.skill)) {
            const skillBonusMultiplier = 1 + ((5 - p1SkillNum) * 0.2);
            score += skillDiff * 10 * skillBonusMultiplier;
          }
          
          // 3. 랜덤 요소 추가 (±40점)
          score += Math.random() * 80 - 40;
          
          return { player: p2, score };
        });
        
        // 점수 기반 가중치 랜덤 선택
        const totalScore = scores.reduce((sum, s) => sum + Math.max(s.score, 1), 0);
        let random = Math.random() * totalScore;
        let p2 = scores[0].player;
        
        for (const { player, score } of scores) {
          random -= Math.max(score, 1);
          if (random <= 0) {
            p2 = player;
            break;
          }
        }
        
        teams.push({
          players: [p1, p2],
          avgSkill: (skillToNumber(p1.skill) + skillToNumber(p2.skill)) / 2
        });
        
        usedPlayers.add(p1.id);
        usedPlayers.add(p2.id);
      }
      
      // 남은 플레이어 처리 (혼자팀)
      const remaining = playerList.filter(p => !usedPlayers.has(p.id));
      remaining.forEach(p => {
        teams.push({
          players: [p],
          avgSkill: skillToNumber(p.skill)
        });
        
        const newSoloHistory = new Set(soloHistory);
        newSoloHistory.add(p.name);
        setSoloHistory(newSoloHistory);
      });
    } else {
      // 실력 무시 모드: 이미 제외 횟수 기준으로 정렬되어 있으므로 순서 유지
      const shuffled = [...playerList];

      for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
          teams.push({
            players: [shuffled[i], shuffled[i + 1]],
            avgSkill: (skillToNumber(shuffled[i].skill) + skillToNumber(shuffled[i + 1].skill)) / 2
          });
        } else {
          teams.push({
            players: [shuffled[i]],
            avgSkill: skillToNumber(shuffled[i].skill)
          });
          
          const newSoloHistory = new Set(soloHistory);
          newSoloHistory.add(shuffled[i].name);
          setSoloHistory(newSoloHistory);
        }
      }
    }

    return teams;
  };

  const saveToHistory = () => {
    if (games.length === 0) {
      alert("저장할 게임 구성이 없습니다.");
      return;
    }

    // 현재 게임에 참여한 플레이어 찾기
    const participatingPlayerIds = new Set<number>();
    games.forEach(game => {
      [...game.team1.players, ...game.team2.players].forEach(p => {
        participatingPlayerIds.add(p.id);
      });
    });

    // 제외된 플레이어 찾기
    const excludedPlayers = players.filter(p => !participatingPlayerIds.has(p.id));

    const entry: HistoryEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString("ko-KR"),
      games: games,
      playerCount: players.length,
      excludedPlayers: excludedPlayers.length > 0 ? excludedPlayers : undefined
    };

    // 매칭 히스토리 업데이트: 같은 게임에 참여한 플레이어들 기록
    const newMatchHistory = { ...matchHistory };
    games.forEach(game => {
      const allPlayers = [...game.team1.players, ...game.team2.players];
      allPlayers.forEach(p1 => {
        if (!newMatchHistory[p1.name]) {
          newMatchHistory[p1.name] = new Set();
        }
        allPlayers.forEach(p2 => {
          if (p1.name !== p2.name) {
            newMatchHistory[p1.name].add(p2.name);
          }
        });
      });
    });
    setMatchHistory(newMatchHistory);

    // ⭐ 매칭 빈도 업데이트: 같은 게임에 참여한 모든 플레이어 쌍의 매칭 횟수 증가
    const newMatchFrequency = { ...matchFrequency };
    games.forEach(game => {
      const allPlayers = [...game.team1.players, ...game.team2.players];
      for (let i = 0; i < allPlayers.length; i++) {
        for (let j = i + 1; j < allPlayers.length; j++) {
          const key = getMatchKey(allPlayers[i].name, allPlayers[j].name);
          newMatchFrequency[key] = (newMatchFrequency[key] || 0) + 1;
        }
      }
    });
    setMatchFrequency(newMatchFrequency);

    setHistory([entry, ...history]);
    setShowHistory(true);
    alert("게임 구성이 기록에 저장되었습니다.");
  };

  const deleteHistoryEntry = (entryId: number) => {
    if (confirm("이 기록을 삭제하시겠습니까?")) {
      setHistory(history.filter(entry => entry.id !== entryId));
    }
  };

  const clearHistory = () => {
    if (confirm("모든 기록을 삭제하시겠습니까?")) {
      setHistory([]);
      setSoloHistory(new Set());
      setMatchHistory({});
      setMatchFrequency({});
      setPlayerExclusionCount({});
      setLastExcludedPlayerIds(new Set());
      setSecondLastExcludedPlayerIds(new Set());
    }
  };

  // 플레이어가 미참여한 총 경기 수 계산
  const getPlayerExcludedCount = (playerName: string): number => {
    let excludedCount = 0;
    history.forEach(entry => {
      // 해당 기록에서 이 플레이어가 제외되었는지 확인
      if (entry.excludedPlayers && entry.excludedPlayers.some(p => p.name === playerName)) {
        excludedCount++;
      }
    });
    return excludedCount;
  };

  // 특정 히스토리 엔트리 시점까지의 미참여 횟수 계산
  const getPlayerExcludedCountUntil = (playerName: string, entryIndex: number): number => {
    let excludedCount = 0;
    // entryIndex 이후의 기록들만 확인 (시간상 이전 기록들)
    // 현재 기록도 포함하여 계산
    for (let i = entryIndex; i < history.length; i++) {
      const entry = history[i];
      if (entry.excludedPlayers && entry.excludedPlayers.some(p => p.name === playerName)) {
        excludedCount++;
      }
    }
    return excludedCount;
  };

  // 게임 구성 결과를 텍스트로 변환
  const generateSummaryText = (): string => {
    if (games.length === 0) return "";

    const participatingPlayerIds = new Set<number>();
    games.forEach(game => {
      [...game.team1.players, ...game.team2.players].forEach(p => {
        participatingPlayerIds.add(p.id);
      });
    });
    const nonParticipatingPlayers = players.filter(p => !participatingPlayerIds.has(p.id));

    let text = "🏸 배드민턴 게임 구성\n\n";
    
    games.forEach((game, index) => {
      const team1Text = game.team1.players.map(p => `${p.name}(${p.skill})`).join(", ");
      const team2Text = game.team2.players.map(p => `${p.name}(${p.skill})`).join(", ");
      text += `게임 ${index + 1}: ${team1Text} vs ${team2Text}\n`;
    });

    if (nonParticipatingPlayers.length > 0) {
      text += `\n⏸️ 이번 게임 미참여: ${nonParticipatingPlayers.map(p => `${p.name}(${p.skill})`).join(", ")}`;
    }

    return text;
  };

  // 클립보드에 복사
  const copyToClipboard = async () => {
    const text = generateSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      alert("게임 구성이 클립보드에 복사되었습니다!\n카카오톡 등에 붙여넣기 하세요.");
    } catch (err) {
      alert("복사에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/bracket")}
            className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30"
          >
            <Home className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
        </div>

        <div className="text-center mb-12 text-white">
          <h1 className="text-5xl font-bold mb-4">🏸 배드민턴 팀 매칭</h1>
          <p className="text-xl opacity-90">공정하고 균형잡힌 팀을 자동으로 구성해드립니다</p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8">
          {/* Player Input Section */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">참가자 등록</h2>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("single")}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === "single"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-purple-600"
                }`}
                data-testid="tab-single"
              >
                개별 입력
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === "bulk"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-purple-600"
                }`}
                data-testid="tab-bulk"
              >
                리스트 입력
              </button>
            </div>

            {/* Single Input Tab */}
            {activeTab === "single" && (
              <div>
                <div className="mb-3">
                  <p className="text-sm text-gray-600">이름만 입력하면 자동으로 추가됩니다. 성별과 실력은 나중에 수정할 수 있어요.</p>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                      placeholder="이름을 입력하세요"
                      maxLength={20}
                      data-testid="input-player-name"
                    />
                  </div>

                  <Button onClick={addPlayer} className="bg-green-500 hover:bg-green-600" data-testid="button-add-player">
                    <Plus className="w-4 h-4 mr-2" />
                    참가자 추가
                  </Button>
                </div>
              </div>
            )}

            {/* Bulk Input Tab */}
            {activeTab === "bulk" && (
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">리스트로 한번에 입력</h3>
                  <p className="text-sm text-gray-600">쉼표(,) 또는 공백으로 구분하여 여러 명을 한번에 추가하세요</p>
                  <p className="text-xs text-gray-500 mt-1">예: 홍길동, 김철수, 이영희 또는 홍길동 김철수 이영희</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름 목록</label>
                  <textarea
                    value={bulkNames}
                    onChange={(e) => setBulkNames(e.target.value)}
                    placeholder="홍길동, 김철수, 이영희, 박민수, 최지은&#10;또는&#10;홍길동 김철수 이영희 박민수 최지은"
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="input-bulk-names"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button onClick={addBulkPlayers} className="bg-green-500 hover:bg-green-600" data-testid="button-add-bulk">
                    <Plus className="w-4 h-4 mr-2" />
                    참가자 추가
                  </Button>
                  <Button 
                    onClick={() => setBulkNames("")} 
                    variant="outline"
                    data-testid="button-clear-bulk"
                  >
                    입력 초기화
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              참가자 목록 (<span className="text-purple-600">{players.length}</span>명)
            </h2>
            
            {players.length === 0 ? (
              <p className="text-center text-gray-500 py-8">참가자를 추가해주세요</p>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/4">이름</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/6">성별</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/6">실력</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-1/6">상태</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700 w-20">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player) => (
                        <tr 
                          key={player.id} 
                          className={`border-b border-gray-100 hover:bg-gray-50 ${player.isResting ? 'bg-gray-100 opacity-60' : ''}`}
                          data-testid={`player-row-${player.id}`}
                        >
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {player.name}
                            {player.isResting && <span className="ml-2 text-xs text-orange-600">💤 휴식중</span>}
                          </td>
                          <td className="px-4 py-3">
                            <Select 
                              value={player.gender} 
                              onValueChange={(v) => updatePlayer(player.id, "gender", v as "male" | "female")}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">♂ 남성</SelectItem>
                                <SelectItem value="female">♀ 여성</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Select 
                              value={player.skill} 
                              onValueChange={(v) => updatePlayer(player.id, "skill", v as SkillLevel)}
                            >
                              <SelectTrigger className="h-9 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="D">D</SelectItem>
                                <SelectItem value="E">E</SelectItem>
                                <SelectItem value="입문">입문</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              onClick={() => toggleResting(player.id)}
                              variant={player.isResting ? "default" : "outline"}
                              size="sm"
                              className={player.isResting ? "bg-orange-500 hover:bg-orange-600" : ""}
                              data-testid={`button-rest-${player.id}`}
                            >
                              {player.isResting ? "참여" : "휴식"}
                            </Button>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              onClick={() => removePlayer(player.id)}
                              variant="destructive"
                              size="sm"
                              data-testid={`button-remove-${player.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Settings & Controls */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">팀 구성 설정</h2>
            
            <div className="space-y-6 bg-gray-50 p-4 rounded-lg mb-6">
              {/* Court Count Settings */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-3">코트 수</h4>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    placeholder="제한 없음"
                    value={courtCount ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCourtCount(value === "" ? null : parseInt(value));
                    }}
                    className="w-32"
                    data-testid="input-court-count"
                  />
                  <span className="text-sm text-gray-600">
                    {courtCount 
                      ? `코트당 4명 → 최대 ${courtCount * 4}명 참여` 
                      : "코트 수 제한 없음 (전체 인원 참여)"}
                  </span>
                  {courtCount && (
                    <Button
                      onClick={() => setCourtCount(null)}
                      variant="outline"
                      size="sm"
                      data-testid="button-clear-court-count"
                    >
                      초기화
                    </Button>
                  )}
                </div>
              </div>

              {/* Skill Settings */}
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-semibold text-gray-800 mb-3">실력 설정</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="skillMode"
                      value="use"
                      checked={skillMode === "use"}
                      onChange={(e) => setSkillMode(e.target.value as "use" | "ignore")}
                      className="w-4 h-4"
                    />
                    <span>실력 고려하기</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="skillMode"
                      value="ignore"
                      checked={skillMode === "ignore"}
                      onChange={(e) => setSkillMode(e.target.value as "use" | "ignore")}
                      className="w-4 h-4"
                    />
                    <span>실력 무시하기 (완전 랜덤)</span>
                  </label>
                </div>
              </div>

              {/* Balance Settings */}
              {skillMode === "use" && (
                <div className="border-b border-gray-200 pb-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={balanceTeams}
                        onChange={(e) => setBalanceTeams(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>실력 균형 맞추기</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={avoidSoloRepeat}
                        onChange={(e) => setAvoidSoloRepeat(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>연속 혼자팀 방지</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Game Type Settings */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">경기 유형</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gameType"
                      value="mixed"
                      checked={gameType === "mixed"}
                      onChange={(e) => setGameType(e.target.value as "mixed" | "separate" | "any")}
                      className="w-4 h-4"
                    />
                    <span>혼복 (남녀 혼합)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gameType"
                      value="separate"
                      checked={gameType === "separate"}
                      onChange={(e) => setGameType(e.target.value as "mixed" | "separate" | "any")}
                      className="w-4 h-4"
                    />
                    <span>남복/여복 분리</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gameType"
                      value="any"
                      checked={gameType === "any"}
                      onChange={(e) => setGameType(e.target.value as "mixed" | "separate" | "any")}
                      className="w-4 h-4"
                    />
                    <span>성별 무관</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={generateTeams}
                disabled={players.length < 4}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-generate-teams"
              >
                게임 구성하기 {players.length < 4 && `(${players.length}/4명)`}
              </Button>
              <Button onClick={clearGames} variant="outline" data-testid="button-clear-games">
                게임 초기화
              </Button>
              <Button onClick={clearAll} variant="destructive" data-testid="button-clear-all">
                전체 초기화
              </Button>
            </div>
          </div>

          {/* Results */}
          {showResults && games.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">게임 구성 결과</h2>
              
              <div className="space-y-3">
                {games.map((game, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-300 rounded-lg p-4"
                    data-testid={`game-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-600 mr-3">게임 {index + 1}</span>
                        <span className="text-lg font-bold text-gray-800">
                          {game.team1.players.map(p => `${p.name}(${p.skill})`).join(", ")}
                          <span className="mx-3 text-purple-600">vs</span>
                          {game.team2.players.map(p => `${p.name}(${p.skill})`).join(", ")}
                        </span>
                      </div>
                      <div className="ml-4 text-sm text-gray-500">
                        실력차: {Math.abs(game.team1.avgSkill - game.team2.avgSkill).toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 참여하지 못한 플레이어 */}
              {(() => {
                const participatingPlayerIds = new Set<number>();
                games.forEach(game => {
                  [...game.team1.players, ...game.team2.players].forEach(p => {
                    participatingPlayerIds.add(p.id);
                  });
                });
                const nonParticipatingPlayers = players.filter(p => !participatingPlayerIds.has(p.id));
                
                if (nonParticipatingPlayers.length > 0) {
                  return (
                    <div className="mt-6 bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        이번 게임 미참여 ({nonParticipatingPlayers.length}명)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {nonParticipatingPlayers.map(player => (
                          <div 
                            key={player.id}
                            className="bg-white px-3 py-2 rounded-lg border border-gray-300"
                          >
                            <span className="font-semibold text-gray-700">
                              {player.name} (미참여 {getPlayerExcludedCount(player.name)}회)
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {player.gender === "male" ? "♂" : "♀"} {player.skill}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mt-6 flex gap-4 flex-wrap">
                <Button onClick={generateTeams} className="bg-teal-500 hover:bg-teal-600">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  다시 구성하기
                </Button>
                <Button onClick={copyToClipboard} className="bg-blue-500 hover:bg-blue-600">
                  <Copy className="w-4 h-4 mr-2" />
                  텍스트로 복사
                </Button>
                <Button onClick={saveToHistory} className="bg-green-500 hover:bg-green-600">
                  기록 저장
                </Button>
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">게임 구성 기록</h2>
                <Button onClick={clearHistory} variant="destructive" size="sm">
                  기록 삭제
                </Button>
              </div>

              <div className="space-y-4">
                {history.map((entry, entryIndex) => (
                  <div key={entry.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{entry.timestamp}</p>
                        <p className="text-sm text-gray-600">참가자 {entry.playerCount}명 · {entry.games.length}개 게임</p>
                      </div>
                      <Button 
                        onClick={() => deleteHistoryEntry(entry.id)} 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        data-testid={`button-delete-history-${entry.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {entry.games.map((game, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 p-3 rounded">
                          <p className="font-semibold text-gray-800 mb-2">게임 {idx + 1}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-100 p-2 rounded text-sm">
                              <p className="font-semibold text-blue-800">팀 A</p>
                              {game.team1.players.map(p => (
                                <p key={p.id} className="text-xs text-gray-700">
                                  {p.name} ({p.skill})
                                </p>
                              ))}
                            </div>
                            <div className="bg-red-100 p-2 rounded text-sm">
                              <p className="font-semibold text-red-800">팀 B</p>
                              {game.team2.players.map(p => (
                                <p key={p.id} className="text-xs text-gray-700">
                                  {p.name} ({p.skill})
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {entry.excludedPlayers && entry.excludedPlayers.length > 0 && (
                        <div className="bg-gray-100 border border-gray-300 p-3 rounded mt-3">
                          <p className="font-semibold text-gray-700 mb-2">미참여 ({entry.excludedPlayers.length}명)</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.excludedPlayers.map(p => (
                              <span key={p.id} className="text-xs bg-white px-2 py-1 rounded border border-gray-300">
                                {p.name} (미참여 {getPlayerExcludedCountUntil(p.name, entryIndex)}회)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
