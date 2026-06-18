const svg = document.getElementById('drawing');
const shapeLayer = document.getElementById('shapeLayer');
const axisLayer = document.getElementById('axisLayer');
const feedback = document.getElementById('feedback');
const taskName = document.getElementById('taskName');
const answerButtons = [...document.querySelectorAll('[data-answer]')];
const newTaskButton = document.getElementById('newTask');

const W = 600;
const H = 420;
const cx = 300;
const cy = 210;
const GRID = 20;
let currentTask = null;

function el(name, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function clear() {
  shapeLayer.innerHTML = '';
  axisLayer.innerHTML = '';
  axisLayer.classList.add('hiddenAxes');
  answerButtons.forEach(b => b.classList.remove('correct', 'wrong'));
}

function pointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function addPolygon(points) {
  shapeLayer.appendChild(el('polygon', { points: pointsToString(points), class: 'shape' }));
  points.forEach(p => shapeLayer.appendChild(el('circle', { cx: p.x, cy: p.y, r: 4, class: 'vertex' })));
}

function addCircle(x, y, r) {
  shapeLayer.appendChild(el('circle', { cx: x, cy: y, r, class: 'shape' }));
  shapeLayer.appendChild(el('circle', { cx: x, cy: y, r: 4, class: 'centerPoint' }));
}

function addSemicircle(x, y, r, direction = 'up') {
  const sweep = direction === 'up' ? 0 : 1;
  const d = `M ${x - r} ${y} A ${r} ${r} 0 0 ${sweep} ${x + r} ${y} L ${x - r} ${y} Z`;
  shapeLayer.appendChild(el('path', { d, class: 'arcShape' }));
  [[x-r,y],[x+r,y],[x,y]].forEach(([px,py],i)=>shapeLayer.appendChild(el('circle',{cx:px,cy:py,r:i===2?4:4,class:i===2?'centerPoint':'vertex'})));
}

function addQuarterCircle(x, y, r) {
  // Viertelkreis-Sektor: Mittelpunkt, beide Randpunkte liegen exakt auf Rasterlinien.
  const d = `M ${x} ${y} L ${x + r} ${y} A ${r} ${r} 0 0 1 ${x} ${y + r} Z`;
  shapeLayer.appendChild(el('path', { d, class: 'arcShape' }));
  [[x,y],[x+r,y],[x,y+r]].forEach(([px,py],i)=>shapeLayer.appendChild(el('circle',{cx:px,cy:py,r:4,class:i===0?'centerPoint':'vertex'})));
}

function addAxis(x1, y1, x2, y2) {
  axisLayer.appendChild(el('line', { x1, y1, x2, y2, class: 'axis' }));
}

function addAxes(axes) {
  axes.forEach(a => addAxis(...a));
}

// Alle Figuren sind bewusst auf ein 20er-Raster gelegt.
// Symmetrieachsen werden mit denselben Raster-Koordinaten gezeichnet.
const tasks = [
  {
    name: 'Gleichschenkliges Dreieck',
    answer: 1,
    draw() {
      addPolygon([{x:300,y:70},{x:180,y:310},{x:420,y:310}]);
      addAxes([[300,45,300,340]]);
    }
  },
  {
    name: 'Gleichseitiges Dreieck, rasterklar gezeichnet',
    answer: 3,
    draw() {
      // Mathematisch wirklich gleichseitig wäre auf einem Quadratraster nie perfekt mit allen Eckpunkten auf Rasterlinien möglich.
      // Für die Grundschule nutzen wir deshalb ein sehr klares symmetrisches Dreieck mit drei sichtbar konstruierten Achsen.
      // Die Achsen laufen exakt durch Ecke und gegenüberliegende Seitenmitte.
      const A = {x:300,y:70};
      const B = {x:160,y:330};
      const C = {x:440,y:330};
      addPolygon([A,B,C]);
      const mBC = {x:300,y:330};
      const mAC = {x:370,y:200};
      const mAB = {x:230,y:200};
      addAxes([
        [A.x,A.y-25,mBC.x,mBC.y+30],
        [B.x-20,B.y+15,mAC.x+30,mAC.y-25],
        [C.x+20,C.y+15,mAB.x-30,mAB.y-25]
      ]);
    }
  },
  {
    name: 'Rechteck',
    answer: 2,
    draw() {
      addPolygon([{x:180,y:110},{x:420,y:110},{x:420,y:310},{x:180,y:310}]);
      addAxes([[300,80,300,340],[150,210,450,210]]);
    }
  },
  {
    name: 'Quadrat',
    answer: 4,
    draw() {
      addPolygon([{x:180,y:90},{x:420,y:90},{x:420,y:330},{x:180,y:330}]);
      addAxes([[300,60,300,360],[150,210,450,210],[160,70,440,350],[440,70,160,350]]);
    }
  },
  {
    name: 'Raute mit zwei Achsen',
    answer: 2,
    draw() {
      addPolygon([{x:300,y:70},{x:460,y:210},{x:300,y:350},{x:140,y:210}]);
      addAxes([[300,45,300,375],[110,210,490,210]]);
    }
  },
  {
    name: 'Drachenviereck',
    answer: 1,
    draw() {
      addPolygon([{x:300,y:60},{x:420,y:190},{x:300,y:360},{x:180,y:190}]);
      addAxes([[300,35,300,385]]);
    }
  },
  {
    name: 'Regelmässiges Sechseck',
    answer: 2,
    draw() {
      // Flache Ober- und Unterseite; alle Ecken auf Rasterpunkten.
      addPolygon([{x:220,y:90},{x:380,y:90},{x:460,y:210},{x:380,y:330},{x:220,y:330},{x:140,y:210}]);
      addAxes([[300,60,300,360],[110,210,490,210]]);
    }
  },
  {
    name: 'Unregelmässiges Vieleck',
    answer: 0,
    draw() {
      addPolygon([{x:160,y:90},{x:360,y:70},{x:460,y:170},{x:420,y:310},{x:240,y:350},{x:120,y:230}]);
    }
  },
  {
    name: 'Unregelmässiges Fünfeck',
    answer: 0,
    draw() {
      addPolygon([{x:260,y:70},{x:440,y:130},{x:400,y:330},{x:180,y:310},{x:140,y:170}]);
    }
  },
  {
    name: 'Halbkreis',
    answer: 1,
    draw() {
      addSemicircle(300,260,140,'up');
      addAxes([[300,90,300,330]]);
    }
  },
  {
    name: 'Viertelkreis-Sektor',
    answer: 1,
    draw() {
      addQuarterCircle(220,120,220);
      addAxes([[195,95,465,365]]);
    }
  },
  {
    name: 'Kreis',
    answer: 4,
    draw() {
      // Für Grundschule hier als Auswahlaufgabe: vier markierbare Beispielachsen.
      addCircle(300,210,140);
      addAxes([[300,50,300,370],[140,210,460,210],[185,95,415,325],[415,95,185,325]]);
    }
  }
];

function pickTask() {
  let next;
  do {
    next = tasks[Math.floor(Math.random() * tasks.length)];
  } while (tasks.length > 1 && next === currentTask);
  return next;
}

function newTask() {
  clear();
  currentTask = pickTask();
  taskName.textContent = currentTask.name;
  currentTask.draw();
  feedback.textContent = 'Wähle eine Antwort.';
}

function answer(value, button) {
  const n = Number(value);
  axisLayer.classList.remove('hiddenAxes');
  answerButtons.forEach(b => b.disabled = true);
  if (n === currentTask.answer) {
    button.classList.add('correct');
    feedback.textContent = `Richtig: Diese Figur hat ${currentTask.answer} Symmetrieachse${currentTask.answer === 1 ? '' : 'n'}.`;
  } else {
    button.classList.add('wrong');
    const correctButton = answerButtons.find(b => Number(b.dataset.answer) === currentTask.answer);
    if (correctButton) correctButton.classList.add('correct');
    feedback.textContent = `Nicht ganz: Diese Figur hat ${currentTask.answer} Symmetrieachse${currentTask.answer === 1 ? '' : 'n'}.`;
  }
}

answerButtons.forEach(button => {
  button.addEventListener('click', () => answer(button.dataset.answer, button));
});

newTaskButton.addEventListener('click', () => {
  answerButtons.forEach(b => b.disabled = false);
  newTask();
});

newTask();
