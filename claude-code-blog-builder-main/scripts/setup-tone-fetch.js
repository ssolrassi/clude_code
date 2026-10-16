#!/usr/bin/env node
/**
 * setup-tone-fetch.js
 *
 * 사용자 블로그 URL 3~5개에서 본문을 자동 추출하여
 * knowledge/tone-samples/real-blog-posts.txt에 저장.
 *
 * /setup-tone 명령에서 호출됨.
 *
 * 사용법:
 *   node scripts/setup-tone-fetch.js \
 *     --urls "URL1,URL2,URL3" \
 *     --output "knowledge/tone-samples/real-blog-posts.txt"
 *
 * 외부 의존성 0 (Node 20+ 내장 fetch만 사용).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// ─── 인자 파싱 ────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const out = { urls: [], output: 'knowledge/tone-samples/real-blog-posts.txt' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--urls') out.urls = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (args[i] === '--output') out.output = args[++i];
  }
  return out;
}

// ─── HTML → 텍스트 변환 (단순/결정론적) ───────────────────
function htmlToText(html) {
  // <script>, <style>, <noscript> 통째로 제거
  let s = html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, ' ');

  // 네이버 블로그 스마트에디터 컨테이너 추출 (중첩 div 문제 해결)
  const naverMarker = s.indexOf('se-main-container');
  if (naverMarker !== -1) {
    let sub = s.slice(naverMarker);
    const endMarkers = ['class="post_footer"', 'class="_post_property"', 'id="naver-splugin"', 'class="se-footer"', 'id="commentCount"'];
    for (const em of endMarkers) {
      const idx = sub.indexOf(em);
      if (idx !== -1) {
        sub = sub.slice(0, idx);
        break;
      }
    }
    if (sub.length > 300) {
      s = sub;
    }
  } else {
    // 티스토리, 워드프레스, 일반 article 시도
    const candidateSelectors = [
      /<div[^>]*class="[^"]*post-view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
    ];
    for (const re of candidateSelectors) {
      const m = s.match(re);
      if (m && m[1] && m[1].length > 500) {
        s = m[1];
        break;
      }
    }
  }

  // 블록 태그 → 줄바꿈
  s = s.replace(/<\/(p|div|h[1-6]|li|br)[^>]*>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // 모든 태그 제거
  s = s.replace(/<[^>]+>/g, '');

  // HTML 엔티티 디코딩
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));

  // 공백/줄바꿈 정리
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n[ \t]+/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  s = s.trim();

  return s;
}

// ─── 네이버 블로그 모바일 URL 변환 (본문 접근 용이) ────────
function normalizeNaverBlog(url) {
  // m.blog.naver.com 으로 변환하면 본문 추출이 더 쉬움
  if (url.includes('blog.naver.com') && !url.includes('m.blog.naver.com')) {
    return url.replace('blog.naver.com', 'm.blog.naver.com');
  }
  return url;
}

// ─── URL 페치 + 본문 추출 ─────────────────────────────────
async function fetchOne(url) {
  const targetUrl = normalizeNaverBlog(url);
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  try {
    const res = await fetch(targetUrl, {
      headers: browserHeaders,
      redirect: 'follow',
    });
    if (res.ok) {
      const html = await res.text();
      const text = htmlToText(html);
      if (text.length >= 200) {
        return { url, ok: true, text, length: text.length };
      }
    }
  } catch (e) {
    // 1차 실패 시 아래 fallback으로 이동
  }

  // ─── 2차 시도: 오픈소스 Jina Reader (동적 렌더링 지원) ───
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/plain',
      },
    });
    if (jinaRes.ok) {
      const jinaText = await jinaRes.text();
      // Jina 헤더(URL, Title 등 메타데이터) 정리
      let cleanText = jinaText.replace(/^Title:[\s\S]*?URL Source:.*?\n\n/i, '').trim();
      if (cleanText.length >= 200) {
        return { url, ok: true, text: cleanText, length: cleanText.length };
      }
    }
  } catch (e) {
    // Jina 실패 시
  }

  return { url, ok: false, error: '본문 수집 실패 (200자 미만 또는 접근 불가)' };
}

// ─── 메인 ────────────────────────────────────────────────
async function main() {
  const { urls, output } = parseArgs();

  if (urls.length === 0) {
    console.error('❌ --urls 인자가 필요합니다. 예: --urls "URL1,URL2,URL3"');
    process.exit(1);
  }

  console.log(`📥 ${urls.length}개 URL 수집 시작...\n`);

  const results = [];
  for (const url of urls) {
    process.stdout.write(`  ${url}  → `);
    const r = await fetchOne(url);
    if (r.ok) {
      console.log(`✅ ${r.length.toLocaleString()}자`);
    } else {
      console.log(`❌ ${r.error}`);
    }
    results.push(r);
  }

  const success = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  if (success.length === 0) {
    console.error('\n❌ 모든 URL 수집 실패. 수동으로 글을 복사해 주세요.');
    process.exit(2);
  }

  // 통합 텍스트 생성
  const lines = [];
  lines.push(`# 톤 학습용 블로그 글 모음`);
  lines.push(`# 자동 수집: ${new Date().toISOString()}`);
  lines.push(`# 수집 URL: ${success.length}개 / 실패 ${failed.length}개`);
  lines.push('');
  for (const r of success) {
    lines.push('---');
    lines.push(`# 출처: ${r.url}`);
    lines.push('');
    lines.push(r.text);
    lines.push('');
  }
  const merged = lines.join('\n');

  // 디렉토리 보장
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, merged, 'utf-8');

  const totalKB = (Buffer.byteLength(merged, 'utf-8') / 1024).toFixed(1);
  console.log(`\n✅ 저장 완료: ${output}`);
  console.log(`   총 ${success.length}편 / ${totalKB}KB`);

  if (parseFloat(totalKB) < 30) {
    console.log(`\n⚠️  경고: 30KB 미만입니다. 톤 학습이 부정확할 수 있습니다.`);
    console.log(`   더 긴 글 또는 더 많은 URL을 추가하는 것을 권장합니다.`);
  } else if (parseFloat(totalKB) < 80) {
    console.log(`\nℹ️  권장: 80KB 이상이면 톤 학습 품질이 더 좋아집니다.`);
  } else {
    console.log(`\n🎯 충분한 분량입니다. 톤 학습 품질 우수.`);
  }

  if (failed.length > 0) {
    console.log(`\n실패 URL ${failed.length}개:`);
    for (const f of failed) console.log(`  ❌ ${f.url}  (${f.error})`);
  }
}

main().catch(e => {
  console.error('❌ 오류:', e);
  process.exit(1);
});
