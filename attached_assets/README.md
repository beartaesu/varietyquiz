# Assets 폴더

이 폴더는 애플리케이션에서 사용하는 이미지 파일들을 저장합니다.

## 필요한 이미지 파일

다음 이미지 파일들을 `generated_images/` 폴더에 추가해주세요:

1. `Colorful_board_game_collection_b62010fc.png` - 보드게임 컬렉션 이미지
2. `Board_game_pieces_variety_5429783a.png` - 게임 조각들 이미지
3. `Quiz_show_board_game_227373d9.png` - 퀴즈 게임 이미지

## 이미지 생성 방법

이미지가 없는 경우 다음 방법으로 생성할 수 있습니다:

### 옵션 1: AI 이미지 생성 도구 사용
- DALL-E, Midjourney, Stable Diffusion 등
- 프롬프트 예시:
  - "Colorful board game collection on a table, top view"
  - "Various board game pieces, dice, tokens, cards"
  - "Quiz show game board with bright colors"

### 옵션 2: 무료 이미지 사이트
- Unsplash (https://unsplash.com)
- Pexels (https://pexels.com)
- Pixabay (https://pixabay.com)

검색어: "board game", "quiz game", "game pieces"

### 옵션 3: Placeholder 이미지 사용
임시로 단색 이미지를 사용할 수 있습니다:
- 크기: 800x600px
- 형식: PNG
- 배경색: 밝은 색상

## 이미지 최적화

배포 전 이미지를 최적화하면 로딩 속도가 향상됩니다:

```bash
# TinyPNG (https://tinypng.com) 또는
# ImageOptim (https://imageoptim.com) 사용
```

권장 사양:
- 최대 크기: 1200x800px
- 파일 크기: 200KB 이하
- 형식: PNG 또는 WebP
