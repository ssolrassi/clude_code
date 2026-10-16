# Claude Code Blog Builder

이 프로젝트는 Claude Code에서 직접 실행하는 블로그 콘텐츠 자동화 도구입니다.
사용자가 "이 키워드로 블로그 글 만들어줘"라고 요청하면 키워드 리서치 → 초안 생성 → 이미지 생성 → 품질 검증 → 발행 어시스턴트까지 수행합니다.

> ⚠️ **이 시스템은 1개 블로그를 직접 운영하는 경우에 최적화되어 있습니다.**
> 멀티 카테고리 운영, 저품질 복구, 발행 스케줄링, 외주팀 워크플로우 등은 상위 솔루션이 필요합니다.

---

## 🚀 처음 사용한다면 — `/setup` 부터

이 레포는 **누구나 자기 회사에 맞게 사용**할 수 있도록 템플릿화되어 있습니다.
처음 clone 받았다면 가장 먼저 다음 명령을 실행하세요:

```
/setup
```

5분 인터뷰를 통해 `knowledge/brand-facts.md`가 자동으로 채워지며, 이후 `/blog-new "키워드"` 한 줄로 글 한 편이 나옵니다.

**Phase 1 (5분, 필수)** → `/setup`
**Phase 2 (10분, 권장)** → `/setup-tone` (여러분 회사 블로그 URL에서 톤 자동 학습)
**Phase 3 (15분, 선택)** → `/setup-domain` (카테고리별 키워드 뱅크 + 산업별 금칙어)

---

## 프로젝트 구조

```
claude-code-blog-builder/
├── CLAUDE.md              # 이 파일 (Claude Code 지시서)
├── README.md
├── INSTALL.md             # 30초 설치 가이드
├── package.json           # 외부 의존성 0
│
├── knowledge/             # ⭐ Single Source of Truth
│   ├── README.md
│   ├── brand-facts.template.md          # 공개 템플릿
│   ├── brand-facts.md                   # /setup이 생성 (gitignored)
│   ├── conversion-benchmarks.template.md
│   ├── conversion-benchmarks.md
│   ├── banned-words.template.json
│   ├── banned-words.json
│   ├── tone-samples/                    # /setup-tone이 채움
│   └── patterns/
│
├── scripts/
│   ├── research.js              # 네이버 API 키워드 리서치
│   ├── generate-images.js       # Nano Banana Pro 이미지 생성
│   ├── quality-check.js         # 7항목 결정론 채점
│   ├── duplicate-check.js       # 6-gram Jaccard 유사도
│   ├── hook-post-write.js       # PostToolUse 훅 라우터
│   ├── preview.js               # 발행 어시스턴트 (HTML)
│   ├── setup-tone-fetch.js      # 블로그 URL 본문 수집
│   └── sanitize-check.sh        # push 전 게이트
│
├── templates/
│   ├── thumbnail.html
│   ├── infographic.html
│   └── quote-card.html
│
├── .claude/
│   ├── settings.json            # PostToolUse 훅 등록
│   ├── commands/
│   │   ├── setup.md             # /setup
│   │   ├── setup-tone.md
│   │   ├── setup-domain.md
│   │   ├── blog-new.md          # /blog-new
│   │   ├── blog-research.md
│   │   ├── blog-quality.md
│   │   ├── blog-publish-ready.md
│   │   └── blog-preview.md
│   └── agents/
│       ├── setup-interviewer.md
│       ├── blog-researcher.md
│       ├── blog-writer.md
│       ├── blog-quality-reviewer.md
│       └── medical-law-checker.md
│
├── keyword-bank/                # 카테고리별 시드 키워드
│   ├── README.md
│   ├── detail-page.yml          # 예시
│   ├── hospital-marketing.yml   # 예시
│   ├── beauty-brand.yml         # 예시
│   └── ai-marketing.yml         # 예시
│
├── output/                      # 생성된 결과물 (gitignored)
│   └── .gitkeep
│
└── docs/
    ├── how-it-works.md
    ├── setup-guide.md
    └── troubleshooting.md
```

---

## 사용법

`/setup` 완료 후:

```
/blog-new "병원 마케팅"
/blog-new "AI 마케팅 트렌드"
/blog-new "상세페이지 제작 비용"
```

---

## 실행 파이프라인

### STEP 1: 키워드 리서치

`scripts/research.js`를 사용합니다 (네이버 Search API 자동 호출 + 분석).

```bash
node scripts/research.js --keyword "<키워드>" --output "output/<날짜>_<키워드>"
```

스크립트가 자동으로 수행:
- 블로그 전체 포스팅 수 → 경쟁도 판정 (10만+: 높음 / 3만+: 보통 / 미만: 낮음)
- 최근 30일 포스팅 비율 → 트렌드 활성도
- 상위 글 제목에서 연관 키워드 TOP 15 추출
- 롱테일 키워드 8개 자동 제안
- `research.json` 파일 저장

API 인증 실패 시 웹 검색 기반으로 대체 리서치.

### STEP 2: 콘텐츠 생성

**⚠️ 필수 사전 작업 — 글을 쓰기 전에 반드시 아래 파일을 Read로 읽을 것:**

1. `knowledge/brand-facts.md` — 회사 수치·인증 (Single Source of Truth, **이 파일 외의 숫자 사용 금지**)
2. `knowledge/tone-samples/real-blog-posts.txt` — 회사 블로그 문체 학습 (있을 경우)
3. `knowledge/patterns/writing-playbook.txt` — 글쓰기 패턴 가이드 (있을 경우)
4. `knowledge/banned-words.json` — 금칙어 + 도메인 단어
5. `output/_index.json` — 최근 사용한 패턴/도입부 확인 → **의도적으로 다른 조합 선택**
6. (수치 인용 시) `knowledge/conversion-benchmarks.md`

> `brand-facts.md`가 placeholder 상태(`[PLACEHOLDER]`로 시작)면 먼저 사용자에게 `/setup` 실행을 안내하고 멈출 것.

#### 글쓰기 원칙

- `brand-facts.md`에 없는 수치 사용 금지 (픽션 금지). AI 추측 숫자는 신뢰를 박살낸다.
- 회사 톤 시그니처 표현(`tone-samples`에서 추출)을 자연스럽게 2개 이상 삽입
- 도입부 4줄 공식: 문제 → 손실 → 자격 → 끝까지 읽으면 얻을 것
- A.E.A 구조: 권위(Authority) → 근거(Evidence) → 행동(Action)
- 본문 1,500~3,000자, 메인 키워드 5~12회 자연 삽입
- `[IMAGE: 설명]` 마커 최소 4개
- 외부 링크 0건 (네이버 저품질 트리거)
- 최상급/금칙어 0건 (`banned-words.json` 참조)
- 표 1개 이상 삽입

#### 출력 형식

`output/{날짜}_{키워드}/` 폴더에:

1. `post.md` — 블로그 본문 (마크다운)
2. `post.html` — 스마트에디터 붙여넣기용 HTML
3. `metadata.json` — 제목, 태그, 메타설명, 키워드 리포트
4. `guide.md` — 편집 가이드 (이미지 위치, 수정 포인트)

### STEP 3: 이미지 생성

Nano Banana Pro (Gemini 3 Pro Image) API 사용. 외부 의존성 0.

브랜드 시스템은 `.env`로 주입 (`/setup-domain`이 자동 설정):
- `BRAND_NAME` — 이미지에 박힐 브랜드명
- `BRAND_BG_COLOR` / `BRAND_FG_COLOR` / `BRAND_ACCENT` — 컬러팔레트

```bash
GEMINI_API_KEY=your_key node scripts/generate-images.js \
  --title "글 제목" \
  --keyword "키워드" \
  --points "포인트1|||포인트2|||포인트3" \
  --quote "핵심 문구" \
  --steps "단계1|||단계2|||단계3" \
  --output "output/폴더/images"
```

생성 이미지 4종:
1. **썸네일** (16:9) — 메인 키워드 + 브랜드 로고
2. **인포그래픽** (2:3) — 핵심 포인트 시각화
3. **인용 카드** (1:1) — 핵심 문구 강조
4. **프로세스 다이어그램** (4:3) — 단계별 시각화

매번 고유 이미지 (동일 이미지 재사용은 네이버 유사 문서 판정 트리거).

### STEP 4: 품질 검증 + 유사도 검사

**자동 훅으로 실행됨** — `post.md`를 Write/Edit 하면 `.claude/settings.json` 훅이 아래 두 스크립트를 자동 실행합니다:

```bash
node scripts/quality-check.js --file "output/폴더/post.md" --keyword "키워드"
node scripts/duplicate-check.js --file "output/폴더/post.md" [--threshold 25]
```

`duplicate-check.js`는 6-gram Jaccard 유사도 계산. 임계값 25% 초과 시 경고.

검사 항목:
- ✅ 키워드 빈도 (5~12회 권장)
- ✅ 글자수 (≥ 1,500)
- ✅ 어미 반복 (3회 연속 금지)
- ✅ 이미지 마커 수 (≥ 4개)
- ✅ 외부 링크 0건
- ✅ 최상급/금칙어 0건
- ✅ 접속사 비율 ≤ 5%

의료/뷰티 키워드는 추가로 `medical-law-checker` 서브에이전트 호출.

### STEP 4.5: 발행 어시스턴트

`scripts/preview.js`가 작성된 글을 self-contained HTML로 렌더링하고 브라우저로 엽니다.

```bash
node scripts/preview.js --folder "output/폴더"
```

브라우저에서:
- 제목·태그·메타설명 카드 (각각 클립보드 복사)
- 본문 섹션별 "서식 포함 복사" / "텍스트만 복사"
- 이미지 4장 개별/일괄 다운로드
- 발행 체크리스트 10개

네이버 발행 API가 폐쇄돼 있어 자동 발행은 불가하지만, 이 도구로 복붙 마찰을 최소화합니다.

### STEP 5: 최종 패키지

`output/{날짜}_{키워드}/` 폴더 구조:
```
output/2026-04-08_my-keyword/
├── post.md
├── post.html
├── metadata.json
├── guide.md
├── images/
│   ├── thumbnail.png
│   ├── infographic.png
│   ├── quote-card.png
│   └── process.png
└── quality-report.json
```

---

## 환경 설정

`.env` 파일 (`.env.example` 참조):

```
# 네이버 개발자센터 (선택 — 없으면 웹 검색으로 대체)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret

# Nano Banana Pro 이미지 생성 (필수)
# Google AI Studio (aistudio.google.com)에서 무료 발급
GEMINI_API_KEY=your_gemini_api_key

# 브랜드 시스템 (/setup-domain이 자동 설정)
BRAND_NAME=YOUR BRAND
BRAND_BG_COLOR=#F7F6F2
BRAND_FG_COLOR=#1A1A1A
BRAND_ACCENT=#D97A3A
```

별도 `npm install` 불필요. Node 20+ 내장 fetch만 사용.

---

## 톤 시그니처 (쏠라씨)

출처: `knowledge/tone-samples/real-blog-posts.txt` (본문 전체 5편 + AI 글 발췌, 약 22KB)

### 문체 규칙
- 정보·팁 글, 마케팅·광고 글: **해요체** 기본
- 일상 생각·에세이 글: **~다 체**(평서체). 독자에게 말을 걸 때만 해요체로 전환
- 화자: 전문가가 아니라 "경험하고, 관찰하고, 궁금해하고, 알아보고, 내 방식대로 정리하는 사람"
- 경험은 "제 공부법", "저는 ~했어요"처럼 내 사례로 한정. 남에게 일반화하지 않음

### 시그니처 문장 — 정보 글 (해요체)
1. "안녕하세요! 오늘은 운전면허 필기시험 이야기를 해 보려고 해요.✍️"
2. "하루 만에 가능했던 건 '반복' 덕분이었던 것 같아요."
3. "다만 사람마다 다르니, 모의고사 점수가 합격선보다 넉넉하게 나올 때까지 연습하는 걸 추천해요."
4. "필기를 앞둔 분들께 작은 도움이 되면 좋겠어요. 그럼 다음에 또 다른 이야기로 만나요.👋"
5. "AI의 답은 정답이 아니라, 확인할 거리를 알려 주는 초안이라고 생각하는 게 안전해요.😊"

### 시그니처 문장 — 에세이 (~다 체)
1. "정말 어려운 건 준비가 아니라 시작하는 순간이 아니었을까?"
2. "그렇게 '조금만 더'가 하루가 되고, 일주일이 된다😂"
3. "그래서 나는 이걸 정답이 아니라, 나를 이해하는 힌트 정도로 가져가려고 한다."
4. "막상 해 보니까 뭐야...? 왜 재밌어....??????"
5. "잘하려고 애쓰기보다, 일단 해 보는 나를 믿어보자💪"

### 정보 글 구조
인사 + 오늘 주제 → 💬 내 상황 → 💡 "이것부터 알아 두세요" → 번호 붙인 방법(경험 → 효과 → 추천) → 📌 □ 체크리스트 → `< 자주 묻는 질문 >` Q&A → 마무리 → "(이 글은 YYYY년 MM월 기준으로 작성했어요. …)" → 참고자료 ✔️

### 에세이 구조
짧은 명사구 소제목 → 걱정·감정을 말줄임표로 늘이기 ("어떡하지....") → 점 세 줄(`.` `.` `.`)로 반전 → 연구 인용 후 한계 명시 → 다음 편 예고 → 독자 질문 → "주저리주저리 긴 글 읽어주셔서 감사합니다❤️" → "또 만나요👋"

### 공통 특징
- "A가 아니라 B" 구조로 핵심 정리
- 효과를 단정하지 않고 한계를 먼저 인정 ("완벽한 방법은 아니니", "사람마다 다르니", "증명한 건 아니다")
- 이모지는 정보 글에서 문단 끝 1개, 에세이에서는 겹쳐 쓰기 허용 (🎉🎉🎉, 👏👏👏)
- 바뀔 수 있는 정보는 확인처와 기준 시점 명시
- 샘플 글 속 수치(97점, 43개 연구 등)는 개인 경험담이므로 브랜드 수치로 쓰지 않음 (`brand-facts.md` 규칙 우선)

---

## 주의사항

- 생성된 글은 **반드시 사람이 검토 후 발행**합니다
- 자동 발행 기능은 의도적으로 제외 (저품질 리스크)
- 하루 2건 이상 발행 권장하지 않음
- 발행 시간은 불규칙하게 유지 (패턴 탐지 방지)
- 이미지는 반드시 스마트에디터에서 직접 업로드

---

## 라이선스

MIT — 자유롭게 사용/수정/배포 가능. 다만 `knowledge/` 폴더의 회사 데이터는 절대 git에 올리지 마세요 (`.gitignore`에 등록되어 있습니다).
