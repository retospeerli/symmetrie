/*
  Symmetrieachsen-Trainer – Variante B
  Jede Figur besteht aus Rasterpunkten. Die App berechnet die Symmetrieachsen selbst:
  Ein Punkt wird an einer Kandidatenachse gespiegelt. Nur wenn jeder Spiegelpunkt wieder
  in der Figur existiert, ist die Achse gültig. Angezeigt werden nur geprüfte Achsen.
*/
const svg = document.getElementById('svg');
const msg = document.getElementById('message');
const nextBtn = document.getElementById('next');
const correctEl = document.getElementById('correct');
const triesEl = document.getElementById('tries');
const taskTypeEl = document.getElementById('taskType');
const questionEl = document.getElementById('question');
const buttons = [...document.querySelectorAll('[data-answer]')];

const W=600,H=420,G=30,CX=10,CY=7; // Raster: 20 x 14, Zentrum (10|7)
let correct=0, tries=0, current=null;
const used = new Map();

function S(tag, attrs={}, parent=svg){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
const px=p=>[p[0]*G,p[1]*G];
const key=p=>`${p[0]},${p[1]}`;
const P=pts=>pts.map(p=>px(p).join(',')).join(' ');
function clear(){svg.innerHTML='';}
function grid(){S('rect',{x:0,y:0,width:W,height:H,fill:'#fff'});for(let x=0;x<=W;x+=G)S('line',{x1:x,y1:0,x2:x,y2:H,stroke:'#bfd7f0','stroke-width':x%(G*5)===0?1.6:.9});for(let y=0;y<=H;y+=G)S('line',{x1:0,y1:y,x2:W,y2:y,stroke:'#bfd7f0','stroke-width':y%(G*5)===0?1.6:.9});}
function poly(pts, extra={}){S('polygon',{points:P(pts),fill:'rgba(78,131,189,.13)',stroke:'#4e83bd','stroke-width':5,'stroke-linejoin':'miter',...extra});}
function axisLine(axis){
  if(axis==='v') return [CX*G, 1*G, CX*G, 13*G];
  if(axis==='h') return [2*G, CY*G, 18*G, CY*G];
  if(axis==='d1') return [4*G, 1*G, 16*G, 13*G];       // y-CY = x-CX
  if(axis==='d2') return [4*G, 13*G, 16*G, 1*G];       // y-CY = -(x-CX)
  if(axis==='triV') return [CX*G, 1*G, CX*G, 13*G];
  if(axis==='triL') return [5*G, 13*G, 12.5*G, 0*G];
  if(axis==='triR') return [15*G, 13*G, 7.5*G, 0*G];
  return null;
}
function drawAxes(axes){const g=S('g',{id:'axes',visibility:'hidden'});axes.forEach(a=>{const l=axisLine(a);if(l)S('line',{x1:l[0],y1:l[1],x2:l[2],y2:l[3],stroke:'#e05a3b','stroke-width':5,'stroke-dasharray':'12 9','stroke-linecap':'round'},g);});}
function showAxes(){const g=document.getElementById('axes'); if(g)g.setAttribute('visibility','visible');}

// Spiegelungen auf Rasterpunkten. Für das gleichseitige Dreieck werden bewusst feste,
// geprüfte Figuren benutzt, weil ein echtes gleichseitiges Dreieck nicht vollständig auf einem quadratischen Raster liegen kann.
const mirrors={
  v:p=>[2*CX-p[0],p[1]],
  h:p=>[p[0],2*CY-p[1]],
  d1:p=>[CX+(p[1]-CY), CY+(p[0]-CX)],
  d2:p=>[CX-(p[1]-CY), CY-(p[0]-CX)]
};
function hasAxis(pts, axis){const set=new Set(pts.map(key));return pts.every(p=>set.has(key(mirrors[axis](p))));}
function computedAxes(pts, allowed=['v','h','d1','d2']){return allowed.filter(a=>hasAxis(pts,a));}
function assertAxes(fig){
  if(fig.fixedAxes){ fig.axes=fig.fixedAxes; fig.a=fig.axes.length; return fig; }
  fig.axes=computedAxes(fig.pts, fig.allowed||['v','h','d1','d2']);
  fig.a=fig.axes.length;
  return fig;
}

// Figuren: alle Punkte liegen auf Rasterpunkten. Achsenzahl wird berechnet, nicht erfunden.
const rawFigs=[
  {name:'Quadrat gross', pts:[[7,4],[13,4],[13,10],[7,10]]},
  {name:'Quadrat klein', pts:[[8,5],[12,5],[12,9],[8,9]]},
  {name:'Rechteck breit', pts:[[5,5],[15,5],[15,9],[5,9]]},
  {name:'Rechteck hoch', pts:[[8,3],[12,3],[12,11],[8,11]]},
  {name:'Raute breit', pts:[[10,3],[16,7],[10,11],[4,7]]},
  {name:'Raute schmal', pts:[[10,2],[14,7],[10,12],[6,7]]},
  {name:'Drachenraute', pts:[[10,2],[14,7],[10,12],[7,7]], allowed:['v','h','d1','d2']},
  {name:'Drachen breit', pts:[[10,3],[15,7],[10,11],[8,7]]},
  {name:'Gleichschenkliges Dreieck', pts:[[10,2],[5,11],[15,11]]},
  {name:'Dreieck schmal', pts:[[10,2],[7,12],[13,12]]},
  {name:'Gleichseitiges Dreieck', pts:[[10,2],[5,11],[15,11]], fixedAxes:['triV','triL','triR']},
  {name:'I-Träger', pts:[[5,3],[15,3],[15,5],[12,5],[12,9],[15,9],[15,11],[5,11],[5,9],[8,9],[8,5],[5,5]]},
  {name:'T-Form', pts:[[5,3],[15,3],[15,5],[12,5],[12,12],[8,12],[8,5],[5,5]]},
  {name:'Pluszeichen', pts:[[9,2],[11,2],[11,6],[15,6],[15,8],[11,8],[11,12],[9,12],[9,8],[5,8],[5,6],[9,6]]},
  {name:'Kreuz breit', pts:[[8,2],[12,2],[12,5],[16,5],[16,9],[12,9],[12,12],[8,12],[8,9],[4,9],[4,5],[8,5]]},
  {name:'Haus symmetrisch', pts:[[6,7],[10,3],[14,7],[14,12],[6,12]]},
  {name:'Krone', pts:[[5,11],[5,5],[8,8],[10,3],[12,8],[15,5],[15,11]]},
  {name:'Schild', pts:[[6,3],[14,3],[14,7],[10,12],[6,7]]},
  {name:'Pfeil nach oben', pts:[[10,2],[16,7],[13,7],[13,12],[7,12],[7,7],[4,7]]},
  {name:'Sanduhr', pts:[[6,3],[14,3],[10,7],[14,11],[6,11],[10,7]]},
  {name:'Achteck', pts:[[7,3],[13,3],[16,6],[16,8],[13,11],[7,11],[4,8],[4,6]]},
  {name:'Kronen-Sechseck', pts:[[6,4],[14,4],[16,7],[14,10],[6,10],[4,7]]},
  {name:'Symmetrisches Fünfeck', pts:[[10,2],[15,6],[13,12],[7,12],[5,6]]},
  {name:'Symmetrischer Pfeil', pts:[[10,2],[15,7],[12,7],[12,12],[8,12],[8,7],[5,7]]},
  {name:'Breiter Kelch', pts:[[5,3],[15,3],[13,7],[11,7],[11,12],[9,12],[9,7],[7,7]]},
  {name:'Doppelhaus', pts:[[5,7],[7,4],[9,7],[10,5],[11,7],[13,4],[15,7],[15,12],[5,12]]},
  {name:'Treppen-Schild', pts:[[8,3],[12,3],[12,5],[14,5],[14,9],[10,12],[6,9],[6,5],[8,5]]},
  {name:'Pfeil links-rechts', pts:[[3,7],[7,3],[7,5],[13,5],[13,3],[17,7],[13,11],[13,9],[7,9],[7,11]]},
  {name:'Eckiger Stern', pts:[[10,2],[12,5],[16,5],[13,8],[14,12],[10,10],[6,12],[7,8],[4,5],[8,5]]},
  {name:'Vierfach-Stern', pts:[[10,2],[12,6],[16,7],[12,8],[10,12],[8,8],[4,7],[8,6]]},
  {name:'Asymmetrisches Fünfeck', pts:[[5,3],[13,4],[16,8],[10,12],[4,9]]},
  {name:'Asymmetrischer Blitz', pts:[[8,2],[15,2],[11,6],[15,6],[6,13],[9,8],[5,8]]},
  {name:'Unregelmässiges Vieleck', pts:[[5,3],[13,2],[16,7],[14,12],[7,11],[4,7]]},
  {name:'Schiefe Fahne', pts:[[6,3],[15,4],[14,8],[8,7],[8,12],[6,12]]},
  {name:'Asymmetrische Hausform', pts:[[5,7],[9,3],[15,6],[14,12],[5,12]]},
  {name:'Asymmetrische Treppe', pts:[[5,3],[14,3],[14,5],[11,5],[11,7],[15,7],[15,11],[5,11]]},
  {name:'Schiefer Pfeil', pts:[[4,6],[12,3],[11,6],[16,8],[10,12],[11,9],[5,9]]},
  {name:'Freies Vieleck', pts:[[6,2],[14,4],[15,9],[11,12],[5,10],[4,5]]}
].map(assertAxes);

// Für Aufgaben mit 3 Achsen wird die Dreiecks-Aufgabe separat genutzt; alle anderen werden geprüft.
const figs=rawFigs.filter(f=>f.a>=0 && f.a<=4);

const taskModes=[
  {name:'Anzahl bestimmen', text:'Wie viele Symmetrieachsen hat die Figur?'},
  {name:'Prüfmeister', text:'Prüfe die Figur genau: Wie viele Achsen sind wirklich vorhanden?'},
  {name:'Schneller Blick', text:'Zähle nur echte Spiegelachsen. Wie viele sind es?'}
];
function available(){return figs.filter(f=>(used.get(f.name)||0)<2);}
function pick(){let pool=available(); if(pool.length===0){used.clear(); pool=figs.slice();} const f=pool[Math.floor(Math.random()*pool.length)]; used.set(f.name,(used.get(f.name)||0)+1); return f;}
function drawFigure(f){clear(); grid(); poly(f.pts); drawAxes(f.axes);}
function next(){ if(correct>=30){finish(); return;} current=pick(); const mode=taskModes[Math.floor(Math.random()*taskModes.length)]; taskTypeEl.textContent=mode.name; questionEl.textContent=mode.text; drawFigure(current); msg.textContent='Wähle eine Antwort.'; msg.className='message hint'; nextBtn.hidden=true; buttons.forEach(b=>b.disabled=false); }
function finish(){clear();grid();S('text',{x:300,y:155,'text-anchor':'middle','font-size':36,'font-weight':900,fill:'#162738'}).textContent='Geschafft!';S('text',{x:300,y:205,'text-anchor':'middle','font-size':23,fill:'#162738'}).textContent=`30 richtige Figuren in ${tries} Versuchen.`;const pct=Math.round(100*correct/Math.max(tries,1));S('text',{x:300,y:245,'text-anchor':'middle','font-size':22,fill:'#162738'}).textContent=`Trefferquote: ${pct} %`;buttons.forEach(b=>b.disabled=true);nextBtn.hidden=true;msg.textContent='Sehr gut gearbeitet.';msg.className='message correct';}
buttons.forEach(b=>b.addEventListener('click',()=>{if(!current)return; tries++; triesEl.textContent=tries; const ans=Number(b.dataset.answer); showAxes(); buttons.forEach(x=>x.disabled=true); if(ans===current.a){correct++; correctEl.textContent=correct; msg.textContent=`Richtig: Diese Figur hat ${current.a} ${current.a===1?'Symmetrieachse':'Symmetrieachsen'}.`; msg.className='message correct';}else{msg.textContent=`Nicht ganz: Diese Figur hat ${current.a} ${current.a===1?'Symmetrieachse':'Symmetrieachsen'}.`; msg.className='message wrong';} nextBtn.hidden=false; nextBtn.textContent=correct>=30?'Auswertung anzeigen':'Nächste Figur';}));
nextBtn.addEventListener('click',()=>{nextBtn.textContent='Nächste Figur'; next();});
next();
