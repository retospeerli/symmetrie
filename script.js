
const svg=document.getElementById("svg"),msg=document.getElementById("message"),nextBtn=document.getElementById("next"),correctEl=document.getElementById("correct"),triesEl=document.getElementById("tries"),modeLabel=document.getElementById("modeLabel"),buttons=[...document.querySelectorAll("[data-answer]")];
const W=600,H=420,GRID=30,EPS=1e-6;
let correct=0,tries=0,current=null;
const used=new Map();

function S(tag,attrs={},parent=svg){const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e}
function round(x){return Math.abs(x-Math.round(x))<1e-9?Math.round(x):+x.toFixed(3)}
function grid(){S("rect",{x:0,y:0,width:W,height:H,fill:"#fff"});for(let x=0;x<=W;x+=GRID)S("line",{x1:x,y1:0,x2:x,y2:H,stroke:"#b8d1ea","stroke-width":x%150===0?1.4:.8});for(let y=0;y<=H;y+=GRID)S("line",{x1:0,y1:y,x2:W,y2:y,stroke:"#b8d1ea","stroke-width":y%150===0?1.4:.8})}
function P(pts){return pts.map(p=>`${round(p[0])},${round(p[1])}`).join(" ")}
function drawPolygon(pts){S("polygon",{points:P(pts),fill:"rgba(78,131,189,.12)",stroke:"#4e83bd","stroke-width":4,"stroke-linejoin":"miter"})}
function dist2(p,q){const dx=p[0]-q[0],dy=p[1]-q[1];return dx*dx+dy*dy}
function normLine(a,b,c){const len=Math.hypot(a,b);a/=len;b/=len;c/=len;if(a<-EPS||(Math.abs(a)<EPS&&b<-EPS)){a=-a;b=-b;c=-c}if(Math.abs(a)<EPS)a=0;if(Math.abs(b)<EPS)b=0;if(Math.abs(c)<EPS)c=0;return[a,b,c]}
function lineThrough(p,q){return normLine(p[1]-q[1],q[0]-p[0],-((p[1]-q[1])*p[0]+(q[0]-p[0])*p[1]))}
function perpBisector(p,q){const mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,a=q[0]-p[0],b=q[1]-p[1];return normLine(a,b,-(a*mx+b*my))}
function reflectPoint(p,l){const[a,b,c]=l,d=a*p[0]+b*p[1]+c;return[p[0]-2*a*d,p[1]-2*b*d]}
function closePoint(p,q,tol=1e-4){return Math.abs(p[0]-q[0])<tol&&Math.abs(p[1]-q[1])<tol}
function sameCyclic(A,B){const n=A.length;if(B.length!==n)return false;for(let s=0;s<n;s++){let ok=true;for(let i=0;i<n;i++){if(!closePoint(A[i],B[(i+s)%n])){ok=false;break}}if(ok)return true}for(let s=0;s<n;s++){let ok=true;for(let i=0;i<n;i++){const j=(s-i+n)%n;if(!closePoint(A[i],B[j])){ok=false;break}}if(ok)return true}return false}
function validAxis(pts,line){return sameCyclic(pts,pts.map(p=>reflectPoint(p,line)))}
function lineKey(l){return l.map(v=>Math.round(v*100000)/100000).join(",")}
function findAxes(pts){const cand=[],n=pts.length;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){cand.push(lineThrough(pts[i],pts[j]));cand.push(perpBisector(pts[i],pts[j]))}const found=[],keys=new Set();for(const l of cand){const k=lineKey(l);if(keys.has(k))continue;keys.add(k);if(validAxis(pts,l))found.push(l)}found.sort((a,b)=>axisSort(a)-axisSort(b));return found}
function axisSort(l){const[a,b]=l;if(Math.abs(b)<1e-5)return 0;if(Math.abs(a)<1e-5)return 1;return 2+Math.atan2(-a,b)}
function segmentInBox(a,b,c,minX,minY,maxX,maxY){const pts=[];if(Math.abs(b)>EPS){let y=-(a*minX+c)/b;if(y>=minY-EPS&&y<=maxY+EPS)pts.push([minX,y]);y=-(a*maxX+c)/b;if(y>=minY-EPS&&y<=maxY+EPS)pts.push([maxX,y])}if(Math.abs(a)>EPS){let x=-(b*minY+c)/a;if(x>=minX-EPS&&x<=maxX+EPS)pts.push([x,minY]);x=-(b*maxY+c)/a;if(x>=minX-EPS&&x<=maxX+EPS)pts.push([x,maxY])}const u=[];for(const p of pts)if(!u.some(q=>dist2(p,q)<1e-6))u.push(p);if(u.length<2)return null;u.sort((p,q)=>p[0]===q[0]?p[1]-q[1]:p[0]-q[0]);return[u[0],u[u.length-1]]}
function drawAxis(line,parent){const[a,b,c]=line,p=segmentInBox(a,b,c,-70,-70,W+70,H+70);if(!p)return;S("line",{x1:round(p[0][0]),y1:round(p[0][1]),x2:round(p[1][0]),y2:round(p[1][1]),stroke:"#e45b3f","stroke-width":4,"stroke-dasharray":"12 8","stroke-linecap":"round"},parent)}
function centered(points,dx=0,dy=0){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,tx=W/2+dx-cx,ty=H/2+dy-cy;return points.map(p=>[p[0]+tx,p[1]+ty])}
function make(name,pts,group="Form"){const axes=findAxes(pts);return{name,pts,axes,answer:axes.length,group}}

const figs=[
make("Quadrat gross",centered([[210,120],[390,120],[390,300],[210,300]]),"Quadrat"),
make("Quadrat klein",centered([[240,150],[360,150],[360,270],[240,270]]),"Quadrat"),
make("Rechteck breit",centered([[150,150],[450,150],[450,270],[150,270]]),"Rechteck"),
make("Rechteck hoch",centered([[240,75],[360,75],[360,345],[240,345]]),"Rechteck"),
make("Raute breit",centered([[300,90],[480,210],[300,330],[120,210]]),"Raute"),
make("Raute schmal",centered([[300,60],[390,210],[300,360],[210,210]]),"Raute"),
make("Drachenraute gross",centered([[300,60],[420,210],[300,360],[240,210]]),"Drachenraute"),
make("Drachenraute klein",centered([[300,90],[390,210],[300,330],[255,210]]),"Drachenraute"),
make("Gleichschenkliges Dreieck breit",centered([[300,75],[150,315],[450,315]]),"Dreieck"),
make("Gleichschenkliges Dreieck schmal",centered([[300,60],[210,330],[390,330]]),"Dreieck"),
make("Gleichseitiges Dreieck",centered([[300,80],[144.115,350],[455.885,350]]),"Dreieck"),
make("Kleines gleichseitiges Dreieck",centered([[300,105],[196.077,285],[403.923,285]]),"Dreieck"),
make("I-Träger",centered([[150,75],[450,75],[450,120],[330,120],[330,300],[450,300],[450,345],[150,345],[150,300],[270,300],[270,120],[150,120]]),"Vieleck"),
make("T-Form",centered([[150,75],[450,75],[450,135],[330,135],[330,345],[270,345],[270,135],[150,135]]),"Vieleck"),
make("Pluszeichen",centered([[270,60],[330,60],[330,150],[420,150],[420,210],[330,210],[330,300],[270,300],[270,210],[180,210],[180,150],[270,150]]),"Vieleck"),
make("Kreuz breit",centered([[240,60],[360,60],[360,150],[480,150],[480,240],[360,240],[360,330],[240,330],[240,240],[120,240],[120,150],[240,150]]),"Vieleck"),
make("Symmetrisches Haus",centered([[180,180],[300,60],[420,180],[420,330],[180,330]]),"Vieleck"),
make("Krone",centered([[150,300],[150,150],[240,225],[300,90],[360,225],[450,150],[450,300]]),"Vieleck"),
make("Schild",centered([[180,90],[420,90],[420,210],[300,345],[180,210]]),"Vieleck"),
make("Pfeil",centered([[120,180],[300,60],[480,180],[390,180],[390,300],[210,300],[210,180]]),"Vieleck"),
make("Sanduhr",centered([[180,75],[420,75],[300,210],[420,345],[180,345],[300,210]]),"Vieleck"),
make("Symmetrisches Achteck",centered([[210,90],[390,90],[480,180],[480,240],[390,330],[210,330],[120,240],[120,180]]),"Vieleck"),
make("Treppenschild",centered([[210,90],[390,90],[390,150],[450,150],[450,270],[390,270],[390,330],[210,330],[210,270],[150,270],[150,150],[210,150]]),"Vieleck"),
make("Quadratstern",centered([[300,60],[345,150],[450,150],[375,225],[405,330],[300,270],[195,330],[225,225],[150,150],[255,150]]),"Vieleck"),
make("Vierfach-Sägezahn",centered([[300,60],[330,150],[420,150],[360,210],[420,270],[330,270],[300,360],[270,270],[180,270],[240,210],[180,150],[270,150]]),"Vieleck"),
make("Asymmetrisches Fünfeck",centered([[180,90],[390,120],[450,270],[300,345],[150,240]]),"Asymmetrisch"),
make("Asymmetrischer Blitz",centered([[240,60],[420,60],[330,180],[450,180],[210,360],[285,225],[165,225]]),"Asymmetrisch"),
make("Unregelmässiges Vieleck",centered([[150,90],[360,60],[450,180],[390,330],[210,300],[120,210]]),"Asymmetrisch"),
make("Schiefe Fahne",centered([[180,90],[420,120],[390,240],[210,210],[210,345],[180,345]]),"Asymmetrisch"),
make("Asymmetrisches Haus",centered([[180,180],[300,60],[420,180],[420,330],[180,330],[180,180],[360,120],[360,75],[405,75],[405,165]]),"Asymmetrisch")
];

console.table(figs.map(f=>({Figur:f.name,Achsen:f.answer,Gruppe:f.group})));

function available(){return figs.filter(f=>(used.get(f.name)||0)<2)}
function pick(){let pool=available();if(pool.length===0){used.clear();pool=figs}const weighted=[];for(const f of pool){const w=f.group==="Vieleck"&&f.answer>0?4:f.group==="Asymmetrisch"?2:1;for(let i=0;i<w;i++)weighted.push(f)}const f=weighted[Math.floor(Math.random()*weighted.length)];used.set(f.name,(used.get(f.name)||0)+1);return f}
function drawFigure(f,show=false){svg.innerHTML="";grid();drawPolygon(f.pts);const g=S("g",{id:"axes",visibility:show?"visible":"hidden"});for(const line of f.axes)drawAxis(line,g);for(const p of f.pts)S("circle",{cx:round(p[0]),cy:round(p[1]),r:3.2,fill:"#4e83bd"})}
function next(){if(correct>=30){finish();return}current=pick();drawFigure(current,false);msg.textContent="Wähle eine Antwort.";msg.className="";modeLabel.textContent=current.group;nextBtn.hidden=true;buttons.forEach(b=>b.disabled=false)}
function showAxes(){const g=document.getElementById("axes");if(g)g.setAttribute("visibility","visible")}
function finish(){svg.innerHTML="";grid();S("text",{x:300,y:160,"text-anchor":"middle","font-size":36,"font-weight":900,fill:"#1b2a38"}).textContent="Geschafft!";S("text",{x:300,y:212,"text-anchor":"middle","font-size":22,fill:"#1b2a38"}).textContent=`30 richtige Figuren in ${tries} Versuchen.`;buttons.forEach(b=>b.disabled=true);nextBtn.hidden=true;msg.textContent="Auswertung abgeschlossen.";msg.className="correct"}
buttons.forEach(b=>b.addEventListener("click",()=>{if(!current)return;tries++;triesEl.textContent=tries;const ans=Number(b.dataset.answer);showAxes();buttons.forEach(x=>x.disabled=true);if(ans===current.answer){correct++;correctEl.textContent=correct;msg.textContent=`Richtig: Diese Figur hat ${current.answer} ${current.answer===1?"Symmetrieachse":"Symmetrieachsen"}.`;msg.className="correct"}else{msg.textContent=`Nicht ganz: Diese Figur hat ${current.answer} ${current.answer===1?"Symmetrieachse":"Symmetrieachsen"}.`;msg.className="wrong"}nextBtn.hidden=false;if(correct>=30)nextBtn.textContent="Auswertung anzeigen"}));
nextBtn.addEventListener("click",()=>{nextBtn.textContent="Nächste Figur";next()});
next();
