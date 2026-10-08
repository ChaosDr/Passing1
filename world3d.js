import * as THREE from './three.module.js';
import {createSoftwareRenderer} from './software3d.js';

// Every wall and furnishing below is geometry in the same walkable scene.
const S=.5, canvas=document.getElementById('room-canvas');
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});}catch{renderer=createSoftwareRenderer(canvas,THREE);}
renderer.setPixelRatio(1);renderer.setClearColor(0x171c25);renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x171c25,6,17);
const camera=new THREE.PerspectiveCamera(70,1,.035,28);camera.rotation.order='YXZ';
scene.add(camera);scene.add(new THREE.AmbientLight(0x9ea8c5,1.15));
const sun=new THREE.DirectionalLight(0xffdec1,1.6);sun.position.set(3,6,2);scene.add(sun);
const layout=Array.from({length:18},()=>Array(24).fill(1));
const rooms=[{name:'BEDROOM',x:2,y:11,w:6,h:6,color:0x77767b},{name:'THE FLAT',x:2,y:2,w:12,h:9,color:0x858079},{name:'WARDROBE',x:8,y:11,w:6,h:6,color:0x82757c},{name:'KITCHEN',x:14,y:2,w:8,h:7,color:0x858a80},{name:'BATHROOM',x:14,y:9,w:8,h:8,color:0x8d9b9b}];
for(const r of rooms)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)layout[y][x]=0;
for(let x=2;x<14;x++)layout[10][x]=1;for(let y=2;y<17;y++)layout[y][13]=1;for(let y=11;y<17;y++)layout[y][7]=1;for(let x=14;x<22;x++)layout[8][x]=1;
[[4,10],[5,10],[10,10],[11,10],[13,5],[13,6],[13,9],[13,10],[7,13],[7,14],[17,8],[18,8]].forEach(([x,y])=>layout[y][x]=0);
let seed=937;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function texture(kind){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
 g.fillStyle=kind==='wood'?'#6b5140':kind==='tile'?'#929f9b':kind==='fabric'?'#60596b':'#85817a';g.fillRect(0,0,64,64);
 for(let i=0;i<600;i++){g.fillStyle=rand()>.5?'#ffffff0d':'#00000015';g.fillRect(rand()*64,rand()*64,1+rand()*3,1+rand()*3)}
 if(kind==='wood'){for(let y=0;y<64;y+=16){g.fillStyle='#201b1760';g.fillRect(0,y,64,1);for(let x=(y%32?16:0);x<64;x+=32)g.fillRect(x,y,1,16)}for(let i=0;i<70;i++){g.fillStyle='#221a1630';g.fillRect(rand()*64,rand()*64,6+rand()*16,1)}}
 if(kind==='tile'){g.strokeStyle='#465552';for(let i=0;i<=64;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.moveTo(0,i);g.lineTo(64,i);g.stroke()}}
 if(kind==='fabric'){for(let i=0;i<64;i+=8){g.fillStyle='#28273555';g.fillRect(i,0,3,64);g.fillRect(0,i,64,3)}}
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
const maps={wood:texture('wood'),wall:texture('wall'),tile:texture('tile'),cloth:texture('fabric')};
const mats=new Map();function mat(color,map,emissive=0){const key=`${color}:${map}:${emissive}`;if(!mats.has(key))mats.set(key,new THREE.MeshLambertMaterial({color,map:maps[map],emissive,flatShading:true}));return mats.get(key)}
const blockers=[],items=[],animated={};
function box(parent,w,h,d,x,y,z,color,map){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,map));m.position.set(x,y,z);parent.add(m);return m}
function cylinder(parent,r,h,x,y,z,color,n=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),mat(color));m.position.set(x,y,z);parent.add(m);return m}
function block(x,z,w,d){blockers.push({x,z,w,d})}
function item(id,label,g,x,z){g.userData.item=id;g.traverse(o=>o.userData.item=id);items.push({id,label,g,x,z});return g}
function group(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);return g}
for(const r of rooms){const cx=(r.x+r.w/2)*S,cz=(r.y+r.h/2)*S;
 box(scene,r.w*S,.08,r.h*S,cx,-.04,cz,r.name==='BATHROOM'?0xcccccc:0xa08b74,r.name==='BATHROOM'?'tile':'wood');
 box(scene,r.w*S,.07,r.h*S,cx,2.64,cz,0x69696c,'wall');
 const light=new THREE.PointLight(r.name==='BATHROOM'?0xe2edff:0xffd9ab,7,6,2);light.position.set(cx,2.25,cz);scene.add(light);
 box(scene,.34,.06,.34,cx,2.53,cz,0xeedbb6);}
// Surface each wall only where it borders a room, preserving actual open doorways.
for(let z=0;z<18;z++)for(let x=0;x<24;x++)if(layout[z][x]){
 const r=rooms.find(r=>x>=r.x-1&&x<=r.x+r.w&&z>=r.y-1&&z<=r.y+r.h)||rooms[1];
 if([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz])=>layout[z+dz]?.[x+dx]===0)){
 box(scene,S,2.6,S,(x+.5)*S,1.3,(z+.5)*S,r.color,r.name==='BATHROOM'?'tile':'wall');
 box(scene,S+.005,.13,S+.005,(x+.5)*S,.065,(z+.5)*S,0x413f3d);}}
// Bedroom: bed, irregular blanket, pillow, bedside phone and abandoned gym bag.
let g=group(1.72,7.2);box(g,1.45,.32,2.02,0,.2,0,0x443730,'wood');box(g,1.43,.22,1.98,0,.47,0,0xc2bbae);box(g,1.4,.09,1.32,0,.62,.29,0x847487,'cloth');box(g,.7,.14,.43,0,.64,-.68,0xd0c6bb,'cloth');box(g,1.48,.85,.13,0,.45,-1.04,0x594335,'wood');block(1.72,7.2,1.5,2.1);item('bedclothes','BED',g,1.72,7.2);animated.blanket=g.children[2];
g=group(2.75,7.05);box(g,.55,.08,.55,0,.64,0,0x795e48,'wood');for(const x of [-.2,.2])for(const z of [-.2,.2])box(g,.05,.65,.05,x,.32,z,0x443b33);const phone=box(g,.105,.022,.2,0,.697,0,0x14191f);box(g,.085,.006,.16,0,.71,0,0x70aac1);block(2.75,7.05,.55,.55);item('phone','PHONE',g,2.75,7.05);
g=group(2.85,6.15);box(g,.55,.28,.35,0,.14,0,0x2b3345,'cloth');box(g,.25,.05,.08,0,.33,0,0x1b1c28);item('gym','GYM BAG',g,2.85,6.15);
// Desk with CRT, keyboard, cans and mug.
g=group(5.5,2.05);box(g,1.6,.1,.75,0,.78,0,0x815f42,'wood');for(const x of [-.68,.68])for(const z of [-.26,.26])box(g,.08,.76,.08,x,.38,z,0x423a34);box(g,.6,.42,.43,0,1.08,-.06,0xadb0a8);box(g,.51,.31,.022,0,1.08,.167,0x17242b);const screen=box(g,.44,.25,.012,0,1.08,.183,0x7bafc7);screen.material=new THREE.MeshBasicMaterial({color:0x91bad2});box(g,.22,.06,.23,0,.85,.02,0x808780);box(g,.5,.035,.17,0,.856,.24,0xb3b3a6);for(let i=0;i<5;i++)box(g,.42,.008,.008,0,.879,.19+i*.023,0x454851);cylinder(g,.065,.16,-.5,.9,.12,0x75636d);for(let i=0;i<3;i++)cylinder(g,.04,.14,.5+i*.095,.9,-.07,0x73898c);block(5.5,2.05,1.7,.8);item('computer','COMPUTER',g,5.5,2.05);
g=group(5.3,2.84);box(g,.55,.09,.55,0,.49,0,0x4d3e40);box(g,.55,.65,.09,0,.78,.25,0x51454b,'cloth');cylinder(g,.035,.46,0,.23,0,0x32353b);for(let i=0;i<4;i++){const leg=box(g,.65,.04,.05,0,.07,0,0x32353b);leg.rotation.y=i*Math.PI/4}const clothesGroup=new THREE.Group();g.add(clothesGroup);box(clothesGroup,.5,.09,.35,0,.59,0,0x938477,'cloth');box(clothesGroup,.28,.09,.42,.05,.67,.02,0x2c3240,'cloth');box(clothesGroup,.22,.3,.06,-.13,.53,-.23,0xada396);animated.chairClothes=clothesGroup;block(5.3,2.84,.58,.6);item('chair','CLOTHES ON CHAIR',g,5.3,2.84);
// Window, curtains and radiator are tangible geometry, with a city beyond glass.
g=group(3.6,1.03);box(g,1.55,1.37,.12,0,1.5,0,0x3e3938);box(g,1.36,1.17,.03,0,1.5,.078,0x203c57);box(g,.05,1.2,.08,0,1.5,.12,0xa59e8e);box(g,1.4,.05,.08,0,1.5,.12,0xa59e8e);for(let i=0;i<7;i++){const b=box(g,.14,.25+rand()*.5,.02,-.6+i*.19,1.05+rand()*.1,.1,0x182838);box(g,.03,.05,.014,-.6+i*.19,1.12,.115,0xc09b57)}const curtains=[];for(const side of [-1,1]){const c=box(g,.43,1.55,.12,side*.61,1.48,.2,0x645b6d,'cloth');curtains.push(c)}for(let i=0;i<10;i++)box(g,.08,.48,.15,-.54+i*.12,.38,.18,0xb0aba0);animated.curtains=curtains;item('window','WINDOW',g,3.6,1.03);
// Wardrobe, parcel and mirror with a visible low-poly person.
g=group(4.55,7.08);box(g,1.12,1.95,.5,0,.975,0,0x5a4439,'wood');box(g,.52,1.81,.06,-.28,1,.29,0x7a5b49,'wood');box(g,.52,1.81,.06,.28,1,.29,0x735644,'wood');box(g,.03,.17,.04,-.04,1,.34,0xb5aa88);box(g,.03,.17,.04,.04,1,.34,0xb5aa88);block(4.55,7.08,1.16,.56);item('clothes','WARDROBE',g,4.55,7.08);
g=group(5.65,7.55);box(g,.55,.19,.37,0,.095,0,0xb39569);box(g,.06,.006,.37,0,.194,0,0xdac49b);item('parcel','PARCEL',g,5.65,7.55);
g=group(6.17,6.63);g.rotation.y=-Math.PI/2;box(g,.83,1.98,.07,0,1.06,0,0x36302e);box(g,.73,1.86,.018,0,1.06,.045,0x6a7c86);const loader=new THREE.TextureLoader();loader.load('mirror-close.webp',t=>{t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.81),new THREE.MeshBasicMaterial({map:t}));m.position.set(0,1.06,.058);g.add(m);m.userData.item='mirror';});item('mirror','MIRROR',g,6.17,6.63);
// Kitchen cabinet, steel sink, dishes, food, fridge, bins.
g=group(8.1,2.05);box(g,1.45,.82,.68,0,.41,0,0x736e60,'wood');box(g,1.52,.07,.75,0,.86,0,0xb5b2a2);box(g,.65,.025,.42,-.3,.905,0,0x434e51);box(g,.55,.01,.34,-.3,.92,0,0x7a8789);cylinder(g,.025,.25,-.3,1.06,-.22,0xb7bbb9);const dishes=new THREE.Group();g.add(dishes);for(let i=0;i<4;i++)cylinder(dishes,.14,.035,.3,.93+i*.04,.1,0xbab9ad);animated.dishes=dishes;block(8.1,2.05,1.5,.8);item('dishes','DISHES',g,8.1,2.05);
g=group(9.6,2.05);box(g,1.1,.82,.68,0,.41,0,0x6b6d5e,'wood');box(g,1.15,.07,.75,0,.86,0,0xb5b2a2);box(g,.35,.08,.24,0,.95,0,0xd6b78d);box(g,.33,.018,.22,0,1.005,0,0xa37d49);block(9.6,2.05,1.15,.8);item('food','FOOD',g,9.6,2.05);
g=group(10.45,1.7);box(g,.72,1.8,.75,0,.9,0,0xb8b8ad);box(g,.62,.02,.03,0,1.13,.397,0x555c60);block(10.45,1.7,.74,.76);
g=group(9.4,3.35);cylinder(g,.18,.43,0,.215,0,0x41454a);cylinder(g,.19,.025,0,.44,0,0x979b91);item('trash','TRASH',g,9.4,3.35);animated.trash=g;
// Bathroom basin, mirror, bath, separate curtain panels and running water.
g=group(7.93,5.78);box(g,.76,.16,.51,0,.84,0,0xd0cec3);box(g,.55,.025,.34,0,.932,0,0x697d80);box(g,.45,.01,.25,0,.946,0,0xadbcb5);cylinder(g,.04,.83,0,.42,0,0xc1c3b9);cylinder(g,.022,.2,0,1.05,-.19,0xabb5b9);box(g,.61,.7,.06,0,1.65,-.25,0x516c79);box(g,.08,.1,.08,.25,1,-.12,0x4b6377);box(g,.014,.14,.014,.25,1.1,-.12,0xc0bb9c);block(7.93,5.78,.8,.55);item('sink','SINK · BRUSH TEETH',g,7.93,5.78);
g=group(9.65,6.63);box(g,1.35,.47,1.85,0,.235,0,0xd0cfc1);box(g,1.11,.03,1.55,0,.48,0,0x667977);cylinder(g,.022,1.68,.47,1.31,-.69,0xa7b7b6);const showerhead=cylinder(g,.11,.05,.47,2.15,-.61,0x555e66);showerhead.rotation.x=.7;box(g,1.48,.025,.025,0,2.28,.84,0x80888b);const curtain=new THREE.Group();g.add(curtain);for(let i=0;i<11;i++)box(curtain,.115,1.8,.055,-.66+i*.13,1.35,.83,0x697282,'cloth');curtain.scale.x=.28;curtain.position.x=-.48;animated.showerCurtain=curtain;const water=new THREE.Group();g.add(water);for(let i=0;i<28;i++){const drop=box(water,.012,.17,.012,.47+(rand()-.5)*.38,.5+rand()*1.5,-.55+(rand()-.5)*.4,0xa4c6d0);drop.material=new THREE.MeshBasicMaterial({color:0xa4c6d0,transparent:true,opacity:.45})}water.visible=false;animated.water=water;block(9.65,6.63,1.4,1.9);item('shower','SHOWER',g,9.65,6.63);
// Front door and everyday clutter.
g=group(1.03,3.1);g.rotation.y=Math.PI/2;box(g,1.1,2.1,.09,0,1.05,0,0x674d3c,'wood');box(g,.13,.04,.08,.37,1,.08,0xbdb497);item('exit','FRONT DOOR',g,1.03,3.1);
for(let i=0;i<16;i++){const x=1.7+rand()*3.3,z=3.6+rand()*1.1;const m=box(scene,.15+rand()*.17,.035,.14+rand()*.18,x,.03,z,i%3?0x515265:0x978887,'cloth');m.rotation.y=rand()*3}
for(let i=0;i<6;i++){const x=3.3+rand(),z=1.8+rand()*2;cylinder(scene,.045,.14,x,.07,z,0x868475)}
box(scene,2.4,.012,1.25,3.6,.014,4.2,0x6b4350,'cloth');box(scene,1.5,.012,.8,9.2,.012,5.3,0x45545a,'cloth');
// First-person hands are geometry attached to the camera.
const hands=new THREE.Group();camera.add(hands);hands.visible=false;const arm=box(hands,.075,.12,.3,.18,-.26,-.38,0xbfa393);arm.rotation.x=-.3;const brush=box(hands,.025,.025,.25,.18,-.19,-.54,0xd7d8b8);box(hands,.035,.022,.045,.18,-.178,-.67,0xacc4c1);animated.hands=hands;
let pos={x:5.5,y:15.4,a:-Math.PI/2},pitch=-.2,running=false,last=0,onInteract=()=>{},onArea=()=>{},target=null,goal='phone',flags={},roomName='',keys=new Set(),held=new Set(),drag=null,anim=null,bob=0;
const raycaster=new THREE.Raycaster();const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function area(){return rooms.find(r=>pos.x>=r.x&&pos.x<r.x+r.w&&pos.y>=r.y&&pos.y<r.y+r.h)?.name||'THE FLAT'}
function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const width=Math.min(640,Math.max(300,Math.round(r.width*.48)));renderer.setSize(width,Math.round(width*r.height/r.width),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
function collision(x,z){const radius=.16;for(const dx of [-radius,radius])for(const dz of [-radius,radius])if(layout[Math.floor((z+dz)/S)]?.[Math.floor((x+dx)/S)]!==0)return true;return blockers.some(b=>Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius)}
// Screen-space labels follow the real objects and respect walls/furniture.
const nearbyLayer=document.createElement('div');nearbyLayer.className='nearby-objects';document.getElementById('play').append(nearbyLayer);
scene.updateMatrixWorld(true);
for(const i of items){i.bounds=new THREE.Box3().setFromObject(i.g);i.anchor=i.bounds.getCenter(new THREE.Vector3());i.badge=document.createElement('button');i.badge.className='object-badge hidden';i.badge.textContent=i.label;i.badge.onclick=()=>{if(i.reachable){held.clear();keys.clear();onInteract(i.id)}};nearbyLayer.append(i.badge)}
const focusFrame=document.createElement('div');focusFrame.className='object-frame hidden';nearbyLayer.append(focusFrame);
const sight=new THREE.Raycaster();let targetUpdated=0;
function visibleItem(i){if(!i.g.visible)return false;const direction=i.anchor.clone().sub(camera.position);const distance=direction.length();sight.set(camera.position,direction.normalize());sight.far=distance+.15;const hit=sight.intersectObjects(scene.children,true).find(h=>!hands.children.includes(h.object));return hit?.object.userData.item===i.id}
function updateTarget(){scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(new THREE.Vector2(0,0),camera);const hits=raycaster.intersectObjects(scene.children,true);target=null;for(const h of hits){if(hands.children.includes(h.object))continue;if(h.distance>2.4)break;if(h.object.userData.item){target=items.find(i=>i.id===h.object.userData.item);break}if(h.distance>.2)break}
 const rect=canvas.getBoundingClientRect();let best=.76;
 for(const i of items){const distance=Math.hypot(i.x-camera.position.x,i.z-camera.position.z),point=i.anchor.clone().project(camera);const shown=distance<=3.2&&point.z>-1&&point.z<1&&Math.abs(point.x)<.92&&Math.abs(point.y)<.77&&visibleItem(i);i.badge.classList.toggle('hidden',!shown);i.reachable=shown&&distance<=2.4;
 if(!shown)continue;i.badge.style.left=`${(point.x+1)*50}%`;i.badge.style.top=`${(1-point.y)*50}%`;i.badge.classList.toggle('reachable',i.reachable);i.badge.disabled=!i.reachable;i.badge.setAttribute('aria-label',i.reachable?`Use ${i.label}`:`${i.label}, move closer`);
 const facing=Math.cos(Math.atan2(i.z-camera.position.z,i.x-camera.position.x)-pos.a);if(!target&&i.reachable&&facing>best){best=facing;target=i}
 }
 for(const i of items)i.badge.classList.toggle('selected',i===target);
 focusFrame.classList.toggle('hidden',!target);
 if(target){const points=[];for(const x of [target.bounds.min.x,target.bounds.max.x])for(const y of [target.bounds.min.y,target.bounds.max.y])for(const z of [target.bounds.min.z,target.bounds.max.z]){const v=new THREE.Vector3(x,y,z).project(camera);if(v.z>-1&&v.z<1)points.push(v)}if(points.length){const xs=points.map(v=>(v.x+1)*rect.width/2),ys=points.map(v=>(1-v.y)*rect.height/2),left=clamp(Math.min(...xs),8,rect.width-8),top=clamp(Math.min(...ys),90,rect.height-100),right=clamp(Math.max(...xs),left+12,rect.width-8),bottom=clamp(Math.max(...ys),top+12,rect.height-100);Object.assign(focusFrame.style,{left:`${left}px`,top:`${top}px`,width:`${right-left}px`,height:`${bottom-top}px`})}else focusFrame.classList.add('hidden')}
 const b=document.getElementById('interact');b.classList.toggle('hidden',!target);if(target){b.textContent=`USE · ${target.label}`;b.setAttribute('aria-label',`Use ${target.label}`)}document.getElementById('room-label').textContent='';
 const obj=items.find(i=>i.id===goal);if(obj){
 const start=[Math.floor(pos.x),Math.floor(pos.y)],end=[Math.floor(obj.x/S),Math.floor(obj.z/S)],queue=[start],came=new Map([[start.join(','),null]]);
 for(let n=0;n<queue.length;n++){const [x,z]=queue[n];if(x===end[0]&&z===end[1])break;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=`${nx},${nz}`;if(layout[nz]?.[nx]!==0||came.has(k))continue;came.set(k,[x,z]);queue.push([nx,nz])}}
 let path=[],at=end;if(came.has(end.join(',')))while(at){path.push(at);at=came.get(at.join(','))}path.reverse();const next=path[Math.min(path.length-1,2)];
 const tx=path.length>3?(next[0]+.5)*S:obj.x,tz=path.length>3?(next[1]+.5)*S:obj.z;
 const a=Math.atan2(tz-pos.y*S,tx-pos.x*S)-pos.a,d=Math.atan2(Math.sin(a),Math.cos(a));document.getElementById('waypoint').textContent=`${goal.toUpperCase()} ${Math.abs(d)<.4?'↑':d>0?'→':'←'} · ${Math.round(Math.hypot(obj.x-pos.x*S,obj.z-pos.y*S))} m`}
}
function tick(t){if(!running)return;const dt=Math.min(.25,(t-last)/1000||.016);last=t;const paused=['panel','computer','mirror-mode'].some(id=>!document.getElementById(id).classList.contains('hidden'))||Boolean(anim);
 const f=Number(keys.has('w')||keys.has('arrowup')||held.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||held.has('back')),side=Number(keys.has('d')||held.has('right'))-Number(keys.has('a')||held.has('left')),spin=Number(keys.has('arrowright')||held.has('turnRight'))-Number(keys.has('arrowleft')||held.has('turnLeft'));
 if(!paused){pos.a+=spin*dt*1.7;const speed=dt*1.45,dx=(Math.cos(pos.a)*f-Math.sin(pos.a)*side)*speed,dz=(Math.sin(pos.a)*f+Math.cos(pos.a)*side)*speed;let x=pos.x*S,z=pos.y*S;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.065));for(let step=0;step<steps;step++){if(!collision(x+dx/steps,z))x+=dx/steps;if(!collision(x,z+dz/steps))z+=dz/steps}pos.x=x/S;pos.y=z/S;if(f||side)bob+=dt*8;camera.position.set(x,1.55+(f||side?Math.sin(bob)*.018:0),z)}
 camera.rotation.set(pitch,-pos.a-Math.PI/2,0,'YXZ');
 if(anim){const p=Math.min(1,(t-anim.start)/anim.duration);if(anim.kind==='shower'){animated.showerCurtain.scale.x=.28+.72*Math.min(1,p*3);animated.showerCurtain.position.x=-.48*(1-Math.min(1,p*3));animated.water.visible=true;animated.water.children.forEach(m=>{m.position.y-=dt*2.8;if(m.position.y<.48)m.position.y=2})}else if(anim.kind==='brush'){hands.visible=true;hands.position.x=Math.sin(t*.023)*.04;hands.position.y=Math.cos(t*.019)*.025}else if(anim.id==='clear_chair'){animated.chairClothes.position.y=Math.sin(p*Math.PI)*.35;animated.chairClothes.position.x=p*.8;animated.chairClothes.visible=p<.92}else {hands.visible=true;hands.position.y=-.2+Math.sin(p*Math.PI)*.17}if(p>=1){hands.visible=false;animated.water.visible=false;anim=null;refresh(flags)}}
 const next=area();if(next!==roomName){roomName=next;onArea(next)}if(t-targetUpdated>100){updateTarget();targetUpdated=t}renderer.render(scene,camera);requestAnimationFrame(tick)}
function refresh(f){flags=f;animated.chairClothes.visible=!f.chairCleared;animated.dishes.visible=!f.kitchenClean;animated.trash.visible=!f.kitchenClean;if(f.bedMade){animated.blanket.position.z=.12;animated.blanket.scale.z=1.35}animated.curtains.forEach((c,i)=>c.position.x=(i?1:-1)*(f.windowOpen?.87:.61))}
canvas.addEventListener('pointerdown',e=>{if(!running||['panel','computer','mirror-mode'].some(id=>!document.getElementById(id).classList.contains('hidden')))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;pos.a-=(e.clientX-drag.x)*.005;pitch=Math.max(-.85,Math.min(.6,pitch-(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY});for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>drag=null);
function tapMove(key){if(['panel','computer','mirror-mode'].some(id=>!document.getElementById(id).classList.contains('hidden'))||anim)return;if(key==='turnLeft'||key==='turnRight'){pos.a+=(key==='turnRight'?1:-1)*.22;return}const f=key==='forward'?1:key==='back'?-1:0,side=key==='right'?1:key==='left'?-1:0,dx=(Math.cos(pos.a)*f-Math.sin(pos.a)*side)*.3,dz=(Math.sin(pos.a)*f+Math.cos(pos.a)*side)*.3;let x=pos.x*S,z=pos.y*S;for(let i=0;i<6;i++){if(!collision(x+dx/6,z))x+=dx/6;if(!collision(x,z+dz/6))z+=dz/6}pos.x=x/S;pos.y=z/S;camera.position.set(x,1.55,z)}
for(const b of document.querySelectorAll('#move-pad button')){let pressedAt=0;b.addEventListener('pointerdown',e=>{e.preventDefault();pressedAt=performance.now();b.setPointerCapture(e.pointerId);held.add(b.dataset.move)});b.addEventListener('click',()=>{if(performance.now()-pressedAt<250)tapMove(b.dataset.move)});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>held.delete(b.dataset.move))}

window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,[contenteditable]'))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);if(running)e.preventDefault()}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();held.clear();drag=null});window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);document.getElementById('interact').onclick=()=>{held.clear();keys.clear();if(target)onInteract(target.id)};
window.PassingWorld={start(c){onInteract=c.interact;onArea=c.area;pos={x:5.5,y:15.4,a:-Math.PI/2};pitch=-.55;camera.position.set(pos.x*S,1.55,pos.y*S);roomName='';resize();if(!running){running=true;last=performance.now();requestAnimationFrame(tick)}},stop(){running=false;held.clear();keys.clear()},setGoal(id){goal=id},refresh,getPosition(){return {...pos}},isRunning(){return running},teleport(x,y,a){pos={x,y,a};camera.position.set(x*S,1.55,y*S)},focus(id){const i=items.find(i=>i.id===id);if(i)pos.a=Math.atan2(i.z-pos.y*S,i.x-pos.x*S)},animate(kind,duration,id){anim={kind,duration,id,start:performance.now()}},inspect(){return {position:{...pos},room:area(),objects:items.length,meshCount:scene.children.length,renderer:'WebGL geometry'}}};
