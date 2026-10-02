#!/usr/bin/env bash
# sanitize-check.sh
#
# push 전 자동 게이트. 외부 공개판에 다음이 0건이어야 함:
#   - 알잘 회사 데이터 (회사명, 실수치, 인증, 사례)
#   - 시크릿 (실 API 키, .env 파일)
#   - 본인 식별 정보 (이메일, 전화번호)
#
# 사용법:
#   bash scripts/sanitize-check.sh
#   또는
#   npm run sanitize-check
#
# 종료 코드: 0 = 통과, 1 = 차단어 발견

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 검사 제외 경로 (gitignored 디렉토리)
EXCLUDE='--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=output'
# 검사 제외 파일 (스크립트 자체 + 의도적 언급)
EXCLUDE_FILES='--exclude=sanitize-check.sh'
EXCLUDE="$EXCLUDE $EXCLUDE_FILES"

# ────────────────────────────────────────────
# 1. 차단어 — 회사 식별 정보
# ────────────────────────────────────────────
BLOCKED_COMPANY=(
  '알잘'
  'ALZAL'
  'ALJAL'
  'ALZZAL'
  'alzzal'
  'aljal'
  '알잘스튜디오'
  '알잘AI'
  '와디즈'
  'KIDP'
  'KOITA'
  '조달청'
  '대표소비자브랜드'
  '동국제약'
  '경동제약'
  '패스트캠퍼스'
)

# ────────────────────────────────────────────
# 2. 차단어 — 구체 수치 (외부 공개판에 박혀있으면 안 됨)
# ────────────────────────────────────────────
BLOCKED_NUMBERS=(
  '4,000건'
  '4,000+'
  '1,200곳'
  '1,200+'
  '12,589'
  '6,300만'
  '1\.1억'
  '5년 업력'
)

# ────────────────────────────────────────────
# 3. 차단어 — 시크릿 패턴
# ────────────────────────────────────────────
BLOCKED_SECRETS=(
  'AIzaSy[A-Za-z0-9_-]\{20,\}'   # Google API 키
  'sk-[A-Za-z0-9]\{20,\}'        # OpenAI 키
  'ghp_[A-Za-z0-9]\{20,\}'       # GitHub Personal Access Token
  'xoxb-[A-Za-z0-9-]\{20,\}'     # Slack Bot Token
)

# ────────────────────────────────────────────
# 검사 실행
# ────────────────────────────────────────────
TOTAL_HITS=0

echo "🔍 sanitize-check.sh — push 전 게이트"
echo "─────────────────────────────────────"

# 1. 회사 식별 정보
echo ""
echo "[1/4] 회사 식별 정보 검사..."
COMPANY_HITS=0
for word in "${BLOCKED_COMPANY[@]}"; do
  HITS=$(grep -r $EXCLUDE -l "$word" . 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    COUNT=$(echo "$HITS" | wc -l)
    echo "  ❌ '$word' — $COUNT개 파일에서 발견:"
    echo "$HITS" | sed 's/^/      /'
    COMPANY_HITS=$((COMPANY_HITS + COUNT))
  fi
done
if [ $COMPANY_HITS -eq 0 ]; then
  echo "  ✅ 통과 (0건)"
fi
TOTAL_HITS=$((TOTAL_HITS + COMPANY_HITS))

# 2. 구체 수치
echo ""
echo "[2/4] 구체 수치 검사..."
NUMBER_HITS=0
for pattern in "${BLOCKED_NUMBERS[@]}"; do
  HITS=$(grep -r $EXCLUDE -l "$pattern" . 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    COUNT=$(echo "$HITS" | wc -l)
    echo "  ❌ '$pattern' — $COUNT개 파일:"
    echo "$HITS" | sed 's/^/      /'
    NUMBER_HITS=$((NUMBER_HITS + COUNT))
  fi
done
if [ $NUMBER_HITS -eq 0 ]; then
  echo "  ✅ 통과 (0건)"
fi
TOTAL_HITS=$((TOTAL_HITS + NUMBER_HITS))

# 3. 시크릿
echo ""
echo "[3/4] 시크릿 패턴 검사..."
SECRET_HITS=0
for pattern in "${BLOCKED_SECRETS[@]}"; do
  HITS=$(grep -rE $EXCLUDE -l "$pattern" . 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    COUNT=$(echo "$HITS" | wc -l)
    echo "  ❌ 시크릿 패턴 발견 — $COUNT개 파일:"
    echo "$HITS" | sed 's/^/      /'
    SECRET_HITS=$((SECRET_HITS + COUNT))
  fi
done
if [ $SECRET_HITS -eq 0 ]; then
  echo "  ✅ 통과 (0건)"
fi
TOTAL_HITS=$((TOTAL_HITS + SECRET_HITS))

# 4. .env 파일 추적 여부
echo ""
echo "[4/4] .env 파일 점검..."
if [ -f ".env" ]; then
  if git check-ignore .env >/dev/null 2>&1; then
    echo "  ✅ .env 존재하지만 .gitignore에 등록됨 (안전)"
  else
    echo "  ❌ .env 파일이 .gitignore에 없음! 즉시 추가하세요."
    TOTAL_HITS=$((TOTAL_HITS + 1))
  fi
else
  echo "  ✅ .env 파일 없음"
fi

# ────────────────────────────────────────────
# 결과
# ────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────"
if [ $TOTAL_HITS -eq 0 ]; then
  echo "✅ 통과 — 0건. push 안전."
  exit 0
else
  echo "❌ 차단 — 총 $TOTAL_HITS건 발견. push 중단."
  echo ""
  echo "수정 방법:"
  echo "  1. 위 파일들을 열어 차단어를 제거하거나 placeholder로 교체"
  echo "  2. 다시 'bash scripts/sanitize-check.sh' 실행"
  echo "  3. 0건 통과 후 push"
  exit 1
fi
