// Regenerates the README screenshots in docs/ by driving headless Chrome over CDP.
// No dependencies: needs Node 22+ (built-in WebSocket) and Google Chrome.
//
//   python3 -m http.server 8765 &          # serve the site
//   node scripts/screenshots.mjs docs dark # output dir, theme (dark|light)
//
// Env: CHROME (path to Chrome), URL (default http://localhost:8765/).
// Analyses Morphy's Opera Game with Stockfish, so it takes about a minute.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
const OUT = process.argv[2], CH = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', PORT = 9333, URL0 = process.env.URL || 'http://localhost:8765/';
const proc = spawn(CH, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${tmpdir()}/chess-coach-shots-profile`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (list.find(t => t.type === 'page')) break; } catch {} await sleep(200); }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const cdp = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
const view = (w, h, mobile = false) => cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile });
const shot = async (name, clip) => { const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log('wrote', name); };
const rect = sel => ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; })()`);
const THEME = process.argv[3] || 'dark';

await cdp('Page.enable'); await view(1280, 900);
await cdp('Page.navigate', { url: URL0 }); await sleep(1500);
await ev(`localStorage.clear(); localStorage.setItem('coach.theme','${THEME}'); location.reload()`); await sleep(1500);
// hero: let the demo reach the blunder
for (let i = 0; i < 80; i++) { if (await ev("document.querySelector('#demoBadge').textContent.includes('??')")) break; await sleep(250); } await sleep(700);
await shot('hero', { x: 0, y: 0, width: 1280, height: 720 });

// analyse a public-domain game (Morphy's Opera Game, 1858) for a populated review
const PGN = JSON.stringify('[Event "Opera House"]\\n[Site "Paris FRA"]\\n[Date "1858.??.??"]\\n[White "Paul Morphy"]\\n[Black "Duke of Brunswick and Count Isouard"]\\n[Result "1-0"]\\n\\n1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0'.replace(/\\n/g, '\n'));
await ev(`document.querySelector('[data-tab=paste]').click(); document.querySelector('#pgn').value = ${PGN}; document.querySelector('#side').value='b'; document.querySelector('#depth').value='16'; document.querySelector('#go').click(); 1`);
for (let i = 0; i < 120; i++) { await sleep(1000); if (await ev(`!!document.querySelector('#s-summary')`)) break; }
await sleep(2500);
await ev(`document.documentElement.style.scrollBehavior='auto'; 1`);
const sec = async (sel, name, pad = 0) => { await ev(`document.querySelector('${sel}').scrollIntoView(); 1`); await sleep(900); };
// summary + first lesson as one tall capture
const a = await rect('#s-summary'), b = await rect('#les0');
await shot('review', { x: 0, y: a.y - 12, width: 1280, height: b.y + b.height - a.y + 60 });
// drill: show the answer so the explanation is visible
await ev(`document.querySelector('#rev0') && document.querySelector('#rev0').click(); 1`); await sleep(500);
const b2 = await rect('#les0');
await shot('lesson', { x: 80, y: b2.y - 10, width: 1120, height: b2.height + 50 });
const v = await rect('#s-review'), vv = await rect('#s-review + section');
await ev(`window.__viewerGo(31); 1`); await sleep(900);
await shot('viewer', { x: 80, y: vv.y - 6, width: 1120, height: vv.height + 12 });
// mobile
await view(390, 844, true); await ev(`window.scrollTo(0,0); 1`); await sleep(600);
await shot('mobile', { x: 0, y: 0, width: 390, height: 844 });
ws.close(); proc.kill();
