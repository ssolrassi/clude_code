# keyword-bank/ — 카테고리별 롱테일 키워드 풀

카테고리별로 SEO 자산이 될 키워드를 누적 관리합니다. "오늘 뭘 쓸까" 고민할 시간을 줄이고, 카테고리별 노하우 연재로 장기 SEO 자산을 쌓는 것이 목적입니다.

## 파일 목록 (예시)

| 파일 | 카테고리 |
|:---|:---|
| `detail-page.yml` | 상세페이지/커머스 (예시) |
| `hospital-marketing.yml` | 병원 마케팅 (예시) |
| `beauty-brand.yml` | 뷰티 브랜드 (예시) |
| `ai-marketing.yml` | AI 마케팅 (예시) |

> ⚠️ 위 4개 파일은 **예시 시드**입니다. 여러분 카테고리에 맞는 yml은 `/setup-domain` 명령으로 자동 생성됩니다.

## 데이터 형식

```yaml
keywords:
  - keyword: "상세페이지 제작 비용"
    intent: pricing            # pricing / comparison / how-to / case-study / trend
    funnel_stage: comparison   # awareness / interest / comparison / decision
    priority: high             # high / medium / low
    competition: unknown       # high / medium / low / unknown — research.js로 검증 후 갱신
    suggested_pattern: 4       # 12패턴 중 추천 번호
    longtails:
      - "상세페이지 제작 비용 평균"
      - "스마트스토어 상세페이지 외주 비용"
    last_used: null            # 마지막 사용 날짜 (중복 방지)
    notes: ""
```

## 사용 흐름

1. 새 글 쓸 때 카테고리 yml 열어서 `last_used: null` 또는 `30일 이전` 키워드 골라
2. `priority: high` 우선
3. `/blog-research <키워드>` → 경쟁도 검증
4. 글 작성 → `last_used` 갱신

## 업데이트 원칙

- `competition` 필드는 `research.js` 결과로 한 달에 한 번 일괄 업데이트
- 새 키워드는 `priority: medium`부터 시작
- 사용 후 반드시 `last_used` 기록 (중복 발행 방지)
- 발행해서 잘 나온 키워드는 `notes` 에 성과 메모

## ⚠️ 주의

이 파일의 키워드는 **시드 후보**입니다. 실제 발행 전 반드시:
1. 여러분 사업 방향과 부합하는지 사람이 한 번 더 확인
2. `research.js` 로 경쟁도 실측
3. 의료법 키워드면 `medical-law-checker` 사전 통과
