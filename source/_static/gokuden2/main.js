const $ = id => document.getElementById(id);
const stage = $('stage'), screen = $('screen'), cv = $('cv'), ctx = cv.getContext('2d');
const titlecard = $('titlecard'), subtitle = $('subtitle'), hint = $('hint'), controller = $('controller');
ctx.imageSmoothingEnabled = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const loadImg = src => new Promise((ok, ng) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ng; i.src = src; });

// Colours sampled from the battle screen.
const C = {
  fill: '#7b849c', dark: '#42424a', white: '#ffffff',
  red: '#d67394', redDark: '#7a2a44', blue: '#5294de', blueDark: '#215273', green: '#5ab542', greenDark: '#086b18',
};
// Freeza's attacks recorded from the game; `counter` is the response that wins against it.
const ATK = {
  dash: { name: '대쉬 어택', kind: '파워', counter: 'a' },
  zanzo: { name: '잔상 카운터', kind: '반격', counter: 'x' },
  bakuha: { name: '폭발파', kind: '특수', counter: 'b' },
  feint: { name: '페인트 어택', kind: '스피드', counter: 'y' },
  buster: { name: '에너지 버스터', kind: '에네르기파', counter: 'by' },
};
const MOVE = {
  a: { name: '유도기공탄', kind: '기공' }, b: { name: '잔상권', kind: '스피드' },
  x: { name: '전력투구', kind: '파워' }, y: { name: '카운터', kind: '반격' },
  ax: { name: '에네르기파' }, by: { name: '태양권' }, none: { name: '무방비' },
};
const MOVES = ['a', 'b', 'x', 'y', 'ax', 'by'];
// Late-game techniques bound to direction + button (recorded with the $7E0C96 move table).
const FANCY = {
  a: { up: '초기공포', right: '초연속기공탄', left: '초확산기공탄', down: '초유도기공탄' },
  x: { up: '거북선인류최종오의', right: '메테오 스매쉬', left: '파워 러쉬', down: '엘보우 스매쉬' },
  y: { up: '초잔상 카운터', right: '파이널 카운터', left: '리버설 슛', down: '카운터 어택' },
  b: { up: '파이널 어택', right: '초슬래쉬 블로우', left: '페인트 슬래쉬', down: '마하 어택' },
};
let heldDir = null;
// Every exchange take starts 4 frames before Freeza's banner and the response was pressed
// 8 frames after it, so up to this frame all takes of one attack are identical.
const HOLD = 12;
const BANNER = { R: [C.red, C.redDark], B: [C.blue, C.blueDark], G: [C.green, C.greenDark] };
// Opening: the clash take is cut while the two beams still meet; the explosion sound sits
// further into the same recording (seconds after the clip's first frame).
const BOOM_AT = 17.17, BOOM_LEN = 2.6;

let data, sheets, field, font, script, bgmLoop, bubble = {}, img = {}, aura, shadows;
let actx, master, buffers = {};
let muted = false;

async function load() {
  const [d, fj, sj] = await Promise.all([
    fetch('assets/battle/clips.json').then(r => r.json()),
    fetch('assets/ui/font.json').then(r => r.json()),
    fetch('script.json').then(r => r.json()),
    fetch('assets/battle/bgm.json').then(r => r.json()).then(j => { bgmLoop = j; }),
    fetch('assets/battle/aura.json').then(r => r.json()).then(j => { aura = j; }),
    fetch('assets/battle/shadows.json').then(r => r.json()).then(j => { shadows = j; }),
  ]);
  data = d; script = sj;
  // The idle take has two images: Freeza's shadow, or Goku's (the one reaching lower, to his feet).
  const idle = [...new Map(data.clips.idle.frames.map(f => [f[0], f])).values()];
  const bottom = f => f[2] + data.images[f[0]][4];
  idle.sort((a, b) => bottom(a) - bottom(b));
  idleFrame = { F: idle[0], G: idle[idle.length - 1] };
  // Ki charge: the game's power-up aura (images cycle every 2 frames) from the 전력투구 take.
  const zx = data.clips.zanzo_x.frames;
  const a0 = zx.findIndex(f => f && f[0] === 4);
  charge.frames = zx.slice(a0, a0 + 64);
  charge.sfxAt = a0 / data.fps;
  font = { cols: fj.cols, index: new Map([...fj.chars].map((c, i) => [c, i])) };
  aura.img = await loadImg('assets/battle/aura.png');
  shadows.img = await loadImg('assets/battle/shadows.png');
  [field, font.img, img.shenron, bubble.F, bubble.G, ...sheets] = await Promise.all([
    loadImg('assets/battle/field.png'), loadImg('assets/ui/font.png'), loadImg('assets/ui/shenron.png'),
    loadImg('assets/ui/bubble_F.png'), loadImg('assets/ui/bubble_G.png'),
    ...Array.from({ length: data.sheets }, (_, i) => loadImg(`assets/battle/sheet${i}.png`)),
  ]);
}

async function loadAudio() {
  actx = new AudioContext();
  master = actx.createGain();
  master.connect(actx.destination);
  const names = ['bgm', 'patchbgm', 'sfx/charge', ...Object.keys(data.clips).map(n => `sfx/${n}`)];
  await Promise.all(names.map(async n => {
    const buf = await fetch(`assets/battle/${n}.flac`).then(r => r.arrayBuffer());
    buffers[n] = await actx.decodeAudioData(buf);
  }));
}

function playBuffer(name, { when = 0, offset = 0, duration, loop = false, loopStart = 0, loopEnd = 0, gain = 1, fadeOut = 0 } = {}) {
  const src = actx.createBufferSource();
  src.buffer = buffers[name];
  src.loop = loop;
  if (loop && loopEnd) { src.loopStart = loopStart; src.loopEnd = loopEnd; }
  const g = actx.createGain();
  g.gain.value = gain;
  src.connect(g).connect(master);
  src.gainNode = g;
  const at = when || actx.currentTime;
  loop ? src.start(at, offset) : src.start(at, offset, duration);
  if (fadeOut && duration) {
    g.gain.setValueAtTime(gain, at + duration - fadeOut);
    g.gain.linearRampToValueAtTime(0, at + duration);
  }
  return src;
}

// ---------- clip playback (clock = audio clock, so sound effects stay in sync) ----------
const now = () => actx ? actx.currentTime : performance.now() / 1000;
let cur = null;           // {name, clip, t0, hold, done}

const liveSfx = new Set();
function sfxOf(name, opts) {
  const src = playBuffer(name, opts);
  liveSfx.add(src);
  src.onended = () => liveSfx.delete(src);
  return src;
}
function stopSfx() { for (const s of liveSfx) { try { s.stop(); } catch (e) {} } liveSfx.clear(); }

function playClip(name, { from = 0, hold = null } = {}) {
  const clip = data.clips[name];
  const t0 = now() + 0.03 - from / data.fps;
  const len = (hold ?? clip.frames.length) - from;
  stopSfx();
  sfxOf(`sfx/${name}`, { when: now() + 0.03, offset: clip.sfxOffset + from / data.fps, duration: len / data.fps, fadeOut: 0.08 });
  return new Promise(done => {
    cur = { name, clip, t0, hold, done, ev: 0, scoring: false };
    while (clip.events && cur.ev < clip.events.length && clip.events[cur.ev][0] < from) cur.ev++;
  });
}

function frameIndex() {
  if (!cur) return null;
  let i = Math.floor((now() - cur.t0) * data.fps);
  if (cur.hold !== null && i >= cur.hold) return cur.hold;
  if (i >= cur.clip.frames.length) {
    const d = cur.done;
    cur = null;
    d();
    return null;
  }
  return Math.max(0, i);
}

let chargeAllowed = false;
const chargeOk = () => chargeAllowed && !cur;
function startCharge() {
  charge.t0 = now();
  view.turn = 'G';
  // Charge sound cut from normal play (seamless loop).
  charge.src = playBuffer('sfx/charge', { loop: true, gain: 0.9 });

}
function stopCharge() {
  charge.t0 = 0;
  if (charge.src) { charge.src.stop(); charge.src = null; }
}

// HP/ki changes recorded from the game, applied on the frame they happened.
function applyEvents(i) {
  const ev = cur.clip.events;
  if (!ev || !cur.scoring) return;
  while (cur.ev < ev.length && ev[cur.ev][0] <= i) {
    const [, dg, df, dk] = ev[cur.ev++];
    // Goku's damage is softened (x0.6, max 400 a hit) so one energy buster is not a one-shot.
    game.hp = Math.max(0, game.hp + Math.max(dg * 0.6, -400));
    game.fhp = Math.max(0, game.fhp + df);
    game.ki = Math.max(0, game.ki + dk);
  }
}
// What the HUD shows eases toward the real values, like a counter rolling down.
const shown = { hp: 1000, ki: 200 };
function easeHud() {
  for (const k of ['hp', 'ki']) {
    const d = game[k] - shown[k];
    shown[k] = Math.abs(d) < 1 ? game[k] : shown[k] + Math.sign(d) * Math.max(1, Math.abs(d) * 0.12);
  }
}

function drawOverlay(f) {
  if (!f) return;
  const [img, x, y] = f;
  const [s, sx, sy, w, h] = data.images[img];
  ctx.drawImage(sheets[s], sx, sy, w, h, x, y, w, h);
}

// ---------- HUD, dialogue boxes, ROM font ----------
const view = { hud: false, box: null, flash: 0, flashColor: '#fff', turn: 'F' };
// The game draws a shadow only under the character whose turn it is (speaker or attacker).
let idleFrame = {};
const charge = { frames: [], sfxAt: 0, t0: 0, src: null };

function glyphs(text, x, y) {
  [...text].forEach((ch, k) => {
    const i = font.index.get(ch);
    if (ch === '+') {  // not in the ROM font
      ctx.fillStyle = C.white;
      ctx.fillRect(x + k * 12 + 2, y + 9, 8, 2); ctx.fillRect(x + k * 12 + 5, y + 6, 2, 8);
      return;
    }
    if (i === undefined) return;
    ctx.drawImage(font.img, (i % font.cols) * 16, Math.floor(i / font.cols) * 16, 16, 16, x + k * 12, y, 16, 16);
  });
}

function hudBox(x, y, w, h, fill = C.fill, dark = C.dark) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.white; ctx.fillRect(x, y, w - 2, 2); ctx.fillRect(x, y, 2, h - 2);
  ctx.fillStyle = dark; ctx.fillRect(x + w - 2, y, 2, h); ctx.fillRect(x, y + h - 2, w, 2);
}

const game = { hp: 1000, ki: 200, fhp: 0, atk: null, resp: null };

function num(n, right, y) { const t = String(Math.max(0, Math.round(n))); glyphs(t, right - t.length * 12, y); }

function drawHud(i) {
  hudBox(0, 11, 104, 28); glyphs('프리더', 20, 15);
  hudBox(0, 203, 104, 28); glyphs('체력', 20, 207); num(shown.hp, 94, 207);
  const ex = game.atk && cur && cur.clip.banner !== undefined ? cur.clip : null;
  const decided = ex && game.resp && i >= ex.banner;
  if (game.atk && cur) {
    const [f, d] = decided && ex.freeza ? BANNER[ex.freeza] : [C.fill, C.dark];
    hudBox(104, 11, 152, 28, f, d);
    glyphs(ATK[game.atk].name, 112, 15);
  }
  if (decided) {
    const [f, d] = ex.goku ? BANNER[ex.goku] : [C.fill, C.dark];
    hudBox(104, 203, 152, 28, f, d);
    glyphs(game.respName || MOVE[game.resp].name, 112, 207);
  } else {
    hudBox(104, 203, 152, 28); glyphs('전투력', 112, 207); num(shown.ki, 244, 207);
  }
}

// Speech bubbles are cut from the game: fixed size, placed where the game puts them.
const BUBBLE = { F: { x: 24, y: 48, tx: 32, ty: 55 }, G: { x: 67, y: 120, tx: 80, ty: 127 } };

function drawBox(box) {
  const b = BUBBLE[box.who];
  ctx.drawImage(bubble[box.who], b.x, b.y);
  box.lines.forEach((l, k) => glyphs(l, b.tx, b.ty + k * 16));
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 239);
  if (data) {
    ctx.drawImage(field, 0, 0);
    const i = frameIndex();
    if (cur && i !== null) applyEvents(i);
    if (cur && i !== null) {
      // Restore the shadow the game drops from the non-active fighter.
      const sh = shadows && shadows.clips[cur.name] && shadows.clips[cur.name][i];
      if (sh) for (const [k, who] of [[0, 'G'], [1, 'F']]) {
        const p = sh[k], m = shadows.shadow[who];
        if (p) ctx.drawImage(shadows.img, m.sx, 0, m.w, m.h, p[0] + m.dx, p[1] + m.dy, m.w, m.h);
      }
      drawOverlay(cur.clip.frames[i]);
    }
    else if (charging && chargeOk()) {
      if (!charge.t0) startCharge();
      // The game's ki-charge aura, cut from base-form Goku in normal play, drawn behind SSJ Goku.
      const k = Math.floor((now() - charge.t0) * data.fps) % aura.frames.length;
      const af = aura.frames[k] || aura.frames[k + 1];
      ctx.drawImage(aura.img, af[0], 0, af[1], af[2], Math.round(aura.goku[0] + af[3]), aura.goku[1] + af[4], af[1], af[2]);
      drawOverlay(idleFrame.F); drawOverlay(idleFrame.G);
    } else {
      if (charge.t0) stopCharge();
      // The game shadows only the active fighter; drawing both idle images keeps both shadows.
      drawOverlay(idleFrame.F); drawOverlay(idleFrame.G);
    }
    easeHud();
    if (view.hud) drawHud(i);
    if (view.box) drawBox(view.box);
  }
  if (view.flash > 0) {
    ctx.globalAlpha = view.flash; ctx.fillStyle = view.flashColor; ctx.fillRect(0, 0, 256, 239); ctx.globalAlpha = 1;
  }
  requestAnimationFrame(draw);
}

function tweenFlash(to, ms, color) {
  if (color) view.flashColor = color;
  const from = view.flash, t0 = performance.now();
  return new Promise(r => {
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / ms);
      view.flash = from + (to - from) * k;
      k < 1 ? requestAnimationFrame(step) : r();
    })();
  });
}

function shake() { screen.classList.remove('shake'); void screen.offsetWidth; screen.classList.add('shake'); }

// ---------- input ----------
let waiter = null, skipOpening = null, onResponse = null, charging = false;
const confirm = () => new Promise(r => { waiter = r; });
const fireConfirm = () => { if (waiter) { const w = waiter; waiter = null; w(); } };

screen.addEventListener('click', e => { if (!e.target.closest('#start, #menu')) fireConfirm(); });
document.querySelector('.cmp').addEventListener('click', () => { if (pskip && !waiter) pskip(); else fireConfirm(); });

// A+X / B+Y count as a combo when the second button lands within a short window.
let pending = null;
function pressButton(b) {
  if (!onResponse) { if (b === 'a') fireConfirm(); return; }
  if (pending && pending.b !== b) {
    const pair = [pending.b, b].sort().join('');
    if (pair === 'ax' || pair === 'by') { clearTimeout(pending.t); pending = null; respond(pair); return; }
  }
  if (pending) clearTimeout(pending.t);
  pending = { b, t: setTimeout(() => { pending = null; if ('abxy'.includes(b)) respond(b); }, 110) };
}
function respond(m) {
  if (!onResponse) return;
  document.querySelectorAll('#moves li').forEach(li => li.classList.toggle('hit', li.dataset.move === m));
  onResponse(m);
}

const held = new Set();
function padDown(b) { held.add(b); document.querySelector(`#pad [data-btn="${b}"]`)?.classList.add('down'); charging = held.has('l') && held.has('r'); }
function padUp(b) { held.delete(b); document.querySelector(`#pad [data-btn="${b}"]`)?.classList.remove('down'); charging = held.has('l') && held.has('r'); }

// Same keys as the user's Mesen SNES controller (settings.json Snes.Port1.Mapping1).
const KEYMAP = { d: 'a', c: 'b', s: 'x', x: 'y', q: 'l', w: 'r' };
const KEYNAME = Object.fromEntries(Object.entries(KEYMAP).map(([k, b]) => [b, k.toUpperCase()]));
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'enter' || k === ' ') {
    e.preventDefault();
    if (stage.dataset.scene === 'start') run();
    else if (menuPick) menuPick();
    else if (pskip && !waiter) pskip();
    else fireConfirm();
  } else if (k === 'escape' && skipOpening) skipOpening();
  else if ((k === 'arrowup' || k === 'arrowdown') && menuMove) { e.preventDefault(); menuMove(); }
  else if (k.startsWith('arrow')) { e.preventDefault(); heldDir = k.slice(5); }
  else if (KEYMAP[k]) { padDown(KEYMAP[k]); if ('abxy'.includes(KEYMAP[k])) pressButton(KEYMAP[k]); }
});
document.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (key.startsWith('arrow') && heldDir === key.slice(5)) heldDir = null;
  const k = KEYMAP[key]; if (k) padUp(k);
});

$('pad').addEventListener('pointerdown', e => {
  const dirEl = e.target.closest('[data-dir]');
  if (dirEl) {
    e.preventDefault();
    heldDir = dirEl.dataset.dir;
    const up = () => { heldDir = null; window.removeEventListener('pointerup', up); };
    window.addEventListener('pointerup', up);
    return;
  }
  const g = e.target.closest('[data-btn]');
  if (!g) return;
  e.preventDefault();
  const b = g.dataset.btn;
  padDown(b);
  if ('abxy'.includes(b)) pressButton(b);
  const up = () => { padUp(b); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointerup', up);
});
$('moves').addEventListener('click', e => {
  const li = e.target.closest('[data-move]');
  if (li) respond(li.dataset.move);
});

// ---------- battle ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
let bubbleTimer = null;
function say(page, ms) {
  const [who, ...lines] = page;
  view.box = { who, lines };
  view.turn = who;
  clearTimeout(bubbleTimer);
  if (ms) bubbleTimer = setTimeout(() => { if (view.box && view.box.lines === lines) view.box = null; }, ms);
}

// Freeza powers up (pink aura) before he picks an attack, as in the game.
async function windup() {
  view.turn = 'F';
  await playClip('windup');
}

// One exchange: Freeza's banner appears, the take holds just before the response until the
// player answers (or `window` ms pass), then continues in the take for that answer.
async function exchange(atk, { window = null, onHold, accept } = {}) {
  game.atk = atk; game.resp = null;
  view.turn = 'F';
  $('why').hidden = true;
  const holding = playClip(`${atk}_none`, { hold: HOLD });
  onHold && onHold();
  let resp = await new Promise(res => {
    let timer = window ? setTimeout(() => res('none'), window) : null;
    onResponse = m => {
      if (accept && !accept(m)) return;
      clearTimeout(timer); res(m);
    };
  });
  onResponse = null;
  only(null);  // drop the guide highlight as soon as the move is chosen
  // Not enough ki: the move fizzles and Goku takes the hit.
  const take = data.clips[`${atk}_${resp}`];
  if (resp !== 'none' && game.ki + take.dKi < 0) {
    say(script.lowKi, 1800);
    resp = 'none';
  }
  // Direction held with the button: use the late-game technique take if one was recorded.
  let takeName = `${atk}_${resp}`;
  game.respName = MOVE[resp].name;
  if (heldDir && FANCY[resp] && data.clips[`${atk}_${resp}_${heldDir}`]) {
    takeName = `${atk}_${resp}_${heldDir}`;
    game.respName = FANCY[resp][heldDir];
  }
  game.resp = resp;
  view.box = null;
  cur = null;
  // With no answer the take still waits for input until just before its banner; skip that.
  const from = resp === 'none' ? Math.max(HOLD, data.clips[`${atk}_none`].banner - 6) : HOLD;
  const playing = playClip(takeName, { from });
  cur.scoring = true;
  await playing;
  const t = data.clips[takeName];
  why(atk, resp, t);
  document.querySelectorAll('#moves li').forEach(li => li.classList.remove('hit'));
  game.atk = null;
  return { resp, t };
}

// Why an exchange went the way it did (the game's rock-paper-scissors).
const BEATS = { 기공: '파워', 스피드: '기공', 반격: '스피드', 파워: '반격' };
function why(atk, resp, t) {
  const A = ATK[atk], M = { ...MOVE[resp], name: game.respName || MOVE[resp].name };
  const vs = `프리더 ${A.name}(${A.kind}) vs 오공 ${M.name}${M.kind ? `(${M.kind})` : ''}`;
  let reason;
  if (resp === 'none') reason = '아무 기술도 못 써서 그대로 맞았다';
  else if (t.goku === 'B') {
    if (resp === 'by') reason = '태양권으로 눈을 가려 에네르기파 계열을 피했다';
    else if (resp === 'ax') reason = '에네르기파는 보통 기술을 이긴다';
    else if (BEATS[M.kind] === A.kind) reason = `${M.kind} 계열은 ${A.kind} 계열에 강하다`;
    else reason = `${A.name}는 ${M.name}에 약하다`;
  } else if (t.goku === 'R') {
    if (atk === 'buster') reason = '에너지 버스터는 태양권이 아니면 못 막는다';
    else if (resp === 'by') reason = '태양권은 에네르기파 계열에만 통한다';
    else if (resp === 'ax') reason = `${A.name}는 에네르기파도 이긴다`;
    else if (BEATS[A.kind] === M.kind) reason = `${A.kind} 계열은 ${M.kind} 계열에 강하다`;
    else reason = `${A.name}에 ${M.name}는 안 통한다`;
  } else {
    reason = A.kind === M.kind ? '같은 계열끼리는 비긴다' : `${A.kind}와 ${M.kind}는 서로 마주 보는 계열이라 비긴다`;
  }
  const label = { B: '이김', R: '짐', G: '비김' }[t.goku] || '짐';
  const el = $('why');
  el.innerHTML = `<b class="${t.goku || 'R'}">${label}</b>${vs} — ${reason}`;
  el.hidden = false;
}

// Judge by Goku's banner colour (B win / R lose / G draw): a won 태양권 deals no damage.
function react(t, ms = 1600) {
  if (t.goku === 'B') say(pick(script.freezaHit), ms);
  else if (t.goku === 'R') say(pick(script.freezaWin), ms);
  else say(pick(script.draw), ms);
}

function updateBar() {
  const n = Math.ceil(game.fhp / 300);
  $('fhp').textContent = '프리더 ' + '■'.repeat(n) + '□'.repeat(Math.max(0, 10 - n));
}

// Tutorial: only the wanted button is live (others dimmed), Goku is refilled after every exchange.
function only(m) {
  document.querySelectorAll('#moves li').forEach(li => li.classList.toggle('off', !!m && li.dataset.move !== m));
  document.querySelectorAll('#moves li').forEach(li => li.classList.toggle('want', !!m && li.dataset.move === m));
  const parts = m ? (m.length === 2 ? [...m] : [m]) : [];
  document.querySelectorAll('#pad [data-btn]').forEach(g => {
    g.classList.toggle('off', !!m && !parts.includes(g.dataset.btn));
    g.classList.toggle('want', parts.includes(g.dataset.btn));
  });
}

async function tutorial() {
  hint.textContent = '프리더의 기술을 보고 받아칠 기술을 고르세요';
  for (const step of script.tutorial) {
    await talk([step.before]);
    hint.textContent = '프리더의 기술을 보고 받아칠 기술을 고르세요';
    const want = step.move || ATK[step.atk].counter;
    await windup();
    if (step.demo) {
      // Losing example: the player presses the wrong counter on purpose to see what happens.
      only(step.demo);
      const r = await exchange(step.atk, { onHold: () => say(step.guide), accept: m => m === step.demo });
      react(r.t, 0);
      await sleep(600);
      await confirm();
      view.box = null;
      if (step.after) await talk([step.after]);
    } else {
      only(want);
      for (;;) {
        const r = await exchange(step.atk, { onHold: () => say(step.guide), accept: m => m === want });
        if (r.resp === want) {
          react(r.t, 0); hint.textContent = '▶ 클릭 · Enter'; await confirm(); view.box = null;
          if (step.after) await talk([step.after]);
          break;
        }
      }
    }
    game.ki = 200; game.hp = Math.max(game.hp, 300);  // keep damage visible, never let the tutorial kill Goku
  }
  // Ki charge step: hold L+R until the gauge is full.
  game.ki = 40;
  say(script.chargeGuide);
  only(null);
  document.querySelectorAll('#moves li').forEach(li => li.classList.add('off'));
  document.querySelectorAll('#pad [data-btn]').forEach(g => {
    const lr = g.dataset.btn === 'l' || g.dataset.btn === 'r';
    g.classList.toggle('off', !lr); g.classList.toggle('want', lr);
  });
  hint.textContent = `L+R 을 꾹 누르세요 (키보드 ${KEYNAME.l}+${KEYNAME.r})`;
  chargeAllowed = true;
  while (game.ki < 200) {
    if (charge.t0) game.ki = Math.min(200, game.ki + 2);
    await sleep(33);
  }
  chargeAllowed = false;
  only(null);
  hint.textContent = '▶ 클릭 · Enter';
  await talk(script.afterTutorial);
}

async function realtime() {
  game.hp = 1000; game.ki = 200; game.fhp = 3000; game.atk = null; game.resp = null;
  cur = null; view.box = null; view.turn = 'G'; only(null);
  $('fhp').hidden = false; updateBar();
  hint.textContent = `배너가 뜨면 바로 받아치세요 · 기 모으기: L+R 꾹 (${KEYNAME.l}+${KEYNAME.r})`;
  chargeAllowed = true;
  const atks = Object.keys(ATK);
  while (game.hp > 0 && game.fhp > 0) {
    // The game leaves a few seconds between exchanges (time to charge with L+R).
    const wait = 1000 + Math.random() * 2000, t0 = performance.now();
    while (performance.now() - t0 < wait) {
      if (charge.t0 && game.ki < 200) game.ki = Math.min(200, game.ki + 2);
      await sleep(33);
    }
    if (game.hp <= 0) break;
    stopCharge();
    await windup();
    const atk = pick(atks);
    const kind = ATK[atk].kind;
    hint.textContent = `${ATK[atk].name} (${kind}) · 파워 < 기공 < 스피드 < 반격 < 파워`;
    // Like the game, Freeza's banner stays up a couple of seconds before he strikes.
    const r = await exchange(atk, { window: 2600 });
    react(r.t);
    updateBar();
  }
  chargeAllowed = false; stopCharge();
  const won = game.fhp <= 0;
  hint.textContent = '';
  await sleep(1200);
  view.box = null;
  await playClip(won ? 'ko_win' : 'ko_lose', { from: 0 });
  await talk(won ? script.win : script.lose);
  $('fhp').hidden = true;
  $('why').hidden = true;
  return won;
}

// ---------- scenes ----------
async function opening() {
  stage.dataset.scene = 'opening';
  view.hud = false;
  let skipped = false;
  const skip = new Promise(r => { skipOpening = () => { skipped = true; r(); }; });
  await Promise.race([playClip('melee').then(() => !skipped && playClip('clash')), skip]);
  skipOpening = null;
  cur = null;
  stopSfx();
  view.flash = 1; view.flashColor = '#fff';
  // Same explosion whether the opening ran to the end or was skipped.
  sfxOf('sfx/clash', { offset: data.clips.clash.sfxOffset + BOOM_AT, duration: BOOM_LEN });
  shake();
  await sleep(900);
}

let menuPick = null, menuMove = null;
async function title() {
  stage.dataset.scene = 'title';
  view.hud = false; view.box = null; view.turn = 'G';
  titlecard.className = 'show';
  tweenFlash(0, 1200);
  await sleep(700);
  titlecard.classList.add('in');
  await sleep(920);
  const text = '한글패치 v1.2';
  for (let i = 1; i <= text.length; i++) { subtitle.textContent = text.slice(0, i); await sleep(70); }
  const menu = $('menu'), items = [...menu.querySelectorAll('button')];
  menu.hidden = false;
  let sel = 0;
  const show = () => items.forEach((b, k) => b.classList.toggle('sel', k === sel));
  show();
  hint.textContent = '↑↓ 고르기 · Enter 결정';
  const choice = await new Promise(res => {
    menuMove = () => { sel = 1 - sel; show(); };
    menuPick = () => res(items[sel].dataset.go);
    items.forEach((b, k) => { b.onclick = () => res(b.dataset.go); b.onmouseenter = () => { sel = k; show(); }; });
  });
  menuMove = menuPick = null;
  menu.hidden = true;
  titlecard.classList.add('out');
  await sleep(500);
  titlecard.className = '';
  subtitle.textContent = '';
  hint.textContent = '';
  return choice;
}

async function talk(pages) {
  hint.textContent = '▶ 클릭 · Enter · A';
  for (const page of pages) { say(page); await confirm(); }
  view.box = null;
  hint.textContent = '';
}

async function play() {
  stage.dataset.scene = 'battle';
  view.hud = true;
  game.hp = 1000; game.ki = 200;
  await talk(script.intro);
  controller.hidden = false;
  await tutorial();
  await realtime();  // win or lose, back to the title menu afterwards
  controller.hidden = true;
  $('why').hidden = true;
  view.hud = false;
}

// ---------- music switching (fade between battle music and patch-notes music) ----------
const music = { battle: null, patch: null };
// Sound-test track used for the patch notes (rendered by capture/ from the debug SOUND menu).
const PATCH_BGM = 'M08';
function fadeSource(src, to, sec) {
  const g = src && src.gainNode;
  if (!g) return;
  g.gain.cancelScheduledValues(actx.currentTime);
  g.gain.setValueAtTime(g.gain.value, actx.currentTime);
  g.gain.linearRampToValueAtTime(to, actx.currentTime + sec);
}
function patchMusic(on) {
  fadeSource(music.battle, on ? 0 : 0.8, 1.2);
  if (on && PATCH_BGM && !music.patch) music.patch = playBuffer('patchbgm', { loop: true, ...patchLoop, gain: 0 });
  fadeSource(music.patch, on ? 0.8 : 0, 1.2);
}

// ---------- patch notes: Shenron narrates over v1.1 / v1.2 game footage ----------
const pv = { v11: $('v11'), v12: $('v12') }, pi = { v11: $('i11'), v12: $('i12') };
const ph = { v11: $('h11').getContext('2d'), v12: $('h12').getContext('2d') };
const shen = $('shen').getContext('2d');
shen.imageSmoothingEnabled = false;
let patchData = null, rate = 1, pskip = null;

// Narration window: types the text like the game; `wait` adds the blinking ▼ and waits for a press.
let narr = { lines: [], shown: 0, cursor: false };
function drawNarration() {
  shen.clearRect(0, 0, 340, 96);
  // Like the game's intro: the whole dragon moves 1px up and down every 32 frames.
  const bob = Math.floor(performance.now() / (32 * 1000 / 60)) % 2;
  shen.drawImage(img.shenron, 40, 4, 176, 128, 0, bob, 132, 96);
  shen.drawImage(img.shenron, 32, 143, 192, 80, 140, 8, 192, 80);
  let left = narr.shown;
  narr.lines.forEach((l, k) => {
    [...l].slice(0, Math.max(0, left)).forEach((ch, j) => {
      const i = font.index.get(ch);
      if (i !== undefined) shen.drawImage(font.img, (i % font.cols) * 16, Math.floor(i / font.cols) * 16, 16, 16, 156 + j * 12, 16 + k * 16, 16, 16);
    });
    left -= l.length;
  });
  if (narr.cursor && Math.floor(performance.now() / 350) % 2 === 0) {
    shen.fillStyle = '#ffe14d';
    for (let r = 0; r < 5; r++) shen.fillRect(312 + r, 70 + r, 9 - r * 2, 1);
  }
  if (stage.dataset.scene === 'patch') requestAnimationFrame(drawNarration);
}

async function narrate(lines, { wait = false } = {}) {
  narr = { lines, shown: 0, cursor: false };
  const total = lines.join('').length;
  let fast = false;
  const skip = confirm().then(() => { fast = true; });
  for (; narr.shown < total && !fast; narr.shown++) await sleep(40);
  narr.shown = total;
  if (wait) {
    narr.cursor = true;
    hint.textContent = '▼ 다음 버튼 · 클릭 · Enter 를 누르세요';
    if (!fast) await skip; else await confirm();
    narr.cursor = false;
    hint.textContent = '';
  } else if (!fast) {
    await Promise.race([skip, sleep(1400 + total * 25)]);
  }
  waiter = null;
}
async function narratePages(pages, opts) {
  for (let k = 0; k < pages.length; k++) await narrate(pages[k], { wait: opts?.wait && k === pages.length - 1 });
}

function highlight(ver, rects) {
  const c = ph[ver];
  c.clearRect(0, 0, 256, 239);
  c.strokeStyle = '#ff2a2a'; c.lineWidth = 2;
  for (const [x0, y0, x1, y1] of rects) c.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0, y1 - y0);
}
function lack(ver, on) { pv[ver].parentElement.querySelector('.lack').hidden = !on; }

function showMedia(kind, item) {
  for (const v of ['v11', 'v12']) {
    highlight(v, []); lack(v, false);
    pv[v].hidden = kind !== 'video'; pi[v].hidden = kind !== 'image';
    if (kind === 'video') { pv[v].src = `assets/patch/${item}-${v}.mp4`; pv[v].currentTime = 0; pv[v].playbackRate = rate; }
  }
}

// Play both takes until each reaches its stop time (null = that version has no such page).
function runTo(stop) {
  return new Promise(res => {
    const target = { v11: stop.v11, v12: stop.v12 };
    for (const v of ['v11', 'v12']) {
      if (target[v] === null) { pv[v].pause(); lack(v, true); } else { lack(v, false); pv[v].playbackRate = rate; pv[v].play(); }
    }
    pskip = () => { for (const v of ['v11', 'v12']) if (target[v] !== null) pv[v].currentTime = target[v]; };
    hint.textContent = '재생 중 · 다음 버튼 · Enter 로 건너뛰기';
    (function watch() {
      let done = true;
      for (const v of ['v11', 'v12']) {
        if (target[v] === null) continue;
        if (pv[v].currentTime >= target[v]) { pv[v].pause(); pv[v].currentTime = target[v]; } else done = false;
      }
      if (done) { pskip = null; if (hint.textContent.startsWith('재생 중')) hint.textContent = ''; res(); }
      else requestAnimationFrame(watch);
    })();
  });
}

async function patchNotes() {
  stage.dataset.scene = 'patch';
  patchMusic(true);
  if (!patchData) patchData = await fetch('assets/patch/patch.json').then(r => r.json());
  $('patchview').hidden = false;
  requestAnimationFrame(drawNarration);
  showMedia('image');
  pi.v11.src = 'assets/ui/title_jp.png'; pi.v12.src = 'assets/ui/title_kr.png';
  await narratePages(script.patch.intro);
  for (const item of script.patch.items) {
    if (item.id === 'title') {
      highlight('v11', [[10, 40, 214, 104]]); highlight('v12', [[10, 56, 118, 104]]);
      await narratePages(item.say, { wait: true });
      continue;
    }
    showMedia('video', item.id);
    if (item.id === 'pod') {
      // The difference is time spent on the map: play both while Shenron explains.
      const len = patchData.items.pod.length;
      const run = runTo({ v11: len, v12: len });
      await narratePages(item.say.slice(0, 1));
      await run;
      await narratePages(item.say.slice(1), { wait: true });
      continue;
    }
    // Footage starts right away; the narration plays over it and the first stop waits.
    const stops = patchData.items[item.id].stops;
    let k = 0;
    const talking = narratePages(item.say);
    for (const stop of stops) {
      for (const v of ['v11', 'v12']) highlight(v, []);
      await runTo(stop);
      if (k++ === 0) await talking;
      highlight('v11', stop.hl11); highlight('v12', stop.hl12);
      narr.cursor = true;
      hint.textContent = '▼ 다음 버튼 · 클릭 · Enter 를 누르세요';
      await confirm();
      narr.cursor = false;
      hint.textContent = '';
    }
  }
  showMedia('image');
  pi.v11.src = 'assets/ui/title_jp.png'; pi.v12.src = 'assets/ui/title_kr.png';
  await narratePages(script.patch.outro, { wait: true });
  $('patchview').hidden = true;
  patchMusic(false);
}

$('pnext').addEventListener('click', () => { if (pskip && !waiter) pskip(); else fireConfirm(); });
$('shen').addEventListener('click', () => fireConfirm());
$('pfast').addEventListener('click', () => {
  rate = rate === 1 ? 2 : 1;
  $('pfast').classList.toggle('on', rate === 2);
  for (const v of ['v11', 'v12']) pv[v].playbackRate = rate;
});
$('pback').addEventListener('click', () => location.reload());
let patchLoop = {};
fetch('assets/battle/patchbgm.json').then(r => r.json()).then(j => { patchLoop = j; });

async function run() {
  stage.dataset.scene = 'loading';
  if (!actx) await loadAudio();
  await actx.resume();
  // The song's intro plays once; loopStart..loopEnd repeats seamlessly after that.
  music.battle = playBuffer('bgm', { loop: true, ...bgmLoop, gain: 0.8 });
  await opening();
  for (;;) {
    const go = await title();
    if (go === 'play') await play(); else await patchNotes();
    await tweenFlash(1, 400, '#fff');
  }
}

$('start').addEventListener('click', run);
$('skip').addEventListener('click', () => skipOpening && skipOpening());
$('mute').addEventListener('click', () => {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 1;
  $('mute').textContent = muted ? '소리 OFF' : '소리 ON';
});

// Show the keyboard key on every pad button and move-list entry.
document.querySelectorAll('#pad [data-btn]').forEach(g => {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  const c = g.querySelector('circle'), r = g.tagName === 'rect' ? g : null;
  const x = c ? +c.getAttribute('cx') : +r.getAttribute('x') + +r.getAttribute('width') / 2;
  const y = c ? +c.getAttribute('cy') + 40 : +r.getAttribute('y') - 2;
  t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', 'kl');
  t.textContent = KEYNAME[g.dataset.btn];
  g.parentNode.appendChild(t);
});
document.querySelectorAll('#moves li[data-move]').forEach(li => {
  const keys = [...li.dataset.move].map(b => KEYNAME[b]).join('+');
  li.insertAdjacentHTML('beforeend', `<i class="key">${keys}</i>`);
});

// Size the game screen from the space the bottom bar leaves (its height changes with the panels).
const fit = () => { if (innerWidth < 900) document.documentElement.style.setProperty('--bar', ($('bar').offsetHeight + 40) + 'px'); };
new ResizeObserver(fit).observe($('bar'));
addEventListener('resize', fit);

load().then(() => requestAnimationFrame(draw));
