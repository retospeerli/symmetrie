const svg = document.getElementById('svg');
const msg = document.getElementById('message');
const nextBtn = document.getElementById('next');
const correctEl = document.getElementById('correct');
const triesEl = document.getElementById('tries');
const buttons = [...document.querySelectorAll('[data-answer]')];

const W = 600, H = 420, GRID = 30;
let correct = 0, tries = 0, current = null;
const used = new Map();

function S(tag, attrs = {}, parent = svg) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent.appendChild(e);
  return e;
}

const P = pts => pts.map(p => p.join(',')).join(' ');

function grid() {
  S('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' });
  for (let x = 0; x <= W; x += GRID) {
    S('line', { x1: x, y1: 0, x2: x, y2: H, stroke: '#b8d1ea', 'stroke-width': x % 150 === 0 ? 1.3 : .8 });
  }
  for (let y = 0; y <= H; y += GRID) {
    S('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#b8d1ea', 'stroke-width': y % 150 === 0 ? 1.3 : .8 });
  }
}

function poly(pts) {
  S('polygon', {
    points: P(pts),
    fill: 'rgba(78,131,189,.10)',
    stroke: '#4e83bd',
    'stroke-width': 4,
    'stroke-linejoin': 'miter'
  });
}

function path(d) {
  S('path', {
    d,
    fill: 'rgba(78,131,189,.10)',
    stroke: '#4e83bd',
    'stroke-width': 4,
    'stroke-linejoin': 'miter',
    'stroke-linecap': 'butt'
  });
}

function circle(cx, cy, r) {
  S('circle', { cx, cy, r, fill: '#fff', stroke: '#4e83bd', 'stroke-width': 4 });
}

function axes(lines) {
  const g = S('g', { id: 'axes', visibility: 'hidden' });
  lines.forEach(l => S('line', {
    x1: l[0], y1: l[1], x2: l[2], y2: l[3],
    stroke: '#e45b3f',
    'stroke-width': 4,
    'stroke-dasharray': '12 8',
    'stroke-linecap': 'round'
  }, g));
}

// Alle wichtigen Punkte liegen auf dem 30er-Raster.
// Der Kreis selbst ist keine Aufgabe. Kleine Kreise werden nur als Löcher/Dekoration genutzt.
const figs = [
  { name: 'Quadrat gross', a: 4, draw() { poly([[210, 90], [390, 90], [390, 270], [210, 270]]); axes([[300, 45, 300, 315], [165, 180, 435, 180], [190, 70, 410, 290], [410, 70, 190, 290]]); } },
  { name: 'Quadrat klein', a: 4, draw() { poly([[240, 120], [360, 120], [360, 240], [240, 240]]); axes([[300, 75, 300, 285], [195, 180, 405, 180], [220, 100, 380, 260], [380, 100, 220, 260]]); } },
  { name: 'Rechteck breit', a: 2, draw() { poly([[150, 120], [450, 120], [450, 240], [150, 240]]); axes([[300, 75, 300, 285], [105, 180, 495, 180]]); } },
  { name: 'Rechteck hoch', a: 2, draw() { poly([[240, 60], [360, 60], [360, 330], [240, 330]]); axes([[300, 30, 300, 360], [195, 195, 405, 195]]); } },
  { name: 'Raute breit', a: 2, draw() { poly([[300, 60], [480, 210], [300, 360], [120, 210]]); axes([[300, 30, 300, 390], [90, 210, 510, 210]]); } },
  { name: 'Raute schmal', a: 2, draw() { poly([[300, 30], [420, 210], [300, 390], [180, 210]]); axes([[300, 0, 300, 420], [150, 210, 450, 210]]); } },
  { name: 'Drachenraute', a: 1, draw() { poly([[300, 30], [420, 180], [300, 360], [210, 180]]); axes([[300, 0, 300, 390]]); } },
  { name: 'Drachen klein', a: 1, draw() { poly([[300, 60], [390, 180], [300, 330], [240, 180]]); axes([[300, 30, 300, 360]]); } },
  { name: 'Gleichseitiges Dreieck', a: 3, draw() { poly([[300, 60], [150, 330], [450, 330]]); axes([[300, 30, 300, 360], [150, 330, 375, 195], [450, 330, 225, 195]]); } },
  { name: 'Gleichschenkliges Dreieck', a: 1, draw() { poly([[300, 60], [150, 300], [450, 300]]); axes([[300, 30, 300, 330]]); } },
  { name: 'Regelmaessiges Sechseck', a: 3, draw() { poly([[210, 90], [390, 90], [480, 210], [390, 330], [210, 330], [120, 210]]); axes([[300, 60, 300, 360], [90, 210, 510, 210], [150, 85, 450, 335]]); } },
  { name: 'I-Traeger', a: 2, draw() { poly([[150, 60], [450, 60], [450, 120], [330, 120], [330, 300], [450, 300], [450, 360], [150, 360], [150, 300], [270, 300], [270, 120], [150, 120]]); axes([[300, 30, 300, 390], [120, 210, 480, 210]]); } },
  { name: 'T-Form', a: 1, draw() { poly([[150, 60], [450, 60], [450, 120], [330, 120], [330, 360], [270, 360], [270, 120], [150, 120]]); axes([[300, 30, 300, 390]]); } },
  { name: 'Pluszeichen', a: 4, draw() { poly([[270, 60], [330, 60], [330, 150], [420, 150], [420, 210], [330, 210], [330, 300], [270, 300], [270, 210], [180, 210], [180, 150], [270, 150]]); axes([[300, 30, 300, 330], [150, 180, 450, 180], [180, 60, 420, 300], [420, 60, 180, 300]]); } },
  { name: 'Kreuz breit', a: 2, draw() { poly([[240, 60], [360, 60], [360, 150], [480, 150], [480, 240], [360, 240], [360, 330], [240, 330], [240, 240], [120, 240], [120, 150], [240, 150]]); axes([[300, 30, 300, 360], [90, 195, 510, 195]]); } },
  { name: 'Symmetrisches Haus', a: 1, draw() { poly([[180, 180], [300, 60], [420, 180], [420, 330], [180, 330]]); axes([[300, 30, 300, 360]]); } },
  { name: 'Haus mit Kamin asymmetrisch', a: 0, draw() { poly([[180, 180], [300, 60], [420, 180], [420, 330], [180, 330], [180, 180], [360, 120], [360, 60], [420, 60], [420, 180]]); axes([]); } },
  { name: 'Krone', a: 1, draw() { poly([[150, 300], [150, 150], [240, 225], [300, 90], [360, 225], [450, 150], [450, 300]]); axes([[300, 60, 300, 330]]); } },
  { name: 'Schild', a: 1, draw() { poly([[180, 90], [420, 90], [420, 210], [300, 360], [180, 210]]); axes([[300, 60, 300, 390]]); } },
  { name: 'Pfeil', a: 1, draw() { poly([[120, 180], [300, 60], [480, 180], [390, 180], [390, 300], [210, 300], [210, 180]]); axes([[300, 30, 300, 330]]); } },
  { name: 'Sanduhr', a: 2, draw() { poly([[180, 60], [420, 60], [300, 210], [420, 360], [180, 360], [300, 210]]); axes([[300, 30, 300, 390], [150, 210, 450, 210]]); } },
  { name: 'Achteck symmetrisch', a: 2, draw() { poly([[210, 90], [390, 90], [480, 180], [480, 240], [390, 330], [210, 330], [120, 240], [120, 180]]); axes([[300, 60, 300, 360], [90, 210, 510, 210]]); } },
  { name: 'Dreiarmiger Stern', a: 3, draw() { poly([[300, 60], [330, 165], [450, 150], [360, 225], [420, 330], [300, 270], [180, 330], [240, 225], [150, 150], [270, 165]]); axes([[300, 30, 300, 360], [165, 120, 435, 300], [435, 120, 165, 300]]); } },
  { name: 'Blattform eckig', a: 1, draw() { poly([[300, 60], [390, 120], [450, 210], [390, 300], [300, 360], [210, 300], [150, 210], [210, 120]]); axes([[300, 30, 300, 390]]); } },
  { name: 'Wappen mit zwei Loechern', a: 1, draw() { poly([[180, 120], [240, 120], [300, 60], [360, 120], [420, 120], [480, 180], [480, 270], [420, 330], [360, 330], [300, 390], [240, 330], [180, 330], [120, 270], [120, 180]]); circle(240, 210, 24); circle(360, 210, 24); axes([[300, 30, 300, 405]]); } },
  { name: 'Stern vierfach', a: 4, draw() { poly([[300, 60], [345, 150], [450, 150], [375, 225], [405, 330], [300, 270], [195, 330], [225, 225], [150, 150], [255, 150]]); axes([[300, 30, 300, 360], [120, 195, 480, 195], [165, 60, 435, 330], [435, 60, 165, 330]]); } },
  { name: 'Symmetrische Krone breit', a: 1, draw() { poly([[120, 330], [120, 180], [210, 240], [270, 120], [300, 210], [330, 120], [390, 240], [480, 180], [480, 330]]); axes([[300, 90, 300, 360]]); } },
  { name: 'Doppelhaus', a: 1, draw() { poly([[150, 210], [210, 120], [270, 210], [270, 330], [330, 330], [330, 210], [390, 120], [450, 210], [450, 330], [150, 330]]); axes([[300, 90, 300, 360]]); } },
  { name: 'Asymmetrisches Fuenfeck', a: 0, draw() { poly([[180, 90], [390, 120], [450, 270], [300, 360], [150, 240]]); axes([]); } },
  { name: 'Asymmetrischer Blitz', a: 0, draw() { poly([[240, 60], [420, 60], [330, 180], [450, 180], [210, 360], [285, 225], [165, 225]]); axes([]); } },
  { name: 'Unregelmaessiges Vieleck', a: 0, draw() { poly([[150, 90], [360, 60], [450, 180], [390, 330], [210, 300], [120, 210]]); axes([]); } },
  { name: 'Schiefe Fahne', a: 0, draw() { poly([[180, 90], [420, 120], [390, 240], [210, 210], [210, 360], [180, 360]]); axes([]); } },
  { name: 'Spirale eckig asymmetrisch', a: 0, draw() { path('M180 90 L420 90 L420 330 L150 330 L150 150 L360 150 L360 270 L210 270 L210 210 L300 210'); axes([]); } },
  { name: 'Asymmetrische Treppe', a: 0, draw() { poly([[150, 90], [300, 90], [300, 150], [360, 150], [360, 210], [450, 210], [450, 330], [150, 330]]); axes([]); } }
];

function drawFigure(f) {
  svg.innerHTML = '';
  grid();
  f.draw();
}

function available() {
  return figs.filter(f => (used.get(f.name) || 0) < 2);
}

function pick() {
  let pool = available();
  if (pool.length === 0) {
    used.clear();
    pool = figs;
  }

  // Leichte Gewichtung: mehr symmetrische Spezialfiguren, aber weiterhin Grundformen und 0-Achsen-Figuren.
  const weighted = [];
  for (const f of pool) {
    const isSpecial = !/(Quadrat|Rechteck|Raute|Drachen|Dreieck)/.test(f.name) && f.a > 0;
    const weight = isSpecial ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(f);
  }

  const f = weighted[Math.floor(Math.random() * weighted.length)];
  used.set(f.name, (used.get(f.name) || 0) + 1);
  return f;
}

function next() {
  if (correct >= 30) {
    finish();
    return;
  }
  current = pick();
  drawFigure(current);
  msg.textContent = 'Wähle eine Antwort.';
  msg.className = 'message';
  nextBtn.hidden = true;
  buttons.forEach(b => b.disabled = false);
}

function showAxes() {
  const g = document.getElementById('axes');
  if (g) g.setAttribute('visibility', 'visible');
}

function finish() {
  svg.innerHTML = '';
  grid();
  S('text', { x: 300, y: 165, 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 800, fill: '#1b2a38' }).textContent = 'Geschafft!';
  S('text', { x: 300, y: 220, 'text-anchor': 'middle', 'font-size': 24, fill: '#1b2a38' }).textContent = `30 richtige Figuren in ${tries} Versuchen.`;
  const quote = tries > 0 ? Math.round((correct / tries) * 100) : 100;
  S('text', { x: 300, y: 260, 'text-anchor': 'middle', 'font-size': 22, fill: '#1b2a38' }).textContent = `Trefferquote: ${quote} %`;
  buttons.forEach(b => b.disabled = true);
  nextBtn.hidden = true;
  msg.textContent = 'Sehr gut gearbeitet.';
  msg.className = 'message correct';
}

buttons.forEach(b => b.addEventListener('click', () => {
  if (!current) return;
  tries++;
  triesEl.textContent = tries;
  const ans = Number(b.dataset.answer);
  showAxes();
  buttons.forEach(x => x.disabled = true);

  if (ans === current.a) {
    correct++;
    correctEl.textContent = correct;
    msg.textContent = `Richtig: ${current.a} ${current.a === 1 ? 'Symmetrieachse' : 'Symmetrieachsen'}.`;
    msg.className = 'message correct';
  } else {
    msg.textContent = `Nicht ganz: Diese Figur hat ${current.a} ${current.a === 1 ? 'Symmetrieachse' : 'Symmetrieachsen'}.`;
    msg.className = 'message wrong';
  }

  nextBtn.hidden = false;
  if (correct >= 30) nextBtn.textContent = 'Auswertung anzeigen';
}));

nextBtn.addEventListener('click', () => {
  nextBtn.textContent = 'Nächste Figur';
  next();
});

next();
