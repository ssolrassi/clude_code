#!/usr/bin/env node
/**
 * 블로그 이미지 생성기
 * HTML + 시스템 브라우저(Edge/Chrome) → PNG 스크린샷 방식.
 * 한글 맑은고딕 완벽 지원. 외부 AI API 불필요.
 *
 * 환경 변수:
 *   BRAND_NAME      — 브랜드명 (기본: YOUR BRAND)
 *   BRAND_BG_COLOR  — 배경색 hex (기본: #F7F6F2)
 *   BRAND_FG_COLOR  — 본문 텍스트 hex (기본: #1A1A1A)
 *   BRAND_ACCENT    — 포인트 색 hex (기본: #D97A3A)
 *
 * Usage:
 *   node scripts/generate-images.js \
 *     --title "글 제목" --keyword "키워드" \
 *     --points "포인트1|||포인트2|||포인트3" \
 *     --quote "핵심 문구" \
 *     --steps "단계1|||단계2|||단계3" \
 *     --output "output/폴더/images"
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

// ────────────────────────────────────────────────
// CLI 파싱
// ────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    }
  }
  return args;
}

const splitList = (s) =>
  (s || '').split('|||').map((x) => x.trim()).filter(Boolean);

// ────────────────────────────────────────────────
// 브랜드 시스템
// ────────────────────────────────────────────────
const BRAND = process.env.BRAND_NAME   || '부자습관';
const BG    = process.env.BRAND_BG_COLOR || '#F7F6F2';
const FG    = process.env.BRAND_FG_COLOR || '#1A1A1A';
const ACC   = process.env.BRAND_ACCENT   || '#D97A3A';

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo',
                 'Noto Sans KR', sans-serif;
    background: ${BG};
    color: ${FG};
    -webkit-font-smoothing: antialiased;
  }
`;

// ────────────────────────────────────────────────
// 키워드 → 이모지 아이콘 자동 매핑
// ────────────────────────────────────────────────
function guessIcon(text) {
  const rules = [
    [/IRP|개인형.*퇴직|퇴직연금/, '🏦'],
    [/연금|저축|납입/, '💰'],
    [/월세|임대|전세|주택|집|부동산/, '🏠'],
    [/카드|체크카드|신용카드/, '💳'],
    [/의료비|병원|건강|치료/, '🏥'],
    [/교육비|학교|학원|대학/, '📚'],
    [/세금|절세|공제|환급|세액/, '💹'],
    [/소득|급여|연봉|월급/, '💵'],
    [/체크리스트|목록|점검/, '📋'],
    [/마감|기간|달력|일정/, '📅'],
    [/신청|접수|가입|등록/, '📝'],
    [/시작|출발|개시/, '🚀'],
    [/수집|증빙|영수증|서류/, '🧾'],
    [/전환|변경|교체/, '🔄'],
    [/최종|완료|마감|완성/, '✅'],
    [/한도|점검|검토|분석/, '🔍'],
    [/투자|펀드|ETF|주식/, '📈'],
    [/자동차|차량|렌트/, '🚗'],
    [/보험|보장/, '🛡️'],
    [/근로|직장|회사/, '👔'],
    [/앱|모바일|온라인|인터넷/, '📱'],
    [/장려금|지원금|보조금/, '🎁'],
    [/절약|아끼|저금/, '🐷'],
    [/비교|분석|리뷰/, '📊'],
    [/가이드|방법|절차/, '📌'],
  ];
  for (const [re, icon] of rules) if (re.test(text)) return icon;
  return '✦';
}

// ────────────────────────────────────────────────
// HTML 템플릿 생성 함수
// ────────────────────────────────────────────────

/** 썸네일 (1280×720) — 좌측 제목+미니리스트 / 우측 포인트 카드 */
function thumbnailHtml({ title, keyword, points }) {
  const shortTitle = title.replace(/\s*—\s*.*$/, '').trim();
  const subtitle   = title.includes('—') ? title.replace(/^.*?—\s*/, '').trim() : '';
  const highlights = (points.length ? points : ['핵심 정보', '실전 가이드', '완전 정리']).slice(0, 3);
  const cards = highlights.map(p => {
    const icon = guessIcon(p);
    const short = p.length > 14 ? p.slice(0, 14) + '…' : p;
    return `
      <div class="hl-card">
        <span class="hl-icon">${icon}</span>
        <span class="hl-text">${short}</span>
      </div>`;
  }).join('');
  const miniItems = highlights.map(p => `
    <div class="mini-item">
      <span class="mini-dot"></span>
      <span class="mini-text">${p}</span>
    </div>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    ${BASE_CSS}
    body { width:1280px; height:720px; overflow:hidden; display:flex; }
    .left {
      flex: 0 0 58%; padding: 72px 52px 64px; display:flex;
      flex-direction:column; gap:16px;
      position:relative; z-index:1;
    }
    .badge {
      display:inline-flex; align-items:center; gap:8px;
      background:${ACC}22; border:1.5px solid ${ACC};
      color:${ACC}; border-radius:20px; padding:5px 16px;
      font-size:14px; font-weight:700; width:fit-content;
    }
    .title {
      font-size:${shortTitle.length > 16 ? '34px' : '40px'};
      font-weight:900; line-height:1.35; color:${FG};
      word-break:keep-all;
    }
    .subtitle { font-size:15px; color:#666; line-height:1.6; word-break:keep-all; max-width:460px; }
    .divider { width:40px; height:3px; background:${ACC}; border-radius:2px; margin-bottom:4px; }
    .mini-list { display:flex; flex-direction:column; gap:12px; }
    .mini-item { display:flex; align-items:center; gap:12px; }
    .mini-dot { width:7px; height:7px; border-radius:50%; background:${ACC}; flex-shrink:0; }
    .mini-text { font-size:14px; color:#777; font-weight:600; word-break:keep-all; line-height:1.4; }
    .brand { font-size:13px; color:#aaa; position:absolute; bottom:32px; left:52px; font-weight:700; letter-spacing:0.04em; }
    .right {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:14px;
      padding:48px 36px; background:${FG}06;
      border-left:2px solid ${FG}0C; position:relative;
    }
    .right-label {
      font-size:11px; font-weight:800; color:${ACC};
      letter-spacing:0.14em; margin-bottom:4px; align-self:flex-start;
    }
    .hl-card {
      width:100%; background:#fff; border-radius:12px;
      padding:14px 18px; display:flex; align-items:center; gap:14px;
      box-shadow:0 3px 12px rgba(0,0,0,0.07);
      border-left:4px solid ${ACC};
    }
    .hl-icon { font-size:26px; flex-shrink:0; }
    .hl-text { font-size:14px; font-weight:700; color:${FG}; word-break:keep-all; }
    .deco-bg {
      position:absolute; bottom:-30px; right:-30px;
      width:200px; height:200px; border-radius:50%;
      background:${ACC}; opacity:0.06;
    }
  </style></head><body>
  <div class="left">
    <div class="badge">📊 ${keyword}</div>
    <div class="title">${shortTitle}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="divider"></div>
    <div class="mini-list">${miniItems}</div>
    <div class="brand">${BRAND}</div>
  </div>
  <div class="right">
    <div class="right-label">핵심 포인트</div>
    ${cards}
    <div class="deco-bg"></div>
  </div>
  </body></html>`;
}

/** 인포그래픽 (640×960) — 번호+아이콘+텍스트 가로 카드 */
function infographicHtml({ keyword, points }) {
  const items = points.slice(0, 5);
  const topIcon = guessIcon(keyword);
  const cards = items.map((p, i) => {
    const icon = guessIcon(p);
    return `
    <div class="card">
      <div class="num">${i + 1}</div>
      <span class="card-icon">${icon}</span>
      <div class="text">${p}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    ${BASE_CSS}
    body { width:640px; height:960px; overflow:hidden; display:flex; flex-direction:column; }
    .header {
      background:${FG}; color:#fff; padding:32px 32px 24px;
      flex-shrink:0; position:relative; overflow:hidden;
    }
    .header-deco {
      position:absolute; right:-20px; top:-20px;
      font-size:110px; opacity:0.08; line-height:1;
    }
    .header-label { font-size:11px; letter-spacing:0.14em; opacity:0.5; margin-bottom:8px; font-weight:700; }
    .header-title { font-size:24px; font-weight:900; line-height:1.35; word-break:keep-all; }
    .accent-bar { height:3px; background:${ACC}; margin-top:14px; border-radius:2px; width:44px; }
    .cards { flex:1; padding:28px 28px; display:flex; flex-direction:column; justify-content:space-evenly; overflow:hidden; }
    .card {
      display:flex; align-items:center; gap:18px;
      background:#fff; border-radius:14px;
      box-shadow:0 2px 10px rgba(0,0,0,0.06);
      height:${items.length <= 3 ? '148px' : '110px'};
      padding:0 24px;
      border-left:5px solid ${ACC};
      flex-shrink:0;
    }
    .num {
      font-size:48px; font-weight:900; line-height:1;
      color:${ACC}; opacity:0.15;
      width:38px; text-align:center; flex-shrink:0;
    }
    .card-icon { font-size:34px; line-height:1; flex-shrink:0; }
    .text {
      font-size:15px; line-height:1.5; color:${FG};
      font-weight:600; word-break:keep-all;
    }
    .footer {
      padding:14px 28px; border-top:1px solid ${FG}0F;
      display:flex; justify-content:space-between; align-items:center;
      font-size:11px; color:#bbb; font-weight:700; letter-spacing:0.06em;
      flex-shrink:0;
    }
  </style></head><body>
  <div class="header">
    <div class="header-deco">${topIcon}</div>
    <div class="header-label">핵심 포인트</div>
    <div class="header-title">${keyword}</div>
    <div class="accent-bar"></div>
  </div>
  <div class="cards">${cards}</div>
  <div class="footer"><span>${BRAND}</span><span>${items.length}가지 핵심 정보</span></div>
  </body></html>`;
}

/** 인용 카드 (960×960) — 대형 아이콘 + 인용 문구 */
function quoteHtml({ quote, keyword }) {
  const icon = guessIcon(keyword + quote);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    ${BASE_CSS}
    body {
      width:960px; height:960px; overflow:hidden;
      display:flex; flex-direction:column;
      justify-content:center; align-items:center;
      padding:80px 88px; position:relative;
    }
    .top-bar { position:absolute; top:0; left:0; right:0; height:8px; background:${ACC}; }
    .bottom-bar { position:absolute; bottom:0; left:0; right:0; height:8px; background:${ACC}08; }
    .bg-icon {
      position:absolute; bottom:60px; right:60px;
      font-size:180px; opacity:0.05; line-height:1; user-select:none;
    }
    .bg-quote {
      position:absolute; top:60px; left:64px;
      font-size:200px; color:${ACC}; opacity:0.07;
      font-family:Georgia,serif; line-height:1; user-select:none;
    }
    .main-icon {
      font-size:64px; margin-bottom:20px;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));
    }
    .badge {
      background:${ACC}; color:#fff; border-radius:20px;
      padding:5px 18px; font-size:12px; font-weight:700;
      margin-bottom:28px; letter-spacing:0.04em;
    }
    .quote {
      font-size:${quote.length > 28 ? '27px' : '32px'};
      font-weight:800; line-height:1.7;
      color:${FG}; text-align:center; word-break:keep-all;
      position:relative; z-index:1;
    }
    .divider { width:44px; height:3px; background:${ACC}; border-radius:2px; margin:24px auto; }
    .brand {
      position:absolute; bottom:36px; right:52px;
      font-size:12px; color:#bbb; font-weight:700; letter-spacing:0.06em;
    }
  </style></head><body>
  <div class="top-bar"></div>
  <div class="bg-quote">"</div>
  <div class="bg-icon">${icon}</div>
  <div class="main-icon">${icon}</div>
  <div class="badge">${keyword}</div>
  <div class="quote">${quote}</div>
  <div class="divider"></div>
  <div class="brand">— ${BRAND}</div>
  <div class="bottom-bar"></div>
  </body></html>`;
}

/** 프로세스 다이어그램 (1280×960) — 아이콘 + 단계 노드, 6단계 2열 지원 */
function processHtml({ keyword, steps }) {
  const items = steps.slice(0, 6);
  const useGrid = items.length >= 5; // 5~6개는 2행 배치

  const makeNode = (s, i, showArrow) => {
    const icon = guessIcon(s);
    return `
    <div class="node-wrap">
      <div class="node">
        <div class="node-icon">${icon}</div>
        <div class="step-num">${i + 1}</div>
        <div class="step-label">${s}</div>
      </div>
      ${showArrow ? '<div class="arrow">→</div>' : ''}
    </div>`;
  };

  let flowHtml;
  if (useGrid && items.length === 6) {
    const row1 = items.slice(0, 3);
    const row2 = items.slice(3, 6);
    flowHtml = `
      <div class="row">
        ${row1.map((s,i) => makeNode(s, i, i<2)).join('')}
        <div class="arrow turn">↓</div>
      </div>
      <div class="row row2">
        ${[...row2].reverse().map((s, ri) => {
          const i = 5 - ri;
          return makeNode(s, i, ri>0);
        }).join('')}
      </div>`;
  } else {
    flowHtml = items.map((s, i) => makeNode(s, i, i<items.length-1)).join('');
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    ${BASE_CSS}
    body {
      width:1280px; height:960px; overflow:hidden;
      display:flex; flex-direction:column; padding:56px 64px;
    }
    .header { margin-bottom:36px; }
    .header-label { font-size:11px; color:${ACC}; font-weight:800; letter-spacing:0.14em; margin-bottom:8px; }
    .header-title { font-size:30px; font-weight:900; color:${FG}; }
    .header-underline { height:3px; width:56px; background:${ACC}; border-radius:2px; margin-top:12px; }
    .flow-wrap { flex:1; display:flex; flex-direction:column; justify-content:center; gap:20px; }
    .row { display:flex; align-items:center; justify-content:center; gap:0; }
    .row2 { flex-direction:row-reverse; }
    .node-wrap { display:flex; align-items:center; }
    .node {
      display:flex; flex-direction:column; align-items:center; gap:8px;
      width:${items.length <= 4 ? '180px' : '155px'};
      padding:18px 12px 16px;
      background:#fff; border-radius:16px;
      box-shadow:0 4px 16px rgba(0,0,0,0.08);
      border-top:4px solid ${ACC};
    }
    .node-icon { font-size:28px; line-height:1; }
    .step-num {
      width:32px; height:32px; border-radius:50%;
      background:${ACC}; color:#fff;
      font-size:15px; font-weight:900;
      display:flex; align-items:center; justify-content:center;
    }
    .step-label {
      font-size:13px; font-weight:700; color:${FG};
      text-align:center; line-height:1.4; word-break:keep-all;
    }
    .arrow {
      font-size:24px; color:${ACC}; padding:0 8px;
      font-weight:900; flex-shrink:0;
    }
    .arrow.turn { font-size:28px; padding:0 4px; }
    .footer { margin-top:20px; text-align:right; font-size:12px; color:#ccc; font-weight:700; letter-spacing:0.06em; }
  </style></head><body>
  <div class="header">
    <div class="header-label">STEP BY STEP</div>
    <div class="header-title">${keyword} 진행 프로세스</div>
    <div class="header-underline"></div>
  </div>
  <div class="flow-wrap">${useGrid && items.length===6 ? flowHtml : `<div class="row">${flowHtml}</div>`}</div>
  <div class="footer">${BRAND}</div>
  </body></html>`;
}

// ────────────────────────────────────────────────
// 브라우저 경로 탐색
// ────────────────────────────────────────────────
import { existsSync } from 'node:fs';

function resolveBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

// ────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────
async function main() {
  const args  = parseArgs(process.argv);
  const { title, keyword, quote, output } = args;
  const points = splitList(args.points);
  const steps  = splitList(args.steps);

  if (!title || !keyword || !output) {
    console.error('Usage: --title <t> --keyword <k> --output <dir> [--points a|||b] [--quote q] [--steps a|||b]');
    process.exit(2);
  }

  const executablePath = resolveBrowser();
  if (!executablePath) {
    console.error('ERROR: Chrome 또는 Edge를 찾을 수 없습니다. 설치 후 다시 시도하세요.');
    process.exit(1);
  }
  console.log(`브라우저: ${executablePath.split('\\').pop()}`);

  await mkdir(output, { recursive: true });

  const jobs = [
    { name: 'thumbnail',   w: 1280, h: 720,  html: thumbnailHtml({ title, keyword, points }) },
    { name: 'infographic', w: 640,  h: 960,  html: infographicHtml({ keyword, points: points.length ? points : [keyword] }) },
    { name: 'quote-card',  w: 960,  h: 960,  html: quoteHtml({ quote: quote || title, keyword }) },
    { name: 'process',     w: 1280, h: 960,  html: processHtml({ keyword, steps: steps.length ? steps : ['리서치', '기획', '제작', '검수'] }) },
  ];

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let okCount = 0;
  const errors = [];

  for (const job of jobs) {
    try {
      console.log(`[generate] ${job.name} (${job.w}×${job.h}) ...`);
      const page = await browser.newPage();
      await page.setViewport({ width: job.w, height: job.h, deviceScaleFactor: 2 });
      await page.setContent(job.html, { waitUntil: 'networkidle0' });
      const buf = await page.screenshot({ type: 'png', clip: { x:0, y:0, width:job.w, height:job.h } });
      await page.close();
      const path = join(output, `${job.name}.png`);
      await writeFile(path, buf);
      console.log(`  ✓ ${path} (${(buf.length / 1024).toFixed(0)} KB)`);
      okCount++;
    } catch (e) {
      console.error(`  ✗ ${job.name}: ${e.message}`);
      errors.push({ name: job.name, error: e.message });
    }
  }

  await browser.close();
  console.log(`\nDone: ${okCount}/${jobs.length} images saved to ${output}`);
  if (errors.length === jobs.length) process.exit(1);
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
