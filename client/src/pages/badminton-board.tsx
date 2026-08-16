import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/use-seo";
import {
  CourtMatch,
  SchedulePlayer,
  ScheduleRound,
  ScheduleRuleError,
  calculateFlexibleLineup,
  calculateRestRule,
  generateManualRound,
  validateSchedule,
} from "@/lib/badminton-scheduler";
import { BadmintonSession, loadActiveSession, saveSession } from "@/lib/badminton-session";
import { ArrowLeft, CheckCircle2, Clock3, GripVertical, Pause, Play, Redo2, RotateCcw, Shuffle, Square, Undo2 } from "lucide-react";

interface Slot { court: number; position: number; }
interface LiveCourtState { status: "ready" | "playing" | "finished"; startedAt?: number; finishedAt?: number; }

const skillLabel = (skill: number) => (["입문", "E", "D", "C", "B", "A"][skill] || "입문");
const draftKey = (sessionId: string) => `badminton_draft_v2_${sessionId}`;
const slotKey = ({ court, position }: Slot) => `${court}:${position}`;

const makeSwappedDraft = (draft: ScheduleRound, from: Slot, to: Slot): ScheduleRound => {
  const courts = draft.courts.map(court => ({ ...court, players: [...court.players] }));
  [courts[from.court].players[from.position], courts[to.court].players[to.position]] = [courts[to.court].players[to.position], courts[from.court].players[from.position]];
  return { ...draft, courts };
};

const exceptionLabel = (exception: ScheduleRound["approvedExceptions"][number]) => exception.code === "rest_imbalance"
  ? `휴식 편차 ${exception.spread} 예외 승인`
  : `휴식 간격 ${exception.actualGap ?? "-"}, 기준 ${exception.minimumGap ?? "-"} 예외 승인`;

export default function BadmintonBoardPage() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<BadmintonSession | null>(null);
  const [draft, setDraft] = useState<ScheduleRound | null>(null);
  const [alternatives, setAlternatives] = useState<ScheduleRound[]>([]);
  const [selectedRestIds, setSelectedRestIds] = useState<Set<number>>(new Set());
  const [selectedSoloIds, setSelectedSoloIds] = useState<Set<number>>(new Set());
  const [selectedGameIds, setSelectedGameIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<Slot | null>(null);
  const [undoStack, setUndoStack] = useState<ScheduleRound[]>([]);
  const [redoStack, setRedoStack] = useState<ScheduleRound[]>([]);
  const [undoneRound, setUndoneRound] = useState<ScheduleRound | null>(null);
  const [liveCourts, setLiveCourts] = useState<Record<number, LiveCourtState>>({});
  const [now, setNow] = useState(Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSummaryRoundNumber, setSelectedSummaryRoundNumber] = useState<number | null>(null);

  useSEO({ title: "배드민턴 세션 운영", description: "휴식과 단식을 선택하고 라운드별 게임을 운영합니다", keywords: "배드민턴, 코트운영, 게임배치" });

  useEffect(() => {
    const loaded = loadActiveSession();
    if (!loaded) { setLocation("/bracket/badminton"); return; }
    setSession(loaded);
    if (loaded.settings.autoSaveDraft) {
      try {
        const savedDraft = JSON.parse(localStorage.getItem(draftKey(loaded.id)) || "null") as ScheduleRound | null;
        if (savedDraft?.round === loaded.rounds.length + 1) {
          setDraft(savedDraft);
          setSelectedRestIds(new Set(savedDraft.resting.map(player => player.id)));
          setSelectedSoloIds(new Set(savedDraft.courts.filter(court => court.type === "singles").flatMap(court => court.players.map(player => player.id))));
          setLiveCourts(Object.fromEntries(savedDraft.courts.map((_, index) => [index, { status: "ready" }])));
        }
      } catch { /* 손상된 임시 배치는 무시 */ }
    }
  }, [setLocation]);

  useEffect(() => {
    if (!session?.settings.autoSaveDraft) return;
    if (draft) localStorage.setItem(draftKey(session.id), JSON.stringify(draft));
    else localStorage.removeItem(draftKey(session.id));
  }, [draft, session]);

  useEffect(() => {
    if (!Object.values(liveCourts).some(court => court.status === "playing")) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [liveCourts]);

  const rounds = session?.rounds || [];
  const players = session?.players || [];
  const restOrder = session?.restOrder || [];
  const lineup = useMemo(
    () => calculateFlexibleLineup(players, session?.requestedCourts || 0, selectedRestIds, selectedSoloIds, restOrder, selectedGameIds, session ? {
      previousRounds: rounds,
      restGapMode: session.settings.restGapMode,
      fixedMinimumGap: session.settings.fixedMinimumGap,
    } : undefined),
    [players, restOrder, rounds, selectedGameIds, selectedRestIds, selectedSoloIds, session],
  );
  const historicalValidation = useMemo(() => validateSchedule(players, rounds), [players, rounds]);
  const restCounts = historicalValidation.restCounts;
  const availableSwapKeys = useMemo(() => {
    const available = new Set<string>();
    if (!draft || !selectedSlot) return available;

    draft.courts.forEach((court, courtIndex) => {
      court.players.forEach((_, position) => {
        const target = { court: courtIndex, position };
        if (slotKey(target) === slotKey(selectedSlot)) return;
        const candidate = makeSwappedDraft(draft, selectedSlot, target);
        const hasCurrentRoundIssue = validateSchedule(players, [...rounds, candidate]).issues
          .some(issue => issue.round === candidate.round);
        if (!hasCurrentRoundIssue) available.add(slotKey(target));
      });
    });

    return available;
  }, [draft, players, rounds, selectedSlot]);
  const directRestWarnings = useMemo(() => {
    if (!session || !selectedRestIds.size) return [];
    const minimumGap = session.settings.restGapMode === "fixed" && session.settings.fixedMinimumGap === 0 && lineup.effectiveRestIds.size
      ? calculateRestRule(players.length, lineup.effectiveRestIds.size, "dynamic").minimumGap
      : calculateRestRule(players.length, lineup.effectiveRestIds.size, session.settings.restGapMode, session.settings.fixedMinimumGap).minimumGap;
    const nextRound = rounds.length + 1;
    return players.flatMap(player => {
      if (!selectedRestIds.has(player.id)) return [];
      const previous = [...rounds].reverse().find(round => round.resting.some(resting => resting.id === player.id));
      if (!previous || nextRound - previous.round >= minimumGap) return [];
      return [{ player, previousRound: previous.round, actualGap: nextRound - previous.round, minimumGap }];
    });
  }, [lineup.effectiveRestIds.size, players, rounds, selectedRestIds, session]);

  const persist = (next: BadmintonSession) => {
    const saved = saveSession(next);
    setSession(saved);
  };

  const clearDraft = (text = "휴식·단식 구성을 다시 선택할 수 있습니다.") => {
    setDraft(null);
    setAlternatives([]);
    setUndoStack([]);
    setRedoStack([]);
    setLiveCourts({});
    setSelectedSlot(null);
    setApprovalNeeded(false);
    setMessage(text);
  };

  const createOne = (allowRestImbalance: boolean, candidateIndex = 0) => {
    if (!session) return null;
    if (!lineup.valid) throw new ScheduleRuleError(lineup.message, ["invalid_partition"]);
    if (allowRestImbalance && session.settings.requireExceptionReason && !exceptionReason.trim()) {
      throw new Error("예외 승인 사유를 입력해주세요.");
    }
    const resting = players.filter(player => lineup.effectiveRestIds.has(player.id));
    const singles = players.filter(player => lineup.soloIds.has(player.id));
    const resolvedFixedGap = session.settings.restGapMode === "fixed" && session.settings.fixedMinimumGap === 0 && resting.length
      ? calculateRestRule(players.length, resting.length, "dynamic").minimumGap
      : session.settings.fixedMinimumGap;
    return generateManualRound(players, resting, rounds, session.requestedCourts, singles, {
      restGapMode: session.settings.restGapMode,
      fixedMinimumGap: resolvedFixedGap,
      allowRestImbalance,
      allowMinimumRestGapPlayerIds: [...selectedRestIds],
      exceptionReason,
      candidateIndex,
    }).round;
  };

  const createDraft = (allowRestImbalance = false) => {
    setMessage("");
    setApprovalNeeded(false);
    try {
      const first = createOne(allowRestImbalance, 0);
      if (!first) return;
      const candidates = [first];
      if (session?.settings.enableAlternatives) {
        for (let index = 0; index < 2; index++) {
          const candidate = createOne(allowRestImbalance, index + 1);
          if (candidate) candidates.push(candidate);
        }
      }
      setDraft(first);
      if (session?.settings.restGapMode === "fixed" && session.settings.fixedMinimumGap === 0 && first.restRule.minimumGap > 0) {
        persist({ ...session, settings: { ...session.settings, fixedMinimumGap: first.restRule.minimumGap } });
      }
      setAlternatives(candidates);
      setUndoStack([]);
      setRedoStack([]);
      setLiveCourts(Object.fromEntries(first.courts.map((_, index) => [index, { status: "ready" }])));
      setMessage(first.approvedExceptions.length
        ? `${first.approvedExceptions.map(exceptionLabel).join(" · ")}으로 배치를 만들었습니다.`
        : "게임 그룹을 만들었습니다. 카드를 옮기거나 다시 배치한 뒤 검증할 수 있습니다.");
    } catch (error) {
      setDraft(null);
      if (error instanceof ScheduleRuleError && error.codes.includes("rest_imbalance")) {
        setApprovalNeeded(true);
        setMessage(`${error.message}. 이 라운드만 예외 승인할 수 있습니다.`);
      } else setMessage(error instanceof Error ? error.message : "게임 그룹을 만들 수 없습니다.");
    }
  };

  const setPlayerStatus = (id: number, status: "game" | "rest" | "singles") => {
    if (draft) return;
    setSelectedGameIds(previous => { const next = new Set(previous); status === "game" ? next.add(id) : next.delete(id); return next; });
    setSelectedRestIds(previous => { const next = new Set(previous); status === "rest" ? next.add(id) : next.delete(id); return next; });
    setSelectedSoloIds(previous => { const next = new Set(previous); status === "singles" ? next.add(id) : next.delete(id); return next; });
    setApprovalNeeded(false);
    setMessage("");
  };

  const applySuggested = () => {
    setSelectedRestIds(new Set());
    setSelectedSoloIds(new Set());
    setSelectedGameIds(new Set());
    setApprovalNeeded(false);
    setMessage("누적 휴식 횟수와 최근 휴식 라운드를 반영해 자동 추천했습니다.");
  };

  const swapSlots = (from: Slot, to: Slot) => {
    if (!draft) return;
    if (slotKey(from) === slotKey(to)) {
      setSelectedSlot(null);
      return;
    }
    const nextDraft = makeSwappedDraft(draft, from, to);
    const issues = validateSchedule(players, [...rounds, nextDraft]).issues
      .filter(issue => issue.round === nextDraft.round);
    if (issues.length) {
      setMessage(`교환할 수 없는 조합입니다: ${issues.map(issue => issue.message).join(" / ")}`);
      return;
    }
    setUndoStack(previous => [...previous, draft]);
    setRedoStack([]);
    setDraft(nextDraft);
    setSelectedSlot(null);
    setMessage("검증 가능한 배치로 교환했습니다.");
  };

  const handleSlotClick = (target: Slot) => {
    if (!selectedSlot) {
      setSelectedSlot(target);
      setMessage("초록색으로 표시된 참가자와 교환할 수 있습니다.");
      return;
    }
    if (slotKey(selectedSlot) === slotKey(target)) {
      setSelectedSlot(null);
      setMessage("");
      return;
    }
    if (!availableSwapKeys.has(slotKey(target))) return;
    swapSlots(selectedSlot, target);
  };

  const undoMove = () => {
    const previous = undoStack.at(-1);
    if (!draft || !previous) return;
    setRedoStack(stack => [...stack, draft]);
    setUndoStack(stack => stack.slice(0, -1));
    setDraft(previous);
  };

  const redoMove = () => {
    const next = redoStack.at(-1);
    if (!draft || !next) return;
    setUndoStack(stack => [...stack, draft]);
    setRedoStack(stack => stack.slice(0, -1));
    setDraft(next);
  };

  const verifyDraft = () => {
    if (!draft) return false;
    const validation = validateSchedule(players, [...rounds, draft]);
    const currentIssues = validation.issues.filter(issue => issue.round === draft.round);
    setMessage(currentIssues.length ? `검증 실패: ${currentIssues.map(issue => issue.message).join(" / ")}` : draft.approvedExceptions.length ? "필수 검증 통과 · 휴식 예외는 승인 기록으로 저장됩니다." : "모든 필수 검증을 통과했습니다.");
    return currentIssues.length === 0;
  };

  const confirmRound = () => {
    if (!session || !draft || !verifyDraft()) return;
    if (session.settings.confirmBeforeFinalize && !window.confirm(`${draft.round}라운드를 확정할까요?`)) return;
    const restingIds = new Set(draft.resting.map(player => player.id));
    const nextOrder = [...session.restOrder.filter(id => !restingIds.has(id)), ...session.restOrder.filter(id => restingIds.has(id))];
    persist({ ...session, rounds: [...rounds, draft], restOrder: nextOrder });
    setDraft(null);
    setAlternatives([]);
    setSelectedRestIds(new Set());
    setSelectedSoloIds(new Set());
    setSelectedGameIds(new Set());
    setUndoStack([]);
    setRedoStack([]);
    setLiveCourts({});
    setApprovalNeeded(false);
    setExceptionReason("");
    setMessage(`${draft.round}라운드를 확정하고 자동 저장했습니다.`);
  };

  const undoConfirmedRound = () => {
    if (!session || !rounds.length) return;
    const removed = rounds.at(-1)!;
    setUndoneRound(removed);
    persist({ ...session, rounds: rounds.slice(0, -1) });
    setMessage(`${removed.round}라운드를 취소했습니다. 복원할 수 있습니다.`);
  };

  const restoreConfirmedRound = () => {
    if (!session || !undoneRound || undoneRound.round !== rounds.length + 1) return;
    persist({ ...session, rounds: [...rounds, undoneRound] });
    setMessage(`${undoneRound.round}라운드를 복원했습니다.`);
    setUndoneRound(null);
  };

  const updateLiveCourt = (index: number, status: LiveCourtState["status"]) => {
    const current = Date.now();
    setNow(current);
    setLiveCourts(previous => ({
      ...previous,
      [index]: status === "playing" ? { status, startedAt: current } : status === "finished" ? { ...previous[index], status, finishedAt: current } : { status },
    }));
  };

  const elapsed = (state?: LiveCourtState) => {
    if (!state?.startedAt) return "00:00";
    const seconds = Math.floor(((state.finishedAt || now) - state.startedAt) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const toggleSummary = () => {
    if (!showSummary && rounds.length) setSelectedSummaryRoundNumber(rounds.at(-1)!.round);
    setShowSummary(value => !value);
  };

  if (!session) return null;
  const summaryValidation = validateSchedule(players, rounds);
  const selectedSummaryRound = rounds.find(round => round.round === selectedSummaryRoundNumber) || rounds.at(-1) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br p-4 py-8">
      <div className="max-w-7xl mx-auto space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setLocation("/bracket/badminton")}><ArrowLeft className="w-4 h-4 mr-2" />세션 설정</Button>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right"><p className="font-bold">{session.name}</p><p className="text-sm text-gray-400">현재 {rounds.length + 1}라운드 · {players.length}명 · {session.requestedCourts}코트</p></div>
        </div>

        <section className="bg-white rounded-3xl border p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">이번 라운드 선택</h1><p className="text-sm text-gray-400 mt-1">경기·휴식·단식을 자유롭게 선택하고 만들기 버튼에서 검증합니다.</p></div>{!draft && <div className="flex gap-2"><Button variant="outline" onClick={() => persist({ ...session, restOrder: [...restOrder].sort(() => Math.random() - 0.5) })} disabled={rounds.length > 0}><Shuffle className="w-4 h-4 mr-2" />순서 섞기</Button><Button onClick={applySuggested}>추천 적용</Button></div>}</div>
          <div className="mt-4 rounded-xl border bg-gray-50 p-3 text-sm"><b>휴식 기준:</b> {session.settings.restGapMode === "fixed" ? `세션 고정 · ${session.settings.fixedMinimumGap}라운드 차이` : "라운드별 동적 계산"} · <b>현재 구성:</b> 휴식 {lineup.effectiveRestIds.size}명{lineup.automaticRestIds.size ? ` (자동 ${lineup.automaticRestIds.size}명)` : ""} · 단식 {lineup.soloIds.size}명 · 복식 {lineup.doublesPlayerCount}명</div>
          {directRestWarnings.length > 0 && <div className="mt-3 rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-800"><b className="block">최근 휴식 참가자 직접 지정</b><span>{directRestWarnings.map(({ player, previousRound, actualGap, minimumGap }) => `${player.name}: ${previousRound}라운드 휴식 · 현재 간격 ${actualGap}, 기준 ${minimumGap}`).join(" / ")}</span><span className="block mt-1">경고 후에도 휴식 배치는 가능하며, 최소 휴식 간격 예외로 기록됩니다.</span></div>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 mt-5">
            {players.map(player => {
              const resting = selectedRestIds.has(player.id);
              const solo = lineup.soloIds.has(player.id);
              const automatic = lineup.automaticRestIds.has(player.id);
              const effectiveRest = resting || automatic;
              const gameActive = !effectiveRest && !solo;
              const statusButton = "rounded-lg border border-white/15 bg-white/5 py-1.5 text-[11px] font-semibold text-gray-200 transition-colors hover:bg-white/10 disabled:opacity-50";
              const selectedButton = "border-blue-400 bg-blue-600 text-white shadow-sm shadow-blue-950/30";
              return <div key={player.id} className={`rounded-2xl border p-3 text-center ${solo || effectiveRest ? "border-blue-400 bg-blue-600/10" : "bg-gray-50"}`}><b className="block truncate">{player.name}</b><span className="block text-[11px] text-gray-400 mt-1">누적 휴식 {restCounts[player.name] || 0}회</span>{automatic && !resting && !solo && <span className="block text-[11px] text-blue-400 mt-1">자동 휴식 예정</span>}<div className="grid grid-cols-3 gap-1 mt-2"><button aria-pressed={gameActive} disabled={Boolean(draft)} onClick={() => setPlayerStatus(player.id, "game")} className={`${statusButton} ${gameActive ? selectedButton : ""}`}>경기</button><button aria-pressed={effectiveRest} disabled={Boolean(draft)} onClick={() => setPlayerStatus(player.id, "rest")} className={`${statusButton} ${effectiveRest ? selectedButton : ""}`}>휴식</button><button aria-pressed={solo} disabled={Boolean(draft)} onClick={() => setPlayerStatus(player.id, "singles")} className={`${statusButton} ${solo ? selectedButton : ""}`}>단식</button></div></div>;
            })}
          </div>
          {!draft && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => createDraft(false)}><Play className="w-4 h-4 mr-2" />현재 구성으로 게임 만들기</Button>{approvalNeeded && <><input value={exceptionReason} onChange={event => setExceptionReason(event.target.value)} placeholder="예외 승인 사유" className="min-h-10 rounded-xl border bg-gray-50 px-3" /><Button className="bg-amber-600 hover:bg-amber-700" onClick={() => createDraft(true)}><CheckCircle2 className="w-4 h-4 mr-2" />이번 라운드 예외 승인</Button></>}</div>}
          {!draft && message && <div className={`mt-4 rounded-2xl border p-4 ${approvalNeeded ? "border-amber-400/40 bg-amber-500/10" : "bg-gray-50"}`}>{message}</div>}
        </section>

        <section className="bg-white rounded-3xl border p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">게임 배치</h2><p className="text-sm text-gray-400 mt-1">팀 구분 없이 복식 4명, 단식 2명으로 구성합니다.</p></div>{draft && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={undoMove} disabled={!undoStack.length}><Undo2 className="w-4 h-4" /></Button><Button variant="outline" onClick={redoMove} disabled={!redoStack.length}><Redo2 className="w-4 h-4" /></Button><Button variant="outline" onClick={() => createDraft(draft.approvedExceptions.some(exception => exception.code === "rest_imbalance"))}><Shuffle className="w-4 h-4 mr-2" />다시 배치</Button><Button variant="outline" onClick={() => clearDraft()}><RotateCcw className="w-4 h-4 mr-2" />선택으로 돌아가기</Button></div>}</div>
          {!draft && <div className="py-16 text-center text-gray-400">상단에서 참가자 상태를 선택하고 게임을 만들어주세요.</div>}
          {alternatives.length > 1 && <div className="flex gap-2 mt-5">{alternatives.map((candidate, index) => <Button key={index} size="sm" variant={draft === candidate ? "default" : "outline"} onClick={() => { if (draft) setUndoStack(stack => [...stack, draft]); setDraft(candidate); }}>후보 {index + 1}</Button>)}</div>}
          {draft && <div className="grid grid-cols-1 gap-4 mt-6">{draft.courts.map((court, courtIndex) => {
            const live = liveCourts[courtIndex] || { status: "ready" as const };
            return <div key={courtIndex} className="rounded-3xl border bg-gray-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div><h3 className="text-lg font-bold"><span className="text-blue-400">{draft.round}라운드</span> · 게임 {courtIndex + 1}</h3><span className="text-xs text-gray-400">{court.type === "singles" ? "단식 · 2명" : "복식 · 4명"}</span></div>{session.settings.enableLiveMode && <div className="flex items-center gap-2"><span className="font-mono text-sm">{elapsed(live)}</span>{live.status === "ready" && <Button size="sm" onClick={() => updateLiveCourt(courtIndex, "playing")}><Play className="w-3 h-3 mr-1" />시작</Button>}{live.status === "playing" && <Button size="sm" className="bg-amber-600" onClick={() => updateLiveCourt(courtIndex, "finished")}><Square className="w-3 h-3 mr-1" />종료</Button>}{live.status === "finished" && <Button size="sm" variant="outline" onClick={() => updateLiveCourt(courtIndex, "ready")}><RotateCcw className="w-3 h-3 mr-1" />초기화</Button>}</div>}</div><div className={`grid ${court.type === "singles" ? "grid-cols-2 max-w-xl" : "grid-cols-4"} gap-1.5 sm:gap-3`}>{court.players.map((player, position) => {
              const target = { court: courtIndex, position };
              const active = selectedSlot ? slotKey(selectedSlot) === slotKey(target) : false;
              const swapAvailable = Boolean(selectedSlot) && availableSwapKeys.has(slotKey(target));
              const unavailable = Boolean(selectedSlot) && !active && !swapAvailable;
              return <button key={player.id} disabled={unavailable} draggable={!unavailable} onDragStart={() => { setDraggedSlot(target); setSelectedSlot(target); }} onDragOver={event => { if (!unavailable) event.preventDefault(); }} onDrop={() => draggedSlot && swapSlots(draggedSlot, target)} onDragEnd={() => setDraggedSlot(null)} onClick={() => handleSlotClick(target)} aria-label={`${player.name}${swapAvailable ? ", 교환 가능" : unavailable ? ", 교환 불가" : ""}`} className={`min-w-0 min-h-24 rounded-xl border p-2 sm:p-4 text-center sm:text-left transition ${active ? "border-blue-400 bg-blue-600/20 ring-2 ring-blue-300" : swapAvailable ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300 hover:bg-emerald-100" : unavailable ? "cursor-not-allowed bg-white opacity-35" : "bg-white"}`}><div className="flex justify-center sm:justify-between"><span className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center font-bold">{player.name.slice(0, 1)}</span><GripVertical className="hidden sm:block w-4 h-4 text-gray-400" /></div><b className="block mt-2 truncate">{player.name}</b><span className="block text-[10px] text-gray-400">{skillLabel(player.skill)}</span>{swapAvailable && <span className="block mt-1 text-[10px] font-semibold text-emerald-700">교환 가능</span>}</button>;
            })}</div></div>;
          })}</div>}
          {draft && message && <div className={`mt-5 rounded-2xl border p-4 ${draft.approvedExceptions.length ? "border-amber-400/40 bg-amber-500/10" : "bg-gray-50"}`}>{message}</div>}
          {draft && <div className="flex flex-wrap gap-2 mt-5"><Button variant="outline" onClick={verifyDraft}><CheckCircle2 className="w-4 h-4 mr-2" />현재 배치 검증</Button><Button onClick={confirmRound}><CheckCircle2 className="w-4 h-4 mr-2" />검증 후 라운드 확정</Button></div>}
        </section>

        {rounds.length > 0 && <section className="bg-white rounded-3xl border p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">확정된 라운드</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={undoConfirmedRound}><Undo2 className="w-4 h-4 mr-1" />마지막 확정 취소</Button>
              {undoneRound && <Button variant="outline" size="sm" onClick={restoreConfirmedRound}><Redo2 className="w-4 h-4 mr-1" />복원</Button>}
              {session.settings.showSessionSummary && <Button size="sm" onClick={toggleSummary}><Clock3 className="w-4 h-4 mr-1" />{showSummary ? "요약 닫기" : "요약 보기"}</Button>}
            </div>
          </div>
          {showSummary && <div className="mt-5 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-gray-50 p-4"><b>확정 경기</b><p className="text-2xl mt-1">{rounds.reduce((sum, round) => sum + round.courts.length, 0)}게임</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><b>최대 휴식 편차</b><p className="text-2xl mt-1">{summaryValidation.maximumCumulativeRestSpread}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><b>승인 예외</b><p className="text-2xl mt-1">{summaryValidation.approvedIssues.length}건</p></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500">라운드 선택</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {rounds.map(round => <Button key={round.round} size="sm" variant={selectedSummaryRound?.round === round.round ? "default" : "outline"} onClick={() => setSelectedSummaryRoundNumber(round.round)} className={round.approvedExceptions.length ? "border-amber-400" : ""}>{round.round}R</Button>)}
              </div>
            </div>
            {selectedSummaryRound && <article className={`rounded-3xl border p-4 md:p-6 ${selectedSummaryRound.approvedExceptions.length ? "border-amber-400/40 bg-amber-500/5" : "bg-gray-50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xl font-bold">{selectedSummaryRound.round}라운드</h4>
                <span className="rounded-full border px-3 py-1 text-xs">휴식 기준 {selectedSummaryRound.restRule.minimumGap}라운드 · {selectedSummaryRound.restRule.mode === "fixed" ? "세션 고정" : "라운드별 동적"}</span>
              </div>
              <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center">
                <b className="text-sm text-blue-700">휴식</b>
                <div className="mt-2 flex flex-wrap justify-center gap-2">{selectedSummaryRound.resting.length ? selectedSummaryRound.resting.map(player => <span key={player.id} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900">{player.name}</span>) : <span className="text-sm text-gray-400">휴식자 없음</span>}</div>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                {selectedSummaryRound.courts.map((court, courtIndex) => <div key={courtIndex} className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between gap-2"><b>팀 {courtIndex + 1}</b><span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">{court.type === "singles" ? "단식" : "복식"}</span></div><div className="mt-3 flex flex-wrap gap-2">{court.players.map(player => <span key={player.id} className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-medium">{player.name}</span>)}</div></div>)}
              </div>
              {selectedSummaryRound.approvedExceptions.length > 0 && <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-800">{selectedSummaryRound.approvedExceptions.map(exception => { const names = selectedSummaryRound.resting.filter(player => exception.playerIds.includes(player.id)).map(player => player.name).join(" · "); return `${names ? `${names}: ` : ""}${exception.priorRestRound === undefined ? exceptionLabel(exception) : `${exception.priorRestRound}→${selectedSummaryRound.round}라운드 휴식 간격 ${exception.actualGap}, 기준 ${exception.minimumGap} · 예외 승인`} · 사유: ${exception.reason}`; }).join(" / ")}</div>}
            </article>}
          </div>}
        </section>}
        <Footer />
      </div>
    </div>
  );
}
