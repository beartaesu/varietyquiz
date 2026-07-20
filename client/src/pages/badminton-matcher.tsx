import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";
import { calculateRestRule, RestGapMode, SchedulePlayer } from "@/lib/badminton-scheduler";
import {
  BadmintonFeatureFlags,
  BadmintonSession,
  createSession,
  defaultFeatureFlags,
  deleteSession,
  listSessions,
  saveSession,
  setActiveSession,
} from "@/lib/badminton-session";
import { ArrowRight, Clock3, Home, Play, Plus, Settings2, Trash2 } from "lucide-react";

type SkillLevel = "A" | "B" | "C" | "D" | "E" | "입문";
interface PlayerInput { id: number; name: string; skill: SkillLevel; }
const skillNumber: Record<SkillLevel, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, 입문: 0 };
const skillLevels: SkillLevel[] = ["입문", "E", "D", "C", "B", "A"];

function shuffle(ids: number[]) {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export default function BadmintonMatcherPage() {
  const [, setLocation] = useLocation();
  const [players, setPlayers] = useState<PlayerInput[]>([]);
  const [sessions, setSessions] = useState<BadmintonSession[]>([]);
  const [name, setName] = useState("");
  const [bulkNames, setBulkNames] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [courtCount, setCourtCount] = useState(4);
  const [restGapMode, setRestGapMode] = useState<RestGapMode>("fixed");
  const [flags, setFlags] = useState<BadmintonFeatureFlags>(defaultFeatureFlags);
  const [error, setError] = useState("");

  useSEO({ title: "배드민턴 세션 설정", description: "참가자와 코트를 설정하고 배드민턴 세션을 시작합니다", keywords: "배드민턴, 게임배치, 휴식" });

  useEffect(() => {
    setSessions(listSessions());
    try {
      const saved = JSON.parse(localStorage.getItem("badminton_players_v3") || "[]") as PlayerInput[];
      if (saved.length) setPlayers(saved);
      const courts = Number(localStorage.getItem("badminton_court_count_v2"));
      if (courts > 0) setCourtCount(courts);
    } catch { /* 이전 설정이 손상되면 새로 시작 */ }
  }, []);

  useEffect(() => { localStorage.setItem("badminton_players_v3", JSON.stringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem("badminton_court_count_v2", String(courtCount)); }, [courtCount]);

  const converted: SchedulePlayer[] = useMemo(
    () => players.map(player => ({ id: player.id, name: player.name, skill: skillNumber[player.skill], profileId: `local-${player.id}` })),
    [players],
  );
  const defaultCourts = Math.min(courtCount, Math.floor(players.length / 4));
  const defaultRestCount = players.length - defaultCourts * 4;
  const fixedRule = calculateRestRule(players.length, defaultRestCount, "dynamic");

  const addNames = (raw: string) => {
    const incoming = raw.split(/[,\s]+/).map(value => value.trim()).filter(Boolean);
    const existing = new Set(players.map(player => player.name));
    const unique = [...new Set(incoming)].filter(value => !existing.has(value));
    if (!unique.length) { setError("추가할 새 참가자가 없습니다."); return; }
    const now = Date.now();
    setPlayers(previous => [...previous, ...unique.map((playerName, index) => ({ id: now + index, name: playerName, skill: "입문" as SkillLevel }))]);
    setName("");
    setBulkNames("");
    setError("");
  };

  const startSession = () => {
    if (converted.length < 2) { setError("단식을 위해 최소 2명을 등록해주세요."); return; }
    if (new Set(converted.map(player => player.name.trim())).size !== converted.length) { setError("참가자 이름은 중복될 수 없습니다."); return; }
    const session = createSession({
      name: sessionName,
      players: converted,
      requestedCourts: courtCount,
      restOrder: shuffle(converted.map(player => player.id)),
      restGapMode,
      fixedMinimumGap: fixedRule.minimumGap,
      flags,
    });
    saveSession(session);
    setLocation("/bracket/badminton/board");
  };

  const resume = (id: string) => {
    setActiveSession(id);
    setLocation("/bracket/badminton/board");
  };

  const toggleFlag = (key: keyof BadmintonFeatureFlags) => setFlags(previous => ({ ...previous, [key]: !previous[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 py-8">
      <div className="max-w-5xl mx-auto space-y-7">
        <Button variant="outline" onClick={() => setLocation("/")}><Home className="w-4 h-4 mr-2" />홈으로</Button>
        <header><p className="text-blue-400 font-semibold">SESSION SETUP</p><h1 className="text-4xl md:text-5xl font-bold mt-2">배드민턴 세션 설정</h1><p className="text-gray-400 mt-3">참가자와 운영 기준만 정하고, 휴식·단식 선택은 다음 화면에서 진행합니다.</p></header>

        {sessions.length > 0 && <section className="bg-white rounded-3xl border p-5 md:p-6">
          <div className="flex items-center gap-2"><Clock3 className="w-5 h-5" /><h2 className="text-xl font-bold">기존 세션 계속하기</h2></div>
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {sessions.map(session => <div key={session.id} className="rounded-2xl border bg-gray-50 p-4 flex items-center justify-between gap-3">
              <button className="text-left min-w-0 flex-1" onClick={() => resume(session.id)}><b className="block truncate">{session.name}</b><span className="text-xs text-gray-400">{session.players.length}명 · {session.requestedCourts}코트 · {session.rounds.length}라운드</span></button>
              <Button size="sm" onClick={() => resume(session.id)}>계속 <ArrowRight className="w-4 h-4 ml-1" /></Button>
              <button aria-label={`${session.name} 삭제`} onClick={() => { if (window.confirm("이 세션 기록을 삭제할까요?")) { deleteSession(session.id); setSessions(listSessions()); } }}><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>)}
          </div>
        </section>}

        <section className="bg-white rounded-3xl border p-5 md:p-7">
          <h2 className="text-2xl font-bold">1. 새 세션 참가자</h2>
          <div className="grid sm:grid-cols-[1fr_auto] gap-2 mt-4"><Input value={name} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === "Enter" && addNames(name)} placeholder="이름" /><Button onClick={() => addNames(name)}><Plus className="w-4 h-4 mr-1" />추가</Button></div>
          <textarea value={bulkNames} onChange={event => setBulkNames(event.target.value)} placeholder="여러 이름을 공백, 쉼표 또는 줄바꿈으로 입력" className="w-full min-h-24 rounded-xl border bg-gray-50 p-3 mt-3" />
          <Button variant="outline" onClick={() => addNames(bulkNames)} className="mt-2">목록 한 번에 추가</Button>
          <div className="flex flex-wrap gap-2 mt-5">
            {players.map(player => <div key={player.id} className="inline-flex items-center gap-2 rounded-2xl border bg-gray-50 px-3 py-2">
              <b>{player.name}</b>
              <select value={player.skill} onChange={event => setPlayers(previous => previous.map(item => item.id === player.id ? { ...item, skill: event.target.value as SkillLevel } : item))} className="rounded-lg bg-white px-2 py-1 text-sm">{skillLevels.map(level => <option key={level}>{level}</option>)}</select>
              <button onClick={() => setPlayers(previous => previous.filter(item => item.id !== player.id))}><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>)}
          </div>
          <p className="text-sm text-gray-400 mt-3">총 {players.length}명</p>
        </section>

        <section className="bg-white rounded-3xl border p-5 md:p-7">
          <h2 className="text-2xl font-bold">2. 운영 기준</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <label className="font-semibold">세션 이름<Input value={sessionName} onChange={event => setSessionName(event.target.value)} placeholder="예: 월요일 정기 운동" className="mt-2" /></label>
            <label className="font-semibold">코트 수<Input type="number" min={1} value={courtCount} onChange={event => setCourtCount(Math.max(1, Number(event.target.value)))} className="mt-2" /></label>
          </div>
          <div className="mt-5"><b>휴식 최소 간격 기준</b><div className="grid sm:grid-cols-2 gap-3 mt-2">
            <button onClick={() => setRestGapMode("fixed")} className={`rounded-2xl border p-4 text-left ${restGapMode === "fixed" ? "border-blue-400 bg-blue-600/10" : "bg-gray-50"}`}><b>세션 전체 고정 · 권장</b><span className="block text-sm text-gray-400 mt-1">{fixedRule.minimumGap ? `시작 시 계산한 ${fixedRule.minimumGap}라운드 차이를 세션 내내 적용합니다.` : "기본 휴식자가 없어 첫 휴식 라운드의 기준을 세션 기준으로 고정합니다."}</span></button>
            <button onClick={() => setRestGapMode("dynamic")} className={`rounded-2xl border p-4 text-left ${restGapMode === "dynamic" ? "border-blue-400 bg-blue-600/10" : "bg-gray-50"}`}><b>라운드별 동적</b><span className="block text-sm text-gray-400 mt-1">매 라운드 휴식 인원으로 새 기준을 계산해 그 라운드에 저장합니다.</span></button>
          </div></div>
        </section>

        <section className="bg-white rounded-3xl border p-5 md:p-7">
          <div className="flex items-center gap-2"><Settings2 className="w-5 h-5" /><h2 className="text-2xl font-bold">3. 시험 기능</h2></div>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {([
              ["confirmBeforeFinalize", "라운드 확정 전 확인"],
              ["autoSaveDraft", "작성 중 배치 자동 저장"],
              ["requireExceptionReason", "예외 승인 사유 필수"],
              ["enableAlternatives", "자동 배치 후보 3개"],
              ["enableLiveMode", "실시간 코트 운영 모드"],
              ["showSessionSummary", "세션 종료 요약"],
            ] as [keyof BadmintonFeatureFlags, string][]).map(([key, label]) => <button key={key} onClick={() => toggleFlag(key)} className={`flex items-center justify-between rounded-2xl border p-4 ${flags[key] ? "border-blue-400 bg-blue-600/10" : "bg-gray-50"}`}><span className="font-semibold">{label}</span><span className={`rounded-full px-2 py-1 text-xs ${flags[key] ? "bg-blue-600 text-white" : "bg-white"}`}>{flags[key] ? "ON" : "OFF"}</span></button>)}
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-300">{error}</div>}
        <Button size="lg" onClick={startSession} className="w-full min-h-14"><Play className="w-5 h-5 mr-2" />새 세션 시작</Button>
        <Footer />
      </div>
    </div>
  );
}
