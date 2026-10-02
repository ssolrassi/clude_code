---
description: 카테고리별 키워드뱅크/벤치마크/금칙어/이미지 시스템 설정 (Phase 3, 15분)
argument-hint: (인자 없음)
---

# /setup-domain — 도메인 특화 설정 (Phase 3)

여러분의 주력 카테고리에 맞는 키워드뱅크, 업계 벤치마크, 산업별 금칙어, 이미지 디자인 시스템을 설정합니다.

## 사전 조건

- `/setup` 완료
- 가급적 `/setup-tone`도 완료 (필수는 아님)

## 실행 절차

1. `setup-interviewer` 서브에이전트 호출 (Phase 3 모드).
2. `knowledge/brand-facts.md`에서 주력 카테고리 1~3개 읽기.
3. **카테고리별로 순회** (각 카테고리당 3질문, 약 5분):
   - **Q1**: "이 카테고리의 주요 키워드 5~10개?" → `keyword-bank/{slug}.yml` 생성
   - **Q2**: "이 카테고리에 적용되는 법령/규제 단어가 있나요?" → `knowledge/banned-words.json` `domain_specific.words` 추가
   - **Q3**: "이 카테고리의 업계 벤치마크 수치 아시는 것?" → `knowledge/conversion-benchmarks.md` 업데이트
4. **이미지 디자인 시스템** (선택, 5분):
   - 브랜드 컬러 3개 (배경 / 메인 / 포인트, hex)
   - 폰트 스타일 (산세리프 / 세리프 / 혼합)
   - 로고 텍스트 (이미지에 박힐 정확한 표기 — 알파벳 대소문자 정확히)
   - → `scripts/generate-images.js`의 BRAND_NAME, BG_COLOR, ACCENT_COLOR 상수 자동 치환
5. **medical-law-checker 활성화 여부**: 의료/뷰티/제약 카테고리 있으면 활성화 권장

## 출력물

- `keyword-bank/<카테고리1>.yml`
- `keyword-bank/<카테고리2>.yml`
- `keyword-bank/<카테고리3>.yml`
- `knowledge/banned-words.json` (도메인 단어 추가됨)
- `knowledge/conversion-benchmarks.md` (벤치마크 채워짐)
- `scripts/generate-images.js` (브랜드 시스템 치환됨)

## 완료 후 안내

```
✅ Phase 3 완료 — 도메인 특화 설정 끝났습니다.

이제 다음 명령으로 첫 글을 쓸 수 있어요:
  /blog-new "키워드"

추천 시작 키워드: keyword-bank/<카테고리>.yml의 시드 키워드 중 하나
```
