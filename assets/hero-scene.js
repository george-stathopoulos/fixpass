
/**
 * Fixpass hero: a hand-drawn multiplane scene of WordPress trouble behind the headline.
 * Dark theme: the lights are out, the pointer is a flashlight, drawings are greyscale and cast
 * shadows, and a fatal error on the code wall runs away when the light finds it.
 * Light theme: the lights are on and the scene fades away for the regular hero illustration.
 * The hero's Lights switch is the site's theme switch (same setting as the header button).
 */
(()=>{'use strict';
const hero=document.querySelector('[data-hero]'),stage=hero&&hero.querySelector('[data-scene]');
if(!stage)return;
const sw=hero.querySelector('[data-lights]'),root=document.documentElement;
// Hand-drawn WordPress trouble, drawn once as a 3x3 crayon sprite sheet.
// 3x3 cells: 0 failed update · 1 broken theme · 2 "which page?" emails · 3 plugin conflict · 4 phone layout
// · 5 database error · 6 slow site · 7 PHP bug · 8 maintenance mode.
const art=(()=>{
const c=document.createElement('canvas');c.complete=false;c.naturalWidth=0;
const INK='#24211f',FONT="font-family=\"'Comic Sans MS','Chalkboard SE','Marker Felt','Segoe Print',cursive\" font-weight=\"bold\"";
const K={cream:'#f3e4c0',paper:'#fbf4df',white:'#fffdf6',tan:'#dfb878',tanD:'#c99c5c',tanL:'#e8c993',inside:'#6e5030',orange:'#f2611d',purple:'#5a46c4',purpleL:'#a99cf2',red:'#e0352b',green:'#7cb342',yellow:'#ffcf3f',blue:'#2f7fd1',sky:'#bfe3ff',grey:'#c9c4b8',bar:'#e6e0d2',dark:'#2b2a33',peach:'#ffd6a5',lilac:'#d4ccff'};
let seed=7;const r=()=>(seed=(seed*16807)%2147483647)/2147483647,j=(v,a=4)=>(v+(r()-.5)*a*2).toFixed(1);
const R=(x,y,w,h)=>`M${j(x)} ${j(y)} L${j(x+w)} ${j(y)} L${j(x+w)} ${j(y+h)} L${j(x)} ${j(y+h)}Z`;
const RR=(x,y,w,h,q)=>`M${x+q} ${y} H${x+w-q} Q${x+w} ${y} ${x+w} ${y+q} V${y+h-q} Q${x+w} ${y+h} ${x+w-q} ${y+h} H${x+q} Q${x} ${y+h} ${x} ${y+h-q} V${y+q} Q${x} ${y} ${x+q} ${y}Z`;
const O=(cx,cy,q)=>`M${cx-q} ${cy} a${q} ${q} 0 1 0 ${q*2} 0 a${q} ${q} 0 1 0 ${-q*2} 0Z`;
const PIECE='M0 40 H50 C42 4 92 4 84 40 H134 V88 C170 80 170 132 134 124 V174 H0 Z';
const star=(cx,cy,a,b,n)=>{let d='';for(let i=0;i<n*2;i++){const q=i%2?b:a,t=i/(n*2)*Math.PI*2;d+=(i?'L':'M')+(cx+Math.cos(t)*q*(.85+r()*.3)).toFixed(1)+' '+(cy+Math.sin(t)*q*(.85+r()*.3)).toFixed(1)}return d+'Z'};
// items: {d, f: fill, w: line width, s: stroke colour, t: transform, line:false, sk:false}
function draw(items){let f='',o='';for(const i of items){const t=i.t?` transform="${i.t}"`:'';
 if(i.f){f+=`<path d="${i.d}" fill="${i.f}"${t}/>`;if(i.h!==false)f+=`<path d="${i.d}" fill="url(#hatch)"${t}/>`}
 if(i.line!==false){const w=i.w||10,s=i.s||INK;o+=`<path d="${i.d}" fill="none" stroke="${s}" stroke-width="${w}"${t}/>`;
  if(i.sk!==false&&w>=6)o+=`<g transform="translate(4 -3)"><path d="${i.d}" fill="none" stroke="${s}" stroke-width="${(w*.38).toFixed(1)}" opacity=".55"${t}/></g>`}}
 return `<g filter="url(#cr)">${f}</g><g filter="url(#ln)" stroke-linecap="round" stroke-linejoin="round">${o}</g>`}
const txt=(x,y,s,size,fill=INK,t='',anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${FONT}${t?` transform="${t}"`:''}>${s}</text>`;
const T=s=>`<g filter="url(#tx)">${s}</g>`;

// 0 · failed plugin update
const update=draw([
 {d:'M450 520 L390 380 L780 340 L840 450 L700 520 Z',f:K.inside},
 {d:'M700 520 L840 450 L840 820 L700 900 Z',f:K.tanD},
 {d:'M210 520 L700 520 L700 900 L210 900 Z',f:K.tan},
 {d:'M210 520 L110 400 L390 380 L450 520 Z',f:K.tanL},
 {d:'M700 520 L840 450 L790 330 L610 410 Z',f:K.tanL},
 {d:RR(260,640,390,170,16),f:K.white,w:8},
 {d:'M300 760 H600',w:5,sk:false},
 {d:PIECE,f:K.purple,t:'translate(470 200) rotate(22)'},
 {d:PIECE,f:K.orange,t:'translate(170 250) rotate(-28) scale(.7)'},
 {d:'M430 330 l-30 -40 M470 300 l-10 -50 M300 380 l-50 -30',w:6,sk:false},
 {d:RR(130,130,640,92,46),f:K.white},
 {d:RR(142,142,590,68,34),f:K.orange,line:false},
 {d:'M610 124 L590 164 L622 184 L598 232',w:7,sk:false},
 {d:O(840,176,64),f:K.red},
 {d:'M812 148 L868 204 M868 148 L812 204',s:K.white,w:13,sk:false}
])+T(txt(140,108,'Updating… 99%',50)+txt(455,712,'plugin-2.0.zip',44,INK,'','middle')+txt(455,790,'update failed',34,K.red,'','middle'));

// 1 · broken theme on a monitor
const theme=draw([
 {d:'M452 770 L432 860 L592 860 L572 770 Z',f:'#e0cfa6'},
 {d:'M300 862 Q512 842 724 862 L742 908 Q512 930 282 908 Z',f:K.cream},
 {d:RR(80,90,864,690,42),f:K.cream,w:12},
 {d:RR(130,140,764,590,16),f:K.white},
 {d:'M132 142 H892 V204 H132 Z',f:K.bar,w:6},
 {d:O(172,173,13),f:K.red,w:5,sk:false},{d:O(210,173,13),f:K.orange,w:5,sk:false},{d:O(248,173,13),f:K.green,w:5,sk:false},
 {d:RR(290,156,420,34,17),f:K.white,w:5,sk:false},
 {d:R(160,228,704,62),f:K.purple},
 {d:'M300 288 V332 Q312 356 324 332 V288 M420 288 V392 Q434 418 448 392 V288 M620 288 V352 Q632 372 644 352 V288',f:K.purple,w:6},
 {d:'M760 250 H830 M760 262 H830 M760 274 H830',s:K.white,w:5,sk:false},
 {d:R(172,336,320,214),f:K.sky,t:'rotate(9 330 440)'},
 {d:'M184 542 L270 432 L330 502 L392 420 L482 542 Z',f:K.green,t:'rotate(9 330 440)'},
 {d:O(432,380,28),f:K.yellow,t:'rotate(9 330 440)'},
 {d:R(166,618,150,70),f:K.peach,t:'rotate(-12 240 650)'},
 {d:R(330,650,160,62),f:K.lilac,t:'rotate(8 410 680)'},
 {d:'M190 590 H300 M520 690 H600 M610 708 H660',w:6,sk:false},
 {d:R(530,330,340,256),f:K.white,s:K.red,w:9},
 {d:O(574,380,24),f:K.red,w:5,sk:false},
 {d:RR(560,522,160,42,10),f:K.blue,w:5,sk:false},
 {d:'M708 612 L768 548 L810 526 M708 612 L790 660 L870 650 M708 612 L696 690 L726 724 M708 612 L626 648 L540 656 M708 612 L656 566',w:4,sk:false},
 {d:'M880 66 L912 30 L906 74 L944 46 M62 380 L28 402 L66 418 L34 446 M960 520 L990 548 L956 556 L986 590',s:K.orange,w:9,sk:false}
])+T(txt(574,392,'!',34,K.white,'','middle')+txt(305,182,'mysite.com/shop',24)+txt(186,272,'MY SHOP',36,K.white)+txt(612,392,'There has been a',26)+txt(556,444,'critical error',38,K.red)+txt(556,488,'on this website.',28)+txt(640,550,'Learn more',22,K.white,'','middle'));

// 2 · "which page?" emails and a password on a sticky note
const flap=(x,y,w,h,t)=>({d:`M${x} ${y} L${x+w/2} ${y+h*.55} L${x+w} ${y}`,w:7,t});
const emails=draw([
 {d:R(200,470,440,270),f:'#eadcb9',t:'rotate(-14 420 600)'},flap(200,470,440,270,'rotate(-14 420 600)'),
 {d:R(340,500,460,280),f:K.cream,t:'rotate(9 570 640)'},flap(340,500,460,280,'rotate(9 570 640)'),
 {d:R(710,516,62,74),f:K.orange,w:6,t:'rotate(9 570 640)'},
 {d:R(240,560,520,300),f:K.paper},flap(240,560,520,300,''),
 {d:R(668,578,66,80),f:K.purple,w:6},
 {d:'M610 600 q20 -12 40 0 t40 0 M610 622 q20 -12 40 0 t40 0',w:4,sk:false},
 {d:R(660,330,230,220),f:K.yellow,t:'rotate(12 775 440)'},
 {d:'M690 370 L860 530 M860 370 L690 530',s:K.red,w:14,sk:false,t:'rotate(12 775 440)'}
])+T(txt(280,770,'Re: Re: Re:',46)+txt(280,830,'which page??',50)+txt(690,420,'admin',42,INK,'rotate(12 775 440)')+txt(690,486,'pass123',42,INK,'rotate(12 775 440)')+txt(150,470,'?',130,K.orange,'rotate(-12 180 430)')+txt(860,770,'?',100,K.orange,'rotate(14 880 740)'));

// 3 · plugin conflict
const conflict=draw([
 {d:'M40 930 C130 1000 300 870 220 770 C150 690 120 610 236 560',w:46,sk:false},
 {d:'M40 930 C130 1000 300 870 220 770 C150 690 120 610 236 560',s:K.purple,w:28,sk:false},
 {d:'M800 470 C900 440 960 300 880 230 C800 160 860 80 990 40',w:46,sk:false},
 {d:'M800 470 C900 440 960 300 880 230 C800 160 860 80 990 40',s:K.orange,w:28,sk:false},
 {d:R(450,486,86,24),f:K.grey,t:'rotate(-12 340 520)'},{d:R(450,546,86,24),f:K.grey,t:'rotate(-12 340 520)'},
 {d:RR(228,448,226,146,32),f:K.purple,t:'rotate(-12 340 520)'},
 {d:'M270 480 V560 M300 480 V560',s:K.purpleL,w:7,sk:false,t:'rotate(-12 340 520)'},
 {d:RR(600,396,204,152,32),f:K.orange,t:'rotate(-12 700 470)'},
 {d:R(616,428,34,24),f:K.dark,w:5,sk:false,t:'rotate(-12 700 470)'},{d:R(616,492,34,24),f:K.dark,w:5,sk:false,t:'rotate(-12 700 470)'},
 {d:star(566,500,96,34,9),f:K.yellow,w:8},
 {d:'M520 360 L560 318 L556 370 L602 336 M598 640 L640 680 L598 682 L630 736 M470 640 L440 690 L480 690 L452 740',s:K.orange,w:9,sk:false},
 {d:'M150 690 L240 690 L270 720 L240 750 L150 750 Z',f:K.white,w:7,t:'rotate(-20 210 720)'},
 {d:'M820 300 L910 300 L940 330 L910 360 L820 360 Z',f:K.white,w:7,t:'rotate(16 880 330)'}
])+T(txt(196,734,'cache',30,INK,'rotate(-20 210 720)','middle')+txt(868,344,'seo',32,INK,'rotate(16 880 330)','middle')+txt(566,250,'!!',110,K.red,'rotate(-6 566 220)','middle'));

// 4 · phone: the layout breaks out of the screen
const phone=draw([
 {d:RR(330,150,364,720,56),f:K.dark,w:12},
 {d:RR(352,210,320,600,14),f:K.white,w:6},
 {d:RR(462,170,100,22,11),f:'#111',w:4,sk:false},
 {d:R(352,210,320,58),f:K.purple,w:6},
 {d:R(396,300,380,176),f:K.sky,t:'rotate(5 580 390)'},
 {d:'M408 470 L500 372 L560 430 L620 360 L760 470 Z',f:K.green,t:'rotate(5 580 390)'},
 {d:'M384 520 H770 M384 556 H720 M384 592 H800',s:'#9a948a',w:12,sk:false},
 {d:RR(560,650,240,66,33),f:K.orange,w:8},
 {d:'M220 420 L170 450 L220 480 M170 450 H300 M804 420 L854 450 L804 480 M724 450 H854',s:K.red,w:8,sk:false}
])+T(txt(380,250,'MY SHOP',30,K.white)+txt(680,694,'BUY NOW',30,K.white,'','middle')+txt(512,110,'why so wide?!',54,K.red,'rotate(-3 512 100)','middle'));

// 5 · database connection error
const database=draw([
 {d:'M300 360 V740 A212 70 0 0 0 724 740 V360 Z',f:'#8fb1e3'},
 {d:'M300 360 A212 70 0 1 0 724 360 A212 70 0 1 0 300 360Z',f:'#c6d8f6'},
 {d:'M300 490 A212 70 0 0 0 724 490 M300 620 A212 70 0 0 0 724 620',w:8},
 {d:'M540 420 L505 500 L556 566 L512 650 L548 750',w:8,sk:false},
 {d:'M724 690 C830 700 860 800 790 850',w:30,sk:false},{d:'M724 690 C830 700 860 800 790 850',s:K.grey,w:16,sk:false},
 {d:R(752,840,64,52),f:K.dark,t:'rotate(20 784 866)'},
 {d:'M836 900 L870 930 L846 940 L880 980',s:K.orange,w:8,sk:false},
 {d:RR(110,70,804,170,34),f:K.white},
 {d:'M430 238 L462 296 L500 238',f:K.white,w:10}
])+T(txt(512,142,'Error establishing a',44,INK,'','middle')+txt(512,204,'database connection',48,K.red,'','middle')+txt(410,600,'wp_db',60,INK,'rotate(-4 410 590)'));

// 6 · a very slow site
const snail=draw([
 {d:'M150 790 C170 700 260 690 330 710 L780 720 C850 722 880 780 830 800 L180 806 C150 806 140 800 150 790Z',f:'#9ccc65'},
 {d:O(560,560,180),f:K.orange},
 {d:'M560 560 m-22 0 a22 22 0 1 1 44 0 a56 56 0 1 1 -112 0 a98 98 0 1 1 196 0 a138 138 0 1 1 -276 0',w:9},
 {d:O(250,690,64),f:'#9ccc65'},
 {d:'M228 636 L200 530 M268 632 L284 524',w:9},
 {d:O(198,520,20),f:K.white,w:7,sk:false},{d:O(286,514,20),f:K.white,w:7,sk:false},
 {d:O(204,524,7),f:INK,line:false,h:false},{d:O(290,518,7),f:INK,line:false,h:false},
 {d:'M226 712 Q250 730 274 712',w:6,sk:false},
 {d:'M560 170 A80 80 0 1 1 480 250',s:K.purple,w:18,sk:false},
 {d:'M860 830 h20 M910 828 h14 M950 830 h10',s:'#9ccc65',w:10,sk:false}
])+T(txt(560,120,'loading… 47s',52,INK,'','middle'));

// 7 · the PHP bug
const legs=[[300,480,200,430,170,470],[290,600,180,610,150,660],[310,720,220,780,200,830]];
const bug=draw([
 ...legs.map(([a,b,c2,d,e,f])=>({d:`M${a} ${b} L${c2} ${d} L${e} ${f} M${1024-a} ${b} L${1024-c2} ${d} L${1024-e} ${f}`,w:12})),
 {d:'M470 210 C440 130 400 116 372 140 M554 210 C584 130 624 116 652 140',w:9},
 {d:'M512 300 C700 300 760 500 740 620 C720 770 600 830 512 830 C424 830 304 770 284 620 C264 500 324 300 512 300Z',f:K.red},
 {d:'M512 330 V826',w:8},
 {d:O(410,470,30),f:K.dark,line:false},{d:O(620,450,26),f:K.dark,line:false},{d:O(400,720,26),f:K.dark,line:false},{d:O(630,730,32),f:K.dark,line:false},
 {d:O(512,270,84),f:K.dark},
 {d:O(478,250,20),f:K.white,w:5,sk:false},{d:O(548,250,20),f:K.white,w:5,sk:false},
 {d:O(482,256,8),f:INK,line:false,h:false},{d:O(552,256,8),f:INK,line:false,h:false}
])+T(txt(512,612,'PHP',84,K.white,'','middle')+txt(780,170,'bzzt!',50,K.orange,'rotate(10 780 160)','middle'));

// 8 · maintenance mode
const maintenance=draw([
 {d:R(250,520,32,320),f:K.tan},{d:R(742,520,32,320),f:K.tan},
 {d:RR(130,180,764,350,26),f:K.yellow},
 {d:'M150 200 L200 200 L150 250 Z M240 200 L300 200 L170 330 L150 330 L150 290 Z',f:INK,line:false,h:false},
 {d:'M700 900 L792 560 L852 560 L944 900 Z',f:K.orange},
 {d:'M752 712 L892 712 L906 766 L738 766Z',f:K.white,w:7},
 {d:RR(660,890,324,44,10),f:'#d9531a'},
 {d:R(150,860,300,44),f:K.grey,t:'rotate(-18 300 880)'},
 {d:'M110 820 a62 62 0 1 0 70 90 l-40 -20 l-6 -46 Z',f:K.grey,t:'rotate(-18 300 880)'}
])+T(txt(512,282,'Briefly unavailable',58,INK,'','middle')+txt(512,352,'for scheduled',50,INK,'','middle')+txt(512,420,'maintenance.',50,INK,'','middle')+txt(512,488,'check back in a minute',32,INK,'','middle'));

const cell=(s,x,y)=>`<g transform="translate(${x} ${y})">${s}</g>`;
const cells=[update,`<g transform="translate(110 60) scale(.88)">${theme}</g>`,`<g transform="translate(0 -210)">${emails}</g>`,conflict,phone,database,snail,bug,maintenance];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2304" height="2304" viewBox="0 0 3072 3072"><defs>
<filter id="cr" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="4" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.4 0 0 0 2.15" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="t"/><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="9" result="w"/><feDisplacementMap in="t" in2="w" scale="12" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="ln" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 0 0 0 2.3" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="t"/><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="w"/><feDisplacementMap in="t" in2="w" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="tx" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="6" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 0 0 0 1.9" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="t"/><feTurbulence type="fractalNoise" baseFrequency="0.03" seed="8" result="w"/><feDisplacementMap in="t" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
<pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 8 H16" stroke="#000" stroke-opacity=".09" stroke-width="3.5"/></pattern>
</defs>${cells.map((x,i)=>cell(x,(i%3)*1024,Math.floor(i/3)*1024)).join('')}</svg>`;
const img=new Image();
img.onload=()=>{c.width=c.height=2304;c.getContext('2d').drawImage(img,0,0);c.naturalWidth=c.naturalHeight=2304;c.complete=true};
img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
return c})();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,dpr=1,lit=root.dataset.theme==='light',active=true,last=0,start=performance.now(),camera=0,px=.68,py=.55,mx=.68,my=.55,travel=0,seenAt=0,hideUntil=0,escapes=0;
let error={x:.69,y:.36},fleeFrom=null; // fleeFrom: where it was when it slipped away
const code=['// wp-content/themes/shop/functions.php',"add_action( 'init', 'shop_setup' );",'function shop_setup() {','  $cart = wc_get_cart();','  if ( ! $cart ) {',"    wp_die( 'Something broke.' );",'  }',"  return apply_filters( 'shop', $cart );",'}','// plugin? theme? update? which page?','// nothing stays hidden forever'];
const PLANES=[1600,1200,820,520,260,0]; // Explicit world Z, back to front. Several drawings can share a plane.
// Performance: every plane is its own canvas, stacked in the page, so the browser's compositor applies
// depth blur, greyscale and fades on the GPU. Far planes are blurred anyway, so they render at lower
// resolution. Between the code wall and the drawings sits the neon error; the flashlight glow is on top.
const RES=[.5,.6,.7,.85,1,1];
const mk=()=>{const c=document.createElement('canvas');stage.appendChild(c);return c};
const layerCanvases=PLANES.map(mk),layerContexts=layerCanvases.map(c=>c.getContext('2d'));
const neonCanvas=document.createElement('canvas');layerCanvases[0].after(neonCanvas);const nctx=neonCanvas.getContext('2d');
const canvas=mk(),ctx=canvas.getContext('2d');
function sizeTo(c,scale){c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').setTransform(scale,0,0,scale,0,0)}
function resize(){const r=hero.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,1.5);
layerCanvases.forEach((c,i)=>sizeTo(c,dpr*RES[i]));sizeTo(neonCanvas,dpr);sizeTo(canvas,dpr);kick()}
function styleLayers(){layerCanvases.forEach((c,i)=>{const z=PLANES[i];c.style.filter=(lit?'':'grayscale(1) ')+'blur('+((z/1600)*(lit?1.1:3.8)).toFixed(2)+'px)';c.style.opacity=lit?1:(1-z/1600*.15).toFixed(3)})}
new ResizeObserver(resize).observe(hero);
function point(e){const r=hero.getBoundingClientRect();mx=Math.max(0,Math.min(1,(e.clientX-r.left)/w));my=Math.max(0,Math.min(1,(e.clientY-r.top)/h));active=true}
hero.addEventListener('pointermove',point);hero.addEventListener('pointerdown',point);hero.addEventListener('pointerleave',()=>active=false);
hero.addEventListener('touchmove',e=>{if(e.touches[0])point(e.touches[0])},{passive:true});
hero.addEventListener('wheel',e=>{travel=Math.max(0,Math.min(1,travel+e.deltaY/1500))},{passive:true});
window.addEventListener('scroll',()=>{const r=hero.getBoundingClientRect();travel=Math.max(0,Math.min(1,-r.top/h))},{passive:true});
// The scene follows the site theme, whoever changes it (this switch or the header button).
let litAt=0,fadeTimer=0,first=true;
function apply(){lit=root.dataset.theme==='light';if(lit)litAt=performance.now();hero.classList.toggle('lit',lit);
if(!first){hero.classList.add('is-fading');clearTimeout(fadeTimer);fadeTimer=setTimeout(()=>hero.classList.remove('is-fading'),1600)}first=false;styleLayers();kick();if(sw)sw.setAttribute('aria-checked',String(lit));
document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.setAttribute('aria-pressed',String(!lit)));seenAt=0;hideUntil=0}
if(sw)sw.addEventListener('click',()=>{root.dataset.theme=lit?'dark':'light';try{sessionStorage.setItem('hdh-site-theme',root.dataset.theme)}catch(e){}});
new MutationObserver(apply).observe(root,{attributes:true,attributeFilter:['data-theme']});
// Positions below describe the composition at camera Z=0. Convert them back
// into world coordinates before perspective projection, preserving real Z.
function project(x,y,z){const focal=850,s=focal/(focal+z-camera),base=(focal+z)/focal;return{x:w/2+(x-.5)*w*base*s-(reduced?0:px-.5)*230*s,y:h/2+(y-.5)*h*base*s-(reduced?0:py-.5)*150*s,s}}
function specs(){const m=w<700;return m?[
{q:1,x:.32,y:.28,z:1200,size:460,angle:-.06},{q:5,x:.86,y:.40,z:1200,size:300,angle:.06},
{q:6,x:.84,y:.10,z:820,size:240,angle:.05},
{q:7,x:.14,y:.58,z:520,size:200,angle:.2},{q:0,x:.26,y:.88,z:520,size:290,angle:-.16},
{q:4,x:.92,y:.66,z:260,size:200,angle:.12},{q:3,x:.84,y:.90,z:260,size:250,angle:.14},{q:8,x:.10,y:.74,z:260,size:210,angle:-.08},
{q:2,x:.56,y:1.03,z:0,size:330,angle:-.10}]:[
// Far back, blurred and dim: the broken shop sits behind the headline.
{q:1,x:.22,y:.56,z:1200,size:640,angle:-.06},{q:5,x:.93,y:.46,z:1200,size:440,angle:.07},
{q:6,x:.60,y:.13,z:820,size:320,angle:.04},
{q:7,x:.88,y:.14,z:520,size:300,angle:.22},{q:0,x:.60,y:.84,z:520,size:400,angle:-.18},
// Closer: around the edges, framing the code wall where the error hides.
{q:3,x:.17,y:.19,z:260,size:310,angle:.14},{q:8,x:.16,y:.87,z:260,size:370,angle:-.08},{q:4,x:.80,y:.78,z:260,size:300,angle:.12},
{q:2,x:.42,y:.97,z:0,size:500,angle:-.10}];}
// Shadows: black silhouettes of the sheet, softened once by shrinking (small = softer when drawn back up).
let shadowSoft=null,shadowSofter=null;
function silhouettes(){const n=art.naturalWidth,sil=document.createElement('canvas');sil.width=sil.height=n;const g=sil.getContext('2d');g.drawImage(art,0,0);g.globalCompositeOperation='source-in';g.fillRect(0,0,n,n);
const shrink=k=>{const c=document.createElement('canvas');c.width=c.height=Math.round(n/k);const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(sil,0,0,c.width,c.height);return c};
shadowSoft=shrink(6);shadowSofter=shrink(14)}
function sprite(c,o,shadow=false,receiver=0){if(!art.complete||!art.naturalWidth)return;if(shadow&&!shadowSoft)silhouettes();const p=project(o.x,o.y,o.z);let x=p.x,y=p.y,scale=p.s;
if(shadow){const gap=receiver-o.z,spread=1+gap/(1000+o.z-camera);x=px*w+(p.x-px*w)*spread;y=py*h+(p.y-py*h)*spread;scale*=spread}
const src=shadow?((receiver-o.z)>800?shadowSofter:shadowSoft):art,aw=src.width/3,ah=src.height/3;c.save();c.translate(x,y);c.rotate(o.angle);c.drawImage(src,(o.q%3)*aw,Math.floor(o.q/3)*ah,aw,ah,-o.size*scale/2,-o.size*scale/2,o.size*scale,o.size*scale);c.restore()}
function codePlane(c,z,index){const mobile=w<700;const p=project(mobile?.55:.72,mobile?.72:.49,z);c.save();c.translate(p.x,p.y);c.scale(p.s,p.s);c.rotate(-.05+index*.014);c.font=(mobile?30:37)+'px monospace';c.textBaseline='top';
if(index===0){c.fillStyle=lit?'rgba(240,240,240,.4)':'#303236';c.fillRect(-550,-365,1120,755);c.strokeStyle=lit?'#bbb':'#757575';c.lineWidth=2;c.strokeRect(-550,-365,1120,755);code.forEach((line,i)=>{c.fillStyle=lit?'#1b1b1b':'#ddd';c.globalAlpha=.9;c.fillText(String(i+1).padStart(2,'0')+'  '+line,-515,i*57-320)})}
else{c.font=(mobile?19:23)+'px monospace';c.fillStyle=lit?'#333':'#d2d2d2';c.globalAlpha=.50;c.fillText(['','// db: connection lost','// site: sooo slow','update_failed();','plugin_conflict();','> Re: which page?'][index],-90,index%2?-160:115)}c.restore()}
// The fatal error is a neon sign: drawn sharp, straight after the code wall so nearer drawings still cover it.
// It gives off its own light, so a faint red glow shows even in the dark; the flashlight brings it to full brightness.
function neon(t){
// Escaping: it blurs and fades out where it was caught, then fades back in at its new hiding place.
let at=error,fade,blur=0;
nctx.clearRect(0,0,w,h);
if(t<hideUntil){if(!fleeFrom)return;const k=Math.min(1,(t-fleeFrom.t)/430);at={x:fleeFrom.x+k*.012,y:fleeFrom.y-k*.006};fade=1-k;blur=k*7}
else fade=reduced?1:Math.min(1,(t-hideUntil)/700);
if(fade<=0)return;
const p=project(at.x,at.y,1600),near=Math.max(0,1-Math.hypot(p.x-px*w,p.y-py*h)/((w<700?205:300)*1.1));
const flick=reduced||lit?1:(Math.sin(t*.0047)>.985?.45:1)*(.93+.07*Math.sin(t*.021));
nctx.save();nctx.translate(p.x,p.y);nctx.scale(p.s,p.s);nctx.rotate(-.045);nctx.font='bold '+(w<700?32:38)+'px monospace';nctx.lineCap='round';
nctx.globalAlpha=(lit?1:.32+.68*near)*flick*fade;if(blur)nctx.filter='blur('+blur.toFixed(1)+'px)';const msg='Fatal error: shop-plugin.php:42';
const pass=(fill,blur,glow)=>{nctx.shadowColor=glow;nctx.shadowBlur=blur;nctx.fillStyle=fill;nctx.strokeStyle=fill;nctx.fillText(msg,-285,0);nctx.lineWidth=4;nctx.beginPath();nctx.moveTo(-285,16);nctx.lineTo(430,22);nctx.stroke()};
pass('#ff0a2a',46,'#ff0022');pass('#ff1f3d',22,'#ff1a33');pass('#ff5a6a',8,'#ff4d5e');pass(lit?'#ff1030':'#ffe4e8',0,'transparent');
nctx.restore()}
function beam(c,z){const depth=z/1600,rad=(w<700?205:300)/(1+depth*.55),power=1/(1+depth*1.45);c.save();c.globalCompositeOperation='destination-in';const light=c.createRadialGradient(px*w,py*h,0,px*w,py*h,rad);light.addColorStop(0,'rgba(255,255,255,'+power+')');light.addColorStop(.30,'rgba(255,255,255,'+(power*.94)+')');light.addColorStop(.72,'rgba(255,255,255,'+(power*.40)+')');light.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=light;c.fillRect(0,0,w,h);c.restore()}
// The loop only runs while the hero is on screen, the tab is visible, and the scene isn't faded out.
let raf=0,onScreen=true;
function kick(){if(!raf)raf=requestAnimationFrame(draw)}
new IntersectionObserver(([e])=>{onScreen=e.isIntersecting;if(onScreen)kick()}).observe(hero);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick()});
function draw(t){raf=0;if(!w||!onScreen||document.hidden)return;
if(lit&&performance.now()-litAt>1700)return; // lights on and faded out (1.5s): nothing to draw until they go out
const dt=Math.min(40,t-(last||t));last=t;const smooth=1-Math.exp(-dt/100);px+=(mx-px)*smooth;py+=(my-py)*smooth;
const target=reduced?0:140*Math.min(1,(t-start)/2300)+travel*360;camera+=(target-camera)*smooth;
if(lit)error={x:w<700?.50:.69,y:w<700?.69:.52}; // caught: it stays on the code wall
const objects=specs(),ep=project(error.x,error.y,1600),radius=(w<700?205:300)/1.55,dist=Math.hypot(ep.x-px*w,ep.y-py*h);
if(!lit&&!reduced&&active&&t>hideUntil&&dist<radius*.68){if(!seenAt)seenAt=t;if(t-seenAt>650){escapes++;const spots=w<700?[[.40,.65],[.65,.78],[.48,.88],[.78,.58]]:[[.69,.52],[.84,.39],[.74,.76],[.51,.65],[.80,.60]];const p=spots[escapes%spots.length];fleeFrom={x:error.x,y:error.y,t};error={x:p[0],y:p[1]};hideUntil=t+430;seenAt=0}}else seenAt=0;
ctx.clearRect(0,0,w,h);
for(let i=0;i<PLANES.length;i++){const z=PLANES[i],c=layerContexts[i];c.clearRect(0,0,w,h);codePlane(c,z,i);if(i>0)for(const o of objects)if(o.z===z)sprite(c,o);
// Foreground alpha silhouettes cast enlarged shadows onto every deeper plane.
// source-atop confines those shadows to actual receiver surfaces and code.
if(!lit){c.save();c.globalCompositeOperation='source-atop';c.globalAlpha=.82;for(const o of objects)if(o.z<z)sprite(c,o,true,z);c.restore();beam(c,z)}
if(i===0)neon(t);}
if(!lit){const radius=w<700?205:300,glow=ctx.createRadialGradient(px*w,py*h,0,px*w,py*h,radius);glow.addColorStop(0,'rgba(255,255,255,.055)');glow.addColorStop(.52,'rgba(255,255,255,.018)');glow.addColorStop(.86,'rgba(255,147,68,.05)');glow.addColorStop(1,'rgba(255,147,68,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px*w,py*h,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff934f';ctx.beginPath();ctx.arc(px*w+4,py*h+4,2,0,Math.PI*2);ctx.fill()}
raf=requestAnimationFrame(draw)}
apply();resize();
})();


