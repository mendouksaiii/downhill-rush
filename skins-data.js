// Shared skin catalog + model builders for Downhill Rush.
// Used by skins.html (showroom), market.html (shop preview), and later the game itself.
import * as THREE from 'three';

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

/* ============================ BIKE SKINS ================================== */
export const BIKES=[
 { id:'sunset', name:'SUNSET DRIFTER', tier:'common', price:400, glow:0xff7847,
   flavor:'Chases the horizon it came from.',
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
];
function makeBikeMat(def, physical){
  const C=physical?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
  const m=new C({ color:def.color, flatShading:true,
    roughness:def.rough!==undefined?def.rough:.5,
    metalness:def.metal!==undefined?def.metal:0 });
  if(def.envI) m.envMapIntensity=def.envI;
  if(def.emissive){ m.emissive=new THREE.Color(def.emissive); m.emissiveIntensity=def.ei||1; }
  if(physical){ m.iridescence=.7; m.iridescenceIOR=1.6; }
  return m;
}
export function buildBike(skin){
  const g=new THREE.Group();
  const M={ frame:makeBikeMat(skin.frame, skin.physical),
            accent:makeBikeMat(skin.accent, skin.physical),
            wheel:makeBikeMat(skin.wheels) };
  const dark=mat(0x14101f,{r:.6});
  const wheelGeo=skin.discWheels
    ? new THREE.CylinderGeometry(.48,.48,.1,18)
    : new THREE.CylinderGeometry(.48,.48,.14,10);
  wheelGeo.rotateZ(Math.PI/2);
  for(const z of [.82,-.82]){
    const w=new THREE.Mesh(wheelGeo,M.wheel); w.position.set(0,.48,z); g.add(w);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.18,8),M.accent);
    hub.rotation.z=Math.PI/2; hub.position.set(0,.48,z); g.add(hub);
  }
  const box=(w,h,d,x,y,z,m,rx=0)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    b.position.set(x,y,z); b.rotation.x=rx; g.add(b); return b; };
  box(.14,.14,1.7, 0,.62,0, M.frame);
  box(.12,.12,1.15, 0,1.04,.03, M.frame, .1);
  box(.12,.55,.12, 0,.85,.72, M.frame, .25);
  box(.12,.5,.12, 0,.85,-.55, M.frame, -.2);
  box(.34,.07,.46, 0,1.14,-.6, dark);
  box(.6,.08,.08, 0,1.16,.68, M.accent);
  box(.09,.09,.1, .3,1.16,.68, dark);
  box(.09,.09,.1,-.3,1.16,.68, dark);
  const cr=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.06,10),M.accent);
  cr.rotation.z=Math.PI/2; cr.position.set(0,.5,-.12); g.add(cr);
  box(.3,.05,.05, 0,.5,-.12, dark);
  box(.1,.04,.16, .18,.5,-.12, dark);
  box(.1,.04,.16,-.18,.5,-.12, dark);
  if(skin.extras) skin.extras(g,M);
  return g;
}

/* ============================ RIDER BUILDER =============================== */
export function riderRig(g, o){
  // o: skin, top, pants, shoes, eyes, shirt?, legTop?, legBot?, headScale?, bulk?, crop?, topMat?
  const S={ skin:mat(o.skin), top:o.topMat||mat(o.top), pants:mat(o.pants), shoes:mat(o.shoes,{r:.35}) };
  const bulk=o.bulk||1, hs=o.headScale||1;
  const box=(w,h,d,x,y,z,m,rx=0,ry=0,rz=0)=>{
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    b.position.set(x,y,z); b.rotation.set(rx,ry,rz); g.add(b); return b; };
  for(const s of [-1,1]){
    box(.17,.5,.17, s*.12,.75,0, o.legTop?mat(o.legTop):S.pants);
    box(.15,.5,.15, s*.12,.28,0, o.legBot?mat(o.legBot):S.pants);
    box(.17,.12,.32, s*.12,.06,.05, S.shoes);
  }
  let torso;
  if(o.crop){                                    // cropped top: bare midriff strip
    torso=box(.5*bulk,.46,.29*bulk, 0,1.44,0, S.top);
    box(.44,.18,.25, 0,1.12,0, S.skin);
  } else {
    torso=box(.52*bulk,.64,.3*bulk, 0,1.34,0, S.top);
  }
  if(o.shirt) box(.2,.52,.05, 0,1.32,.16*bulk, mat(o.shirt));
  for(const s of [-1,1]){
    box(.14*bulk,.56,.14*bulk, s*(.34*bulk),1.3,0, S.top, 0,0,-s*.1);
    box(.1,.1,.1, s*(.37*bulk),.97,0, S.skin);
  }
  const headY=1.86+(hs-1)*.12;
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.23*hs,0),S.skin);
  head.position.set(0,headY,0); g.add(head);
  for(const s of [-1,1])
    box(.055*hs,.06*hs,.02, s*.08*hs, headY+.02, .2*hs, mat(0x111111,{e:o.eyes,ei:1.2}));
  return { S, box, head, headY, hs, torso,
    hairCap(color,scale=1){ const h=new THREE.Mesh(new THREE.IcosahedronGeometry(.25*hs*scale,0),mat(color,{r:.7}));
      h.scale.y=.75; h.position.set(0,headY+.1,-.02); g.add(h); return h; },
    hairBack(color,len=.5,w=.34){ const h=box(w,len,.1, 0,headY-len/2+.12,-.2*hs, mat(color,{r:.7})); return h; },
    hat(color,r=.26){ const b=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.9,.09,10),mat(color,{r:.6}));
      b.position.set(0,headY+.22,0); b.rotation.z=.12; g.add(b); return b; },
    skirt(color,r=.44){ const s=new THREE.Mesh(new THREE.CylinderGeometry(.26,r,.32,10),mat(color,{r:.6}));
      s.position.set(0,.94,0); g.add(s); return s; },
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

 { id:'ronin', name:'RONIN', tier:'epic', price:5000, glow:0xff2e6e,
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
];
