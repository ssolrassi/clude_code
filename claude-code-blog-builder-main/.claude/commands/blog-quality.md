---
description: 특정 글 폴더의 품질검사·유사도검사 재실행
argument-hint: <폴더명 또는 경로>
---

"$ARGUMENTS" 경로의 블로그 글을 재검사합니다.

1. 폴더 경로 추정:
   - 사용자가 `2026-04-08_상세페이지AI` 같은 폴더명만 줬다면 `output/$ARGUMENTS/post.md`
   - 전체 경로면 그대로 사용

2. 품질검사:
   ```bash
   node scripts/quality-check.js --file "output/.../post.md" --keyword "<폴더명에서 추출>"
   ```

3. 유사도 검사:
   ```bash
   node scripts/duplicate-check.js --file "output/.../post.md"
   ```

4. 결과를 표 형식으로 사용자에게 보고:
   - 전 항목 PASS/WARN 상태
   - 유사도 상위 3건
   - 경고가 있으면 어느 부분을 어떻게 수정할지 구체 제안 (수정은 하지 않음, 제안만)

사용자가 "고쳐줘" 라고 하면 그때 Edit으로 수정 후 재검사.
