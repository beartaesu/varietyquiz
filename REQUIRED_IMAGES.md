# 🖼️ 필요한 이미지 파일 목록

## 📋 현재 상황

프로젝트에서 사용하는 이미지는 **2가지 종류**입니다:

### 1. 배경 이미지 (UI용) - 3개 파일
### 2. 연예인 사진 (퀴즈용) - 데이터베이스에서 관리

---

## 🎨 1. 배경 이미지 (필수)

### 위치
```
attached_assets/generated_images/
```

### 필요한 파일 3개
1. **`Colorful_board_game_collection_b62010fc.png`**
   - 용도: 홈페이지 배경
   - 내용: 다채로운 보드게임 컬렉션
   - 크기: 800x600px 권장

2. **`Board_game_pieces_variety_5429783a.png`**
   - 용도: 홈페이지 배경
   - 내용: 다양한 게임 조각들 (주사위, 토큰, 카드)
   - 크기: 800x600px 권장

3. **`Quiz_show_board_game_227373d9.png`**
   - 용도: 홈페이지 배경 + SEO 이미지
   - 내용: 퀴즈 게임 보드
   - 크기: 1200x630px 권장 (SNS 공유용)

### 사용되는 페이지
- 홈페이지 (`main-home.tsx`)
- 대진표 카테고리 (`bracket-categories.tsx`)
- 사이트맵 (`sitemap.tsx`)
- SEO 메타 태그 (SNS 공유 시)

---

## 👤 2. 연예인 사진 (자동 처리됨)

### 현재 상태
- ✅ **자동으로 처리됨** - 수동 작업 불필요
- ✅ Naver API로 실제 연예인 사진 검색
- ✅ 실패 시 Unsplash placeholder 사용

### 포함된 연예인 (예시)
```typescript
// server/storage.ts에서 자동 관리
박서준, 아이유, 송혜교, 현빈, 김고은, 이민호, 박보영, 
차은우, 정우성, 전지현, 지드래곤, 수지, 박신혜 등...
```

### 이미지 소스
1. **1순위**: Naver 이미지 검색 API (실제 연예인 사진)
2. **2순위**: Unsplash placeholder (검색 실패 시)

---

## 🚨 배포 전 필수 작업

### 배경 이미지 3개 파일만 추가하면 됩니다!

#### 방법 1: AI 생성 (추천)
**DALL-E, Midjourney, ChatGPT 등 사용**

**프롬프트 예시**:
```
1. "Colorful board game collection on a table, top view, bright colors"
2. "Various board game pieces, dice, tokens, cards scattered on table"
3. "Quiz show game board with bright colors and game elements"
```

#### 방법 2: 무료 이미지 사이트
**Unsplash, Pexels, Pixabay**

**검색어**:
- "board game collection"
- "game pieces dice"
- "quiz game board"

#### 방법 3: 임시 이미지 (빠른 테스트용)
단색 배경 이미지로 임시 대체 가능

---

## 📁 파일 구조

```
varietyquiz/
├── attached_assets/
│   ├── generated_images/          ← 여기에 3개 파일 추가
│   │   ├── Colorful_board_game_collection_b62010fc.png
│   │   ├── Board_game_pieces_variety_5429783a.png
│   │   └── Quiz_show_board_game_227373d9.png
│   └── README.md
```

---

## ⚡ 빠른 해결 방법

### 임시 배포용 (5분)
1. 아무 이미지나 3개 다운로드
2. 파일명을 정확히 맞춰서 저장
3. `attached_assets/generated_images/` 폴더에 업로드
4. Git 커밋 & 푸시

### 완벽한 배포용 (20분)
1. AI 도구로 적절한 이미지 3개 생성
2. 크기 최적화 (800x600px, 200KB 이하)
3. 파일명 정확히 맞춰서 저장
4. Git 커밋 & 푸시

---

## 🔧 이미지 없이 배포하면?

### 증상
- 홈페이지에서 이미지가 깨져서 표시됨
- 기능은 정상 작동하지만 UI가 이상함

### 해결
- 이미지 3개만 추가하면 즉시 해결됨
- Railway가 자동으로 재배포함

---

## 📊 우선순위

### 1순위 (필수)
- [ ] `Quiz_show_board_game_227373d9.png` (SEO 중요)

### 2순위 (권장)
- [ ] `Colorful_board_game_collection_b62010fc.png`
- [ ] `Board_game_pieces_variety_5429783a.png`

### 연예인 사진
- ✅ **자동 처리됨** - 작업 불필요

---

## 💡 팁

### 파일명 주의사항
- **정확히 일치**해야 함 (대소문자, 언더스코어 포함)
- 확장자는 `.png` 고정

### 크기 권장사항
- 너무 크면 로딩 느림 (2MB 이하 권장)
- 너무 작으면 화질 저하 (최소 400x300px)

### 테스트 방법
1. 이미지 추가 후 Git 푸시
2. Railway 자동 재배포 대기
3. 홈페이지에서 이미지 로딩 확인

---

## 🎯 결론

**연예인 사진은 이미 자동으로 처리되고 있습니다!**

**배포를 위해서는 배경 이미지 3개만 추가하면 됩니다.**

1. 이미지 3개 준비 (AI 생성 또는 다운로드)
2. `attached_assets/generated_images/` 폴더에 저장
3. Git 커밋 & 푸시
4. Railway 배포 진행

**이미지 없이도 배포는 가능하지만, UI가 완벽하지 않습니다.**