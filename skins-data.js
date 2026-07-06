// Shared skin catalog + model builders for Redline Rider.
// Used by skins.html (showroom), market.html (shop preview), and later the game itself.
// Style matches the in-game bike/rider: real MTB frame from painted tubes, torus
// wheels with neon rims, capsule limbs, two-tone vertical gradients baked into
// vertex colors on flat-shaded material — no textures.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const TIER={
  starter:{label:'STARTER', col:'#7de08a', hex:0x7de08a},
  common:{label:'COMMON', col:'#9a92c9', hex:0x9a92c9},
  rare:{label:'RARE', col:'#4db8ff', hex:0x4db8ff},
  epic:{label:'EPIC', col:'#b44dff', hex:0xb44dff},
  legendary:{label:'LEGENDARY', col:'#ffd76e', hex:0xffd76e},
  mythic:{label:'MYTHIC', col:'#a8ecff', hex:0xa8ecff},
};
export const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c, flatShading:true,
  roughness:o.r!==undefined?o.r:.55, metalness:o.m||0,
  emissive:o.e||0x000000, emissiveIntensity:o.ei!==undefined?o.ei:1,
  envMapIntensity:o.envI||1});

/* ---- gradient / flat-shaded builders (shared bike + rider style) ---- */
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
export const bodyMat=new THREE.MeshStandardMaterial({vertexColors:true, flatShading:true, roughness:.5, metalness:.06});
function colorGeo(geo,fn){
  const p=geo.attributes.position, cols=new Float32Array(p.count*3), c=new THREE.Color();
  for(let i=0;i<p.count;i++){ fn(p.getX(i),p.getY(i),p.getZ(i),c);
    cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(cols,3)); return geo;
}
const grad=(y0,y1,bot,top)=>{ const A=new THREE.Color(bot), B=new THREE.Color(top);
  return (x,y,z,c)=>c.lerpColors(A,B,THREE.MathUtils.clamp((y-y0)/(y1-y0),0,1)); };
const solid=col=>{ const A=new THREE.Color(col); return (x,y,z,c)=>c.copy(A); };
const darken=(hex,f)=>new THREE.Color(hex).multiplyScalar(f).getHex();
const mergeAll=arr=>mergeGeometries(arr.map(g=>g.index?g.toNonIndexed():g));
function tube(a,b,r,seg=6,cap=false){
  const d=V3(b.x-a.x,b.y-a.y,b.z-a.z), l=d.length();
  const g=cap?new THREE.CapsuleGeometry(r,l,3,seg):new THREE.CylinderGeometry(r,r,l,seg);
  g.translate(0,l/2,0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(0,1,0), d.normalize()));
  g.translate(a.x,a.y,a.z); return g;
}
function boxGeo(w,h,d,x,y,z,rx=0){ const g=new THREE.BoxGeometry(w,h,d);
  if(rx) g.rotateX(rx); g.translate(x,y,z); return g; }

/* ============================ BIKE SKINS ================================== */
export const BIKES=[
 { id:'sunset', name:'SUNSET DRIFTER', tier:'common', price:400, glow:0xff7847,
   flavor:'Chases the horizon it came from.',
   // in-game paint override: the classic launch look every player knows
   game:{bot:0x8f1560, top:0xff6a3d, rim:0x00e5ff},
   frame:{color:0xff7847, rough:.55}, accent:{color:0xff2e88, rough:.5},
   wheels:{color:0x2a1020, emissive:0xff7847, ei:1.2},
   extras(g,M){ const badge=new THREE.Mesh(new THREE.CircleGeometry(.09,12),
     mat(0xffd76e,{e:0xffd76e,ei:.8}));
     badge.position.set(.09,.62,.1); badge.rotation.y=Math.PI/2; g.add(badge); } },
 { id:'night', name:'NIGHT RIDER', tier:'common', price:400, glow:0x7a3cff,
   flavor:'You will hear it. Barely.',
   frame:{color:0x14101f, rough:.35}, accent:{color:0x241b3f, rough:.4},
   wheels:{color:0x0d0716, emissive:0x7a3cff, ei:1.0} },
 { id:'frost', name:'FROSTBITE', tier:'rare', price:1200, glow:0x9feaff,
   flavor:'Cold never bothered these wheels.',
   frame:{color:0xdcedf7, rough:.15, metal:.5}, accent:{color:0x9fd8ef, rough:.2, metal:.4},
   wheels:{color:0x0a2233, emissive:0x9feaff, ei:1.4},
   extras(g,M){ for(let i=0;i<3;i++){ const ice=new THREE.Mesh(new THREE.ConeGeometry(.05,.16,5),M.accent);
     ice.position.set(0,.52,-.3+i*.3); ice.rotation.x=Math.PI; g.add(ice);} } },
 { id:'toxic', name:'TOXIC', tier:'rare', price:1200, glow:0x62ff2e,
   flavor:'Do not lick the frame.',
   frame:{color:0x1a2e14, rough:.5}, accent:{color:0x39f761, rough:.4, emissive:0x39f761, ei:.5},
   wheels:{color:0x0c1a08, emissive:0x62ff2e, ei:1.5},
   extras(g,M){ for(const s of [-1,1]){ const can=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.22,7),M.accent);
     can.position.set(s*.11,.78,-.28); g.add(can);} } },
 { id:'sakura', name:'SAKURA', tier:'rare', price:1500, glow:0xff9dc4,
   flavor:'Blooms at full speed.',
   frame:{color:0xffd7e8, rough:.35}, accent:{color:0xff6ea8, rough:.4},
   wheels:{color:0x2e0d1c, emissive:0xff9dc4, ei:1.3},
   extras(g,M){ const c=new THREE.Group();
     for(let i=0;i<5;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),M.accent);
       const a=i/5*Math.PI*2; p.position.set(Math.cos(a)*.07,Math.sin(a)*.07,0); c.add(p); }
     c.position.set(0,1.2,.68); g.add(c); } },
 { id:'voltage', name:'VOLTAGE', tier:'epic', price:3500, glow:0x2e9fff,
   flavor:'Grounded? Never.',
   frame:{color:0x0f1e3c, rough:.3, metal:.3}, accent:{color:0xffe94d, emissive:0xffe94d, ei:1.1, rough:.3},
   wheels:{color:0x0a1430, emissive:0x2e9fff, ei:1.6},
   extras(g,M){ const seg=(x,y,z,ry)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(.03,.05,.22),M.accent);
     b.position.set(x,y,z); b.rotation.y=ry; g.add(b); };
     seg(.1,.72,.25,.6); seg(.1,.66,.05,-.6); seg(.1,.6,-.15,.6); } },
 { id:'inferno', name:'INFERNO', tier:'epic', price:4000, glow:0xff4a1f,
   flavor:'Brakes sold separately. And flammable.',
   frame:{color:0x1c0d0d, rough:.4}, accent:{color:0xff5a1f, emissive:0xff5a1f, ei:1.2, rough:.4},
   wheels:{color:0x2a0d05, emissive:0xff7847, ei:1.7},
   extras(g,M){ for(let i=0;i<3;i++){ const fin=new THREE.Mesh(new THREE.TetrahedronGeometry(.09+i*.03),M.accent);
     fin.position.set(0,1.06+i*.02,-.05-i*.24); g.add(fin);} } },
 { id:'silver', name:'STERLING', tier:'legendary', price:9000, glow:0xf4f6ff,
   flavor:'Polished by professionals. Feared by amateurs.',
   frame:{color:0xf4f6ff, rough:.12, metal:.85, envI:1.7, emissive:0xdfe4f0, ei:.14},
   accent:{color:0xd7dcea, rough:.15, metal:.85, envI:1.6},
   wheels:{color:0xf4f6ff, metal:.7, rough:.15, emissive:0xffffff, ei:.75}, discWheels:true },
 { id:'gold', name:'MIDAS', tier:'legendary', price:18000, glow:0xffd76e,
   flavor:'Everything it touches turns to first place.',
   frame:{color:0xffd76e, rough:.22, metal:.9, envI:1.5, emissive:0xffb52e, ei:.15},
   accent:{color:0xffb52e, rough:.25, metal:.9, envI:1.4},
   wheels:{color:0x3c2a05, metal:.8, rough:.3, emissive:0xffd76e, ei:1.2},
   extras(g,M){ for(let i=0;i<3;i++){ const spike=new THREE.Mesh(new THREE.ConeGeometry(.035,.11,4),M.frame);
     spike.position.set(-.07+i*.07,1.24,.68); g.add(spike);} } },
 { id:'diamond', name:'DIAMONDBACK', tier:'mythic', price:40000, glow:0xa8ecff, physical:true,
   flavor:'Forty thousand reasons to stare.',
   frame:{color:0xeaf6ff, rough:.05, metal:.8, envI:2.1, emissive:0xbfe8ff, ei:.22},
   accent:{color:0xcfeaff, rough:.08, metal:.8, envI:2},
   wheels:{color:0xeaf6ff, metal:.6, rough:.08, emissive:0xa8ecff, ei:.8}, discWheels:true,
   extras(g,M){ const gemMat=new THREE.MeshPhysicalMaterial({color:0xdff2ff, metalness:.9, roughness:.02,
       iridescence:1, iridescenceIOR:1.8, emissive:0x8fd8ff, emissiveIntensity:.35, flatShading:true});
     const at=(x,y,z,s)=>{ const gem=new THREE.Mesh(new THREE.OctahedronGeometry(s),gemMat);
       gem.position.set(x,y,z); gem.rotation.y=.5; g.add(gem); };
     at(0,1.14,-.05,.09); at(0,.7,.28,.07); at(0,.66,-.28,.07); at(0,1.26,.68,.06); } },

 { id:'tidebreaker', name:'TIDEBREAKER', tier:'common', price:500, glow:0x2ee6ff,
   flavor:'Rides the break, never the wake.',
   frame:{color:0x0a5a7a, rough:.5}, accent:{color:0x2ee6ff, rough:.4},
   wheels:{color:0x06202e, emissive:0x2ee6ff, ei:1.3},
   extras(g,M){ for(let i=0;i<3;i++){ const w=new THREE.Mesh(new THREE.ConeGeometry(.06,.18,4),
     mat(0x2ee6ff,{e:0x2ee6ff,ei:.7})); w.position.set(0,.72+i*.02,-.08-i*.26); w.rotation.z=.5; g.add(w);} } },

 { id:'gridrunner', name:'GRIDRUNNER', tier:'rare', price:1400, glow:0x00e5ff,
   flavor:'Straight lines. Neon dreams.',
   frame:{color:0x1a1040, rough:.35, metal:.2}, accent:{color:0xff2ecb, rough:.4},
   wheels:{color:0x0a0620, emissive:0x00e5ff, ei:1.5},
   extras(g,M){ const line=(x,y,z,len,rz,c)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(.018,len,.018),
     mat(c,{e:c,ei:1.3})); b.position.set(x,y,z); b.rotation.z=rz; g.add(b); };
     line(0,.66,.26,.8,-.7,0x00e5ff); line(0,.9,-.02,.5,.7,0xff2ecb); line(0,.6,-.2,.5,-.6,0x00e5ff); } },

 { id:'obsidian', name:'OBSIDIAN', tier:'epic', price:4200, glow:0xff5a2a,
   flavor:'Cooled lava. Still dangerous.',
   frame:{color:0x0c0c12, rough:.22, metal:.4}, accent:{color:0x5a1a0a, rough:.3, emissive:0xff5a2a, ei:.4},
   wheels:{color:0x1a0806, emissive:0xff5a2a, ei:1.4},
   extras(g,M){ for(let i=0;i<4;i++){ const s=new THREE.Mesh(new THREE.TetrahedronGeometry(.07+(i%2)*.02),
     mat(0xff5a2a,{e:0xff5a2a,ei:1})); s.position.set(0,.66+i*.02,.24-i*.28); s.rotation.set(.5,i,.3); g.add(s);} } },

 { id:'aurora', name:'AURORA', tier:'legendary', price:11000, glow:0x4dffa8, physical:true,
   flavor:'Borrowed from the night sky.',
   frame:{color:0x123a2e, rough:.15, metal:.7, envI:1.6, emissive:0x184436, ei:.2},
   accent:{color:0x7a4dff, rough:.2, metal:.6, envI:1.5},
   wheels:{color:0x0a2018, metal:.6, rough:.2, emissive:0x4dffa8, ei:1.0}, discWheels:true,
   extras(g,M){ const band=(c,x,rz)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(.02,.7,.05),
     mat(c,{e:c,ei:.9})); b.position.set(x,.86,0); b.rotation.z=rz; g.add(b); };
     band(0x4dffa8,-.02,-.5); band(0x7a4dff,.02,-.42); } },

 { id:'phantom', name:'PHANTOM', tier:'legendary', price:15000, glow:0xc9b3ff,
   flavor:'You will swear it was never there.',
   frame:{color:0x2a2440, rough:.2, metal:.5, envI:1.4, emissive:0x1a1630, ei:.15},
   accent:{color:0xc9b3ff, rough:.25, metal:.4}, discWheels:true,
   wheels:{color:0x14101f, metal:.5, rough:.2, emissive:0xc9b3ff, ei:1.2},
   extras(g,M){ for(let i=0;i<4;i++){ const w=new THREE.Mesh(new THREE.SphereGeometry(.03+(i%2)*.015,6,5),
     mat(0xc9b3ff,{e:0xc9b3ff,ei:1})); w.position.set(i%2?.06:-.06,.7+i*.1,-.1+i*.05); g.add(w);} } },
];
export function buildBike(skin){
  const g=new THREE.Group();
  const physical=skin.physical, f=skin.frame;
  const C=physical?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
  const frameMat=new C({vertexColors:true, flatShading:true,
    roughness:f.rough??.45, metalness:f.metal??.12, envMapIntensity:f.envI??1,
    emissive:new THREE.Color(f.emissive??0), emissiveIntensity:f.ei??1});
  if(physical){ frameMat.iridescence=.6; frameMat.iridescenceIOR=1.5; }
  const darkMat=mat(0x14101f,{r:.6});
  const rimMat=new THREE.MeshStandardMaterial({color:0x061a1c,
    emissive:new THREE.Color(skin.glow), emissiveIntensity:2.2, flatShading:true});
  const paint=grad(0.35,1.25, skin.frame.color, skin.accent.color);   // two-tone vertical
  // real MTB frame from painted tubes (matches the in-game silhouette)
  const BB=V3(0,.46,-.08), ST=V3(0,1.0,-.44), HT=V3(0,1.08,.5);
  g.add(new THREE.Mesh(mergeAll([
    tube(BB,V3(0,.86,.6),.048), tube(ST,HT,.036), tube(BB,ST,.042),
    tube(V3(0,.8,.58),V3(0,1.16,.52),.052), tube(HT,V3(0,1.14,.64),.032),
    tube(V3(-.3,1.14,.68),V3(.3,1.14,.68),.03,7), tube(V3(0,1.0,-.44),V3(0,1.12,-.5),.03),
    tube(V3(-.07,.84,.62),V3(-.07,.48,.78),.032), tube(V3(.07,.84,.62),V3(.07,.48,.78),.032),
    tube(V3(-.06,.44,-.1),V3(-.06,.48,-.82),.026), tube(V3(.06,.44,-.1),V3(.06,.48,-.82),.026),
    tube(V3(-.05,.98,-.46),V3(-.06,.5,-.8),.024), tube(V3(.05,.98,-.46),V3(.06,.5,-.8),.024),
  ].map(gg=>colorGeo(gg,paint))), frameMat));
  // dark hardware: saddle, grips, cranks, pedals, number plate
  const saddle=new THREE.SphereGeometry(.1,8,6); saddle.scale(1.15,.5,2.3); saddle.translate(0,1.16,-.5);
  g.add(new THREE.Mesh(mergeAll([ saddle,
    tube(V3(-.38,1.14,.68),V3(-.28,1.14,.68),.042), tube(V3(.28,1.14,.68),V3(.38,1.14,.68),.042),
    tube(V3(-.15,.46,-.08),V3(.15,.46,-.08),.028),
    boxGeo(.09,.03,.2,-.16,.46,-.06), boxGeo(.09,.03,.2,.16,.46,-.06),
    boxGeo(.2,.15,.03,0,1.06,.76,-.15),
  ]), darkMat));
  // wheels: dark tire + spokes (or disc), neon rim ring
  const tireGeo=new THREE.TorusGeometry(.4,.085,5,14);
  for(const z of [.82,-.82]){
    const tire=tireGeo.clone(); tire.rotateY(Math.PI/2);
    const hub=new THREE.CylinderGeometry(.05,.05,.12,6); hub.rotateZ(Math.PI/2);
    const parts=[tire,hub];
    if(skin.discWheels){ const disc=new THREE.CylinderGeometry(.34,.34,.035,16); disc.rotateZ(Math.PI/2); parts.push(disc); }
    else for(let i=0;i<5;i++){ const s=new THREE.BoxGeometry(.02,.72,.03); s.rotateX(i/5*Math.PI); parts.push(s); }
    const wm=new THREE.Mesh(mergeAll(parts), darkMat); wm.position.set(0,.48,z); g.add(wm);
    const rimg=new THREE.TorusGeometry(.35,.03,4,12); rimg.rotateY(Math.PI/2);
    const rm=new THREE.Mesh(rimg, rimMat); rm.position.set(0,.48,z); g.add(rm);
  }
  // extras get solid theme materials (their small geoms carry no vertex colors)
  const A=skin.accent;
  const M={ frame:mat(skin.frame.color,{r:f.rough??.4, m:f.metal||0, envI:f.envI||1}),
            accent:mat(A.color,{r:A.rough??.4, e:A.emissive||0, ei:A.ei||1}),
            wheel:darkMat };
  if(skin.extras) skin.extras(g,M);
  return g;
}

/* ============================ RIDER BUILDER =============================== */
export function riderRig(g, o){
  // o: skin, top, pants, shoes, eyes, shirt?, legTop?, legBot?, headScale?, bulk?, crop?, topMat?
  const bulk=o.bulk||1, hs=o.headScale||1;
  const skinTone=o.skin, topCol=o.top, shoeCol=o.shoes;
  const legGrad=grad(0.05,.9, darken(o.legTop||o.pants,.6), o.legBot||o.pants);
  const armGrad=grad(1.0,1.55, darken(topCol,.6), topCol);
  const box=(w,h,d,x,y,z,m,rx=0,ry=0,rz=0)=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    b.position.set(x,y,z); b.rotation.set(rx,ry,rz); g.add(b); return b; };
  // body = capsule limbs + shoes + hands + neck + head, all vertex-colored into one mesh
  const parts=[];
  for(const s of [-1,1]){
    parts.push(colorGeo(tube(V3(s*.13,.9,0), V3(s*.13,.1,.03), .11*bulk,6,true), legGrad));   // leg
    parts.push(colorGeo(boxGeo(.17,.1,.32, s*.13,.06,.06), solid(shoeCol)));                  // shoe
    parts.push(colorGeo(tube(V3(s*.3*bulk,1.54,0), V3(s*.34,1.02,.06), .075*bulk,6,true), armGrad)); // arm
    parts.push(colorGeo(new THREE.IcosahedronGeometry(.075,0).translate(s*.34,1.0,.07), solid(skinTone))); // hand
  }
  const headY=1.86+(hs-1)*.12;
  parts.push(colorGeo(tube(V3(0,1.48,0),V3(0,1.7,.02),.09), solid(skinTone)));                // neck
  parts.push(colorGeo(new THREE.IcosahedronGeometry(.23*hs,0).translate(0,headY,0), solid(skinTone))); // head
  g.add(new THREE.Mesh(mergeAll(parts), bodyMat));
  // torso — its own mesh so it can take a special material (e.g. Mendo's pearlescent jacket)
  const torsoGeo=new THREE.CapsuleGeometry(.2*bulk,.46,4,8); torsoGeo.scale(1.1,1,.74); torsoGeo.translate(0,1.3,0);
  if(o.topMat){ g.add(new THREE.Mesh(torsoGeo,o.topMat)); }
  else {
    const tTop=new THREE.Color(topCol), tBot=new THREE.Color(darken(topCol,.72)), tSkin=new THREE.Color(skinTone);
    colorGeo(torsoGeo,(x,y,z,c)=>{
      if(o.crop && y<1.24){ c.copy(tSkin); return; }                 // bare midriff
      if(y>1.52){ c.copy(tTop); return; }                            // shoulders (brighter)
      c.lerpColors(tBot,tTop,THREE.MathUtils.clamp((y-1.0)/.55,0,1));
    });
    g.add(new THREE.Mesh(torsoGeo, bodyMat));
  }
  if(o.shirt){ const sh=box(.18,.5,.06, 0,1.3,.17*bulk, mat(o.shirt)); }
  for(const s of [-1,1]) box(.055*hs,.06*hs,.02, s*.08*hs, headY+.02, .2*hs, mat(0x111111,{e:o.eyes,ei:1.4}));
  return { box, headY, hs,
    hairCap(color,scale=1){ const h=new THREE.Mesh(new THREE.IcosahedronGeometry(.25*hs*scale,0),mat(color,{r:.7}));
      h.scale.y=.78; h.position.set(0,headY+.1,-.02); g.add(h); return h; },
    hairBack(color,len=.5,w=.34){ return box(w,len,.1, 0,headY-len/2+.12,-.2*hs, mat(color,{r:.7})); },
    hat(color,r=.26){ const b=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.9,.09,10),mat(color,{r:.6}));
      b.position.set(0,headY+.22,0); b.rotation.z=.12; g.add(b); return b; },
    skirt(color,r=.44){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.26,r,.34,10),mat(color,{r:.6}));
      s.position.set(0,.92,0); g.add(s); return s; },
  };
}

export const RIDERS=[
 { id:'rookie', name:'ROOKIE', tier:'starter', price:0, glow:0x00e5ff,
   flavor:'Where every legend starts.',
   build(g){ const R=riderRig(g,{skin:0x1c1c26, top:0x14141e, pants:0x111119, shoes:0x0b0b10,
     eyes:0x00e5ff});
     R.hairCap(0x0f0f16,1.0);
     R.box(.12,.3,.04, 0,1.34,.155, mat(0x062930,{e:0x00e5ff,ei:1.0})); } },  // neon chest stripe

 { id:'berna', name:'BERNA', tier:'legendary', price:8000, glow:0x35d6ff,
   flavor:'Eyes bigger than the mountain.',
   build(g){ const R=riderRig(g,{skin:0xead0b2, top:0x6b6f52, pants:0x3a3d4a, shoes:0x23262e,
     eyes:0x35d6ff, shirt:0x8a8f9c, headScale:1.25});
     R.hairCap(0x5a3d28,1.05);
     for(let i=0;i<4;i++){ const t=new THREE.Mesh(new THREE.ConeGeometry(.06,.14,4),mat(0x5a3d28,{r:.7}));
       t.position.set(-.12+i*.08,R.headY+.3,.02+((i%2)*.06)); t.rotation.z=(i-1.5)*.3; g.add(t); }
     R.box(.56,.2,.12, 0,1.62,-.18, mat(0x23262e,{r:.6})); } },

 { id:'cherry', name:'CHERRY', tier:'epic', price:3000, glow:0xff2e56,
   flavor:'Sweet. Fast. Slightly dangerous.',
   build(g){ const R=riderRig(g,{skin:0xe8b88a, top:0x1b1b22, pants:0xe8b88a, shoes:0xf2f2f2,
     eyes:0x3a2620, crop:true, legTop:0xe8b88a, legBot:0x1b1b22});
     R.hairCap(0x15121a,1.02); R.hairBack(0x15121a,.35);
     R.skirt(0xc2233a,.42);
     const braids=[];
     for(const s of [-1,1]){
       const br=R.box(.09,.85,.09, s*.2,R.headY-.42,.12, mat(0x15121a,{r:.75}),0,0,s*.06);
       braids.push(br);
       const tip=new THREE.Mesh(new THREE.ConeGeometry(.05,.12,5),mat(0x15121a,{r:.75}));
       tip.position.set(s*.24,R.headY-.9,.14); tip.rotation.x=Math.PI; g.add(tip);
       R.box(.07,.05,.05, s*.2,R.headY-.02,.13, mat(0xc2233a));
     }
     for(const s of [-1,1]) R.box(.18,.07,.33, s*.12,.1,.06, mat(0x111111));
     return t=>{ braids.forEach((b,i)=>{ b.rotation.x=Math.sin(t*1.8+i*2)*.12; }); };
   } },

 { id:'princess', name:'PRINCESS', tier:'epic', price:3000, glow:0xff9dc4,
   flavor:'Royalty takes no shortcuts.',
   build(g){ const R=riderRig(g,{skin:0xb5773f, top:0xf7c6d8, pants:0x1c2440, shoes:0x1c1a18,
     eyes:0x3a2620, legTop:0xb5773f, legBot:0x1c2440});
     R.hairCap(0x14121c,1.03); R.hairBack(0x14121c,.95,.4);
     R.skirt(0x1c2440,.4);
     R.box(.16,.05,.05, 0,1.62,.17, mat(0xffffff));
     R.box(.12,.08,.05, 0,1.55,.18, mat(0xc22336));
   } },

 { id:'begone', name:'BEGONE', tier:'rare', price:1500, glow:0x7db8ff,
   flavor:'Says it once. Means it.',
   build(g){ const R=riderRig(g,{skin:0x6e4a2f, top:0x9c1f2e, pants:0x1e1e24, shoes:0x16130f,
     eyes:0x5d766d, shirt:0xf2f2f2});
     R.hairCap(0x8db8ee,1.08);
     const loop=new THREE.Mesh(new THREE.TorusGeometry(.09,.03,6,10),mat(0x8db8ee,{r:.7}));
     loop.position.set(.02,R.headY+.32,0); g.add(loop);
     for(const s of [-1,1]){ const ear=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,4),mat(0x6e4a2f));
       ear.position.set(s*.25,R.headY+.03,0); ear.rotation.z=s*-1.5; g.add(ear); }
     R.box(.07,.34,.04, 0,1.4,.19, mat(0x17150e));
     R.box(.07,.05,.045, 0,1.42,.192, mat(0xd8b13a));
     R.box(.54,.03,.31, 0,1.05,0, mat(0xf2f2f2));
   } },

 { id:'titan', name:'TITAN', tier:'rare', price:1500, glow:0x5ce8d8,
   flavor:'Something colossal behind those eyes.',
   build(g){ const R=riderRig(g,{skin:0xd9a878, top:0x9a7448, pants:0x4c4a3a, shoes:0x2e2018,
     eyes:0x5ce8d8, shirt:0xe8dcc2});
     R.hairCap(0x2e2118,1.05);
     for(let i=0;i<5;i++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.05,.2,4),mat(0x2e2118,{r:.75}));
       s.position.set(-.16+i*.08,R.headY+.26,-.02+((i%2)*.08));
       s.rotation.set((Math.random()-.5)*.9,0,(i-2)*.35); g.add(s); }
     for(const s of [-1,1]) R.box(.2,.16,.36, s*.12,.1,.05, mat(0x0c0b0e,{r:.4}));
   } },

 { id:'bella', name:'BELLA', tier:'epic', price:3000, glow:0xffc76e,
   flavor:'Paris was too slow for her.',
   build(g){ const R=riderRig(g,{skin:0xf2cba8, top:0xb3a48c, pants:0xf2ede6, shoes:0xf2ede6,
     eyes:0xd8a03c, legTop:0xf2cba8, legBot:0xf2ede6});
     R.hairCap(0xc25b45,1.02); R.hairBack(0xc25b45,.45);
     R.hat(0xf2ede6,.27);
     R.skirt(0xb3a48c,.42);
     for(const s of [-1,1]) R.box(.2,.4,.2, s*.34,1.35,0, mat(0xf6f3ec,{r:.5}));
     for(const s of [-1,1]) R.box(.2,.26,.2, s*.12,.2,.02, mat(0xf6f3ec,{r:.7}));
     R.box(.1,.06,.04, 0,1.6,.17, mat(0x8a7a5c));
   } },

 { id:'stephyberry', name:'STEPHYBERRY', tier:'legendary', price:8000, glow:0xffb3c8,
   flavor:'Crowned in strawberries and frost.',
   build(g){ const R=riderRig(g,{skin:0xf6d7c2, top:0x1d1a20, pants:0xf2e2d8, shoes:0xffffff,
     eyes:0x8fa3c8, legTop:0xf6d7c2, legBot:0xffffff});
     R.hairCap(0xf3e2e4,1.05); R.hairBack(0xf3e2e4,1.0,.42);
     R.skirt(0xf2e2d8,.4);
     for(let i=0;i<3;i++){ const c=new THREE.Mesh(new THREE.ConeGeometry(.035,.09,4),
       mat(0xffd76e,{m:.8,r:.25,envI:1.4}));
       c.position.set(-.06+i*.06,R.headY+.3,.06); g.add(c); }
     for(const s of [-1,1]) R.box(.05,.04,.02, s*.14,R.headY-.06,.2, mat(0xff9db4,{e:0xff9db4,ei:.4}));
   } },

 { id:'dave', name:'DAVE', tier:'epic', price:4000, glow:0xf2f2f2,
   flavor:'The suit stays clean. Always.',
   build(g){ const R=riderRig(g,{skin:0x7a4a2c, top:0x1d2a4a, pants:0x1d2a4a, shoes:0x0d0d0f,
     eyes:0x2a2018, shirt:0xf2f2f2});
     const afro=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,0),mat(0x0f0d0d,{r:.85}));
     afro.position.set(0,R.headY+.16,-.02); g.add(afro);
     R.box(.07,.36,.04, 0,1.4,.19, mat(0x10141c));
     R.box(.04,.03,.045, 0,1.38,.2, mat(0xffd76e,{m:.8,r:.3,envI:1.4}));
     R.box(.1,.05,.04, .17,1.5,.17, mat(0xf2f2f2));
   } },

 { id:'dylan', name:'DYLAN', tier:'epic', price:4000, glow:0x2e9fff,
   flavor:'Signal encrypted. Speed is not.',
   build(g){ const R=riderRig(g,{skin:0x6e4426, top:0x17171c, pants:0x121215, shoes:0x0c0c0f,
     eyes:0x111111, shirt:0x1f1f24});
     R.hairCap(0x121010,.92);
     R.box(.3,.07,.05, 0,R.headY+.03,.2, mat(0x0a0a0a,{r:.15}));
     const chain=new THREE.Mesh(new THREE.TorusGeometry(.13,.02,6,14),mat(0xd7dcea,{m:.9,r:.2,envI:1.5}));
     chain.position.set(0,1.62,.1); chain.rotation.x=1.2; g.add(chain);
     R.box(.06,.04,.08, .37,1.0,.02, mat(0x111111,{e:0x2e9fff,ei:1.5}));
   } },

 { id:'ik', name:'IK', tier:'epic', price:4500, glow:0xd8a03c,
   flavor:'He walked here from a saga.',
   build(g){ const R=riderRig(g,{skin:0xe0b58c, top:0x6e6a5e, pants:0xa89878, shoes:0x4a3524,
     eyes:0x4a5a68});
     R.hairCap(0xd8b96e,.95);
     R.box(.14,.09,.06, 0,R.headY-.13,.19, mat(0xd8b96e,{r:.8}));
     R.box(.5,.06,.32, 0,1.06,0, mat(0x4a3524));
     R.box(.52,.04,.3, 0,1.63,0, mat(0xb89a52));
     const cape=[];
     for(let i=0;i<3;i++){ cape.push(R.box(.16,.85-.15*i,.05, -.2+i*.2,1.15-(0.85-.15*i)/2+.35,-.22,
       mat(0x4a3a2a,{r:.85}), .1)); }
     for(const s of [-1,1]) R.box(.18,.3,.2, s*.12,.2,.03, mat(0x4a3524,{r:.7}));
     return t=>{ cape.forEach((c,i)=>{ c.rotation.x=.1+Math.sin(t*2.2+i*.8)*.08; }); };
   } },

 { id:'ronin', name:'RONIN', tier:'legendary', price:15000, glow:0xff2e6e,
   flavor:'One blade. No master.',
   build(g){ const R=riderRig(g,{skin:0xd9a878, top:0xc4356e, pants:0x1a1a20, shoes:0x111114,
     eyes:0xdd2233, shirt:0x17151b});
     R.hairCap(0x17141c,1.02);
     for(let i=0;i<5;i++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.05,.22,4),mat(0x17141c,{r:.75}));
       s.position.set(-.16+i*.08,R.headY+.27,0); s.rotation.z=(i-2)*.4; g.add(s); }
     const kat=new THREE.Group();
     const blade=new THREE.Mesh(new THREE.BoxGeometry(.05,1.15,.05),mat(0x1c1c22,{r:.4}));
     blade.position.y=.3; kat.add(blade);
     const hilt=new THREE.Mesh(new THREE.BoxGeometry(.06,.26,.06),mat(0x8a6a2a,{r:.5}));
     hilt.position.y=.98; kat.add(hilt);
     const guard=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.03,8),mat(0xd8b13a,{m:.7,r:.3}));
     guard.position.y=.84; kat.add(guard);
     kat.position.set(.12,1.3,-.22); kat.rotation.z=.5; g.add(kat);
     const pend=new THREE.Mesh(new THREE.OctahedronGeometry(.05),mat(0xdd2233,{e:0xdd2233,ei:.8}));
     pend.position.set(0,1.5,.18); g.add(pend);
   } },

 { id:'raiden', name:'RAIDEN', tier:'epic', price:5000, glow:0xb44dff,
   flavor:'Two swords, zero patience.',
   build(g){ const R=riderRig(g,{skin:0xc98d5e, top:0x6a3fae, pants:0x3a2a5e, shoes:0x241a3e,
     eyes:0xff5d8f, headScale:1.2});
     R.hairCap(0xcfc4bc,1.03);
     R.hat(0x5a3399,.3);
     for(const s of [-1,1]){
       const sw=new THREE.Group();
       const blade=new THREE.Mesh(new THREE.BoxGeometry(.05,.95,.05),mat(0xd7dcea,{m:.8,r:.25,envI:1.4}));
       blade.position.y=.2; sw.add(blade);
       const hilt=new THREE.Mesh(new THREE.BoxGeometry(.06,.2,.06),mat(0x5a3020,{r:.6}));
       hilt.position.y=.78; sw.add(hilt);
       const gd=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,.05),mat(0xd7dcea,{m:.7,r:.3}));
       gd.position.y=.66; sw.add(gd);
       sw.position.set(s*.14,1.28,-.24); sw.rotation.z=s*.55; g.add(sw);
     }
     R.box(.56,.2,.14, 0,1.6,-.16, mat(0x5a3399,{r:.7}));
   } },

 { id:'spike', name:'SPIKE', tier:'legendary', price:10000, glow:0xff2222,
   flavor:'Armor first. Questions later.',
   build(g){ const R=riderRig(g,{skin:0xd9a878, top:0x1b1b20, pants:0x17171c, shoes:0x101014,
     eyes:0x3a2620, bulk:1.45});
     R.hairCap(0x14121a,1.0);
     for(let i=0;i<4;i++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.05,.18,4),mat(0x14121a,{r:.75}));
       s.position.set(-.12+i*.08,R.headY+.27,0); s.rotation.z=(i-1.5)*.3; g.add(s); }
     for(const s of [-1,1]){
       const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.19,0),mat(0x232329,{r:.35,m:.4}));
       p.position.set(s*.5,1.62,0); g.add(p);
       const dot=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),mat(0x330000,{e:0xff2222,ei:1.6}));
       dot.position.set(s*.56,1.62,.1); g.add(dot);
     }
     const core=new THREE.Mesh(new THREE.CircleGeometry(.09,8),mat(0x330000,{e:0xff2222,ei:1.8}));
     core.position.set(0,1.42,.225); g.add(core);
     R.box(.76,.06,.44, 0,1.06,0, mat(0x232329,{r:.4}));
     return t=>{ core.material.emissiveIntensity=1.4+Math.sin(t*3.2)*.7; };
   } },

 { id:'himars', name:'HIMARS', tier:'legendary', price:12000, glow:0x3b6fd4,
   flavor:'Trained for orbit. Settled for downhill.',
   build(g){ const R=riderRig(g,{skin:0xffffff, top:0x16161c, pants:0x16161c, shoes:0xe8901a,
     eyes:0x111111, headScale:1.5});
     const backHead=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,0),mat(0x3b6fd4,{r:.6}));
     backHead.position.set(0,R.headY+.05,-.12); g.add(backHead);
     const crest=new THREE.Mesh(new THREE.ConeGeometry(.09,.3,5),mat(0x3b6fd4,{r:.6}));
     crest.position.set(0,R.headY+.45,-.02); crest.rotation.z=-.35; g.add(crest);
     const beak=new THREE.Mesh(new THREE.ConeGeometry(.07,.16,6),mat(0xe8901a,{r:.5}));
     beak.position.set(0,R.headY-.06,.36); beak.rotation.x=1.35; g.add(beak);
     const zip=new THREE.Mesh(new THREE.BoxGeometry(.04,.5,.02),mat(0xd8b13a,{m:.7,r:.3}));
     zip.position.set(0,1.32,.16); g.add(zip);
     const nasa=new THREE.Mesh(new THREE.CircleGeometry(.08,10),mat(0x1a3a8a,{e:0x2e5fd4,ei:.5}));
     nasa.position.set(.15,1.4,.165); g.add(nasa);
     const apollo=new THREE.Mesh(new THREE.CircleGeometry(.07,10),mat(0xf2f2f2));
     apollo.position.set(-.15,1.4,.165); g.add(apollo);
     return t=>{ g.rotation.z=Math.sin(t*3.1)*.07; };
   } },

 { id:'mendo', name:'MENDO', tier:'mythic', price:25000, glow:0x9d4dff,
   flavor:'The one who built the mountain.',
   build(g){
     const jacket=new THREE.MeshPhysicalMaterial({color:0xf6f2ff, roughness:.22, metalness:.1,
       clearcoat:1, clearcoatRoughness:.15, iridescence:.55, iridescenceIOR:1.4,
       envMapIntensity:1.6, flatShading:true});
     const R=riderRig(g,{skin:0x5e3a22, top:0xf2eef8, topMat:jacket, pants:0x8a5fd4, shoes:0xf2eef8,
       eyes:0x2a2018, shirt:0xe8dcc2});
     R.hairCap(0x181410,.95);
     R.box(.34,.09,.06, 0,R.headY+.15,.19, mat(0xf2eef8,{r:.3}));
     const lens=R.box(.3,.06,.05, 0,R.headY+.15,.215, mat(0x8a5fd4,{e:0x8a5fd4,ei:.5}));
     for(const s of [-1,1]){ const ear=new THREE.Mesh(new THREE.SphereGeometry(.03,6,5),
       mat(0xffd76e,{m:.8,r:.25,envI:1.4})); ear.position.set(s*.22,R.headY-.04,.04); g.add(ear); }
     R.box(.2,.12,.06, 0,1.66,.14, mat(0xe8dcc2,{r:.7}));
     R.box(.12,.1,.04, .28,1.45,.16, mat(0xffffff));
     R.box(.5,.05,.32, 0,1.06,0, mat(0x6a4aa8,{e:0x9d4dff,ei:.35,r:.5}));
     const chain=new THREE.Mesh(new THREE.TorusGeometry(.12,.018,6,14),
       mat(0xffd76e,{m:.85,r:.25,envI:1.5}));
     chain.position.set(0,1.6,.12); chain.rotation.x=1.25; g.add(chain);
     const orb=new THREE.Group(); orb.position.y=1.35; g.add(orb);
     const gems=[];
     for(let i=0;i<3;i++){ const gm=new THREE.Mesh(new THREE.OctahedronGeometry(.05),
       mat(0x2a1050,{e:0x9d4dff,ei:1.4}));
       const a=i/3*Math.PI*2; gm.position.set(Math.cos(a)*.55,0,Math.sin(a)*.55);
       orb.add(gm); gems.push(gm); }
     const beam=new THREE.Mesh(new THREE.ConeGeometry(.85,3.2,12,1,true),
       new THREE.MeshBasicMaterial({color:0x9d4dff, transparent:true, opacity:.07,
         blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false}));
     beam.position.y=2.2; g.add(beam);
     return t=>{
       orb.rotation.y=t*.8;
       gems.forEach((gm,i)=>{ gm.position.y=Math.sin(t*2+i*2.1)*.16; gm.rotation.y=t*2; });
       lens.material.emissiveIntensity=.5+Math.sin(t*2.4)*.35;
     };
   } },

 { id:'miji', name:'MIJI', tier:'epic', price:5000, glow:0xff2a2a,
   flavor:'The storm wears a hood.',
   build(g){ const R=riderRig(g,{skin:0x3a2a24, top:0x121016, pants:0x0e0d12, shoes:0x0a0a0e,
     eyes:0xff2a2a});
     R.hairCap(0x141018,1.0);
     for(let i=0;i<4;i++){ const s=new THREE.Mesh(new THREE.ConeGeometry(.05,.16,4),mat(0x141018,{r:.8}));
       s.position.set(-.12+i*.08,R.headY+.24,.02); s.rotation.z=(i-1.5)*.35; g.add(s); }
     const hood=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),mat(0x121016,{r:.85}));
     hood.scale.set(1,1.12,1); hood.position.set(0,R.headY+.06,-.08); g.add(hood);       // hood over head
     R.box(.5,.28,.34, 0,1.58,-.04, mat(0x121016,{r:.85}));                               // hood cowl on shoulders
     R.box(.24,.14,.06, 0,R.headY-.12,.19, mat(0x0e0d12));                                // face mask
     const bolt=R.box(.03,.5,.03, .22,1.5,.16, mat(0xff2a2a,{e:0xff2a2a,ei:1.5}),0,0,.3); // red lightning bolt
     R.box(.1,.1,.04, .2,1.3,.16, mat(0xd41a1a,{e:0xd41a1a,ei:.6}));                       // red X mark
     R.box(.06,.16,.04, 0,1.42,.17, mat(0xd41a1a,{e:0xff2a2a,ei:.7}));                     // red kanji/pendant
     return t=>{ bolt.material.emissiveIntensity=1+Math.sin(t*9)*.7; };                   // flickering lightning
   } },

 { id:'maggi', name:'MAGGI', tier:'epic', price:3500, glow:0xffd76e,
   flavor:"Straight A's, straight lines.",
   build(g){ const R=riderRig(g,{skin:0x5a3a24, top:0x16151b, pants:0x14131a, shoes:0x0e0d12,
     eyes:0x3a2620, legTop:0x5a3a24, legBot:0x14131a});                                   // thigh-high black boots
     R.hairCap(0x140f14,1.0);
     for(const s of [-1,1]){ const bun=new THREE.Mesh(new THREE.SphereGeometry(.13,8,7),mat(0x140f14,{r:.75}));
       bun.position.set(s*.16,R.headY+.2,-.02); g.add(bun); }                             // twin space buns
     R.box(.34,.045,.04, 0,R.headY+.02,.19, mat(0x222222,{m:.5,r:.3}));                    // glasses frame
     for(const s of [-1,1]) R.box(.13,.1,.02, s*.09,R.headY+.02,.2, mat(0xcfe8ff,{r:.1,m:.3})); // lenses
     R.skirt(0xf2ede6,.42);                                                               // white pleated skirt
     R.box(.16,.05,.05, 0,1.62,.16, mat(0x14141a));                                        // turtleneck collar
     R.box(.08,.14,.04, 0,1.45,.17, mat(0xffd76e,{m:.8,r:.3,envI:1.4}));                   // gold necklace
     for(const s of [-1,1]) R.box(.06,.06,.06, s*.24,1.28,.02, mat(0xffd76e,{m:.8,r:.3})); // gold watch/cuff
   } },

 { id:'lexxi', name:'LEXXI', tier:'epic', price:4500, glow:0xff2a3a,
   flavor:'Soft eyes. Sharp everything else.',
   build(g){ const R=riderRig(g,{skin:0x5a3a28, top:0x121016, pants:0x0e0d12, shoes:0x141018,
     eyes:0x7a4a3a});
     const hijab=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),mat(0x121016,{r:.7}));
     hijab.scale.set(1,1.06,1); hijab.position.set(0,R.headY+.05,-.04); g.add(hijab);     // hijab cap
     R.box(.42,.4,.16, 0,1.58,-.1, mat(0x121016,{r:.7}));                                  // hijab drape
     R.box(.22,.13,.06, 0,R.headY-.12,.18, mat(0x0e0d12));                                 // face mask
     R.box(.06,.14,.04, 0,1.42,.17, mat(0xd41a1a,{e:0xff2a3a,ei:.7}));                     // red dagger pendant
     R.box(.5,.06,.32, 0,1.06,0, mat(0x1a0e10,{e:0xd41a1a,ei:.3}));                        // red-patterned belt
     R.box(.28,.3,.18, .3,1.2,-.05, mat(0x141018,{r:.6}));                                 // crossbody bag
     R.box(.04,.28,.02, .18,1.14,.14, mat(0xd41a1a,{e:0xd41a1a,ei:.5}));                   // red waist chain
     for(const s of [-1,1]) R.box(.18,.07,.33, s*.13,.06,.06, mat(0xd41a1a));              // red sneaker accents
   } },

 { id:'froggy', name:'FROGGY', tier:'legendary', price:13000, glow:0x62c72e,
   flavor:'Hops the leaderboard. Literally.',
   build(g){ const R=riderRig(g,{skin:0x5cc23a, top:0x5cc23a, pants:0x5cc23a, shoes:0x4aa82e,
     eyes:0x111111, headScale:1.5});
     const belly=new THREE.Mesh(new THREE.SphereGeometry(.2,8,7),mat(0xf2e8c2,{r:.7}));
     belly.scale.set(.9,1.2,.4); belly.position.set(0,1.25,.16); g.add(belly);            // cream belly
     for(const s of [-1,1]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(.11,8,7),mat(0xffffff,{r:.3}));
       eye.position.set(s*.13,R.headY+.16,.04); g.add(eye);                               // big frog eyes on top
       const pup=new THREE.Mesh(new THREE.SphereGeometry(.05,7,6),mat(0x111111));
       pup.position.set(s*.15,R.headY+.15,.13); g.add(pup); }
     R.box(.34,.4,.2, 0,1.3,-.2, mat(0xd42a2a,{r:.5}));                                     // red backpack
     for(const s of [-1,1]) R.box(.06,.5,.06, s*.14,1.35,.08, mat(0xd42a2a,{r:.5}));       // straps
   } },

 { id:'gem', name:'GEM', tier:'rare', price:2000, glow:0xffbf6e,
   flavor:'Rare by name. Rarer by run.',
   build(g){ const R=riderRig(g,{skin:0x6e4428, top:0x16141c, pants:0x14121a, shoes:0x1a1620,
     eyes:0x3a2620, legTop:0x6e4428, legBot:0x14121a});
     R.hairCap(0x120f16,1.0);
     R.hairBack(0x120f16,1.15,.44);                                                        // long braids down back
     const braids=[];
     for(const s of [-1,1]){
       braids.push(R.box(.1,.9,.1, s*.24,1.3,.16, mat(0x120f16,{r:.75})));                 // braids over shoulders
       const tip=new THREE.Mesh(new THREE.ConeGeometry(.05,.12,5),mat(0x120f16,{r:.75}));
       tip.position.set(s*.24,.82,.18); tip.rotation.x=Math.PI; g.add(tip); }
     R.skirt(0x16141c,.4);                                                                 // black skirt (built fit)
     R.box(.3,.04,.16, 0,1.5,.14, mat(0x0e0c12));                                          // lace cami neckline
     R.box(.08,.16,.04, 0,1.44,.17, mat(0xffd76e,{m:.8,r:.3,envI:1.4}));                    // gold layered necklace
     for(const s of [-1,1]){ const hoop=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,6,10),
       mat(0xffd76e,{m:.85,r:.25,envI:1.5})); hoop.position.set(s*.22,R.headY-.06,.02); g.add(hoop); } // gold hoops
     return t=>{ braids.forEach((b,i)=>{ b.rotation.x=Math.sin(t*1.6+i*2)*.1; }); };       // braid sway
   } },
];

/* ===================== IN-GAME SKIN WIRING (v1: palettes) ================== */
// The game renders one shared rider rig (Kaisei's build in index.html) and one
// bike frame; equipping a skin recolors them. These palettes mirror each rider's
// riderRig() colors above — full per-skin models in-game are the next step.
// keys: skin tone, top (jacket), pants, shoes, eyes, hair, shirt (chest inset).
export const RIDER_GAME={
  rookie:     {skin:0x1c1c26, top:0x14141e, pants:0x111119, shoes:0x0b0b10, eyes:0x00e5ff, hair:0x0f0f16, shirt:0x0f0f16},
  berna:      {skin:0xead0b2, top:0x6b6f52, pants:0x3a3d4a, shoes:0x23262e, eyes:0x35d6ff, hair:0x5a3d28, shirt:0x8a8f9c},
  cherry:     {skin:0xe8b88a, top:0x1b1b22, pants:0xe8b88a, shoes:0xf2f2f2, eyes:0x3a2620, hair:0x15121a, shirt:0xc2233a},
  princess:   {skin:0xb5773f, top:0xf7c6d8, pants:0x1c2440, shoes:0x1c1a18, eyes:0x3a2620, hair:0x14121c, shirt:0xffffff},
  begone:     {skin:0x6e4a2f, top:0x9c1f2e, pants:0x1e1e24, shoes:0x16130f, eyes:0x5d766d, hair:0x8db8ee, shirt:0xf2f2f2},
  titan:      {skin:0xd9a878, top:0x9a7448, pants:0x4c4a3a, shoes:0x2e2018, eyes:0x5ce8d8, hair:0x2e2118, shirt:0xe8dcc2},
  bella:      {skin:0xf2cba8, top:0xb3a48c, pants:0xf2ede6, shoes:0xf2ede6, eyes:0xd8a03c, hair:0xc25b45, shirt:0xf6f3ec},
  stephyberry:{skin:0xf6d7c2, top:0x1d1a20, pants:0xf2e2d8, shoes:0xffffff, eyes:0x8fa3c8, hair:0xf3e2e4, shirt:0xf2e2d8},
  dave:       {skin:0x7a4a2c, top:0x1d2a4a, pants:0x1d2a4a, shoes:0x0d0d0f, eyes:0x2a2018, hair:0x0f0d0d, shirt:0xf2f2f2},
  dylan:      {skin:0x6e4426, top:0x17171c, pants:0x121215, shoes:0x0c0c0f, eyes:0x111111, hair:0x121010, shirt:0x1f1f24},
  ik:         {skin:0xe0b58c, top:0x6e6a5e, pants:0xa89878, shoes:0x4a3524, eyes:0x4a5a68, hair:0xd8b96e, shirt:0xb89a52},
  ronin:      {skin:0xd9a878, top:0xc4356e, pants:0x1a1a20, shoes:0x111114, eyes:0xdd2233, hair:0x17141c, shirt:0x17151b},
  raiden:     {skin:0xc98d5e, top:0x6a3fae, pants:0x3a2a5e, shoes:0x241a3e, eyes:0xff5d8f, hair:0xcfc4bc, shirt:0x5a3399},
  spike:      {skin:0xd9a878, top:0x1b1b20, pants:0x17171c, shoes:0x101014, eyes:0x3a2620, hair:0x14121a, shirt:0x232329},
  himars:     {skin:0xffffff, top:0x16161c, pants:0x16161c, shoes:0xe8901a, eyes:0x111111, hair:0x3b6fd4, shirt:0x1a3a8a},
  mendo:      {skin:0x5e3a22, top:0xf2eef8, pants:0x8a5fd4, shoes:0xf2eef8, eyes:0x2a2018, hair:0x181410, shirt:0xe8dcc2},
  miji:       {skin:0x3a2a24, top:0x121016, pants:0x0e0d12, shoes:0x0a0a0e, eyes:0xff2a2a, hair:0x141018, shirt:0xd41a1a},
  maggi:      {skin:0x5a3a24, top:0x16151b, pants:0x14131a, shoes:0x0e0d12, eyes:0x3a2620, hair:0x140f14, shirt:0xffd76e},
  lexxi:      {skin:0x5a3a28, top:0x121016, pants:0x0e0d12, shoes:0x141018, eyes:0x7a4a3a, hair:0x121016, shirt:0xd41a1a},
  froggy:     {skin:0x5cc23a, top:0x5cc23a, pants:0x5cc23a, shoes:0x4aa82e, eyes:0x111111, hair:0x5cc23a, shirt:0xf2e8c2},
  gem:        {skin:0x6e4428, top:0x16141c, pants:0x14121a, shoes:0x1a1620, eyes:0x3a2620, hair:0x120f16, shirt:0xffd76e},
};
// In-game bike paint: two-tone frame gradient + neon rim glow, straight from the
// showroom definition (or its explicit `game` override).
export function bikeGame(id){
  const s=BIKES.find(b=>b.id===id)||BIKES[0];
  return s.game||{bot:s.frame.color, top:s.accent.color, rim:s.glow};
}
