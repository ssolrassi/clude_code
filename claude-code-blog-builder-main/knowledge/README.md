# knowledge/ — 단일 진실 공급원 (Single Source of Truth)

이 폴더는 블로그 자동화 시스템이 글을 쓸 때 참조하는 **여러분 회사에 대한 사실의 유일한 출처**입니다.

## 동작 원리

매번 글을 쓸 때마다 시스템은 이 폴더의 파일을 먼저 읽고 그 안의 정보만 사용합니다.
정보가 흩어지면 어떤 자동화도 무너집니다. 그래서 한 곳에만 사실을 둡니다.

## 파일 구조

| 파일 | 용도 | 어떻게 채우는가 |
|:---|:---|:---|
| `brand-facts.md` | 회사 기본 정보, 실수치, 인증, 타겟 고객 | `/setup` (Phase 1, 5분 인터뷰) |
| `conversion-benchmarks.md` | 업계 벤치마크 수치 (전환율, 객단가 등) | `/setup-domain` (Phase 3) |
| `banned-words.json` | 사용 금지 단어 + 도메인별 규제 단어 | `/setup` 기본 + `/setup-domain` 추가 |
| `tone-samples/real-blog-posts.txt` | 여러분 회사 실제 블로그 글 모음 (톤 학습용) | `/setup-tone` (Phase 2, 자동 수집) |
| `patterns/writing-playbook.txt` | 글쓰기 패턴 가이드 (선택) | 수동 또는 `/setup-domain` |

## ⚠️ 중요

- 이 폴더의 `.template.*` 파일은 **공개 템플릿**입니다. 직접 편집하지 마세요.
- 실제 데이터는 `/setup` 명령이 `brand-facts.md`, `conversion-benchmarks.md`, `banned-words.json` 같은 **실제 파일**로 생성합니다.
- 실제 파일은 `.gitignore`에 등록되어 있어 깃에 올라가지 않습니다 (회사 정보 보호).

## 시작하기

```bash
# 1단계: Claude Code 실행
claude

# 2단계: 인터뷰 시작
/setup
```

5분 후 첫 글을 쓸 수 있는 상태가 됩니다.
