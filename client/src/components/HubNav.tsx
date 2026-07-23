import { Dice5 } from "lucide-react";
import { useLocation } from "wouter";

export function HubNav() {
  const [, setLocation] = useLocation();

  return (
    <header className="home-nav hub-simple-nav">
      <button className="home-brand" onClick={() => setLocation("/")} aria-label="홈으로 이동">
        <span className="home-brand-mark"><Dice5 /></span>
        <span>버라이어티 퀴즈</span>
      </button>
      <span className="home-nav-label">PLAY YOUR WAY</span>
    </header>
  );
}

export function HubBackdrop() {
  return (
    <>
      <div className="home-aurora home-aurora-blue" />
      <div className="home-aurora home-aurora-coral" />
      <div className="home-noise" />
    </>
  );
}
