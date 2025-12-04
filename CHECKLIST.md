# 배포 전 체크리스트 ✅

프로젝트를 배포하기 전에 다음 항목들을 확인하세요.

## 필수 항목

### 1. 환경 설정
- [ ] `.env` 파일 생성 및 설정
- [ ] `DATABASE_URL` 설정 완료
- [ ] 데이터베이스 연결 테스트 완료

### 2. 이미지 파일
- [ ] `attached_assets/generated_images/` 폴더에 이미지 추가
  - [ ] `Colorful_board_game_collection_b62010fc.png`
  - [ ] `Board_game_pieces_variety_5429783a.png`
  - [ ] `Quiz_show_board_game_227373d9.png`

### 3. 빌드 테스트
- [ ] `npm install` 성공
- [ ] `npm run check` 타입 체크 통과
- [ ] `npm run build` 빌드 성공
- [ ] `npm run dev` 로컬 실행 확인

### 4. 데이터베이스
- [ ] 데이터베이스 마이그레이션 완료 (`npm run db:push`)
- [ ] 연예인 데이터 추가 (선택사항)

## 선택 항목

### 5. API 키 (선택사항)
- [ ] Naver API 키 설정 (이미지 검색용)
- [ ] Google Cloud Storage 설정 (이미지 저장용)

### 6. SEO 설정
- [ ] `client/index.html`에서 도메인 URL 수정
- [ ] `client/src/hooks/use-seo.ts`에서 baseUrl 수정
- [ ] Open Graph 이미지 경로 확인

### 7. Git 설정
- [ ] `.gitignore` 확인
- [ ] `.env` 파일이 Git에 포함되지 않는지 확인
- [ ] 민감한 정보 제거 확인

## 배포 플랫폼별 체크리스트

### Vercel
- [ ] `vercel.json` 설정 확인
- [ ] 환경 변수 Vercel 대시보드에 추가
- [ ] 빌드 명령어: `npm run build`
- [ ] 출력 디렉토리: `dist`

### Railway
- [ ] `railway.json` 설정 확인
- [ ] PostgreSQL 서비스 추가
- [ ] 환경 변수 설정
- [ ] 자동 배포 활성화

### Render
- [ ] `render.yaml` 설정 확인
- [ ] PostgreSQL 데이터베이스 생성
- [ ] 환경 변수 설정
- [ ] 빌드 명령어 확인

### Docker
- [ ] `Dockerfile` 테스트
- [ ] `.dockerignore` 확인
- [ ] 로컬에서 Docker 빌드 테스트
```bash
docker build -t varietyquiz .
docker run -p 5000:5000 --env-file .env varietyquiz
```

## 배포 후 확인사항

### 1. 기능 테스트
- [ ] 홈페이지 로딩 확인
- [ ] 퀴즈 게임 작동 확인
- [ ] 배드민턴 매칭 작동 확인
- [ ] 이미지 로딩 확인
- [ ] 모바일 반응형 확인

### 2. 성능 확인
- [ ] 페이지 로딩 속도 확인
- [ ] 이미지 최적화 확인
- [ ] API 응답 속도 확인

### 3. SEO 확인
- [ ] 메타 태그 확인
- [ ] Open Graph 이미지 확인
- [ ] 사이트맵 확인

### 4. 보안 확인
- [ ] HTTPS 적용 확인
- [ ] 환경 변수 노출 여부 확인
- [ ] CORS 설정 확인

## 문제 해결

### 빌드 실패
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 데이터베이스 연결 실패
- DATABASE_URL 형식 확인
- 데이터베이스 서버 실행 확인
- 방화벽/보안 그룹 설정 확인

### 이미지 로딩 실패
- 이미지 파일 경로 확인
- 이미지 파일 존재 여부 확인
- 빌드 시 이미지 포함 여부 확인

## 추가 리소스

- [QUICKSTART.md](./QUICKSTART.md) - 빠른 시작 가이드
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 상세 배포 가이드
- [README.md](./README.md) - 프로젝트 개요

---

모든 항목을 확인했다면 배포를 시작하세요! 🚀
