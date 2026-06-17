const svg = document.getElementById("canvas");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const newTaskBtn = document.getElementById("newTaskBtn");

let currentTask = null;
let answered = false;
let axisGroup = null;

const NS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function clearSvg() {
  svg.innerHTML = "";
  axisGroup = null;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function polygonPoints(cx, cy, r, n, rotation = -90) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (rotation + i * 360 / n) * Math.PI / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function pointsToString(points) {
  return points.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

function drawPolygon(points) {
  svg.appendChild(el("polygon", { points: pointsToString(points), class: "shape" }));
}

function drawRect(x, y, w, h) {
  // Absichtlich ohne Rundung: Vielecke und Rechtecke haben scharfe Ecken.
  svg.appendChild(el("rect", { x, y, width: w, height: h, class: "shape" }));
}

function drawCircle(cx, cy, r) {
  svg.appendChild(el("circle", { cx, cy, r, class: "shape" }));
}

function drawArcSegment() {
  // Kreissegment mit genau einer Symmetrieachse.
  const path = "M 110 310 A 140 140 0 0 1 390 310 L 250 390 Z";
  svg.appendChild(el("path", { d: path, class: "shape" }));
}

function drawIrregularArcShape() {
  // Unsymmetrische Figur aus Bogen und scharfen Ecken.
  const path = "M 115 150 A 120 90 0 0 1 355 130 L 405 255 A 80 120 0 0 1 320 410 L 150 360 L 95 240 Z";
  svg.appendChild(el("path", { d: path, class: "shape" }));
}

function axisLine(angleDeg, group) {
  const cx = 250, cy = 250, len = 420;
  const a = angleDeg * Math.PI / 180;
  const x1 = cx - len * Math.cos(a) / 2;
  const y1 = cy - len * Math.sin(a) / 2;
  const x2 = cx + len * Math.cos(a) / 2;
  const y2 = cy + len * Math.sin(a) / 2;
  group.appendChild(el("line", { x1, y1, x2, y2, class: "axis" }));
}

function prepareAxes(task) {
  axisGroup = el("g", { id: "axisGroup", class: "axes-hidden" });
  task.axes.forEach(angle => axisLine(angle, axisGroup));
  if (task.axes.length > 0) {
    const label = el("text", { x: 18, y: 38, class: "axis-label" });
    label.textContent = "rote Linien = Symmetrieachsen";
    axisGroup.appendChild(label);
  }
  svg.appendChild(axisGroup);
}

function revealAxes() {
  if (axisGroup) axisGroup.setAttribute("class", "axes-visible");
}

function makeTask() {
  const type = choose([
    "none", "none", "noneArc",
    "one", "one", "segment",
    "twoRect", "twoEllipse", "twoRhombus",
    "three", "fourSquare"
  ]);

  if (type === "one") {
    const variant = choose(["triangle", "kite", "shield"]);
    if (variant === "triangle") {
      return {
        answer: 1,
        axes: [90],
        draw() { drawPolygon([[250, 70], [80, 420], [420, 420]]); },
        name: "gleichschenkliges Dreieck"
      };
    }
    if (variant === "kite") {
      return {
        answer: 1,
        axes: [90],
        draw() { drawPolygon([[250, 65], [365, 235], [250, 435], [135, 235]]); },
        name: "Drachenviereck"
      };
    }
    return {
      answer: 1,
      axes: [90],
      draw() { drawPolygon([[250, 65], [390, 180], [340, 390], [250, 440], [160, 390], [110, 180]]); },
      name: "symmetrisches Sechseck"
    };
  }

  if (type === "segment") {
    return {
      answer: 1,
      axes: [90],
      draw: drawArcSegment,
      name: "Kreissegment"
    };
  }

  if (type === "twoRect") {
    return {
      answer: 2,
      axes: [0, 90],
      draw() { drawRect(100, 165, 300, 170); },
      name: "Rechteck"
    };
  }

  if (type === "twoEllipse") {
    return {
      answer: 2,
      axes: [0, 90],
      draw() { svg.appendChild(el("ellipse", { cx: 250, cy: 250, rx: 170, ry: 105, class: "shape" })); },
      name: "Ellipse"
    };
  }

  if (type === "twoRhombus") {
    // Eindeutige Raute: genau zwei Achsen, waagrecht und senkrecht.
    return {
      answer: 2,
      axes: [0, 90],
      draw() { drawPolygon([[250, 75], [405, 250], [250, 425], [95, 250]]); },
      name: "Raute"
    };
  }

  if (type === "three") {
    return {
      answer: 3,
      axes: [90, 210, 330],
      draw() { drawPolygon(polygonPoints(250, 275, 180, 3, -90)); },
      name: "gleichseitiges Dreieck"
    };
  }

  if (type === "fourSquare") {
    return {
      answer: 4,
      axes: [0, 45, 90, 135],
      draw() { drawRect(135, 135, 230, 230); },
      name: "Quadrat"
    };
  }

  if (type === "noneArc") {
    return {
      answer: 0,
      axes: [],
      draw: drawIrregularArcShape,
      name: "unsymmetrische Bogenfigur"
    };
  }

  const variants = [
    () => drawPolygon([[95, 120], [255, 70], [405, 165], [350, 360], [170, 425], [80, 280]]),
    () => drawPolygon([[125, 80], [390, 125], [320, 235], [410, 380], [200, 430], [90, 310]]),
    () => drawPolygon([[135, 115], [320, 75], [415, 215], [290, 250], [365, 395], [125, 360], [85, 205]]),
    () => drawPolygon([[95, 170], [225, 80], [390, 115], [415, 290], [300, 420], [145, 385], [75, 260]])
  ];
  return {
    answer: 0,
    axes: [],
    draw: choose(variants),
    name: "unregelmässiges Vieleck"
  };
}

function newTask() {
  currentTask = makeTask();
  answered = false;
  feedback.classList.add("hidden");
  feedback.textContent = "";
  clearSvg();
  currentTask.draw();
  prepareAxes(currentTask); // Achsen existieren ab Aufgabenstart, bleiben aber verborgen.
  buildAnswers();
}

function buildAnswers() {
  answers.innerHTML = "";
  [0, 1, 2, 3, 4].forEach(num => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = num;
    btn.addEventListener("click", () => checkAnswer(num, btn));
    answers.appendChild(btn);
  });
}

function checkAnswer(num, btn) {
  if (answered) return;
  answered = true;

  const allButtons = [...document.querySelectorAll(".answer-btn")];
  allButtons.forEach(b => b.disabled = true);

  if (num === currentTask.answer) btn.classList.add("correct");
  else {
    btn.classList.add("wrong");
    allButtons.find(b => Number(b.textContent) === currentTask.answer).classList.add("correct");
  }

  revealAxes();

  if (currentTask.answer === 0) {
    feedback.textContent = "Diese Figur hat keine Symmetrieachse.";
  } else if (currentTask.answer === 1) {
    feedback.textContent = "Richtig ist: 1 Symmetrieachse. Die rote Linie zeigt die Achse.";
  } else {
    feedback.textContent = `Richtig sind: ${currentTask.answer} Symmetrieachsen. Die roten Linien zeigen die Achsen.`;
  }
  feedback.classList.remove("hidden");
}

newTaskBtn.addEventListener("click", newTask);
newTask();
