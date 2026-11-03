/* Kinetik 3D exercise demo.
   A sculpted figure driven by the same keyframes as the 2D side-view demos in index.html
   (dmKeys / dmAt / dmSkel), so every exercise gets a 3D version. The muscles each move works
   (musclesFor) glow amber, brighter on the hard part of each rep, with tempo and breathing cues.
   Needs three.js (vendor/three.min.js). index.html falls back to the 2D demo without WebGL. */
(function(){
'use strict';
const W=window.THREE;if(!W)return;
if(W.ColorManagement)W.ColorManagement.legacyMode=false;
const PI=Math.PI,S=.0177,V=(x,y,z)=>new W.Vector3(x,y,z);
const L_TH=.40,L_SH=.38,L_UA=.30,L_FA=.283,ANK=.07;
/* moves drawn lying face up with the body pointing forward: mirror them so the chest faces the sky */
const SUP=new Set(['heeltap','crunch','bicycle','legraise','deadbug','twist','bench','fly','skull','pullover','thrust','bridge','bridge1','invrow','trxham']);
/* moves whose arms or legs swing out to the side rather than forward */
const LAT_ARMS=/lateral raise|flye|fly\b|jumping jack|star jump|pull-apart|reverse fly|rear delt|y raise|dislocate|wall slide|chest stretch|arm circles/i;
/* overhead presses: elbows stay out to the sides and a little forward the whole way up */
const OVERHEAD=new Set(['press','pushpress','thruster','wallball','lungepress']);
/* band push-pull: one band anchored behind (the pressing hand), one in front (the rowing hand), at chest height */
const PP_BACK=[6,50],PP_FRONT=[134,50];
const LAT_LEGS=/jumping jack|star jump|monster|lateral|skater|side shuffle/i;
/* moves where the hard part is moving down (cables and bands pulling up from below are rare) */
const WORK_DOWN=/pulldown|pushdown|pullover|kickback|slam|chop|straight-arm|leg curl|hamstring curl/i;

let G=null; // built once

function fiberTex(){const c=document.createElement('canvas');c.width=128;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,128,128);
  for(let x=0;x<128;x+=2){g.fillStyle=Math.random()<.3?'rgba(255,220,210,'+(Math.random()*.16).toFixed(3)+')':'rgba(40,0,0,'+(Math.random()*.3).toFixed(3)+')';g.fillRect(x,0,1+Math.random()*1.5,128)}
  const t=new W.CanvasTexture(c);t.wrapS=t.wrapT=W.RepeatWrapping;t.repeat.set(4,1);t.encoding=W.sRGBEncoding;return t}

function build(){
  const cv=document.createElement('canvas');cv.className='d3c';
  const renderer=new W.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=W.PCFSoftShadowMap;
  renderer.outputEncoding=W.sRGBEncoding;renderer.toneMapping=W.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new W.Scene(),cam=new W.PerspectiveCamera(30,1,.05,60);
  scene.add(new W.HemisphereLight(0xfff4e8,0x2a2036,.8));
  const key=new W.DirectionalLight(0xfff0e2,1.35);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.5,far:14});key.shadow.bias=-.0006;key.shadow.radius=4;
  scene.add(key,key.target);
  const rim=new W.DirectionalLight(0xaab8ff,.55);rim.position.set(-2.5,2.2,-3);scene.add(rim);
  const floor=new W.Mesh(new W.CircleGeometry(2.4,64),new W.MeshStandardMaterial({color:0x221c2e,roughness:1}));
  floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);

  /* materials: a warm matte "clay" figure; muscles the same clay until they work */
  const FIB=fiberTex();
  const skin=new W.MeshStandardMaterial({color:0x6a1a1e,roughness:.5,map:FIB});
  const dark=skin;
  const hairM=skin;
  const metal=new W.MeshStandardMaterial({color:0x34343c,metalness:.55,roughness:.35});
  const kitM=new W.MeshStandardMaterial({color:0x4a4160,roughness:.75});
  const C={idle:new W.Color(0x9e3034),main:new W.Color(0xffa83a),also:new W.Color(0xf07f3a),emi:new W.Color(0xff8a1c)};
  const mats={},mus={},halo={};
  const GLOW=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);
    r.addColorStop(0,'rgba(255,190,90,1)');r.addColorStop(.4,'rgba(255,160,50,.4)');r.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new W.CanvasTexture(c)})();
  ['chest','delts','biceps','triceps','forearms','abs','obliques','quads','adductors','calves','traps','upperback','lats','lowerback','glutes','hamstrings'].forEach(k=>{
    mats[k]=new W.MeshStandardMaterial({color:C.idle.clone(),roughness:.42,map:FIB,emissive:C.emi.clone(),emissiveIntensity:0});mus[k]=[];halo[k]=[]});
  const SPH=new W.SphereGeometry(1,32,24),bodyMeshes=[];
  const ell=(p,g,pos,sc,rot,mat)=>{const m=new W.Mesh(SPH,mat||(g?mats[g]:skin));m.position.set(pos[0],pos[1],pos[2]);m.scale.set(sc[0],sc[1],sc[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);
    m.castShadow=true;p.add(m);
    if(g){mus[g].push(m);const h=new W.Sprite(new W.SpriteMaterial({map:GLOW,color:0xffb547,transparent:true,blending:W.AdditiveBlending,depthWrite:false,opacity:0}));
      h.position.copy(m.position);h.scale.setScalar(Math.max(sc[0],sc[1],sc[2])*2.4);h.visible=false;p.add(h);halo[g].push(h)}
    else bodyMeshes.push(m);return m};
  const limb=(p,len,r1,r2)=>{const m=new W.Mesh(new W.CylinderGeometry(r1,r2,len,24,1),skin);m.position.y=-len/2;m.castShadow=true;p.add(m);bodyMeshes.push(m);ell(p,null,[0,0,0],[r1,r1,r1])};
  const grp=(p,x,y,z)=>{const g=new W.Group();g.position.set(x,y,z);p.add(g);return g};

  /* skeleton: faces +z, its left is +x; the root sits between the hip joints */
  const root=grp(scene,0,.85,0);
  const B={ua:[],fa:[],hd:[],th:[],sh:[],ft:[],db:[]};
  B.spine=grp(root,0,.1,0);B.chest=grp(B.spine,0,.2,0);B.neck=grp(B.chest,0,.29,0);B.head=grp(B.neck,0,.1,0);
  ell(root,null,[0,.03,-.005],[.145,.1,.1]);
  ell(B.spine,null,[0,.07,0],[.122,.13,.088]);
  ell(B.chest,null,[0,.12,-.005],[.158,.16,.098]);
  ell(B.chest,null,[0,.21,-.01],[.19,.06,.08]);
  {const n=new W.Mesh(new W.CylinderGeometry(.045,.052,.13,16),skin);n.position.y=.04;n.castShadow=true;B.neck.add(n);bodyMeshes.push(n)}
  ell(B.head,null,[0,.04,.01],[.078,.098,.092]);
  ell(B.head,null,[0,.075,-.014],[.083,.074,.09],null,hairM);
  ell(B.head,null,[0,.03,.1],[.012,.018,.014]);
  for(const s of[1,-1])ell(B.head,null,[.078*s,.035,0],[.012,.022,.016]);
  for(let i=0;i<2;i++){const s=i?-1:1;
    const ua=grp(B.chest,.18*s,.23,0),fa=grp(ua,0,-L_UA,0),hd=grp(fa,0,-L_FA,0);
    limb(ua,L_UA,.046,.038);limb(fa,L_FA,.038,.028);
    ell(hd,null,[0,-.05,.004],[.03,.055,.017]);ell(hd,null,[.022*s,-.02,.012],[.011,.028,.011],[0,0,.5*s]);
    const th=grp(root,.09*s,0,0),sh=grp(th,0,-L_TH,0),ft=grp(sh,0,-L_SH,0);
    limb(th,L_TH,.078,.052);limb(sh,L_SH,.05,.034);
    ell(ft,null,[0,-.045,.06],[.048,.035,.122],null,dark);ell(ft,null,[0,-.012,.0],[.04,.03,.05],null,dark);
    B.ua.push(ua);B.fa.push(fa);B.hd.push(hd);B.th.push(th);B.sh.push(sh);B.ft.push(ft);
    /* a dumbbell for each hand, shown when the move uses them */
    const db=new W.Group(),hdl=new W.Mesh(new W.CylinderGeometry(.013,.013,.16,12),metal);hdl.rotation.z=PI/2;db.add(hdl);
    for(const x of[-.075,.075]){const pl=new W.Mesh(new W.CylinderGeometry(.046,.046,.035,20),metal);pl.rotation.z=PI/2;pl.position.x=x;pl.castShadow=true;db.add(pl)}
    db.position.y=-.05;db.visible=false;hd.add(db);B.db.push(db);
    /* muscles: low and smooth so the figure reads as one body */
    ell(ua,'delts',[0,-.035,0],[.06,.074,.06]);
    ell(ua,'biceps',[0,-.15,.02],[.035,.092,.035]);
    ell(ua,'triceps',[0,-.14,-.02],[.037,.1,.034]);
    ell(fa,'forearms',[0,-.07,.004],[.037,.085,.034]);
    ell(th,'quads',[0,-.18,.026],[.064,.17,.05]);
    ell(th,'quads',[-.027*s,-.3,.028],[.035,.052,.034]);
    ell(th,'hamstrings',[0,-.19,-.026],[.055,.16,.045]);
    ell(th,'adductors',[-.03*s,-.1,0],[.035,.1,.045]);
    ell(sh,'calves',[0,-.11,-.026],[.044,.09,.04]);
    ell(B.chest,'chest',[.07*s,.15,.066],[.078,.062,.034],[.15,0,-.25*s]);
    ell(B.chest,'lats',[.1*s,.06,-.042],[.054,.125,.044],[0,0,-.3*s]);
    ell(B.chest,'upperback',[.05*s,.14,-.076],[.046,.072,.03]);
    ell(B.spine,'obliques',[.092*s,.07,.028],[.035,.082,.052],[0,0,.1*s]);
    ell(B.spine,'lowerback',[.031*s,.08,-.062],[.027,.095,.03]);
    ell(root,'glutes',[.06*s,0,-.072],[.078,.082,.058]);
    for(let r=0;r<3;r++)ell(B.spine,'abs',[.029*s,.15-.055*r,.07],[.027,.024,.021]);
  }
  ell(B.chest,'traps',[0,.24,-.034],[.118,.044,.044]);
  ell(B.chest,'traps',[0,.16,-.077],[.034,.082,.027]);
  const BONES=[B.spine,B.chest,B.neck,B.head,...B.ua,...B.fa,...B.hd,...B.th,...B.sh,...B.ft];
  const kit=new W.Group();scene.add(kit);
  /* bands, cables and suspension straps: thin tubes stretched between an anchor and the hands or feet */
  const strapM=new W.MeshStandardMaterial({color:0x3fae6a,roughness:.55}),strapG=new W.CylinderGeometry(1,1,1,10);
  const straps=[0,1,2,3].map(()=>{const m=new W.Mesh(strapG,strapM);m.visible=false;m.castShadow=true;scene.add(m);return m});
  G={cv,renderer,scene,cam,key,root,B,BONES,mats,mus,halo,C,bodyMeshes,kit,kitM,metal,straps,strapM,SPH};
}

/* ---------- small 3D helpers ---------- */
const wp=o=>o.getWorldPosition(new W.Vector3());
const _m=new W.Matrix4();
function aimF(b,T,F){const pqi=b.parent.getWorldQuaternion(new W.Quaternion()).invert();
  const y=wp(b).sub(T);if(y.lengthSq()<1e-8)return;y.normalize().applyQuaternion(pqi);
  const z=F.clone().applyQuaternion(pqi);z.sub(y.clone().multiplyScalar(z.dot(y)));if(z.lengthSq()<1e-8)return;z.normalize();
  _m.makeBasis(new W.Vector3().crossVectors(y,z),y,z);b.quaternion.setFromRotationMatrix(_m)}
/* two-bone IK: joint A, child Bn, reach T, bend toward pole P; fs=1 the front faces the bend (knees), -1 away (elbows) */
function ik2(A,Bn,T,P,fs,l1,l2,fb){const Sx=wp(A),D=T.clone().sub(Sx);let d=D.length();if(d<1e-5)return;const u=D.clone().divideScalar(d);
  d=Math.min(d,l1+l2-1e-3);const ca=Math.max(-1,Math.min(1,(l1*l1+d*d-l2*l2)/(2*l1*d))),sa=Math.sqrt(1-ca*ca);
  let n=P.clone().sub(Sx);n.sub(u.clone().multiplyScalar(n.dot(u)));
  if(n.lengthSq()<1e-6){n=fb.clone();n.sub(u.clone().multiplyScalar(n.dot(u)))}
  n.normalize();const E=Sx.clone().addScaledVector(u,l1*ca).addScaledVector(n,l1*sa);
  aimF(A,E,n.clone().multiplyScalar(fs));aimF(Bn,T,n.clone().multiplyScalar(fs));return n}
function setWQ(b,q){b.quaternion.copy(b.parent.getWorldQuaternion(new W.Quaternion()).invert().multiply(q))}
function lookQ(fwd){const z=fwd.clone().setY(0);if(z.lengthSq()<1e-6)z.set(0,0,1);z.normalize();const y=V(0,1,0),x=new W.Vector3().crossVectors(y,z);
  return new W.Quaternion().setFromRotationMatrix(new W.Matrix4().makeBasis(x,y,z))}

/* ---------- one open demo ---------- */
let D=null,raf=0,A=null;
function M(p,x){return V(x||0,(A.DG-p[1])*S,D.mir*(p[0]-D.cx)*S)}

function plan(P,R,name){
  if(/^(stretch|foam roll) ·|cat-cow|child's pose|downward dog|cobra/i.test(name))return{multi:true,calm:true};
  if(R.length!==2||P.lin)return{multi:true};
  const s0=A.dmSkel(A.dmAt(R,0,true)),s1=A.dmSkel(A.dmAt(R,.5,true)),mid=a=>[(a[0][1][0]+a[1][1][0])/2,(a[0][1][1]+a[1][1][1])/2];
  let best=null,bd=0;
  for(const [a,b] of [[s0.hip,s1.hip],[s0.head,s1.head],[mid(s0.arms),mid(s1.arms)],[mid(s0.legs),mid(s1.legs)]]){const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>bd){bd=d;best=[b[0]-a[0],b[1]-a[1]]}}
  if(bd<3){/* hands moving in opposite directions (push-pull, alternating presses) is not a hold */
    const hm=[0,1].map(i=>Math.hypot(s1.arms[i][1][0]-s0.arms[i][1][0],s1.arms[i][1][1]-s0.arms[i][1][1]));return Math.max(...hm)>=3?{multi:true}:{hold:true}}
  let n1,n2,w1;
  if(Math.abs(best[1])>=Math.abs(best[0])*.6){n1=best[1]<0?'UP':'DOWN';n2=best[1]<0?'DOWN':'UP';w1=best[1]<0}else{n1='OUT';n2='BACK';w1=true}
  if(WORK_DOWN.test(name))w1=!w1;
  const ph=[{n:n1,d:w1?1:2,a:0,b:1,br:w1?'Breathe out':'Breathe in',fx:w1?1:.55},{n:w1?'SQUEEZE':'HOLD',d:w1?.5:.3,a:1,b:1,br:'',fx:w1?1:.7},
    {n:n2,d:w1?2:1,a:1,b:0,br:w1?'Breathe in':'Breathe out',fx:w1?.55:1},{n:'',d:.5,a:0,b:0,br:'',fx:.25}];
  return{ph,tempo:n1+' '+ph[0].d+' · '+n2+' '+ph[2].d}}

/* equipment, built from the same 2D kit drawings */
function slab(a,b,w,t,mat){const p=M(a),q=M(b),len=p.distanceTo(q);if(len<1e-4)return;
  const m=new W.Mesh(new W.BoxGeometry(w,t,len+t),mat||G.kitM);m.position.copy(p).add(q).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(V(0,0,1),q.clone().sub(p).normalize());m.castShadow=m.receiveShadow=true;G.kit.add(m)}
function latBar(p,len,r){const m=new W.Mesh(new W.CylinderGeometry(r||.016,r||.016,len,14),G.metal);m.rotation.z=PI/2;m.position.copy(M(p));m.castShadow=true;G.kit.add(m)}
function post(p,x){const top=M(p,x),h=top.y;if(h<=0)return;const m=new W.Mesh(new W.CylinderGeometry(.025,.025,h,12),G.kitM);m.position.set(top.x,h/2,top.z);m.castShadow=true;G.kit.add(m)}
function disc(p,r){const m=new W.Mesh(new W.CylinderGeometry(r,r,.06,28),G.kitM);m.rotation.z=PI/2;m.position.copy(M(p));m.castShadow=true;G.kit.add(m)}
function buildKit(P){
  /* bench and seat spans along the body: feet that land beside them step out to the side */
  D.benches=(P.pr||[]).filter(o=>o.b==='bench'||o.b==='seat').map(o=>[o.x-4,o.x+(o.b==='seat'?30:o.w)+4]);
  while(G.kit.children.length){const c=G.kit.children.pop();c.geometry&&c.geometry.dispose()}
  (P.pr||[]).forEach(o=>{const b=o.b,x=o.x,y=o.y,w=o.w;
    if(b==='bench'){slab([x,y+1.5],[x+w,y+1.5],.42,.06);slab([x+5,y],[x+5,A.DG],.32,.03);slab([x+w-5,y],[x+w-5,A.DG],.32,.03)}
    else if(b==='box'){const t=(A.DG-y)*S;slab([x,(y+A.DG)/2],[x+w,(y+A.DG)/2],.6,t)}
    else if(b==='bar'){latBar([x+w/2,y],1.15);post([x+w/2,y],.56);post([x+w/2,y],-.56)}
    else if(b==='barlow'){latBar([x+w-3,y],1.15);post([x+w-3,y],.56);post([x+w-3,y],-.56)}
    else if(b==='wall'){slab([x+1,0],[x+1,A.DG],1.3,.05);G.kit.children[G.kit.children.length-1].userData.big=1}
    else if(b==='post'){post([x+2.5,-12],0)}
    else if(b==='seat'){slab([x,y+1.5],[x+30,y+1.5],.42,.06);slab([x+15,y],[x+15,A.DG],.1,.1)}
    else if(b==='seatb'){slab([36,98],[64,98],.42,.06);slab([50,98],[50,A.DG],.1,.1);slab([36,98],[20,72],.42,.05)}
    else if(b==='pad'){slab([x,y+2],[x+16,y+2],.42,.06);slab([x+8,y],[x-6,A.DG],.07,.07);slab([18,100],[12,A.DG],.07,.07)}
    else if(b==='bike'){slab([50,64],[66,64],.2,.05);slab([60,64],[72,98],.06,.06);slab([72,98],[98,52],.06,.06);latBar([99,50],.5,.014);disc([72,98],10*S);
      slab([72,98],[104,A.DG],.06,.06);slab([72,98],[44,A.DG],.06,.06)}
    else if(b==='rail'){slab([20,112],[144,112],.7,.05);post([144,90],.3);post([144,90],-.3);latBar([144,90],.6,.02)}
    else if(b==='belt'){slab([20,A.DG+1],[140,A.DG+1],.7,.05);slab([138,A.DG],[128,40],.08,.08)}
    else if(b==='steps'){slab([62,106],[92,106],.8,16*S);slab([118,A.DG],[118,30],.06,.06)}});
  if(D.key==='pushpull'){post(PP_BACK,.2);post(PP_FRONT,-.2)}
  if(P.roller){const m=new W.Mesh(new W.CylinderGeometry(.075,.075,.5,24),G.kitM);m.rotation.z=PI/2;m.position.copy(M(P.roller));m.castShadow=true;G.kit.add(m)}
}
function heldMesh(h){if(!h)return null;const g=new W.Group(),m=G.metal;
  if(h.t==='bb'){const bar=new W.Mesh(new W.CylinderGeometry(.014,.014,1.5,12),m);bar.rotation.z=PI/2;g.add(bar);
    for(const x of[-.6,.6]){const pl=new W.Mesh(new W.CylinderGeometry(.16,.16,.05,28),m);pl.rotation.z=PI/2;pl.position.x=x;pl.castShadow=true;g.add(pl)}}
  else if(h.t==='db'){const hdl=new W.Mesh(new W.CylinderGeometry(.014,.014,.2,12),m);hdl.rotation.z=PI/2;g.add(hdl);for(const x of[-.09,.09]){const pl=new W.Mesh(new W.CylinderGeometry(.06,.06,.04,20),m);pl.rotation.z=PI/2;pl.position.x=x;pl.castShadow=true;g.add(pl)}}
  else if(h.t==='kb'){const b=new W.Mesh(new W.SphereGeometry(.085,24,18),m);b.castShadow=true;g.add(b);const hd=new W.Mesh(new W.TorusGeometry(.05,.012,10,24,PI),m);hd.position.y=.06;g.add(hd)}
  else if(h.t==='ball'){const b=new W.Mesh(new W.SphereGeometry(.12,28,20),new W.MeshStandardMaterial({color:0x6b4f9a,roughness:.6}));b.castShadow=true;g.add(b)}
  else return null;G.kit.add(g);return g}

function pose(e){const R=D.R,q=A.dmAt(R,e,D.P.lin||(!D.multi&&!D.hold)),s=A.dmSkel(q),B=G.B,mir=D.mir;
  for(const b of G.BONES)b.quaternion.identity();
  const bend=(q.c||0)*.05;
  G.root.position.copy(M(s.hip));G.root.rotation.set(mir*(q.t*Math.PI/180-bend/2),0,0);
  B.spine.rotation.x=mir*bend/2;B.chest.rotation.x=mir*bend/2;B.neck.rotation.x=mir*(q.hd||0)*Math.PI/180;
  G.root.updateMatrixWorld(true);
  const front=V(0,0,1).applyQuaternion(G.root.quaternion);
  for(let i=0;i<2;i++){const side=i?-1:1;
    /* legs */
    const fx=s.legs[i][1][0],wide=s.legs[i][1][1]>A.DG-12&&D.benches.some(r=>fx>r[0]&&fx<r[1]);
    let T=M(s.legs[i][1],(wide?.33:.1)*side),K=M(s.legs[i][0],(wide?.36:.13)*side);T.y+=ANK;
    if(D.latL){const hp=wp(B.th[i]);const v=T.clone().sub(hp),k=K.clone().sub(hp);
      T=hp.clone().add(V(side*Math.abs(v.z),v.y,0));K=hp.clone().add(V(side*Math.abs(k.z)+.02*side,k.y,.04))}
    const n=ik2(B.th[i],B.sh[i],T,K,1,L_TH,L_SH,front);
    const shin=wp(B.ft[i]).sub(wp(B.sh[i])).normalize();
    if(T.y<ANK+.06&&Math.abs(shin.y)>.55){const f=Math.abs(q.t)<60?(n||front).clone():T.clone().sub(G.root.position);setWQ(B.ft[i],lookQ(f))}
    /* arms */
    const oh=OVERHEAD.has(D.key);
    let H=M(s.arms[i][1],(oh?.25:.2)*side),E=M(s.arms[i][0],.26*side);
    if(oh)E=wp(B.ua[i]).add(V(.7*side,-.3,.2));
    if(D.latA){const sp=wp(B.ua[i]);const v=H.clone().sub(sp),k=E.clone().sub(sp);
      H=sp.clone().add(V(side*Math.abs(v.z)+.02*side,v.y,.05));E=sp.clone().add(V(side*Math.abs(k.z)+.02*side,k.y,-.02))}
    if(H.y<.04)H.y=.04;
    ik2(B.ua[i],B.fa[i],H,E,-1,L_UA,L_FA,front.clone().negate());
    if(H.y<.07){const fw=V(0,1,0).applyQuaternion(G.root.quaternion);fw.y=0;if(fw.lengthSq()<1e-4)fw.copy(front);
      setWQ(B.hd[i],new W.Quaternion().setFromUnitVectors(V(0,-1,0),fw.normalize()))}
  }
  /* held kit and straps follow the 2D drawing's own placement */
  const hand=i=>s.arms[i][1],elb=i=>s.arms[i][0],mid=[(hand(0)[0]+hand(1)[0])/2,(hand(0)[1]+hand(1)[1])/2];
  const ahead=(i,d)=>{const h=hand(i),e2=elb(i),L=Math.hypot(h[0]-e2[0],h[1]-e2[1])||1;return[h[0]+(h[0]-e2[0])/L*d,h[1]+(h[1]-e2[1])/L*d]};
  if(D.held&&D.hm){const t=D.held.t,hp=D.P.hold;let at;
    if(t==='bb')at=hp==='sh'?[s.sh[0]-2,s.sh[1]-3]:hp==='hip'?[s.hip[0]+2,s.hip[1]-7]:hand(0);
    else if(t==='kb'||t==='db')at=hp==='hip'?[s.hip[0]+2,s.hip[1]-6]:ahead(0,5);
    else at=ahead(0,5);
    D.hm.position.copy(M(at));if(t==='kb'&&D.hm.position.y<.09)D.hm.position.y=.09;if(t==='ball'&&D.hm.position.y<.12)D.hm.position.y=.12}
  let nseg=0;
  const seg=(a,b)=>{if(nseg>3)return;const m=G.straps[nseg++],dv=b.clone().sub(a),L=dv.length();if(L<1e-4){m.visible=false;return}
    m.visible=true;m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(D.sw,L,D.sw);m.quaternion.setFromUnitVectors(V(0,1,0),dv.divideScalar(L))};
  const hw=i=>wp(G.B.hd[i]).add(V(0,-.045,0).applyQuaternion(G.B.hd[i].getWorldQuaternion(new W.Quaternion()))),both=a=>{seg(a,hw(0));seg(a,hw(1))};
  const P=D.P,nm=D.name;
  if(D.key==='pushpull'){seg(M(PP_BACK,.2),hw(0));seg(M(PP_FRONT,-.2),hw(1))}
  else if(P.ta){if(P.ta==='feet'){const a=M([10,-12]);seg(a,wp(G.B.ft[0]));seg(a,wp(G.B.ft[1]))}else both(M(P.ta))}
  if(P.ba&&!/pull-apart/i.test(nm)&&/band|cable|pulldown|pushdown|face pull|crunch/i.test(nm))both(M(P.ba));
  else if(/^band (curls|overhead|lateral)|banded squats|band good/i.test(nm)){seg(wp(G.B.ft[0]),hw(0));seg(wp(G.B.ft[1]),hw(1))}
  else if(/pull-apart/i.test(nm))seg(hw(0),hw(1));
  for(let k=nseg;k<4;k++)G.straps[k].visible=false}

function frameCam(){const box=new W.Box3();
  for(let k=0;k<8;k++){pose(D.multi||D.hold?k/8:k/14);G.root.updateMatrixWorld(true);for(const m of G.bodyMeshes)box.expandByObject(m)}
  for(const c of G.kit.children)if(!c.userData.big)box.expandByObject(c);
  D.target=box.getCenter(new W.Vector3());const sz=box.getSize(new W.Vector3()),r=Math.max(sz.x,sz.y,sz.z);
  const w=D.el.clientWidth||300,h=D.el.clientHeight||260;
  D.dist=r/(2*Math.tan(PI*15/180))*1.12/Math.min(1,w/h)+.2;
  G.key.target.position.copy(D.target);G.key.position.copy(D.target).add(V(2.2,4.2,2.6))}

function labels(){const w=D.el.clientWidth,h=D.el.clientHeight,cp=G.cam.position;let svg='';const used={l:[],r:[]};
  const pts=D.mus.p.slice(0,2).map(g=>{let best=null,bd=1e9;for(const m of G.mus[g]){const p=wp(m),d=p.distanceTo(cp);if(d<bd){bd=d;best=p}}
    const v=best.project(G.cam);return{g,x:(v.x+1)/2*w,y:(1-v.y)/2*h}}).sort((a,b)=>a.y-b.y);
  for(const o of pts){const right=o.x>w/2,side=right?'r':'l',nm=A.MUS_NAME[o.g].toUpperCase();let ly=Math.max(64,Math.min(h-30,o.y));
    for(const u of used[side])if(Math.abs(u-ly)<24)ly=u+24;used[side].push(ly);
    const tw=nm.length*7.6,lx=right?w-12:12,ex=right?w-18-tw:18+tw;
    svg+='<line x1="'+ex.toFixed(1)+'" y1="'+(ly-4)+'" x2="'+o.x.toFixed(1)+'" y2="'+o.y.toFixed(1)+'"/><circle cx="'+o.x.toFixed(1)+'" cy="'+o.y.toFixed(1)+'" r="3.2"/>'+
      '<text x="'+lx+'" y="'+ly+'" text-anchor="'+(right?'end':'start')+'">'+nm+'</text>'}
  D.ov.innerHTML=svg}

function tick(now){if(!D)return;if(D.frozen!=null){stillFrame();raf=requestAnimationFrame(tick);return}const dt=Math.min(.05,(now-D.last)/1000);D.last=now;
  let e,fx,ph=null,f=0;
  if(D.multi||D.hold){D.clock=(D.clock+dt)%D.P.d;e=D.clock/D.P.d;fx=.75+.25*Math.sin(now/300)}
  else{const tot=D.plan.ph.reduce((a,p)=>a+p.d,0);D.clock=(D.clock+dt)%tot;let t=D.clock;ph=D.plan.ph[0];for(const p of D.plan.ph){if(t<p.d){ph=p;break}t-=p.d}
    f=t/ph.d;const u=f*f*(3-2*f);e=(ph.a+(ph.b-ph.a)*u)/2;fx=ph.fx}
  if(D.still){e=D.multi||D.hold?Math.floor(now/1500)%Math.max(1,D.R.length)/D.R.length:(Math.floor(now/1500)%2)*.5;fx=1}
  D.inten+=(fx-D.inten)*Math.min(1,dt*6);
  D.phEl.textContent=D.hold?'HOLD':ph?ph.n:'';D.brEl.textContent=D.hold?'Breathe steadily':ph?ph.br:D.plan.calm?'Breathe slowly':'Keep breathing';D.pbEl.style.width=(ph&&ph.n?f*100:0)+'%';
  pose(e);
  const I=D.inten,pulse=.93+.07*Math.sin(now/180);
  for(const g in G.mats){const m=G.mats[g];
    if(D.mus.p.includes(g)){m.color.copy(G.C.idle).lerp(G.C.main,.6+.4*I);m.emissiveIntensity=(.3+.8*I)*pulse;for(const h of G.halo[g])h.material.opacity=.08+.32*I}
    else if(D.mus.s.includes(g)){m.color.copy(G.C.idle).lerp(G.C.also,.45+.25*I);m.emissiveIntensity=.04+.14*I}
    else{m.color.copy(G.C.idle);m.emissiveIntensity=0}}
  if(now-D.lastDrag>4000&&!D.drag&&!D.still)D.yaw=D.yaw0+Math.sin(now/4200)*.4;
  const c=G.cam,t=D.target;c.position.set(t.x+Math.sin(D.yaw)*Math.cos(D.pitch)*D.dist,t.y+Math.sin(D.pitch)*D.dist,t.z+Math.cos(D.yaw)*Math.cos(D.pitch)*D.dist);c.lookAt(t);
  G.renderer.render(G.scene,c);labels();raf=requestAnimationFrame(tick)}

function resize(){if(!D)return;const w=D.el.clientWidth||300,h=D.el.clientHeight||260;G.renderer.setSize(w,h,false);G.cam.aspect=w/h;G.cam.updateProjectionMatrix();D.ov.setAttribute('viewBox','0 0 '+w+' '+h)}

function close(){if(raf)cancelAnimationFrame(raf);raf=0;if(D){removeEventListener('resize',D.onR);D=null}}

/* el: the demo panel; name: exercise name; P: its A.DMO entry; api: the app helpers it draws with */
function open(el,name,P,api){close();A=api;if(!G)build();
  const R=A.dmKeys(P),key=Object.keys(A.DMO).find(k=>A.DMO[k]===P)||'';
  let still=false;try{still=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
  const pl=plan(P,R,name),m=A.musclesFor(name)||{p:[],s:[]};
  /* centre the movement: the middle of everything the 2D figure covers */
  let x0=1e9,x1=-1e9;for(let k=0;k<12;k++){const s=A.dmSkel(A.dmAt(R,k/12,P.lin));[s.hip,s.head,...s.legs.map(l=>l[1]),...s.arms.map(l=>l[1])].forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0])})}
  el.innerHTML='';el.classList.add('d3');el.appendChild(G.cv);
  el.insertAdjacentHTML('beforeend','<svg class="d3ov" aria-hidden="true"></svg><div class="d3co" aria-hidden="true"><b></b><span></span><i><u></u></i></div>'+
    (pl.tempo?'<div class="d3tp" aria-hidden="true">'+pl.tempo+'</div>':'')+'<div class="d3hint" aria-hidden="true">Drag to turn</div>');
  D={el,name,P,R,key,mir:SUP.has(key)?-1:1,cx:(x0+x1)/2,multi:!!pl.multi,hold:!!pl.hold,plan:pl,mus:m,still,clock:0,inten:.3,last:performance.now(),
    yaw0:65*PI/180,yaw:65*PI/180,pitch:12*PI/180,lastDrag:-1e9,drag:null,ov:el.querySelector('.d3ov'),phEl:el.querySelector('.d3co b'),brEl:el.querySelector('.d3co span'),pbEl:el.querySelector('.d3co u'),
    latA:LAT_ARMS.test(name),latL:LAT_LEGS.test(name)};
  G.cv.setAttribute('role','img');G.cv.setAttribute('aria-label','3D demonstration of '+name+(m.p.length?', working '+m.p.map(k=>A.MUS_NAME[k]).join(' and '):''));
  /* strap look: suspension straps, cables or rubber bands */
  const trx=/trx/i.test(name),cab=/cable|pulldown|pushdown|face pull|rope/i.test(name);
  D.sw=trx?.011:cab?.0045:.008;G.strapM.color.setHex(trx?0xd8b11c:cab?0x9a9aa6:0x3fae6a);
  buildKit(P);D.held=A.dmHeld(name,P);D.hm=null;
  const db=D.held&&D.held.t==='db'&&P.hold!=='hip';G.B.db.forEach((d,i)=>{d.visible=!!db&&!(i===1&&(D.held.one||P.hold==='mid'))});
  if(D.held&&!db)D.hm=heldMesh(D.held);
  for(const g in G.halo){const on=m.p.includes(g);for(const h of G.halo[g])h.visible=on}
  D.onR=()=>{resize();frameCam()};addEventListener('resize',D.onR);
  resize();frameCam();
  /* drag to turn, double-tap to reset */
  let lastTap=0;
  G.cv.onpointerdown=ev=>{if(!D)return;const now=performance.now();if(now-lastTap<300){D.yaw=D.yaw0;D.pitch=12*PI/180;D.lastDrag=-1e9;D.drag=null;lastTap=0;return}lastTap=now;
    D.drag={x:ev.clientX,y:ev.clientY,yaw:D.yaw,pitch:D.pitch};try{G.cv.setPointerCapture(ev.pointerId)}catch(e){}};
  G.cv.onpointermove=ev=>{if(!D||!D.drag)return;D.yaw=D.drag.yaw-(ev.clientX-D.drag.x)*.01;D.pitch=Math.max(-.05,Math.min(1.2,D.drag.pitch+(ev.clientY-D.drag.y)*.008));D.lastDrag=performance.now()};
  G.cv.onpointerup=G.cv.onpointercancel=()=>{if(D)D.drag=null};
  raf=requestAnimationFrame(tick)}

/* render one frozen frame (for checks): e in 0..1 across the movement */
function still(e){if(D)D.frozen=e}
function stillFrame(){const e=D.frozen;D.inten=1;D.yaw=D.yaw0;pose(D.multi||D.hold?e:e/2);
  for(const g in G.mats){const m=G.mats[g];if(D.mus.p.includes(g)){m.color.copy(G.C.main);m.emissiveIntensity=1.1;for(const h of G.halo[g])h.material.opacity=.4}
    else if(D.mus.s.includes(g)){m.color.copy(G.C.idle).lerp(G.C.also,.7);m.emissiveIntensity=.18}else{m.color.copy(G.C.idle);m.emissiveIntensity=0}}
  const c=G.cam,t=D.target;c.position.set(t.x+Math.sin(D.yaw)*Math.cos(D.pitch)*D.dist,t.y+Math.sin(D.pitch)*D.dist,t.z+Math.cos(D.yaw)*Math.cos(D.pitch)*D.dist);c.lookAt(t);
  G.renderer.render(G.scene,c);labels()}

/* self-check: every pose of the open demo gives finite joint positions */
function check(){if(!D)return 'none';for(let k=0;k<=8;k++){pose(k/8);G.root.updateMatrixWorld(true);
    for(const b of G.BONES){const p=wp(b);if(!isFinite(p.x+p.y+p.z))return 'nan@'+k}}return 'ok'}
function supported(){try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}}
window.Demo3D={open,close,still,check,supported};
})();
