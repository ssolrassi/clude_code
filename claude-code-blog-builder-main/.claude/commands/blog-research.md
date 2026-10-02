---
description: 키워드 리서치만 실행 (STEP 1, 글은 쓰지 않음)
argument-hint: <키워드>
---

"$ARGUMENTS" 키워드의 네이버 리서치만 수행합니다.

1. `scripts/research.js` 실행:
   ```bash
   set -a && . ./.env && set +a && node scripts/research.js --keyword "$ARGUMENTS"
   ```

2. API 인증 실패 시 웹 검색(`WebSearch`)으로 대체:
   - 해당 키워드로 네이버 블로그 상위 10개 제목
   - 연관 롱테일 키워드 후보
   - 경쟁도 체감치

3. 분석 리포트를 사용자에게 제시:
   - 경쟁도 평가 (높음/보통/낮음)
   - 추천 롱테일 키워드 5~8개
   - 글 작성 시 어떤 패턴(12종 중)이 적합할지 제안
   - 피해야 할 표현 (이미 포화된 제목 유형)

**글은 작성하지 않습니다.** 사용자가 "좋아, 이 방향으로 써줘" 라고 하면 그때 `/blog-new` 로 진행.
