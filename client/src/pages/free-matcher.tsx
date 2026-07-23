import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Dices, Minus, Plus, RotateCcw, UsersRound } from "lucide-react";
import { HubBackdrop, HubNav } from "@/components/HubNav";
import { useSEO } from "@/hooks/use-seo";

const defaultNames = ["참가자 1", "참가자 2", "참가자 3", "참가자 4", "참가자 5", "참가자 6", "참가자 7", "참가자 8"];

function shuffle<T>(values: T[]): T[] {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i--) {
    const target = Math.floor(Math.random() * (i + 1));
    [next[i], next[target]] = [next[target], next[i]];
  }
  return next;
}

export default function FreeMatcherPage() {
  const [, setLocation] = useLocation();
  const [namesText, setNamesText] = useState(defaultNames.join("\n"));
  const [groupCount, setGroupCount] = useState(2);
  const [playersPerGroup, setPlayersPerGroup] = useState(4);
  const [groups, setGroups] = useState<string[][]>([]);
  const [resting, setResting] = useState<string[]>([]);
  const [restCounts, setRestCounts] = useState<Record<string, number>>({});

  useSEO({ title: "자유 매칭 | 버라이어티 퀴즈", description: "인원과 그룹 크기를 설정해 공정하게 팀을 나누세요.", keywords: "자유매칭, 팀나누기, 조편성" });
  const names = useMemo(() => namesText.split(/\r?\n|,/).map(name => name.trim()).filter(Boolean), [namesText]);
  const capacity = groupCount * playersPerGroup;

  const generate = () => {
    const ordered = shuffle(names).sort((a, b) => (restCounts[b] || 0) - (restCounts[a] || 0));
    const active = ordered.slice(0, capacity);
    const nextResting = ordered.slice(capacity);
    const activeGroupCount = Math.min(groupCount, Math.ceil(active.length / playersPerGroup));
    setGroups(Array.from({ length: activeGroupCount }, (_, index) => active.slice(index * playersPerGroup, (index + 1) * playersPerGroup)));
    setResting(nextResting);
    setRestCounts(previous => Object.fromEntries(names.map(name => [name, (previous[name] || 0) + (nextResting.includes(name) ? 1 : 0)])));
  };

  return (
    <main className="home-shell hub-page">
      <HubBackdrop />
      <div className="home-container">
        <HubNav />
        <button className="hub-back" onClick={() => setLocation("/matching")}><ArrowLeft /> 매칭 방식 선택</button>
        <section className="free-layout">
          <div className="free-config">
            <span className="hub-kicker">FLEXIBLE MODE</span>
            <h1>자유 매칭</h1>
            <p>참가자 이름과 그룹 구성을 입력하면 무작위로 공정하게 나눠드려요.</p>
            <label>참가자 명단 <span>{names.length}명</span>
              <textarea value={namesText} onChange={event => setNamesText(event.target.value)} placeholder="한 줄에 한 명씩 입력하세요" />
            </label>
            <div className="free-steppers">
              <Stepper label="그룹 수" value={groupCount} suffix="개" onChange={setGroupCount} min={1} max={12} />
              <Stepper label="그룹별 인원" value={playersPerGroup} suffix="명" onChange={setPlayersPerGroup} min={1} max={20} />
            </div>
            <div className="free-capacity"><UsersRound /><span>이번 라운드 참여</span><strong>{Math.min(names.length, capacity)}명</strong><small>· 휴식 {Math.max(0, names.length - capacity)}명</small></div>
            <button className="free-generate" onClick={generate} disabled={names.length === 0}><Dices /> 매칭 생성하기</button>
          </div>
          <div className="free-result">
            <div className="free-result-head"><div><span className="hub-kicker">RESULT</span><h2>매칭 결과</h2></div>{groups.length > 0 && <button onClick={generate}><RotateCcw /> 다시 섞기</button>}</div>
            {groups.length === 0 ? (
              <div className="free-empty"><Dices /><b>아직 생성된 매칭이 없어요</b><p>설정을 확인하고 매칭 생성하기를 눌러주세요.</p></div>
            ) : (
              <div className="free-groups">
                {groups.map((group, index) => <article key={index}><span>GROUP {index + 1}</span><h3>그룹 {index + 1}</h3>{group.map((name, order) => <div key={`${name}-${order}`}><i>{order + 1}</i>{name}</div>)}</article>)}
                {resting.length > 0 && <article className="free-rest"><span>REST</span><h3>이번 라운드 휴식</h3><p>{resting.join(" · ")}</p></article>}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stepper({ label, value, suffix, onChange, min, max }: { label: string; value: number; suffix: string; onChange: (value: number) => void; min: number; max: number }) {
  return <div className="free-stepper"><span>{label}</span><div><button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`${label} 줄이기`}><Minus /></button><strong>{value}{suffix}</strong><button onClick={() => onChange(Math.min(max, value + 1))} aria-label={`${label} 늘리기`}><Plus /></button></div></div>;
}
