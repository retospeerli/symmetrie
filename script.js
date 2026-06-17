const svg = document.getElementById("canvas");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const newTaskBtn = document.getElementById("newTaskBtn");

let currentTask = null;
let answered = false;

const NS = "http://www.w3.org/2000/svg";

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function clearSvg() {
  svg.innerHTML = "";
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function drawPolygon(points) {
  svg.appendChild(el("polygon", { points: pointsToString(points), class: "shape" }));
}

function drawCircle(cx, cy, r) {
  svg.appendChild(el("circle", { cx, cy, r, class: "shape" }));
}

function drawRect(x, y, w, h, rx = 0) {
  svg.appendChild(el("rect", { x, y, width: w, height: h, rx, class: "shape" }));
}

function drawArcSegment() {
  // Kreissegment: eine Symmetrieachse, senkrecht durch die Mitte
  const path = "M 120 300 A 130 130 0 0 1 380 300 Q 250 390 120 300 Z";
  svg.appendChild(el("path", { d: path, class: "arc-shape" }));
}

function drawAxis(angleDeg) {
  const cx = 250, cy = 250, len = 360;
  const a = angleDeg * Math.PI / 180;
  const x1 = cx - len * Math.cos(a) / 2;
  const y1 = cy - len * Math.sin(a) / 2;
  const x2 = cx + len * Math.cos(a) / 2;
  const y2 = cy + len * Math.sin(a) / 2;
  svg.appendChild(el("line", { x1, y1, x2, y2, class: "axis" }));
}

function showAxes(task) {
  task.axes.forEach(drawAxis);
  if (task.axes.length > 0) {
    svg.appendChild(el("text", { x: 18, y: 38, class: "axis-label" })).textContent = "rote Linien = Symmetrieachsen";
  }
}

function makeTask() {
  const type = choose(["none", "one", "two", "three", "four", "segment", "none", "one"]);

  if (type === "one") {
    const variant = choose(["kite", "triangle", "heartlike"]);
    if (variant === "kite") {
      return {
        answer: 1,
        axes: [90],
        draw() { drawPolygon([[250, 70], [360, 250], [250, 430], [140, 250]]); },
        name: "Drachenviereck"
      };
    }
    if (variant === "triangle") {
      return {
        answer: 1,
        axes: [90],
        draw() { drawPolygon([[250, 80], [95, 410], [405, 410]]); },
        name: "gleichschenkliges Dreieck"
      };
    }
    return {
      answer: 1,
      axes: [90],
      draw() { drawPolygon([[250, 70], [325, 165], [410, 180], [350, 320], [250, 430], [150, 320], [90, 180], [175, 165]]); },
      name: "symmetrische Fantasiefigur"
    };
  }

  if (type === "two") {
    return {
      answer: 2,
      axes: [0, 90],
      draw() { drawRect(115, 165, 270, 170, 18); },
      name: "Rechteck"
    };
  }

  if (type === "three") {
    return {
      answer: 3,
      axes: [90, 210, 330],
      draw() { drawPolygon(polygonPoints(250, 270, 180, 3, -90)); },
      name: "gleichseitiges Dreieck"
    };
  }

  if (type === "four") {
    const variant = choose(["square", "diamond"]);
    return {
      answer: 4,
      axes: [0, 45, 90, 135],
      draw() {
        if (variant === "square") drawRect(135, 135, 230, 230, 10);
        else drawPolygon([[250, 90], [410, 250], [250, 410], [90, 250]]);
      },
      name: variant === "square" ? "Quadrat" : "Raute als Quadrat gedreht"
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

  // keine Symmetrie: unregelmässiges Vieleck oder unsymmetrische Figur
  const variants = [
    () => drawPolygon([[105, 140], [250, 85], [385, 175], [350, 360], [180, 420], [90, 285]]),
    () => drawPolygon([[120, 95], [390, 130], [330, 240], [410, 375], [210, 420], [95, 310]]),
    () => drawPolygon([[140, 115], [315, 80], [400, 210], [285, 245], [355, 390], [130, 355], [90, 210]])
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

  showAxes(currentTask);

  const achseText = currentTask.answer === 1 ? "1 Symmetrieachse" : `${currentTask.answer} Symmetrieachsen`;
  const zeroText = "Diese Figur hat keine Symmetrieachse.";
  feedback.textContent = currentTask.answer === 0
    ? zeroText
    : `Richtig sind: ${achseText}. Die roten Linien zeigen die Achsen.`;
  feedback.classList.remove("hidden");
}

newTaskBtn.addEventListener("click", newTask);
newTask();
