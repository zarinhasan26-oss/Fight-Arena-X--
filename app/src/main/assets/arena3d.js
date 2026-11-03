/* Fight Arena X 3D prototype: real-time WebGL stage and articulated humanoid fighters. */
(function(){
'use strict';
if(!window.THREE){document.getElementById('networkMessage').textContent='3D engine could not load. Check internet and retry.';return;}
const T=window.THREE;
let renderer,scene,camera,clock,rigs=[],particles=[],last3=0,ready=false;
const skin=0xd39e78, arenaBlue=0x121c42;
const palette=[
{body:0xd93485,legs:0xf1e5ee,skin:0xb87e59,hair:0x111115},
{body:0x3d4554,legs:0x252b38,skin:0xd0a68c,hair:0x30261f},
{body:0x222b3b,legs:0x1c2430,skin:0xd4a78b,hair:0x433327},
{body:0x25334d,legs:0x1d2433,skin:0xe8b28e,hair:0xc19b56},
{body:0xece5d9,legs:0xf3f0e5,skin:0xba885e,hair:0xdfdfdf},
{body:0xefd1ae,legs:0xe9bb7a,skin:0xc29168,hair:0x171819},
{body:0x93d4ec,legs:0x38518f,skin:0xe8b39c,hair:0xe4edff},
{body:0x262333,legs:0x211d2c,skin:0xc4a08a,hair:0x11111b},
{body:0x8093a9,legs:0x323e52,skin:0xc0d0da,hair:0x41434c},
{body:0x596cb7,legs:0x32375b,skin:0xbfa38c,hair:0x313c4c}
];
function mat(color,rough=.63,metal=.02){return new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function mesh(geom,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(parent,r,material,x,y,z,sx=1,sy=1,sz=1){let m=mesh(new T.SphereGeometry(r,16,12),material,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function limb(parent,length,r1,r2,material,x,y,z){const joint=new T.Group();joint.position.set(x,y,z);parent.add(joint);mesh(new T.CylinderGeometry(r1,r2,length,12),material,joint,0,-length*.5,0);ball(joint,r2,material,0,-length,0);return joint;}
function box(parent,w,h,d,material,x,y,z){return mesh(new T.BoxGeometry(w,h,d),material,parent,x,y,z);}
function createFighter(index,x){
 const p=palette[index]||palette[0],body=mat(p.body),pants=mat(p.legs),bare=mat(p.skin),hair=mat(p.hair),shoe=mat(0x141922);
 const root=new T.Group();root.position.set(x,0,0);scene.add(root);
 const torso=new T.Group();torso.position.y=1.42;root.add(torso);
 ball(torso,.4,body,0,.06,0,1.1,1.25,.65);
 ball(torso,.35,body,0,-.24,0,1,.75,.67);
 const neck=mesh(new T.CylinderGeometry(.115,.12,.24,12),bare,torso,0,.58,0);
 const head=new T.Group();head.position.set(0,.9,0);torso.add(head);
 ball(head,.30,bare,0,0,0,.86,1.08,.82);
 ball(head,.29,hair,0,.175,-.015,.89,.56,.92);
 ball(head,.09,bare,-.252,-.01,0,.55,1,.65);ball(head,.09,bare,.252,-.01,0,.55,1,.65);
 const faceFront=new T.Group();faceFront.position.z=.235;head.add(faceFront);
 // Portrait texture on a subtly curved face surface, backed by full 3D cranium and hair.
 const source=fighters[index].image;
 if(source){
  const loader=new T.TextureLoader();loader.crossOrigin='anonymous';
  loader.load(source,tex=>{
    tex.colorSpace=T.SRGBColorSpace;
    const faceMaterial=new T.MeshStandardMaterial({map:tex,transparent:false,roughness:.94,side:T.DoubleSide});
    const geo=new T.CylinderGeometry(.251,.242,.49,24,1,true,-Math.PI/3,2*Math.PI/3);
    const plate=new T.Mesh(geo,faceMaterial);
    plate.rotation.y=Math.PI;
    plate.position.set(0,0,.005);
    head.add(plate);
   },undefined,()=>makeFace(faceFront,bare,hair));
 }else makeFace(faceFront,bare,hair);
 const leftArm=limb(torso,.68,.16,.115,body,-.44,.42,0);
 const rightArm=limb(torso,.68,.16,.115,body,.44,.42,0);
 const leftFore=limb(leftArm,.61,.12,.10,bare,0,-.66,0);
 const rightFore=limb(rightArm,.61,.12,.10,bare,0,-.66,0);
 ball(leftFore,.12,mat(0x1c2336),0,-.60,0);
 ball(rightFore,.12,mat(0x1c2336),0,-.60,0);
 const hips=new T.Group();hips.position.y=1.14;root.add(hips);
 ball(hips,.36,pants,0,-.05,0,1.1,.6,.73);
 const leftLeg=limb(hips,.77,.205,.16,pants,-.23,-.20,0);
 const rightLeg=limb(hips,.77,.205,.16,pants,.23,-.20,0);
 const leftShin=limb(leftLeg,.70,.165,.12,pants,0,-.77,0);
 const rightShin=limb(rightLeg,.70,.165,.12,pants,0,-.77,0);
 box(leftShin,.24,.16,.37,shoe,0,-.69,.12);
 box(rightShin,.24,.16,.37,shoe,0,-.69,.12);
 if(index===0||index===5){
  const wrap=mat(index===0?0xf2e8f2:0xf2cc9c);
  const scarf=box(torso,.18,.89,.08,wrap,.20,.00,.24);scarf.rotation.z=-.20;
  const skirt=mesh(new T.CylinderGeometry(.32,.51,.42,16),body,hips,0,-.12,0);
 }
 if(index===3){const tie=box(torso,.083,.36,.065,mat(0xdc293b),0,.13,.26);tie.rotation.z=.05;}
 if(index===2){box(torso,.37,.13,.05,mat(0x6686a0),0,.06,.26);}
 if(index===1){box(torso,.20,.08,.05,mat(0x83b9fa),0,.1,.25);}
 if(index===4){const collar=mesh(new T.CylinderGeometry(.15,.23,.25,16),mat(0xe8ede7),torso,0,.49,0);}
 const ring=mesh(new T.TorusGeometry(.62,.036,8,40),new T.MeshBasicMaterial({color:p.body,transparent:true,opacity:.36}),root,0,.055,0);ring.rotation.x=-Math.PI/2;
 return {root,torso,head,leftArm,rightArm,leftFore,rightFore,leftLeg,rightLeg,leftShin,rightShin,hips,ring,lastIndex:index};
}
function makeFace(face,bare,hair){
 let dark=mat(0x252027),white=mat(0xf6f1e3),lip=mat(0x8e5352);
 ball(face,.041,white,-.102,.033,.032,1.3,.65,.4);
 ball(face,.041,white,.102,.033,.032,1.3,.65,.4);
 ball(face,.028,dark,-.102,.033,.065,1,.9,.35);ball(face,.028,dark,.102,.033,.065,1,.9,.35);
 ball(face,.034,bare,0,-.08,.063,.7,1.3,.8);
 ball(face,.064,lip,0,-.160,.034,1,.21,.6);
}
function stage(){
 scene=new T.Scene();scene.background=new T.Color(0x0a1030);scene.fog=new T.FogExp2(0x121c45,.025);
 camera=new T.PerspectiveCamera(45,1,.1,80);camera.position.set(0,3.1,10.7);camera.lookAt(0,1.35,0);
 const ambient=new T.HemisphereLight(0x8dc7ff,0x2c1b3c,1.4);scene.add(ambient);
 let spots=[[0,8,5,0x77b7ff,110],[7,6,-4,0xf24ec3,80],[-7,6,-4,0x45bfff,80]];
 spots.forEach(a=>{let l=new T.PointLight(a[3],a[4],19);l.position.set(a[0],a[1],a[2]);scene.add(l)});
 let floor=mesh(new T.CylinderGeometry(8.2,8.2,.27,72),mat(0x151e33,.33,.35),scene,0,-.12,0);
 const grid=new T.GridHelper(16,25,0x3295ec,0x346a9e);grid.position.y=.025;scene.add(grid);
 const rim=mesh(new T.TorusGeometry(7.35,.09,12,80),new T.MeshBasicMaterial({color:0xe746b8}),scene,0,.1,0);rim.rotation.x=-Math.PI/2;
 let neon=mesh(new T.TorusGeometry(5.9,.04,8,75),new T.MeshBasicMaterial({color:0x12c9f5}),scene,0,.03,0);neon.rotation.x=-Math.PI/2;
 for(let k=0;k<18;k++){const a=k*Math.PI*2/18;
   let pillar=mesh(new T.CylinderGeometry(.05,.08,3,8),mat(0x253b63,.5,.3),scene,Math.cos(a)*7.2,1.5,Math.sin(a)*7.2);
   let light=mesh(new T.BoxGeometry(.16,.4,.16),new T.MeshBasicMaterial({color:k%2?0xfb44af:0x28beff}),scene,Math.cos(a)*7.2,2.9,Math.sin(a)*7.2);
 }
 for(let k=0;k<60;k++){let a=k*2.39996,r=7.8+(k%4)*.33,y=1+(k%5)*.45;
   ball(scene,.09,new T.MeshBasicMaterial({color:k%3===0?0xea93ff:0x63bde4}),Math.cos(a)*r,y,Math.sin(a)*r);
 }
 const canvas=document.getElementById('canvas');
 renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.15;
 clock=new T.Clock();
}
function makeFX(x,color,kind){
 const burst=new T.Group();burst.position.set(x,1.55,.15);scene.add(burst);
 const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.9});
 if(kind===3){
  const cv=document.createElement('canvas');cv.width=512;cv.height=200;
  let c=cv.getContext('2d');c.fillStyle='#ffdc51';c.fillRect(0,0,512,200);c.fillStyle='#191c31';c.font='bold 88px system-ui';c.textAlign='center';c.fillText('50% TAX',256,128);
  let tx=new T.CanvasTexture(cv);let board=mesh(new T.PlaneGeometry(2.4,.92),new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}),burst);board.rotation.y=.25;
 }else if(kind===2){mesh(new T.ConeGeometry(.37,1.6,16),mat(0xe6edff,.25,.4),burst).rotation.z=-Math.PI/2;ball(burst,.3,new T.MeshBasicMaterial({color:0xff6c19}),-.90,0,0,1.6,.75,.75);}
 else if(kind===1){for(let j=0;j<4;j++){let card=mesh(new T.BoxGeometry(.85,1.1,.05),new T.MeshBasicMaterial({color:[0x2877ef,0xee3993,0x35bf72,0x0c141b][j]}),burst,(j-1.5)*.70,0,0);card.rotation.y=j*.28;}}
 else if(kind===4){let bolt=mesh(new T.CylinderGeometry(.06,.09,2.2,7),new T.MeshBasicMaterial({color:0xffec54}),burst);bolt.rotation.z=.35;}
 else {let sphere=ball(burst,.6,material,0,0,0);sphere.scale.y=1.2;}
 for(let i=0;i<16;i++){let a=i*Math.PI*2/16;
  let p=ball(burst,.065,new T.MeshBasicMaterial({color:0xffffff}),Math.cos(a)*.4,Math.sin(a)*.6,.15);
 }
 particles.push({group:burst,life:.8});if(particles.length>20){let old=particles.shift();scene.remove(old.group);}
}
function updateRig(r,unit,now,which){
 if(!r||!unit)return;
 const bob=Math.sin(now*3.8+(which?1.2:0))*.035;
 r.root.position.x=(unit.x-.5)*9;
 r.root.position.y=Math.max(0,unit.y)*1.8+bob;
 r.root.rotation.y=unit.dir===1?Math.PI/2:-Math.PI/2;
 r.head.rotation.z=Math.sin(now*1.4)*.05;
 r.head.rotation.y=unit.dir===1?-Math.PI/2:Math.PI/2; // face camera while torso turns toward opponent
 r.torso.rotation.z=Math.sin(now*4)*.03;
 r.leftArm.rotation.x=-.2+Math.sin(now*5)*.11;
 r.rightArm.rotation.x=-.2-Math.sin(now*5)*.11;
 r.leftArm.rotation.z=-.12;r.rightArm.rotation.z=.12;
 r.leftFore.rotation.x=-1.05;r.rightFore.rotation.x=-1.05;
 r.leftLeg.rotation.x=Math.sin(now*6+(which?1:0))*.12;
 r.rightLeg.rotation.x=-r.leftLeg.rotation.x;
 r.leftShin.rotation.x=.02;r.rightShin.rotation.x=.02;
 if(unit.attack>.02){
  const duration=unit.lastMove==='power'?.85:.26;
  const phase=1-Math.min(1,unit.attack/duration);
  const action=Math.sin(Math.PI*phase);
  if(unit.lastMove==='kick'){
    r.rightLeg.rotation.x=-1.45*action;
    r.rightShin.rotation.x=.30*action;
    r.leftArm.rotation.x=-.8;
    r.rightArm.rotation.x=-.65;
    r.torso.rotation.z=-.18*action;
  }else if(unit.lastMove==='punch'){
    r.rightArm.rotation.x=-1.9*action;
    r.rightFore.rotation.x=-.12;
    r.torso.rotation.y=.35*action;
  }else{
    r.leftArm.rotation.x=-2.4*action;
    r.rightArm.rotation.x=-2.4*action;
    r.leftFore.rotation.x=-.5;
    r.rightFore.rotation.x=-.5;
    r.torso.rotation.y=Math.sin(phase*Math.PI*4)*.25;
    r.rightLeg.rotation.x=-.35*action;
  }
 }else {r.torso.rotation.y=0;r.torso.rotation.z=0;}
 if(unit.flash>.02){r.torso.scale.set(1+.06*Math.sin(now*38),1,1);}
 else r.torso.scale.set(1,1,1);
}
let previousEffect=null;
function renderFrame(){
 if(!renderer)return;
 let width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
 if(width<1||height<1)return;
 renderer.setSize(width,height,false);
 camera.aspect=width/height;camera.position.z=Math.max(8.1,11*(1.7/camera.aspect));camera.updateProjectionMatrix();
 let now=performance.now()/1000;
 updateRig(rigs[0],player,now,0);updateRig(rigs[1],enemy,now,1);
 if(typeof effect!=='undefined'&&effect&&effect.time>0&&effect!==previousEffect){
  let index=effect.kind;makeFX(((effect.from+effect.to)/2-.5)*9,[0xf46a99,0x50a6ff,0xff853d,0xffdb58,0xffd64d,0xf85c35,0xb4eaff,0x8858fa,0x70e9fd,0xa2bbfe][index]||0xffedaa,index);previousEffect=effect;
 }
 if((!effect||effect.time<=0)&&previousEffect)previousEffect=null;
 particles=particles.filter(p=>{p.life-=.016;p.group.scale.multiplyScalar(1.025);p.group.rotation.y+=.09;
  for(let m of p.group.children){if(m.material&&'opacity'in m.material)m.material.opacity=Math.max(0,p.life);}
  if(p.life<=0){scene.remove(p.group);return false}return true});
 renderer.render(scene,camera);
}
const oldStart=startFight;
startFight=function(){
 if(!verifiedOnline)return;
 if(!ready){alert('3D arena is still loading. Check your internet connection.');return;}
 oldStart();
 rigs.forEach(r=>scene.remove(r.root));particles.forEach(p=>scene.remove(p.group));particles=[];previousEffect=null;
 rigs=[createFighter(selected,-2.3),createFighter(enemyIndex,2.3)];
};
draw=function(){if(ready)renderFrame();};
try{
 stage();ready=true;window.FAX3DReady=true;
 const main=document.getElementById('menu');
 let info=document.createElement('div');info.className='hint';info.textContent='WebGL 3D Fighting Prototype • not final photo-realistic character models';main.appendChild(info);
}catch(e){console.error('3D rendering failed',e);window.FAX3DReady=false;}
})();