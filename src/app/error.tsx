"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="message-page">
      <p className="eyebrow">TEMPORARY ERROR</p>
      <h1>잠시 문제가 생겼습니다.</h1>
      <p>입력한 내용은 그대로 두고, 아래 버튼으로 다시 시도해 주세요.</p>
      <button className="text-link button-link" type="button" onClick={reset}>다시 시도하기</button>
    </main>
  );
}
