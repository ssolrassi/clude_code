---
description: 사용자 회사 블로그 URL에서 실제 글 본문을 자동 수집하여 톤 학습 (Phase 2, 10분)
argument-hint: (인자 없음 — 인터뷰에서 URL 입력받음)
---

# /setup-tone — 톤 학습 (Phase 2)

여러분 회사의 실제 블로그 글을 수집해서 AI가 톤을 학습하게 합니다. 첫 글의 품질을 크게 올립니다.

## 사전 조건

- `/setup` 완료 (knowledge/brand-facts.md 존재 + placeholder 아님)
- 운영 중인 블로그 또는 벤치마킹할 블로그 URL 3~5개 보유

## 실행 절차

1. `setup-interviewer` 서브에이전트 호출 (Phase 2 모드).
2. 서브에이전트가 다음을 묻는다:
   > "여러분 회사가 이미 운영 중인 블로그 글 URL 3~5개를 알려주세요. 줄바꿈으로 구분.
   > (없으면 경쟁사/벤치마킹하는 회사 URL도 OK. 같은 산업이면 됩니다)"
3. URL 검증 (도메인 다양성, 형식)
4. 자동 수집 실행:
   ```bash
   node scripts/setup-tone-fetch.js --urls "URL1,URL2,URL3" --output "knowledge/tone-samples/real-blog-posts.txt"
   ```
5. 결과 확인:
   - 수집 텍스트 길이 (목표 80KB+, 최소 30KB)
   - 너무 적으면 URL 추가 요청
6. 시그니처 문장 5개 자동 추출 → 사용자에게 보여주고 검증
7. CLAUDE.md에 "톤 시그니처" 섹션 자동 추가

## 실패 처리

- 일부 URL 수집 실패 → 성공한 것만으로 진행, 실패 URL 보고
- 모두 실패 → "수동 모드"로 전환: 사용자에게 "글 5~10편을 직접 복사해서 knowledge/tone-samples/real-blog-posts.txt에 붙여넣어주세요" 안내
