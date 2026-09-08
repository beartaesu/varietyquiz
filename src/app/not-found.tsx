import Link from "next/link";

export default function NotFound() {
  return (
    <main className="message-page">
      <p className="eyebrow">404 · NOT FOUND</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p>주소가 바뀌었거나 아직 공개되지 않은 콘텐츠일 수 있습니다.</p>
      <Link className="text-link" href="/">홈으로 돌아가기</Link>
    </main>
  );
}
