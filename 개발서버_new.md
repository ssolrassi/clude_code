---
description: 개발서버 자동 시작 (범용 템플릿)
---

# 🖥️ 개발서버 설정

> 이 워크플로우는 범용 로컬 개발서버 실행을 자동화합니다.
> 프로젝트 폴더를 루트로 하여 정적 파일을 서빙합니다.

## 포트 구분
| 환경 | 포트 | 비고 |
|------|------|------|
| **AI IDE** | 9000 | AI 에이전트가 자동 실행 |
| **수동 (VSCode 등)** | 8000 | 사용자가 직접 실행 |

> [!NOTE]
> 포트 번호는 프로젝트에 맞게 자유롭게 변경 가능합니다.
> 다른 서비스와 충돌하지 않는 포트를 선택하세요.

---

// turbo-all

## 실행 순서

### 1단계: 기존 서버 종료
```bash
lsof -ti:9000 | xargs kill -9 2>/dev/null; sleep 1
```

### 2단계: 새 서버 시작
```bash
python3 -m http.server 9000
```

서버 URL: http://localhost:9000

---

## 수동 실행 (터미널에서 직접)
```bash
# 프로젝트 루트 폴더로 이동 후
cd /your/project/root
python3 -m http.server 8000
```
서버 URL: http://localhost:8000

---

## 커스터마이징 가이드

### 포트 변경
위 명령어에서 `9000` 또는 `8000`을 원하는 포트 번호로 변경하세요.

### Node.js 서버 사용 시
```bash
npx -y live-server --port=9000 --no-browser
```
장점: 파일 변경 시 자동 새로고침(Live Reload) 지원

### 특정 디렉토리만 서빙
```bash
python3 -m http.server 9000 --directory ./dist
```
