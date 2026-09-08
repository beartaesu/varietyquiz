"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main className="message-page">
          <p>서비스를 불러오지 못했습니다.</p>
          <button type="button" onClick={reset}>다시 시도하기</button>
        </main>
      </body>
    </html>
  );
}
