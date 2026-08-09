import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/loaders/FBXLoader.js";

window.addEventListener("error",e=>{
  console.error("Bio3D runtime error:",e.error||e.message);
  const s=document.getElementById("voiceStatus");
  if(s)s.textContent="Bio3D detectó un error. Puedes ejecutar el diagnóstico.";
});
window.addEventListener("unhandledrejection",e=>{
  console.error("Bio3D promise error:",e.reason);
});


const canvas=document.querySelector("#scene");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x06131b,0.055);

const camera=new THREE.PerspectiveCamera(38,1,.1,100);
camera.position.set(0,1.25,7.2);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.target.set(0,1.25,0);
controls.minDistance=.45; controls.maxDistance=12;

scene.add(new THREE.HemisphereLight(0xdaf8ff,0x15222a,2.7));
const key=new THREE.DirectionalLight(0xffffff,4.2);key.position.set(4,7,5);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x62cfe6,2);rim.position.set(-4,3,-3);scene.add(rim);

const boneMat=new THREE.MeshStandardMaterial({color:0xe8dfc8,roughness:.7,metalness:.02});
const jointMat=new THREE.MeshStandardMaterial({color:0xf0e9d7,roughness:.65});
const selectMat=new THREE.MeshStandardMaterial({color:0x42d9ee,emissive:0x0a4652,roughness:.45});
const tissueMat=new THREE.MeshStandardMaterial({color:0xd9c3a6,roughness:.9});
const cellMat=new THREE.MeshStandardMaterial({color:0x9fdbe7,roughness:.5,transparent:true,opacity:.92});

const anatomy=new THREE.Group();scene.add(anatomy);
const parts={};

function addPart(key,mesh,label,info,facts){
  mesh.userData={key,label,info,facts};mesh.castShadow=true;mesh.receiveShadow=true;
  anatomy.add(mesh);(parts[key]??=[]).push(mesh);return mesh;
}
function cyl(radiusTop,radiusBottom,height,segments=18){return new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments)}
function sphere(r,ws=24,hs=18){return new THREE.SphereGeometry(r,ws,hs)}
function makeBone(key,geo,pos,rot=[0,0,0],label,info,facts,mat=boneMat){
  const m=new THREE.Mesh(geo,mat.clone());m.position.set(...pos);m.rotation.set(...rot);return addPart(key,m,label,info,facts)
}
const meta={
  craneo:["Cráneo","Conjunto de huesos que protege el encéfalo y forma la estructura de la cara.","Protege el cerebro y contiene cavidades para órganos de los sentidos."],
  columna:["Columna vertebral","Eje óseo central del cuerpo, formado por vértebras.","En el adulto suele describirse como 33 vértebras originales, algunas fusionadas."],
  pelvis:["Pelvis","Anillo óseo que conecta la columna con los miembros inferiores.","Transmite el peso corporal hacia las extremidades inferiores."],
  humero:["Húmero","Hueso largo del brazo entre hombro y codo.","Articula con la escápula, radio y cúbito."],
  femur:["Fémur","Hueso largo del muslo entre cadera y rodilla.","Es el hueso más largo y resistente del cuerpo humano."],
  tibia:["Tibia","Hueso principal de carga de la pierna, entre rodilla y tobillo.","Soporta gran parte del peso corporal en la pierna."]
};

// Skull + jaw
makeBone("craneo",sphere(.38),[0,2.85,0],[0,0,0],...meta.craneo);
makeBone("craneo",new THREE.BoxGeometry(.42,.18,.30),[0,2.52,.03],[0,0,0],...meta.craneo,jointMat);
// spine vertebrae
for(let i=0;i<14;i++){
  makeBone("columna",new THREE.BoxGeometry(.16,.10,.12),[0,2.34-i*.095,0],[0,0,0],...meta.columna);
}
// ribs
for(let i=0;i<6;i++){
  const y=2.15-i*.13;
  const left=new THREE.Mesh(new THREE.TorusGeometry(.33+i*.03,.025,8,24,Math.PI*.85),boneMat.clone());
  left.position.set(-.015,y,0);left.rotation.set(Math.PI/2,0,Math.PI/2+.2);
  addPart("columna",left,...meta.columna);
  const right=left.clone();right.material=boneMat.clone();right.scale.x=-1;addPart("columna",right,...meta.columna);
}
// pelvis
const pelvisGeo=new THREE.TorusGeometry(.42,.12,12,28,Math.PI);
makeBone("pelvis",pelvisGeo,[0,1.05,0],[Math.PI/2,0,0],...meta.pelvis);
makeBone("pelvis",new THREE.BoxGeometry(.28,.16,.18),[0,.95,0],[0,0,0],...meta.pelvis);
// clavicles
makeBone("humero",cyl(.035,.035,.55),[-.28,2.28,0],[0,0,Math.PI/2+.18],...meta.humero);
makeBone("humero",cyl(.035,.035,.55),[.28,2.28,0],[0,0,Math.PI/2-.18],...meta.humero);

// arms
makeBone("humero",cyl(.075,.055,.92),[-.58,1.78,0],[0,0,-.18],...meta.humero);
makeBone("humero",cyl(.075,.055,.92),[.58,1.78,0],[0,0,.18],...meta.humero);
makeBone("humero",cyl(.045,.035,.78),[-.74,.95,0],[0,0,-.10],...meta.humero);
makeBone("humero",cyl(.045,.035,.78),[.74,.95,0],[0,0,.10],...meta.humero);

// legs
makeBone("femur",cyl(.105,.078,1.08),[-.23,.43,0],[0,0,.06],...meta.femur);
makeBone("femur",cyl(.105,.078,1.08),[.23,.43,0],[0,0,-.06],...meta.femur);
makeBone("tibia",cyl(.075,.052,.98),[-.25,-.62,0],[0,0,.02],...meta.tibia);
makeBone("tibia",cyl(.075,.052,.98),[.25,-.62,0],[0,0,-.02],...meta.tibia);
// knees + feet
makeBone("tibia",sphere(.10,16,12),[-.25,-.05,.05],[0,0,0],...meta.tibia,jointMat);
makeBone("tibia",sphere(.10,16,12),[.25,-.05,.05],[0,0,0],...meta.tibia,jointMat);
makeBone("tibia",new THREE.BoxGeometry(.18,.08,.42),[-.25,-1.15,.12],[0,0,0],...meta.tibia);
makeBone("tibia",new THREE.BoxGeometry(.18,.08,.42),[.25,-1.15,.12],[0,0,0],...meta.tibia);


// Bio3D v0.3: atlas óseo ampliado
const extraMeta={
 radio:["Radio","Hueso lateral del antebrazo, del lado del pulgar.","Participa de forma importante en la articulación de la muñeca."],
 cubito:["Cúbito (ulna)","Hueso medial del antebrazo.","Forma una parte principal de la articulación del codo."],
 rotula:["Rótula","Hueso sesamoideo situado delante de la rodilla.","Protege la articulación y mejora la palanca del cuádriceps."],
 perone:["Peroné (fíbula)","Hueso lateral y delgado de la pierna.","Contribuye a la estabilidad del tobillo."],
 esternon:["Esternón","Hueso plano en la zona anterior del tórax.","Se articula con clavículas y cartílagos costales."],
 escapula:["Escápula","Hueso plano de la cintura escapular.","Conecta funcionalmente el miembro superior con el tronco."]
};
makeBone("esternon",new THREE.BoxGeometry(.12,.72,.07),[0,1.93,.26],[0,0,0],...extraMeta.esternon);
makeBone("escapula",new THREE.BoxGeometry(.34,.48,.055),[-.32,1.92,-.18],[0,.15,-.12],...extraMeta.escapula);
makeBone("escapula",new THREE.BoxGeometry(.34,.48,.055),[.32,1.92,-.18],[0,-.15,.12],...extraMeta.escapula);
makeBone("radio",cyl(.038,.03,.72),[-.80,.93,.06],[0,0,-.09],...extraMeta.radio);
makeBone("radio",cyl(.038,.03,.72),[.80,.93,.06],[0,0,.09],...extraMeta.radio);
makeBone("cubito",cyl(.035,.027,.72),[-.69,.93,-.04],[0,0,-.09],...extraMeta.cubito);
makeBone("cubito",cyl(.035,.027,.72),[.69,.93,-.04],[0,0,.09],...extraMeta.cubito);
makeBone("rotula",sphere(.085,18,14),[-.25,-.05,.14],[0,0,0],...extraMeta.rotula);
makeBone("rotula",sphere(.085,18,14),[.25,-.05,.14],[0,0,0],...extraMeta.rotula);
makeBone("perone",cyl(.035,.028,.91),[-.39,-.62,-.02],[0,0,-.02],...extraMeta.perone);
makeBone("perone",cyl(.035,.028,.91),[.39,-.62,-.02],[0,0,.02],...extraMeta.perone);

const tissueGroup=new THREE.Group();tissueGroup.visible=false;scene.add(tissueGroup);
const cortical=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,2.0,32,1,true),tissueMat);
cortical.rotation.z=Math.PI/2;tissueGroup.add(cortical);
for(let i=0;i<14;i++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.10+i*.022,.012,8,28),boneMat.clone());
  ring.rotation.y=Math.PI/2;ring.position.x=(i%2?-.45:.45);ring.position.y=(Math.random()-.5)*.5;ring.position.z=(Math.random()-.5)*.5;
  tissueGroup.add(ring);
}

const cellGroup=new THREE.Group();cellGroup.visible=false;scene.add(cellGroup);
for(let i=0;i<22;i++){
  const c=new THREE.Mesh(sphere(.055,16,12),cellMat.clone());
  c.position.set((Math.random()-.5)*1.7,(Math.random()-.5)*1.05,(Math.random()-.5)*.7);
  cellGroup.add(c);
}
const nucleus=new THREE.Mesh(sphere(.16),new THREE.MeshStandardMaterial({color:0x397f8c,roughness:.45}));
cellGroup.add(nucleus);

let selectedKey=null, currentLevel="bone", educationLevel="secondary";
const nameEl=document.querySelector("#structureName"),descEl=document.querySelector("#description"),
factsEl=document.querySelector("#facts"),breadcrumb=document.querySelector("#breadcrumb"),status=document.querySelector("#voiceStatus");

function clearSelection(){
  Object.values(parts).flat().forEach(m=>m.material = (m.userData.key==="craneo" && m.geometry.type==="BoxGeometry")?jointMat.clone():boneMat.clone());
}
function selectStructure(key){
  if(importedModel && importedMeshIndex[key]?.length){
    selectImportedStructure(key);
    return;
  }
  if(!parts[key])return;
  clearSelection();selectedKey=key;
  markVisited(key);
  parts[key].forEach(m=>m.material=selectMat.clone());
  const m=parts[key][0];
  const label=m.userData.label;
  nameEl.textContent=label;
  descEl.textContent=educationLevel==="secondary" ? m.userData.info : `${m.userData.info} En nivel universitario se estudian además sus relaciones articulares, irrigación, inserciones y correlaciones clínicas.`;
  factsEl.textContent=m.userData.facts;
  breadcrumb.textContent=`Sistema esquelético › ${label}`;
  const box=new THREE.Box3();parts[key].forEach(x=>box.expandByObject(x));
  const center=box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(1.8,.8,2.6)));
}
function showBone(){
  currentLevel="bone";if(importedModel) importedModel.visible=true; anatomy.visible=!importedModel;tissueGroup.visible=false;cellGroup.visible=false;
  controls.target.set(0,1.15,0);camera.position.set(0,1.25,7.2);
  setLevelButtons("levelBone");breadcrumb.textContent=selectedKey?`Sistema esquelético › ${parts[selectedKey][0].userData.label}`:"Sistema esquelético";
}
function showTissue(){
  currentLevel="tissue";anatomy.visible=false;if(importedModel) importedModel.visible=false;tissueGroup.visible=true;cellGroup.visible=false;
  controls.target.set(0,0,0);camera.position.set(2.8,1.6,3.3);
  nameEl.textContent="Tejido óseo";
  descEl.textContent=educationLevel==="secondary"?"El tejido óseo combina una matriz mineral resistente con células vivas.":"El tejido óseo incluye matriz extracelular mineralizada, osteoblastos, osteocitos y osteoclastos, organizados en tejido cortical y trabecular.";
  factsEl.textContent="La organización microscópica permite resistencia mecánica y remodelación continua.";
  breadcrumb.textContent="Sistema esquelético › Tejido óseo";
  setLevelButtons("levelTissue");
}
function showCell(){
  currentLevel="cell";anatomy.visible=false;if(importedModel) importedModel.visible=false;tissueGroup.visible=false;cellGroup.visible=true;
  controls.target.set(0,0,0);camera.position.set(2.0,1.2,2.8);
  nameEl.textContent="Osteocito";
  descEl.textContent=educationLevel==="secondary"?"El osteocito es una célula madura del tejido óseo que ayuda a mantener el hueso.":"El osteocito deriva del osteoblasto, permanece alojado en lagunas óseas y participa en mecanosensación y regulación del remodelado.";
  factsEl.textContent="Los osteocitos se comunican mediante prolongaciones celulares alojadas en canalículos.";
  breadcrumb.textContent="Sistema esquelético › Tejido óseo › Osteocito";
  setLevelButtons("levelCell");
}
function setLevelButtons(id){["levelBone","levelTissue","levelCell"].forEach(x=>document.getElementById(x).classList.toggle("active",x===id))}
document.getElementById("levelBone").onclick=showBone;
document.getElementById("levelTissue").onclick=showTissue;
document.getElementById("levelCell").onclick=showCell;

document.querySelectorAll(".structure").forEach(b=>b.onclick=()=>{showBone();selectStructure(b.dataset.structure)});
document.getElementById("secondaryBtn").onclick=()=>{educationLevel="secondary";document.getElementById("secondaryBtn").classList.add("active");document.getElementById("universityBtn").classList.remove("active");if(selectedKey&&currentLevel==="bone")selectStructure(selectedKey);else if(currentLevel==="tissue")showTissue();else if(currentLevel==="cell")showCell()};
document.getElementById("universityBtn").onclick=()=>{educationLevel="university";document.getElementById("universityBtn").classList.add("active");document.getElementById("secondaryBtn").classList.remove("active");if(selectedKey&&currentLevel==="bone")selectStructure(selectedKey);else if(currentLevel==="tissue")showTissue();else if(currentLevel==="cell")showCell()};


// Construye botones para las nuevas estructuras del atlas
const atlasNames={
 craneo:"Cráneo",columna:"Columna vertebral",pelvis:"Pelvis",humero:"Húmero",femur:"Fémur",tibia:"Tibia",
 radio:"Radio",cubito:"Cúbito (ulna)",rotula:"Rótula",perone:"Peroné (fíbula)",esternon:"Esternón",escapula:"Escápula"
};
const left=document.querySelector(".left-panel");
Object.entries(atlasNames).forEach(([key,label])=>{
 if(document.querySelector(`[data-structure="${key}"]`)) return;
 const b=document.createElement("button");b.className="structure";b.dataset.structure=key;b.textContent=label;
 b.onclick=()=>{showBone();selectStructure(key)};left.appendChild(b);
});
const search=document.getElementById("boneSearch");
search.addEventListener("input",()=>{
 const q=normalize(search.value);
 document.querySelectorAll(".structure").forEach(b=>b.style.display=normalize(b.textContent).includes(q)?"block":"none");
});

// Carga local opcional de un modelo GLB/GLTF anatómico.
let importedModel=null;
document.getElementById("loadModelBtn").onclick=()=>document.getElementById("modelFile").click();
document.getElementById("modelFile").onchange=e=>{
 const file=e.target.files?.[0]; if(!file)return;
 const url=URL.createObjectURL(file);
 const ext=(file.name.split(".").pop()||"").toLowerCase();

 const finishModel=(model)=>{
   if(importedModel)scene.remove(importedModel);
   importedModel=model;
   importedModel.name=file.name;
   importedModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
   const box=new THREE.Box3().setFromObject(importedModel);
   const size=box.getSize(new THREE.Vector3());
   const maxDim=Math.max(size.x,size.y,size.z,.0001);
   const scale=3.8/maxDim;
   importedModel.scale.multiplyScalar(scale);
   const box2=new THREE.Box3().setFromObject(importedModel);
   const c2=box2.getCenter(new THREE.Vector3());
   importedModel.position.sub(c2);
   scene.add(importedModel);
   anatomy.visible=false;tissueGroup.visible=false;cellGroup.visible=false;
   controls.target.set(0,0,0);camera.position.set(0,0,5);
   nameEl.textContent="Modelo anatómico importado";
   descEl.textContent=`${file.name} cargado localmente. Bio3D está analizando sus mallas anatómicas.`;
   factsEl.textContent="Prueba comandos de voz o exporta el mapa de mallas para revisar la nomenclatura.";
   if(file.name.toLowerCase().includes("skeletalsystem100")){
     document.getElementById("modelProfile").value="zanatomy";
   }
   indexImportedModel(importedModel);
   setTimeout(()=>{inspectImportedModel();fitImportedModel()},100);
   URL.revokeObjectURL(url);
 };

 if(ext==="fbx"){
   const loader=new FBXLoader();
   loader.load(url,obj=>finishModel(obj),undefined,err=>{
     console.error(err);status.textContent="No se pudo cargar ese FBX.";URL.revokeObjectURL(url);
   });
 }else{
   const loader=new GLTFLoader();
   loader.load(url,gltf=>finishModel(gltf.scene),undefined,err=>{
     console.error(err);status.textContent="No se pudo cargar ese GLB/GLTF.";URL.revokeObjectURL(url);
   });
 }
};

// Idioma de reconocimiento de voz
const speechLang={es:"es-ES",en:"en-US",it:"it-IT",ar:"ar-SA",zh:"zh-CN"};

// Bio3D v0.4 — reconocimiento semántico simple de mallas importadas
const anatomyAliases={
  craneo:["craneo","cranium","skull","cranio"],
  columna:["columna","spine","vertebra","vertebral","vertebrae"],
  pelvis:["pelvis","hip","coxal"],
  humero:["humero","humerus"],
  femur:["femur","femoral"],
  tibia:["tibia"],
  radio:["radio","radius"],
  cubito:["cubito","ulna"],
  rotula:["rotula","patella"],
  perone:["perone","fibula"],
  esternon:["esternon","sternum"],
  escapula:["escapula","scapula","shoulderblade"]
};

let importedMeshIndex={};

function cleanName(s=""){
  return normalize(String(s).replace(/[_\-.]+/g," "));
}
function indexImportedModel(rootModel){
  importedMeshIndex={};
  rootModel.traverse(o=>{
    if(!o.isMesh) return;
    const n=cleanName(o.name);
    Object.entries(anatomyAliases).forEach(([key,aliases])=>{
      if(aliases.some(a=>n.includes(cleanName(a)))){
        (importedMeshIndex[key]??=[]).push(o);
      }
    });
  });
  const found=Object.keys(importedMeshIndex).map(k=>atlasNames[k]||k);
  status.textContent=found.length
    ? `Modelo analizado: encontré ${found.join(", ")}.`
    : "Modelo cargado, pero no encontré nombres anatómicos reconocibles en sus mallas.";
}
function resetImportedHighlight(){
  if(!importedModel) return;
  importedModel.traverse(o=>{
    if(o.isMesh && o.userData._bio3dOriginalMaterial){
      o.material=o.userData._bio3dOriginalMaterial;
    }
  });
}
function selectImportedStructure(key){
  const meshes=importedMeshIndex[key];
  if(!importedModel || !meshes?.length) return false;
  resetImportedHighlight();
  meshes.forEach(m=>{
    if(!m.userData._bio3dOriginalMaterial) m.userData._bio3dOriginalMaterial=m.material;
    m.material=selectMat.clone();
  });
  anatomy.visible=false;
  tissueGroup.visible=false;
  cellGroup.visible=false;
  importedModel.visible=true;

  const box=new THREE.Box3();
  meshes.forEach(m=>box.expandByObject(m));
  const center=box.getCenter(new THREE.Vector3());
  const size=box.getSize(new THREE.Vector3());
  const maxDim=Math.max(size.x,size.y,size.z,.25);
  controls.target.copy(center);
  camera.position.copy(center.clone().add(new THREE.Vector3(maxDim*2.2,maxDim*.8,maxDim*2.6)));

  const label=atlasNames[key]||key;
  nameEl.textContent=label;
  const procedural=parts[key]?.[0]?.userData;
  descEl.textContent=procedural?.info || `Estructura identificada dentro del modelo anatómico importado: ${label}.`;
  factsEl.textContent=procedural?.facts || "Bio3D ha localizado esta estructura a partir del nombre de sus mallas.";
  breadcrumb.textContent=`Modelo importado › ${label}`;
  selectedKey=key;
  markVisited(key);
  return true;
}

// Síntesis de voz
let availableVoices=[];
function refreshVoices(){
  availableVoices=speechSynthesis.getVoices();
  const sel=document.getElementById("voiceSelect");
  const lang=speechLang[document.getElementById("language").value]||"es-ES";
  const base=lang.slice(0,2).toLowerCase();
  const matching=availableVoices.filter(v=>v.lang?.toLowerCase().startsWith(base));
  const pool=matching.length?matching:availableVoices;
  sel.innerHTML="";
  pool.forEach((v,i)=>{
    const op=document.createElement("option");
    op.value=availableVoices.indexOf(v);
    op.textContent=`${v.name} (${v.lang})`;
    sel.appendChild(op);
  });
}
if("speechSynthesis" in window){
  refreshVoices();
  speechSynthesis.onvoiceschanged=refreshVoices;
}
function speakCurrent(){
  if(!("speechSynthesis" in window)){
    status.textContent="Síntesis de voz no disponible en este navegador.";
    return;
  }
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(`${nameEl.textContent}. ${descEl.textContent} ${factsEl.textContent}`);
  const lang=speechLang[document.getElementById("language").value]||"es-ES";
  u.lang=lang;
  const idx=Number(document.getElementById("voiceSelect").value);
  if(Number.isFinite(idx) && availableVoices[idx]) u.voice=availableVoices[idx];
  u.rate=Number(document.getElementById("speechRate").value)||1;
  speechSynthesis.speak(u);
}
document.getElementById("speakBtn").onclick=speakCurrent;
document.getElementById("language").addEventListener("change",refreshVoices);


const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
canvas.addEventListener("pointerdown",e=>{
  if(currentLevel!=="bone")return;
  const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(anatomy.children,true)[0];
  if(hit?.object?.userData?.key)selectStructure(hit.object.userData.key);
});

function normalize(t){return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function command(text){
  const t=normalize(text);
  const map=[["craneo","craneo"],["skull","craneo"],["cranio","craneo"],["columna","columna"],["spine","columna"],["pelvis","pelvis"],["humero","humero"],["humerus","humero"],["femur","femur"],["tibia","tibia"],["radio","radio"],["radius","radio"],["cubito","cubito"],["ulna","cubito"],["rotula","rotula"],["patella","rotula"],["perone","perone"],["fibula","perone"],["esternon","esternon"],["sternum","esternon"],["escapula","escapula"],["scapula","escapula"]];
  for(const [word,key] of map){if(t.includes(word)){showBone();selectStructure(key);return}}
  if(t.includes("tejido")){showTissue();return}
  if(t.includes("celula")||t.includes("osteocito")){showCell();return}
  if(t.includes("mas cerca")||t.includes("acerca")){camera.position.lerp(controls.target,.28);return}
  if(t.includes("aleja")||t.includes("alejar")){camera.position.sub(controls.target).multiplyScalar(1.35).add(controls.target);return}
  if(t.includes("vista completa")||t.includes("cuerpo completo")){showBone();return}
  status.textContent="No reconocí esa estructura todavía.";
}

document.getElementById("mic").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){status.textContent="El navegador no ofrece reconocimiento de voz.";return}
  const r=new SR();r.lang=speechLang[document.getElementById("language").value]||"es-ES";r.interimResults=false;r.continuous=false;r.start();status.textContent="Escuchando…";
  r.onresult=e=>{const text=e.results[0][0].transcript;status.textContent=`Oí: “${text}”`;command(text)};
  r.onerror=()=>status.textContent="No pude escuchar. Inténtalo otra vez.";
};


// Bio3D v0.5 — interfaz multilingüe
const I18N={
 es:{secondary:"Secundaria",university:"Universidad",systems:"Sistemas",skeleton:"Esqueleto",muscles:"Músculos",organs:"Órganos",nervous:"Nervioso",tissues:"Tejidos",boneAtlas:"Atlas óseo",searchBone:"Buscar hueso…",loadModel:"Cargar modelo GLB/GLTF",modelNote:"Puedes sustituir el esqueleto procedural por un modelo anatómico 3D propio.",viewerHint:"Arrastra para rotar · rueda/pellizco para zoom · toca un hueso para seleccionarlo",bone:"Hueso",tissue:"Tejido",cell:"Célula",factsTitle:"Datos",voiceExplanation:"Explicación por voz",listen:"Escuchar",voice:"Voz",speed:"Velocidad",voiceCommands:"Comandos de voz"},
 en:{secondary:"Secondary",university:"University",systems:"Systems",skeleton:"Skeleton",muscles:"Muscles",organs:"Organs",nervous:"Nervous",tissues:"Tissues",boneAtlas:"Bone atlas",searchBone:"Search bone…",loadModel:"Load GLB/GLTF model",modelNote:"You can replace the procedural skeleton with your own anatomical 3D model.",viewerHint:"Drag to rotate · wheel/pinch to zoom · tap a bone to select it",bone:"Bone",tissue:"Tissue",cell:"Cell",factsTitle:"Facts",voiceExplanation:"Voice explanation",listen:"Listen",voice:"Voice",speed:"Speed",voiceCommands:"Voice commands"},
 it:{secondary:"Secondaria",university:"Università",systems:"Sistemi",skeleton:"Scheletro",muscles:"Muscoli",organs:"Organi",nervous:"Nervoso",tissues:"Tessuti",boneAtlas:"Atlante osseo",searchBone:"Cerca osso…",loadModel:"Carica modello GLB/GLTF",modelNote:"Puoi sostituire lo scheletro procedurale con un modello anatomico 3D.",viewerHint:"Trascina per ruotare · rotella/pizzico per zoom · tocca un osso per selezionarlo",bone:"Osso",tissue:"Tessuto",cell:"Cellula",factsTitle:"Dati",voiceExplanation:"Spiegazione vocale",listen:"Ascolta",voice:"Voce",speed:"Velocità",voiceCommands:"Comandi vocali"},
 ar:{secondary:"الثانوية",university:"الجامعة",systems:"الأجهزة",skeleton:"الهيكل العظمي",muscles:"العضلات",organs:"الأعضاء",nervous:"العصبي",tissues:"الأنسجة",boneAtlas:"أطلس العظام",searchBone:"ابحث عن عظم…",loadModel:"تحميل نموذج GLB/GLTF",modelNote:"يمكنك استبدال الهيكل الافتراضي بنموذج تشريحي ثلاثي الأبعاد.",viewerHint:"اسحب للتدوير · قرّب للتكبير · المس عظماً لتحديده",bone:"عظم",tissue:"نسيج",cell:"خلية",factsTitle:"معلومات",voiceExplanation:"شرح صوتي",listen:"استمع",voice:"الصوت",speed:"السرعة",voiceCommands:"أوامر صوتية"},
 zh:{secondary:"中学",university:"大学",systems:"系统",skeleton:"骨骼",muscles:"肌肉",organs:"器官",nervous:"神经",tissues:"组织",boneAtlas:"骨骼图谱",searchBone:"搜索骨骼…",loadModel:"加载 GLB/GLTF 模型",modelNote:"你可以用自己的三维解剖模型替换程序生成的骨架。",viewerHint:"拖动旋转 · 滚轮/捏合缩放 · 点击骨骼选择",bone:"骨骼",tissue:"组织",cell:"细胞",factsTitle:"信息",voiceExplanation:"语音讲解",listen:"播放",voice:"声音",speed:"速度",voiceCommands:"语音命令"}
};
function applyLanguage(){
 const lang=document.getElementById("language").value;
 const dict=I18N[lang]||I18N.es;
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==="ar"?"rtl":"ltr";
 document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(dict[k])el.textContent=dict[k]});
 document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{const k=el.dataset.i18nPlaceholder;if(dict[k])el.placeholder=dict[k]});
 refreshVoices();
}
document.getElementById("language").addEventListener("change",applyLanguage);

// Sinónimos de voz en los cinco idiomas
Object.assign(anatomyAliases,{
 craneo:[...anatomyAliases.craneo,"teschio","جمجمة","头骨","颅骨"],
 columna:[...anatomyAliases.columna,"colonna vertebrale","عمود فقري","脊柱"],
 pelvis:[...anatomyAliases.pelvis,"bacino","حوض","骨盆"],
 humero:[...anatomyAliases.humero,"omero","عظم العضد","肱骨"],
 femur:[...anatomyAliases.femur,"femore","عظم الفخذ","股骨"],
 tibia:[...anatomyAliases.tibia,"tibia","قصبة الساق","胫骨"],
 radio:[...anatomyAliases.radio,"radio","كعبرة","桡骨"],
 cubito:[...anatomyAliases.cubito,"ulna","زند","尺骨"],
 rotula:[...anatomyAliases.rotula,"rotula","رضفة","髌骨"],
 perone:[...anatomyAliases.perone,"perone","شظية","腓骨"],
 esternon:[...anatomyAliases.esternon,"sterno","قص","胸骨"],
 escapula:[...anatomyAliases.escapula,"scapola","لوح الكتف","肩胛骨"]
});

// Amplía el reconocimiento de comandos usando los alias multilingües
const originalCommand=command;
command=function(text){
 const t=normalize(text);
 for(const [key,aliases] of Object.entries(anatomyAliases)){
   if(aliases.some(a=>t.includes(normalize(a)))){
     showBone();selectStructure(key);return;
   }
 }
 const tissueWords=["tejido","tissue","tessuto","نسيج","组织"];
 const cellWords=["celula","cell","cellula","خلية","细胞","osteocito","osteocyte"];
 if(tissueWords.some(w=>t.includes(normalize(w)))){showTissue();return}
 if(cellWords.some(w=>t.includes(normalize(w)))){showCell();return}
 originalCommand(text);
};
applyLanguage();





























// Bio3D v3.2 Device Test — pruebas guiadas de navegador/dispositivo
const DEVICE_KEY="bio3d_device_report_v32";
let deviceReport={tests:{},issues:[]};

function detectBrowser(){
 const ua=navigator.userAgent;
 if(/Edg/i.test(ua))return "Edge";
 if(/Chrome/i.test(ua))return "Chrome";
 if(/Safari/i.test(ua)&&!/Chrome/i.test(ua))return "Safari";
 if(/Firefox/i.test(ua))return "Firefox";
 return "Otro";
}
function testWebGL(){
 try{
   const c=document.createElement("canvas");
   return !!(c.getContext("webgl2")||c.getContext("webgl"));
 }catch(e){return false}
}
function renderDeviceInfo(){
 document.getElementById("deviceBrowser").textContent=detectBrowser();
 document.getElementById("deviceScreen").textContent=`${screen.width}×${screen.height}`;
 document.getElementById("deviceTouch").textContent=(navigator.maxTouchPoints||0)>0?`${navigator.maxTouchPoints} punto(s)`:"No detectado";
 document.getElementById("deviceWebgl").textContent=testWebGL()?"✓":"✗";
 document.getElementById("deviceVoice").textContent=(window.SpeechRecognition||window.webkitSpeechRecognition||window.speechSynthesis)?"Disponible":"Limitado";
 document.getElementById("deviceMemory").textContent=navigator.deviceMemory?`${navigator.deviceMemory} GB`:"No informado";
}
function runDeviceTest(){
 renderDeviceInfo();
 deviceReport.tests={
   onlineAtTest:navigator.onLine,
   serviceWorker:("serviceWorker" in navigator),
   cacheApi:("caches" in window),
   browser:detectBrowser(),
   screen:`${screen.width}x${screen.height}`,
   touchPoints:navigator.maxTouchPoints||0,
   webgl:testWebGL(),
   voice:!!(window.SpeechRecognition||window.webkitSpeechRecognition||window.speechSynthesis),
   deviceMemory:navigator.deviceMemory||null,
   pixelRatio:window.devicePixelRatio||1,
   online:navigator.onLine,
   userAgent:navigator.userAgent,
   testedAt:new Date().toISOString()
 };
 localStorage.setItem(DEVICE_KEY,JSON.stringify(deviceReport));
 const failures=[];
 if(!deviceReport.tests.webgl)failures.push("WebGL");
 if(!deviceReport.tests.voice)failures.push("voz");
 document.getElementById("deviceTestStatus").textContent=failures.length
   ?`Prueba completada con limitaciones: ${failures.join(", ")}.`
   :"Prueba básica completada. Continúa con toque, voz y navegación 3D.";
}
document.getElementById("runDeviceTestBtn").onclick=runDeviceTest;

document.getElementById("touchTestBtn").onclick=()=>{
 const canvas=document.getElementById("scene");
 canvas.classList.add("touch-pulse");
 document.getElementById("deviceTestStatus").textContent="Toca y arrastra el modelo 3D. Si responde, marca la prueba táctil como verificada.";
 setTimeout(()=>canvas.classList.remove("touch-pulse"),1800);
};

document.getElementById("voiceTestBtn").onclick=()=>{
 const btn=document.getElementById("speakBtn");
 if(btn){btn.click();document.getElementById("deviceTestStatus").textContent="Prueba de salida de voz iniciada. Si escuchas la explicación, la síntesis funciona."}
};

document.getElementById("saveIssueBtn").onclick=()=>{
 const notes=document.getElementById("issueNotes").value.trim();
 if(!notes){status.textContent="Escribe primero una incidencia.";return}
 deviceReport.issues=deviceReport.issues||[];
 deviceReport.issues.push({date:new Date().toISOString(),notes,screen:`${innerWidth}x${innerHeight}`,browser:detectBrowser()});
 localStorage.setItem(DEVICE_KEY,JSON.stringify(deviceReport));
 document.getElementById("issueNotes").value="";
 document.getElementById("deviceTestStatus").textContent=`Incidencia guardada. Total: ${deviceReport.issues.length}`;
};

document.getElementById("exportDeviceReportBtn").onclick=()=>{
 runDeviceTest();
 const payload={
   app:"Bio3D v3.2 Device Test",
   device:deviceReport.tests,
   issues:deviceReport.issues||[],
   classroomChecklist:Object.fromEntries([...document.querySelectorAll(".rc-test")].map(c=>[c.dataset.test,c.checked])),
   classProgress:classState,
   exportedAt:new Date().toISOString()
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="Bio3D_device_report.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
};
try{
 const saved=JSON.parse(localStorage.getItem(DEVICE_KEY)||"null");
 if(saved)deviceReport=saved;
}catch(e){}
renderDeviceInfo();

// Bio3D v3.1 RC — checklist de validación para aula
const RC_TEST_KEY="bio3d_rc_tests_v31";
function loadRcTests(){
 let state={};try{state=JSON.parse(localStorage.getItem(RC_TEST_KEY)||"{}")}catch(e){}
 document.querySelectorAll(".rc-test").forEach(c=>{c.checked=!!state[c.dataset.test];c.onchange=saveRcTests});
 renderRcTests();
}
function saveRcTests(){
 const state={};document.querySelectorAll(".rc-test").forEach(c=>state[c.dataset.test]=c.checked);
 localStorage.setItem(RC_TEST_KEY,JSON.stringify(state));renderRcTests();
}
function renderRcTests(){
 const all=[...document.querySelectorAll(".rc-test")],done=all.filter(c=>c.checked).length;
 const el=document.getElementById("rcReadiness");
 el.textContent=`Preparación: ${done}/${all.length} pruebas verificadas${done===all.length?" · ✓ Lista para prueba controlada en aula":""}`;
}
document.getElementById("resetRcTestsBtn").onclick=()=>{localStorage.removeItem(RC_TEST_KEY);document.querySelectorAll(".rc-test").forEach(c=>c.checked=false);renderRcTests()};
loadRcTests();

// Bio3D v3.0 Beta — estabilización, diagnóstico, respaldo y rendimiento
const BIO3D_DATA_KEYS=[
 "bio3d_class_progress_v28",
 "bio3d_lessons_v29",
 "bio3d_history_v29",
 "bio3d-learning-v07",
 "bio3d-profile-v09",
 "bio3d-app-v1",
 "bio3d-exact-mesh-map-v15"
];

function storageAvailable(){
 try{
   const k="__bio3d_test__";localStorage.setItem(k,"1");localStorage.removeItem(k);return true;
 }catch(e){return false}
}
function runDiagnostics(){
 const voiceOk=!!(window.SpeechRecognition||window.webkitSpeechRecognition||window.speechSynthesis);
 const storageOk=storageAvailable();
 document.getElementById("diagRenderer").textContent=renderer?"✓":"✗";
 document.getElementById("diagVoice").textContent=voiceOk?"✓":"No disponible";
 document.getElementById("diagStorage").textContent=storageOk?"✓":"✗";
 document.getElementById("diagModel").textContent=importedModel||importedMuscleModel?"Cargado":"No cargado";
 status.textContent=voiceOk&&storageOk?"Diagnóstico completado: funciones principales disponibles.":"Diagnóstico completado con limitaciones del navegador.";
}
document.getElementById("runDiagnosticsBtn").onclick=runDiagnostics;

document.getElementById("backupDataBtn").onclick=()=>{
 const payload={version:"3.0-beta",exportedAt:new Date().toISOString(),data:{}};
 BIO3D_DATA_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)payload.data[k]=v});
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="Bio3D_respaldo_v3.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
 status.textContent="Respaldo exportado.";
};
document.getElementById("restoreDataFile").onchange=async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{
    const payload=JSON.parse(await file.text());
    if(!payload?.data || typeof payload.data!=="object") throw new Error("Formato inválido");
    Object.entries(payload.data).forEach(([k,v])=>{
      if(BIO3D_DATA_KEYS.includes(k) && typeof v==="string") localStorage.setItem(k,v);
    });
    status.textContent="Respaldo importado. Recarga Bio3D para aplicar todos los datos.";
  }catch(err){
    console.error(err);
    status.textContent="No se pudo importar el respaldo.";
  }
};

let lowPower=false;
document.getElementById("lowPowerBtn").onclick=()=>{
 lowPower=!lowPower;document.body.classList.toggle("low-power",lowPower);
 renderer.setPixelRatio(lowPower?1:Math.min(devicePixelRatio,2));
 document.getElementById("lowPowerBtn").textContent=lowPower?"⚙️ Rendimiento activado":"⚙️ Modo rendimiento";
 status.textContent=lowPower?"Modo rendimiento activado para móviles/equipos lentos.":"Modo de calidad normal.";
};

// Prevent duplicate tour counting and repeated lesson history due to rapid clicks
let actionLock=false;
function withActionLock(fn){
 if(actionLock)return;actionLock=true;
 try{fn()}finally{setTimeout(()=>actionLock=false,250)}
}

// Mobile visibility helpers
function ensurePanelInView(el){
 if(!el)return;el.scrollIntoView({block:"nearest",behavior:lowPower?"auto":"smooth"});
}
["tourSelect","urinarySelect","endocrineSelect","organSelect","muscleSelect"].forEach(id=>{
 const el=document.getElementById(id);if(el)el.addEventListener("change",()=>ensurePanelInView(el));
});

// Diagnostics on load
setTimeout(runDiagnostics,600);

// Bio3D v2.9 Beta — lecciones, objetivos, historial y CSV
const LESSON_KEY="bio3d_lessons_v29";
const HISTORY_KEY="bio3d_history_v29";
let lessons=[],history=[],activeLessonId=null;
function loadTeachingData(){
 try{lessons=JSON.parse(localStorage.getItem(LESSON_KEY)||"[]")}catch(e){lessons=[]}
 try{history=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")}catch(e){history=[]}
 renderLessons();renderHistory();
}
function saveTeachingData(){
 localStorage.setItem(LESSON_KEY,JSON.stringify(lessons));
 localStorage.setItem(HISTORY_KEY,JSON.stringify(history));
 renderLessons();renderHistory();
}
function renderLessons(){
 const s=document.getElementById("lessonList");if(!s)return;
 s.innerHTML='<option value="">Seleccionar lección…</option>';
 lessons.forEach(l=>{const o=document.createElement("option");o.value=l.id;o.textContent=`${l.completed?"✓ ":""}${l.title}`;s.appendChild(o)});
}
function renderHistory(){
 const box=document.getElementById("historyBox");if(!box)return;
 if(!history.length){box.textContent="Todavía no hay resultados.";return}
 box.innerHTML=history.slice().reverse().slice(0,20).map(h=>`<div class="history-item"><b>${h.type}</b> · ${h.detail}<br><small>${h.date}</small></div>`).join("");
}
function logHistory(type,detail){
 history.push({type,detail,date:new Date().toLocaleString(),student:classState.student||"Sin nombre",level:educationLevel});
 if(history.length>200)history=history.slice(-200);saveTeachingData();
}
document.getElementById("createLessonBtn").onclick=()=>{
 const title=document.getElementById("lessonTitle").value.trim();
 const objective=document.getElementById("lessonObjective").value.trim();
 const system=document.getElementById("lessonSystem").value;
 if(!title||!objective){status.textContent="Escribe título y objetivo de aprendizaje.";return}
 const lesson={id:"L"+Date.now(),title,objective,system,level:educationLevel,completed:false,created:new Date().toLocaleString()};
 lessons.push(lesson);saveTeachingData();document.getElementById("lessonList").value=lesson.id;
 document.getElementById("lessonStatus").textContent=`Creada: ${title}`;
};
function launchLesson(lesson){
 activeLessonId=lesson.id;
 const tourMap={skeletal:"skeletal",muscular:"muscular",nervous:"nervous",cardio:"whole_body",respiratory:"organs",digestive:"organs",urinary:"urinary",endocrine:"whole_body"};
 document.getElementById("tourSelect").value=tourMap[lesson.system]||"whole_body";
 document.getElementById("startTourBtn").click();
 document.getElementById("lessonStatus").textContent=`Lección activa: ${lesson.title} · Objetivo: ${lesson.objective}`;
 nameEl.textContent=lesson.title;descEl.textContent=lesson.objective;factsEl.textContent=`Nivel: ${lesson.level==="university"?"Universidad":"Secundaria"}`;
 logHistory("Lección iniciada",lesson.title);
}
document.getElementById("startLessonBtn").onclick=()=>{
 const id=document.getElementById("lessonList").value,lesson=lessons.find(x=>x.id===id);
 if(!lesson){status.textContent="Selecciona una lección.";return}launchLesson(lesson);
};
document.getElementById("completeLessonBtn").onclick=()=>{
 const id=activeLessonId||document.getElementById("lessonList").value,lesson=lessons.find(x=>x.id===id);
 if(!lesson){status.textContent="No hay una lección activa.";return}
 lesson.completed=true;lesson.completedAt=new Date().toLocaleString();
 classState.points+=25;saveClassState();logHistory("Lección completada",lesson.title);saveTeachingData();
 document.getElementById("lessonStatus").textContent=`✓ Lección completada: ${lesson.title}`;
};

function csvEscape(v){const s=String(v??"");return `"${s.replaceAll('"','""')}"`}
document.getElementById("exportCsvBtn").onclick=()=>{
 const rows=[["Fecha","Estudiante","Nivel","Tipo","Detalle"]];
 history.forEach(h=>rows.push([h.date,h.student,h.level,h.type,h.detail]));
 rows.push([]);
 rows.push(["RESUMEN"]);
 rows.push(["Estudiante",classState.student||"Sin nombre"]);
 rows.push(["Preguntas",classState.questions]);
 rows.push(["Correctas",classState.correct]);
 rows.push(["Puntos",classState.points]);
 rows.push(["Recorridos",classState.toursCompleted]);
 rows.push(["Progreso",progressPercent()+"%"]);
 const csv="\uFEFF"+rows.map(r=>r.map(csvEscape).join(",")).join("\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="Bio3D_historial.csv";a.click();URL.revokeObjectURL(url);
};

// Record quiz results in history by observing feedback changes
const quizFeedback=document.getElementById("quizFeedback");
new MutationObserver(()=>{
 const txt=quizFeedback.textContent.trim();
 if(txt.startsWith("✓"))logHistory("Quiz","Respuesta correcta");
 else if(txt.startsWith("✗"))logHistory("Quiz","Respuesta incorrecta");
}).observe(quizFeedback,{childList:true,characterData:true,subtree:true});

// Extend teacher stats with lessons
const renderClassStateV28=renderClassState;
renderClassState=function(){
 renderClassStateV28();
 const stats=document.getElementById("teacherStats");if(stats){
  const done=lessons.filter(x=>x.completed).length;
  stats.innerHTML+=`<br>Lecciones: ${lessons.length} · Completadas: ${done}`;
 }
};
loadTeachingData();

// Bio3D v2.8 Beta — aula, modo profesor y progreso persistente
const CLASS_KEY="bio3d_class_progress_v28";
let classState={student:"",questions:0,correct:0,points:0,toursCompleted:0,systems:{}};
function loadClassState(){
 try{const x=JSON.parse(localStorage.getItem(CLASS_KEY)||"null");if(x)classState={...classState,...x}}catch(e){}
 document.getElementById("studentName").value=classState.student||"";
 renderClassState();
}
function saveClassState(){localStorage.setItem(CLASS_KEY,JSON.stringify(classState));renderClassState()}
function progressPercent(){
 const quizScore=Math.min(60,classState.correct*10);
 const tourScore=Math.min(40,classState.toursCompleted*10);
 return Math.min(100,quizScore+tourScore);
}
function renderClassState(){
 const p=progressPercent();
 document.getElementById("progressText").textContent=p+"%";
 document.getElementById("progressFill").style.width=p+"%";
 document.getElementById("scoreCard").textContent=`Preguntas: ${classState.questions} · Correctas: ${classState.correct} · Puntos: ${classState.points}`;
 document.getElementById("teacherStats").innerHTML=
  `Estudiante: <b>${classState.student||"Sin nombre"}</b><br>`+
  `Recorridos completados: ${classState.toursCompleted}<br>`+
  `Preguntas respondidas: ${classState.questions}<br>`+
  `Aciertos: ${classState.correct}<br>`+
  `Precisión: ${classState.questions?Math.round(classState.correct/classState.questions*100):0}%<br>`+
  `Progreso global: ${p}%`;
}
document.getElementById("saveStudentBtn").onclick=()=>{classState.student=document.getElementById("studentName").value.trim();saveClassState();status.textContent="Perfil de estudiante guardado en este dispositivo."};
document.getElementById("resetProgressBtn").onclick=()=>{classState={student:document.getElementById("studentName").value.trim(),questions:0,correct:0,points:0,toursCompleted:0,systems:{}};saveClassState()};
document.getElementById("classMode").onchange=e=>{document.getElementById("teacherPanel").style.display=e.target.value==="teacher"?"block":"none"};
document.getElementById("exportProgressBtn").onclick=()=>{
 const report=`Bio3D v2.8 - Progreso educativo\nEstudiante: ${classState.student||"Sin nombre"}\nNivel: ${educationLevel}\nPreguntas: ${classState.questions}\nCorrectas: ${classState.correct}\nPuntos: ${classState.points}\nRecorridos completados: ${classState.toursCompleted}\nProgreso: ${progressPercent()}%\n`;
 const blob=new Blob([report],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="Bio3D_progreso.txt";a.click();URL.revokeObjectURL(url);
};

// larger level-aware question bank
const QUESTION_BANK={
 secondary:[
  {system:"skeletal",q:"¿Qué protege principalmente el cráneo?",a:["Encéfalo","Corazón","Pulmones"],correct:0},
  {system:"muscular",q:"¿Qué músculo flexiona de forma importante el codo?",a:["Bíceps braquial","Glúteo mayor","Gastrocnemio"],correct:0},
  {system:"nervous",q:"¿Qué estructura conecta el encéfalo con gran parte del cuerpo?",a:["Médula espinal","Aorta","Esófago"],correct:0},
  {system:"cardio",q:"¿Qué órgano bombea la sangre?",a:["Corazón","Hígado","Riñón"],correct:0},
  {system:"respiratory",q:"¿Qué órganos realizan el intercambio gaseoso?",a:["Pulmones","Riñones","Intestinos"],correct:0},
  {system:"digestive",q:"¿Dónde ocurre gran parte de la absorción de nutrientes?",a:["Intestino delgado","Vejiga","Tráquea"],correct:0},
  {system:"urinary",q:"¿Qué órganos producen la orina?",a:["Riñones","Uréteres","Vejiga"],correct:0},
  {system:"endocrine",q:"¿Qué glándula está en el cuello?",a:["Tiroides","Hipófisis","Suprarrenal"],correct:0}
 ],
 university:[
  {system:"skeletal",q:"¿Qué vértebra cervical se denomina atlas?",a:["C1","C2","C7"],correct:0},
  {system:"muscular",q:"¿Cuál es una acción principal del bíceps braquial?",a:["Supinación del antebrazo","Extensión de rodilla","Flexión plantar"],correct:0},
  {system:"nervous",q:"¿Qué nervio inerva principalmente el deltoides?",a:["Axilar","Tibial","Femoral"],correct:0},
  {system:"cardio",q:"¿Qué vaso emerge del ventrículo izquierdo?",a:["Aorta","Vena cava superior","Arteria pulmonar derecha"],correct:0},
  {system:"respiratory",q:"¿Dónde ocurre la difusión principal de gases?",a:["Membrana alveolocapilar","Tráquea","Bronquio principal"],correct:0},
  {system:"digestive",q:"¿Qué órgano produce bilis?",a:["Hígado","Estómago","Colon"],correct:0},
  {system:"urinary",q:"¿Qué proceso inicia la formación de orina en el corpúsculo renal?",a:["Filtración glomerular","Peristalsis","Ventilación"],correct:0},
  {system:"endocrine",q:"¿Qué células pancreáticas producen insulina?",a:["Células beta","Células alfa","Células C tiroideas"],correct:0}
 ]
};
function questionForCurrentTour(){
 const tourMap={whole_body:null,skeletal:"skeletal",muscular:"muscular",nervous:"nervous",organs:null,urinary:"urinary"};
 const sys=tourMap[tourState.name];
 let pool=QUESTION_BANK[educationLevel]||QUESTION_BANK.secondary;
 if(sys)pool=pool.filter(x=>x.system===sys);
 return pool[Math.floor(Math.random()*pool.length)];
}
showTourQuiz=function(){
 const q=questionForCurrentTour();if(!q)return;
 document.getElementById("quizQuestion").textContent=q.q;
 const box=document.getElementById("quizAnswers");box.innerHTML="";
 document.getElementById("quizFeedback").textContent="";
 q.a.forEach((ans,i)=>{
  const b=document.createElement("button");b.textContent=ans;
  b.onclick=()=>{
   classState.questions++;
   classState.systems[q.system]=(classState.systems[q.system]||0)+1;
   if(i===q.correct){classState.correct++;classState.points+=educationLevel==="university"?15:10;document.getElementById("quizFeedback").textContent="✓ Correcto";}
   else document.getElementById("quizFeedback").textContent="✗ Incorrecto. Revisa la estructura y vuelve a intentarlo.";
   saveClassState();
   [...box.children].forEach(x=>x.disabled=true);
  };
  box.appendChild(b);
 });
};

// Track completed tours when reaching final step
const renderTourStepV27=renderTourStep;
renderTourStep=function(){
 renderTourStepV27();
 const steps=TOURS[tourState.name]||[];
 if(steps.length&&tourState.index===steps.length-1&&!tourState._counted){
  classState.toursCompleted++;classState.points+=20;tourState._counted=true;saveClassState();
 }
};
document.getElementById("startTourBtn").addEventListener("click",()=>{tourState._counted=false});

// teacher voice shortcut
const commandV27=command;
command=function(text){
 const t=normalize(text);
 if(t.includes("modo profesor")||t.includes("teacher mode")){document.getElementById("classMode").value="teacher";document.getElementById("classMode").dispatchEvent(new Event("change"));return}
 if(t.includes("modo estudiante")||t.includes("student mode")){document.getElementById("classMode").value="student";document.getElementById("classMode").dispatchEvent(new Event("change"));return}
 commandV27(text);
};
loadClassState();

// Bio3D v2.7 Beta — educación global, quiz contextual y sistema endocrino
const endocrineGroup=new THREE.Group();scene.add(endocrineGroup);endocrineGroup.visible=false;
const glandMat=new THREE.MeshStandardMaterial({color:0xc77a9d,roughness:.72});
function gland(name,pos,scale){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,22,16),glandMat.clone());
 m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;endocrineGroup.add(m);return m;
}
const ENDOCRINE={
 pituitary:{name:"Hipófisis",objects:[gland("pituitary",[0,2.68,.05],[.055,.04,.05])]},
 thyroid:{name:"Tiroides",objects:[gland("thyroid_left",[-.055,2.30,.08],[.06,.12,.045]),gland("thyroid_right",[.055,2.30,.08],[.06,.12,.045])]},
 adrenals:{name:"Glándulas suprarrenales",objects:[gland("adrenal_left",[-.30,1.31,-.10],[.09,.055,.07]),gland("adrenal_right",[.30,1.31,-.10],[.09,.055,.07])]},
 pancreas:{name:"Páncreas endocrino",objects:[gland("pancreas",[0,1.18,.08],[.34,.07,.07])]}
};
const ENDOCRINE_LEVEL={
 secondary:{
  pituitary:"La hipófisis produce hormonas que regulan otras glándulas y varias funciones corporales.",
  thyroid:"La tiroides produce hormonas relacionadas con el metabolismo y el crecimiento.",
  adrenals:"Las suprarrenales producen hormonas que participan en la respuesta al estrés y el equilibrio de sales.",
  pancreas:"El páncreas endocrino produce hormonas como insulina y glucagón para regular la glucosa."
 },
 university:{
  pituitary:"La adenohipófisis y neurohipófisis participan en ejes endocrinos que regulan crecimiento, reproducción, función tiroidea, corteza suprarrenal y balance hídrico.",
  thyroid:"Las células foliculares producen T4/T3 bajo control del eje hipotálamo-hipófisis-tiroides; las células C producen calcitonina.",
  adrenals:"La corteza suprarrenal sintetiza mineralocorticoides, glucocorticoides y andrógenos; la médula libera catecolaminas.",
  pancreas:"Los islotes pancreáticos contienen células beta, alfa y delta, entre otras, relacionadas con insulina, glucagón y somatostatina."
 }
};
function showEndocrine(key){
 const d=ENDOCRINE[key];if(!d)return;
 endocrineGroup.visible=true;Object.values(ENDOCRINE).flatMap(x=>x.objects).forEach(o=>o.visible=false);d.objects.forEach(o=>o.visible=true);
 const box=new THREE.Box3();d.objects.forEach(o=>box.expandByObject(o));
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),dist=Math.max(s.x,s.y,s.z,.12);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(dist*2,dist*.7,dist*2.7)));
 nameEl.textContent=d.name;descEl.textContent=ENDOCRINE_LEVEL[educationLevel]?.[key]||ENDOCRINE_LEVEL.secondary[key];
 factsEl.textContent=educationLevel==="university"?"Nivel universitario: regulación hormonal integrada.":"Nivel secundaria: función hormonal principal.";
 breadcrumb.textContent=`Sistema endocrino › ${d.name}`;
}
document.getElementById("showEndocrineBtn").onclick=()=>showEndocrine(document.getElementById("endocrineSelect").value);

// Education-level enrichment for major existing systems
const EDUCATION_GLOBAL={
 secondary:{
  heart:"El corazón funciona como una bomba que mantiene la sangre circulando por el cuerpo.",
  brain:"El cerebro recibe información, controla movimientos y participa en memoria, pensamiento y emociones.",
  lungs:"Los pulmones permiten incorporar oxígeno y eliminar dióxido de carbono.",
  liver:"El hígado procesa nutrientes y ayuda a eliminar sustancias del organismo.",
  deltoid:"El deltoides ayuda a levantar el brazo hacia un lado."
 },
 university:{
  heart:"El corazón genera gradientes de presión mediante ciclos coordinados de sístole y diástole y mantiene los circuitos pulmonar y sistémico.",
  brain:"El cerebro integra redes corticales y subcorticales responsables de procesamiento sensorial, control motor y funciones cognitivas superiores.",
  lungs:"La ventilación y perfusión pulmonar permiten difusión de O₂ y CO₂ a través de la membrana alveolocapilar.",
  liver:"El hígado integra metabolismo de carbohidratos, lípidos y proteínas, síntesis plasmática, biotransformación y producción biliar.",
  deltoid:"El deltoides posee porciones clavicular, acromial y espinal; la porción media es un importante abductora glenohumeral."
 }
};
function applyEducationalOverride(key){
 const txt=EDUCATION_GLOBAL[educationLevel]?.[key];
 if(txt)descEl.textContent=txt;
}
const showOrganV26=showOrgan;
showOrgan=function(key){showOrganV26(key);applyEducationalOverride(key)};
const showCnsV26=showCns;
showCns=function(key){showCnsV26(key);applyEducationalOverride(key)};
const selectMuscleV26=selectMuscle;
selectMuscle=function(key){selectMuscleV26(key);applyEducationalOverride(key)};

// Quiz engine
const QUIZZES={
 whole_body:[
  {q:"¿Qué sistema proporciona soporte estructural al cuerpo?",a:["Sistema esquelético","Sistema digestivo","Sistema endocrino"],correct:0},
  {q:"¿Qué órgano impulsa la sangre por la circulación?",a:["Riñón","Corazón","Hígado"],correct:1}
 ],
 skeletal:[
  {q:"¿Qué estructura protege principalmente al encéfalo?",a:["Pelvis","Cráneo","Fémur"],correct:1}
 ],
 muscular:[
  {q:"¿Qué músculo participa de forma importante en la flexión del codo?",a:["Bíceps braquial","Gastrocnemio","Glúteo mayor"],correct:0}
 ],
 nervous:[
  {q:"¿Qué estructura comunica el encéfalo con gran parte del cuerpo?",a:["Médula espinal","Estómago","Aorta"],correct:0}
 ],
 organs:[
  {q:"¿Dónde ocurre principalmente el intercambio gaseoso?",a:["Pulmones","Hígado","Vejiga"],correct:0}
 ],
 urinary:[
  {q:"¿Qué estructuras producen la orina?",a:["Uréteres","Riñones","Vejiga"],correct:1}
 ]
};
function showTourQuiz(){
 const list=QUIZZES[tourState.name]||QUIZZES.whole_body;
 const q=list[Math.floor(Math.random()*list.length)];
 document.getElementById("quizQuestion").textContent=q.q;
 const box=document.getElementById("quizAnswers");box.innerHTML="";
 document.getElementById("quizFeedback").textContent="";
 q.a.forEach((ans,i)=>{
  const b=document.createElement("button");b.textContent=ans;
  b.onclick=()=>{document.getElementById("quizFeedback").textContent=i===q.correct?"✓ Correcto":"✗ Revisa la estructura y vuelve a intentarlo."};
  box.appendChild(b);
 });
}
document.getElementById("tourQuizBtn").onclick=showTourQuiz;

// add endocrine to voice
const commandV26=command;
command=function(text){
 const t=normalize(text);
 const eAliases={pituitary:["hipofisis","pituitary","ipofisi"],thyroid:["tiroides","thyroid","tiroide"],adrenals:["suprarrenales","adrenal","surrenali"],pancreas:["pancreas endocrino","endocrine pancreas"]};
 for(const [key,list] of Object.entries(eAliases))if(list.some(a=>t.includes(normalize(a)))){showEndocrine(key);return}
 if(t.includes("pregunta del recorrido")||t.includes("quiz")){showTourQuiz();return}
 commandV26(text);
};

// Bio3D v2.6 Beta — sistema urinario, recorridos y contenido por nivel
const urinaryGroup=new THREE.Group();scene.add(urinaryGroup);urinaryGroup.visible=false;
const urinaryMat=new THREE.MeshStandardMaterial({color:0x8c4a5b,roughness:.72});
const bladderMat=new THREE.MeshStandardMaterial({color:0xb97c8c,roughness:.72});
const urineTubeMat=new THREE.MeshStandardMaterial({color:0xd8c4a4,roughness:.75});

function urinaryEllipsoid(name,pos,scale,mat){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),mat.clone());
 m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;urinaryGroup.add(m);return m;
}
const uKidneyL=urinaryEllipsoid("urinary_kidney_left",[-.30,1.08,-.12],[.13,.23,.11],urinaryMat);
const uKidneyR=urinaryEllipsoid("urinary_kidney_right",[.30,1.08,-.12],[.13,.23,.11],urinaryMat);
const uBladder=urinaryEllipsoid("urinary_bladder",[0,.52,.05],[.18,.16,.16],bladderMat);
const uUreterL=tubeBetween([-.30,.90,-.10],[-.09,.62,.03],urineTubeMat,.018);uUreterL.name="ureter_left";urinaryGroup.add(uUreterL);
const uUreterR=tubeBetween([[.30,.90,-.10],[.09,.62,.03]][0],[[.30,.90,-.10],[.09,.62,.03]][1],urineTubeMat,.018);uUreterR.name="ureter_right";urinaryGroup.add(uUreterR);
const uUrethra=tubeBetween([0,.43,.05],[0,.22,.05],urineTubeMat,.017);uUrethra.name="urethra";urinaryGroup.add(uUrethra);

const URINARY={
 kidneys:{objects:[uKidneyL,uKidneyR],name:"Riñones"},
 ureters:{objects:[uUreterL,uUreterR],name:"Uréteres"},
 bladder:{objects:[uBladder],name:"Vejiga"},
 urethra:{objects:[uUrethra],name:"Uretra"}
};

const LEVEL_CONTENT={
 secondary:{
  kidneys:"Los riñones filtran la sangre y producen la orina.",
  ureters:"Los uréteres llevan la orina desde los riñones hasta la vejiga.",
  bladder:"La vejiga almacena temporalmente la orina.",
  urethra:"La uretra conduce la orina desde la vejiga hacia el exterior."
 },
 university:{
  kidneys:"Los riñones regulan volumen, osmolaridad y equilibrio ácido-base, participan en funciones endocrinas y forman orina mediante filtración, reabsorción y secreción.",
  ureters:"Los uréteres son conductos musculares retroperitoneales que transportan orina mediante peristalsis desde la pelvis renal hasta la vejiga.",
  bladder:"La vejiga urinaria es un órgano muscular distensible cuyo detrusor participa en el almacenamiento y la micción.",
  urethra:"La uretra es el conducto de salida del tracto urinario inferior y presenta diferencias anatómicas importantes según el sexo."
 }
};
function showUrinary(key){
 const item=URINARY[key];if(!item)return;
 urinaryGroup.visible=true;
 Object.values(URINARY).flatMap(x=>x.objects).forEach(o=>o.visible=false);
 item.objects.forEach(o=>o.visible=true);
 const box=new THREE.Box3();item.objects.forEach(o=>box.expandByObject(o));
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.15);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(d*2,d*.7,d*2.5)));
 nameEl.textContent=item.name;
 descEl.textContent=LEVEL_CONTENT[educationLevel]?.[key]||LEVEL_CONTENT.secondary[key];
 factsEl.textContent=educationLevel==="university"?"Nivel universitario: anatomía funcional y fisiología integrada.":"Nivel secundaria: función principal y ubicación general.";
 breadcrumb.textContent=`Sistema urinario › ${item.name}`;
}
document.getElementById("showUrinaryBtn").onclick=()=>showUrinary(document.getElementById("urinarySelect").value);

// Educational level now updates urinary content too
const secBtn=document.getElementById("secondaryBtn"),uniBtn=document.getElementById("universityBtn");
secBtn.addEventListener("click",()=>{const k=document.getElementById("urinarySelect").value;if(k)showUrinary(k)});
uniBtn.addEventListener("click",()=>{const k=document.getElementById("urinarySelect").value;if(k)showUrinary(k)});

// Guided tours
const TOURS={
 whole_body:[
  {label:"Esqueleto",fn:()=>{document.getElementById("layerPreset").value="skeleton";applyPreset("skeleton")}},
  {label:"Músculos",fn:()=>{document.getElementById("layerPreset").value="musculoskeletal";applyPreset("musculoskeletal")}},
  {label:"Sistema nervioso",fn:()=>{document.getElementById("layerPreset").value="neuro";applyPreset("neuro")}},
  {label:"Corazón y circulación",fn:()=>{document.getElementById("layerPreset").value="cardio";applyPreset("cardio")}},
  {label:"Órganos internos",fn:()=>{document.getElementById("layerPreset").value="viscera";applyPreset("viscera")}},
  {label:"Sistema urinario",fn:()=>showUrinary("kidneys")}
 ],
 skeletal:[
  {label:"Cráneo",fn:()=>{showBone();selectStructure("craneo")}},
  {label:"Columna",fn:()=>{showBone();selectStructure("columna")}},
  {label:"Pelvis",fn:()=>{showBone();selectStructure("pelvis")}},
  {label:"Fémur",fn:()=>{showBone();selectStructure("femur")}}
 ],
 muscular:[
  {label:"Deltoides",fn:()=>selectMuscle("deltoid")},
  {label:"Bíceps",fn:()=>selectMuscle("biceps_brachii")},
  {label:"Cuádriceps",fn:()=>selectMuscle("quadriceps")},
  {label:"Gastrocnemio",fn:()=>selectMuscle("gastrocnemius")}
 ],
 nervous:[
  {label:"Cerebro",fn:()=>showCns("brain")},
  {label:"Médula espinal",fn:()=>showCns("spinal_cord")},
  {label:"Nervio ciático",fn:()=>showNerve("sciatic")},
  {label:"Nervio radial",fn:()=>showNerve("radial")}
 ],
 organs:[
  {label:"Corazón",fn:()=>showOrgan("heart")},
  {label:"Pulmones",fn:()=>showOrgan("lungs")},
  {label:"Hígado",fn:()=>showOrgan("liver")},
  {label:"Intestino delgado",fn:()=>showDigest("small_intestine")}
 ],
 urinary:[
  {label:"Riñones",fn:()=>showUrinary("kidneys")},
  {label:"Uréteres",fn:()=>showUrinary("ureters")},
  {label:"Vejiga",fn:()=>showUrinary("bladder")},
  {label:"Uretra",fn:()=>showUrinary("urethra")}
 ]
};
let tourState={name:null,index:-1};
function renderTourStep(){
 const steps=TOURS[tourState.name]||[];
 if(!steps.length||tourState.index<0)return;
 const step=steps[tourState.index];step.fn();
 document.getElementById("tourStatus").textContent=`${tourState.index+1}/${steps.length} · ${step.label}`;
}
document.getElementById("startTourBtn").onclick=()=>{tourState.name=document.getElementById("tourSelect").value;tourState.index=0;renderTourStep()};
document.getElementById("tourPrevBtn").onclick=()=>{if(tourState.index>0){tourState.index--;renderTourStep()}};
document.getElementById("tourNextBtn").onclick=()=>{const steps=TOURS[tourState.name]||[];if(tourState.index<steps.length-1){tourState.index++;renderTourStep()}};

// Add urinary system to multicayer opacity behavior
const setSystemVisibilityV25=setSystemVisibility;
setSystemVisibility=function(config){
 setSystemVisibilityV25(config);
 urinaryGroup.visible=!!config.organs;
};
const opacityOrgans=document.getElementById("opacityOrgans");
opacityOrgans.addEventListener("input",e=>setObjectOpacity(urinaryGroup,Number(e.target.value)/100));

// Voice
const commandV25=command;
command=function(text){
 const t=normalize(text);
 const uAliases={
  kidneys:["rinones","kidneys","reni"],
  ureters:["ureteres","ureters","ureteri"],
  bladder:["vejiga","bladder","vescica"],
  urethra:["uretra","urethra"]
 };
 for(const [key,list] of Object.entries(uAliases))if(list.some(a=>t.includes(normalize(a)))){showUrinary(key);return}
 if(t.includes("recorrido cuerpo")||t.includes("tour cuerpo completo")){document.getElementById("tourSelect").value="whole_body";document.getElementById("startTourBtn").click();return}
 commandV25(text);
};

// Bio3D v2.5 Beta — cuerpo completo multicapa y opacidad por sistema
function setObjectOpacity(root,opacity){
 if(!root)return;
 root.traverse(o=>{
  if(!o.isMesh)return;
  if(!o.userData._bio3dOpacityBase)o.userData._bio3dOpacityBase=o.material;
  const base=o.userData._bio3dOpacityBase;
  const mat=base.clone();
  mat.transparent=opacity<.999;
  mat.opacity=opacity;
  mat.depthWrite=opacity>.35;
  o.material=mat;
 });
}
function skeletonRoot(){return importedModel||anatomy}
function muscleRoot(){return importedMuscleModel||muscleGroup}
function setSystemVisibility(config){
 const sk=skeletonRoot(),mu=muscleRoot();
 if(sk)sk.visible=!!config.skeleton;
 if(mu)mu.visible=!!config.muscle;
 nerveGroup.visible=!!config.nerve;
 cnsGroup.visible=!!config.nerve;
 circulationGroup.visible=!!config.circulation;
 organGroup.visible=!!config.organs;
 respiratoryGroup.visible=!!config.organs;
 digestiveGroup.visible=!!config.organs;
 attachmentGroup.visible=false;tendonGroup.visible=false;
}
const PRESETS={
 all:{skeleton:true,muscle:true,nerve:true,circulation:true,organs:true},
 skeleton:{skeleton:true,muscle:false,nerve:false,circulation:false,organs:false},
 musculoskeletal:{skeleton:true,muscle:true,nerve:false,circulation:false,organs:false},
 neuro:{skeleton:true,muscle:false,nerve:true,circulation:false,organs:false},
 cardio:{skeleton:false,muscle:false,nerve:false,circulation:true,organs:true},
 viscera:{skeleton:false,muscle:false,nerve:false,circulation:false,organs:true}
};
function applyPreset(name){
 const p=PRESETS[name]||PRESETS.all;setSystemVisibility(p);
 if(p.organs){
  Object.values(organs).flat().forEach(o=>o.visible=true);
  Object.values(digestiveObjects).flat().forEach(o=>o.visible=true);
  respiratoryGroup.children.forEach(o=>o.visible=true);
 }
 if(p.nerve){nerveGroup.visible=true;cnsGroup.visible=true;Object.values(cns).flat().forEach(o=>o.visible=true)}
 if(p.circulation){circulationGroup.visible=true;Object.values(vesselSets).flat().forEach(o=>o.visible=true)}
 controls.target.set(0,1.25,0);camera.position.set(0,1.4,5.3);controls.update();
 nameEl.textContent="Cuerpo completo multicapa";
 descEl.textContent="Combina sistemas anatómicos y ajusta su transparencia para estudiar relaciones espaciales.";
 factsEl.textContent=`Vista activa: ${document.getElementById("layerPreset").selectedOptions[0].textContent}.`;
 breadcrumb.textContent="Atlas › Cuerpo completo multicapa";
}
document.getElementById("applyLayerPresetBtn").onclick=()=>applyPreset(document.getElementById("layerPreset").value);

const opacityBindings=[
 ["opacitySkeleton",()=>skeletonRoot()],
 ["opacityMuscle",()=>muscleRoot()],
 ["opacityNerve",()=>nerveGroup],
 ["opacityCirculation",()=>circulationGroup],
 ["opacityOrgans",()=>organGroup]
];
opacityBindings.forEach(([id,getRoot])=>{
 document.getElementById(id).oninput=e=>{
  const v=Number(e.target.value)/100;
  setObjectOpacity(getRoot(),v);
  if(id==="opacityNerve")setObjectOpacity(cnsGroup,v);
  if(id==="opacityOrgans"){setObjectOpacity(respiratoryGroup,v);setObjectOpacity(digestiveGroup,v)}
 };
});
document.getElementById("resetLayersBtn").onclick=()=>{
 document.getElementById("opacitySkeleton").value=100;
 document.getElementById("opacityMuscle").value=85;
 document.getElementById("opacityNerve").value=100;
 document.getElementById("opacityCirculation").value=100;
 document.getElementById("opacityOrgans").value=90;
 setObjectOpacity(skeletonRoot(),1);setObjectOpacity(muscleRoot(),.85);
 setObjectOpacity(nerveGroup,1);setObjectOpacity(cnsGroup,1);setObjectOpacity(circulationGroup,1);
 setObjectOpacity(organGroup,.9);setObjectOpacity(respiratoryGroup,.9);setObjectOpacity(digestiveGroup,.9);
 document.getElementById("layerPreset").value="all";applyPreset("all");
};

// voice presets
const commandV24=command;
command=function(text){
 const t=normalize(text);
 if(t.includes("cuerpo completo")||t.includes("todo el cuerpo")||t.includes("whole body")){document.getElementById("layerPreset").value="all";applyPreset("all");return}
 if(t.includes("solo esqueleto")||t.includes("skeleton only")){document.getElementById("layerPreset").value="skeleton";applyPreset("skeleton");return}
 if(t.includes("musculo y esqueleto")||t.includes("musculoskeletal")){document.getElementById("layerPreset").value="musculoskeletal";applyPreset("musculoskeletal");return}
 if(t.includes("vista nerviosa")||t.includes("nervous system view")){document.getElementById("layerPreset").value="neuro";applyPreset("neuro");return}
 if(t.includes("vista circulatoria")||t.includes("circulatory view")){document.getElementById("layerPreset").value="cardio";applyPreset("cardio");return}
 commandV24(text);
};

// Bio3D v2.4 Beta — SNC, vías respiratorias y aparato digestivo
const cnsGroup=new THREE.Group();scene.add(cnsGroup);cnsGroup.visible=false;
const respiratoryGroup=new THREE.Group();scene.add(respiratoryGroup);respiratoryGroup.visible=false;
const digestiveGroup=new THREE.Group();scene.add(digestiveGroup);digestiveGroup.visible=false;

const brainMat=new THREE.MeshStandardMaterial({color:0xc98f9d,roughness:.78});
const cordMat=new THREE.MeshStandardMaterial({color:0xe0b6a8,roughness:.75});
const airwayMat=new THREE.MeshStandardMaterial({color:0xbfc9d6,roughness:.65});
const digestiveMat=new THREE.MeshStandardMaterial({color:0xc07f67,roughness:.78});
const intestineMat=new THREE.MeshStandardMaterial({color:0xd49a7f,roughness:.8});

function eMesh(name,pos,scale,mat,group){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat.clone());
 m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;group.add(m);return m;
}

// CNS
const cns={
 brain:[eMesh("brain",[0,2.82,0],[.34,.30,.31],brainMat,cnsGroup)],
 cerebellum:[eMesh("cerebellum",[0,2.60,-.22],[.22,.14,.16],brainMat,cnsGroup)],
 brainstem:[eMesh("brainstem",[0,2.50,-.02],[.08,.18,.08],cordMat,cnsGroup)],
 spinal_cord:[]
};
const cord=tubeBetween([0,2.46,-.02],[0,.88,-.02],cordMat,.035);cord.name="spinal_cord";cnsGroup.add(cord);cns.spinal_cord.push(cord);

const CNS_INFO={
 brain:["Cerebro","Principal estructura del sistema nervioso central relacionada con integración sensorial, movimiento, lenguaje, memoria y funciones cognitivas."],
 cerebellum:["Cerebelo","Participa en coordinación del movimiento, equilibrio y aprendizaje motor."],
 brainstem:["Tronco encefálico","Conecta encéfalo y médula espinal y contiene centros relacionados con funciones vitales."],
 spinal_cord:["Médula espinal","Vía principal de comunicación entre encéfalo y cuerpo; también participa en reflejos."]
};

function focusObjects(objects,title,info,crumb){
 const box=new THREE.Box3();objects.forEach(o=>{o.visible=true;box.expandByObject(o)});
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.15);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(d*1.7,d*.6,d*2.5)));
 nameEl.textContent=title;descEl.textContent=info;factsEl.textContent="Representación 3D educativa simplificada.";
 breadcrumb.textContent=crumb;
}
function showCns(key){
 if(!cns[key])return;
 cnsGroup.visible=true;Object.values(cns).flat().forEach(o=>o.visible=false);
 const [title,info]=CNS_INFO[key];focusObjects(cns[key],title,info,`Sistema nervioso central › ${title}`);
}
document.getElementById("showCnsBtn").onclick=()=>showCns(document.getElementById("cnsSelect").value);

// Respiratory system
const trachea=tubeBetween([0,2.42,.05],[0,1.88,.08],airwayMat,.055);trachea.name="trachea";respiratoryGroup.add(trachea);
const leftBronchus=tubeBetween([0,1.88,.08],[-.28,1.73,.04],airwayMat,.035);leftBronchus.name="left_bronchus";respiratoryGroup.add(leftBronchus);
const rightBronchus=tubeBetween([0,1.88,.08],[.28,1.73,.04],airwayMat,.035);rightBronchus.name="right_bronchus";respiratoryGroup.add(rightBronchus);

const airwayBranches=[];
[
 [[-.28,1.73,.04],[-.43,1.55,.02]],[[-.28,1.73,.04],[-.18,1.48,.02]],
 [[.28,1.73,.04],[.43,1.55,.02]],[[.28,1.73,.04],[.18,1.48,.02]]
].forEach((p,i)=>{const b=tubeBetween(p[0],p[1],airwayMat,.018);b.name="airway_branch_"+i;respiratoryGroup.add(b);airwayBranches.push(b)});

const RESP_INFO={
 trachea:["Tráquea","Conducto respiratorio que comunica laringe y bronquios principales."],
 bronchi:["Bronquios principales","Ramas de la tráquea que conducen aire hacia cada pulmón."],
 airway_tree:["Árbol respiratorio","Conjunto esquemático de tráquea, bronquios y ramas intrapulmonares."]
};
function showResp(key){
 respiratoryGroup.visible=true;
 [...respiratoryGroup.children].forEach(o=>o.visible=false);
 let objects=[];
 if(key==="trachea")objects=[trachea];
 if(key==="bronchi")objects=[leftBronchus,rightBronchus];
 if(key==="airway_tree")objects=[trachea,leftBronchus,rightBronchus,...airwayBranches];
 if(!objects.length)return;
 const [title,info]=RESP_INFO[key];focusObjects(objects,title,info,`Vías respiratorias › ${title}`);
}
document.getElementById("showRespBtn").onclick=()=>showResp(document.getElementById("respSelect").value);

// Digestive system
const esophagus=tubeBetween([0,2.26,.10],[-.10,1.30,.13],digestiveMat,.035);esophagus.name="esophagus";digestiveGroup.add(esophagus);
const dgStomach=eMesh("digest_stomach",[-.20,1.18,.16],[.24,.33,.18],digestiveMat,digestiveGroup);
const dgLiver=eMesh("digest_liver",[.22,1.28,.14],[.50,.25,.21],organMats.liver,digestiveGroup);

function curvedLoop(name,center,w,h,turns,mat,r=.022){
 const pts=[];const segments=120;
 for(let i=0;i<segments;i++){
   const t=i/(segments-1)*Math.PI*2*turns;
   const shrink=1-i/(segments*1.8);
   pts.push(new THREE.Vector3(center[0]+Math.cos(t)*w*shrink,center[1]+Math.sin(t)*h*.35,center[2]+Math.sin(t*.5)*.03));
 }
 const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),segments,r,8,false);
 const m=new THREE.Mesh(geo,mat.clone());m.name=name;digestiveGroup.add(m);return m;
}
const smallIntestine=curvedLoop("small_intestine",[0,.78,.14],.28,.45,4.5,intestineMat,.018);

const colonPts=[
 new THREE.Vector3(-.34,.55,.10),new THREE.Vector3(-.34,1.02,.10),
 new THREE.Vector3(.34,1.02,.10),new THREE.Vector3(.34,.55,.10),
 new THREE.Vector3(.10,.42,.10),new THREE.Vector3(0,.30,.10)
];
const colonGeo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(colonPts),80,.035,10,false);
const largeIntestine=new THREE.Mesh(colonGeo,digestiveMat.clone());largeIntestine.name="large_intestine";digestiveGroup.add(largeIntestine);

const DIGEST_INFO={
 esophagus:["Esófago","Conducto muscular que transporta el bolo alimenticio desde la faringe al estómago."],
 stomach:["Estómago","Órgano que almacena y mezcla el alimento con secreciones gástricas."],
 small_intestine:["Intestino delgado","Principal región de digestión química y absorción de nutrientes."],
 large_intestine:["Intestino grueso","Participa en absorción de agua y formación del contenido fecal."],
 liver:["Hígado","Órgano accesorio de la digestión con funciones metabólicas y producción de bilis."]
};
const digestiveObjects={esophagus:[esophagus],stomach:[dgStomach],small_intestine:[smallIntestine],large_intestine:[largeIntestine],liver:[dgLiver]};
function showDigest(key){
 const objects=digestiveObjects[key];if(!objects)return;
 digestiveGroup.visible=true;Object.values(digestiveObjects).flat().forEach(o=>o.visible=false);
 const [title,info]=DIGEST_INFO[key];focusObjects(objects,title,info,`Aparato digestivo › ${title}`);
}
document.getElementById("showDigestBtn").onclick=()=>showDigest(document.getElementById("digestSelect").value);

// module navigation refinements
document.querySelectorAll('.module[data-module="nervous"]').forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));b.classList.add("active");
   cnsGroup.visible=true;showCns("brain");
 }
});
document.querySelectorAll('.module[data-module="organs"]').forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));b.classList.add("active");
   organGroup.visible=true;showOrgan("heart");
 }
});

// Voice commands
const commandV23=command;
command=function(text){
 const t=normalize(text);
 const cnsAliases={brain:["cerebro","brain","cervello"],cerebellum:["cerebelo","cerebellum","cervelletto"],brainstem:["tronco encefalico","brainstem","tronco encefalico"],spinal_cord:["medula espinal","spinal cord","midollo spinale"]};
 for(const [key,list] of Object.entries(cnsAliases))if(list.some(a=>t.includes(normalize(a)))){showCns(key);return}
 if(t.includes("traquea")||t.includes("trachea")){showResp("trachea");return}
 if(t.includes("bronquio")||t.includes("bronchi")){showResp("bronchi");return}
 if(t.includes("arbol respiratorio")||t.includes("airway tree")){showResp("airway_tree");return}
 const digAliases={esophagus:["esofago","esophagus","esofago"],small_intestine:["intestino delgado","small intestine","intestino tenue"],large_intestine:["intestino grueso","large intestine","intestino crasso"]};
 for(const [key,list] of Object.entries(digAliases))if(list.some(a=>t.includes(normalize(a)))){showDigest(key);return}
 commandV23(text);
};

// Bio3D v2.3 Beta — órganos internos y circulación
const organGroup=new THREE.Group();scene.add(organGroup);organGroup.visible=false;
const circulationGroup=new THREE.Group();scene.add(circulationGroup);circulationGroup.visible=false;

const organMats={
 heart:new THREE.MeshStandardMaterial({color:0xa83c3c,roughness:.62}),
 lung:new THREE.MeshStandardMaterial({color:0xb97878,roughness:.78,transparent:true,opacity:.88}),
 liver:new THREE.MeshStandardMaterial({color:0x77433a,roughness:.8}),
 stomach:new THREE.MeshStandardMaterial({color:0xb67d72,roughness:.75}),
 kidney:new THREE.MeshStandardMaterial({color:0x8c3f3f,roughness:.72})
};
const arteryMat=new THREE.MeshStandardMaterial({color:0xb32626,roughness:.55});
const veinMat=new THREE.MeshStandardMaterial({color:0x315a9e,roughness:.55});

function ellipsoid(name,pos,scale,mat){
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,20),mat.clone());
 m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;organGroup.add(m);return m;
}
const organs={
 heart:[ellipsoid("heart",[0,1.66,.12],[.25,.34,.22],organMats.heart)],
 lungs:[
  ellipsoid("lung_left",[-.30,1.82,.02],[.27,.58,.20],organMats.lung),
  ellipsoid("lung_right",[.30,1.82,.02],[.27,.58,.20],organMats.lung)
 ],
 liver:[ellipsoid("liver",[.22,1.25,.14],[.52,.26,.22],organMats.liver)],
 stomach:[ellipsoid("stomach",[-.22,1.16,.15],[.24,.34,.18],organMats.stomach)],
 kidneys:[
  ellipsoid("kidney_left",[-.30,1.08,-.10],[.13,.23,.11],organMats.kidney),
  ellipsoid("kidney_right",[.30,1.08,-.10],[.13,.23,.11],organMats.kidney)
 ]
};
const ORGAN_INFO={
 heart:["Corazón","Órgano muscular que impulsa la sangre a través de la circulación pulmonar y sistémica."],
 lungs:["Pulmones","Órganos respiratorios donde ocurre el intercambio gaseoso entre aire y sangre."],
 liver:["Hígado","Órgano metabólico con funciones de procesamiento de nutrientes, síntesis y detoxificación."],
 stomach:["Estómago","Órgano del aparato digestivo que almacena y mezcla el alimento con secreciones gástricas."],
 kidneys:["Riñones","Filtran la sangre, regulan líquidos y electrolitos y participan en la formación de orina."]
};
function showOrgan(key){
 if(!organs[key])return;
 organGroup.visible=true;
 Object.values(organs).flat().forEach(m=>{m.visible=false});
 organs[key].forEach(m=>m.visible=true);
 const [title,info]=ORGAN_INFO[key];
 const box=new THREE.Box3();organs[key].forEach(m=>box.expandByObject(m));
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.2);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(d*1.8,d*.5,d*2.7)));
 nameEl.textContent=title;descEl.textContent=info;
 factsEl.textContent="Modelo procedural educativo. La posición y forma están simplificadas.";
 breadcrumb.textContent=`Órganos internos › ${title}`;
}
document.getElementById("showOrganBtn").onclick=()=>showOrgan(document.getElementById("organSelect").value);

let heartAnimating=false;
document.getElementById("animateHeartBtn").onclick=()=>{
 showOrgan("heart");if(heartAnimating)return;heartAnimating=true;
 const hs=organs.heart,base=hs.map(m=>m.scale.clone()),start=performance.now(),duration=3200;
 function beat(now){
  const p=(now-start)/duration;
  const pulse=Math.max(0,Math.sin(p*Math.PI*8))*.09;
  hs.forEach((m,i)=>m.scale.set(base[i].x*(1+pulse),base[i].y*(1+pulse),base[i].z*(1+pulse)));
  if(p<1)requestAnimationFrame(beat);else{hs.forEach((m,i)=>m.scale.copy(base[i]));heartAnimating=false}
 }
 requestAnimationFrame(beat);
 status.textContent="Animación educativa del latido cardíaco.";
};

function vessel(a,b,mat,r=.025){const m=tubeBetween(a,b,mat,r);circulationGroup.add(m);return m}
const vesselSets={aorta:[],vena_cava:[],pulmonary:[]};
vesselSets.aorta.push(
 vessel([0,1.72,.08],[0,1.98,.02],arteryMat,.045),
 vessel([0,1.98,.02],[0,1.02,-.02],arteryMat,.04),
 vessel([0,1.10,-.02],[.24,.15,-.02],arteryMat,.025),
 vessel([0,1.10,-.02],[-.24,.15,-.02],arteryMat,.025)
);
vesselSets.vena_cava.push(
 vessel([-.08,2.15,-.02],[-.08,1.66,.05],veinMat,.04),
 vessel([-.08,.72,-.02],[-.08,1.66,.05],veinMat,.045)
);
vesselSets.pulmonary.push(
 vessel([0,1.72,.10],[.34,1.82,.05],arteryMat,.028),
 vessel([0,1.72,.10],[-.34,1.82,.05],arteryMat,.028),
 vessel([.34,1.77,.08],[0,1.63,.12],veinMat,.022),
 vessel([-.34,1.77,.08],[0,1.63,.12],veinMat,.022)
);
Object.values(vesselSets).flat().forEach(v=>v.visible=false);
function showVessels(key){
 circulationGroup.visible=true;
 Object.values(vesselSets).flat().forEach(v=>v.visible=false);
 (vesselSets[key]||[]).forEach(v=>v.visible=true);
 const labels={
  aorta:["Aorta","Principal arteria sistémica; distribuye sangre desde el ventrículo izquierdo hacia el organismo."],
  vena_cava:["Venas cavas","Grandes venas que retornan sangre sistémica hacia la aurícula derecha."],
  pulmonary:["Circulación pulmonar","Conecta corazón y pulmones para permitir el intercambio gaseoso."]
 };
 if(labels[key]){nameEl.textContent=labels[key][0];descEl.textContent=labels[key][1];factsEl.textContent="Trayecto vascular 3D esquemático con finalidad educativa."}
}
document.getElementById("showVesselBtn").onclick=()=>showVessels(document.getElementById("vesselSelect").value);
document.getElementById("toggleCirculationBtn").onclick=()=>circulationGroup.visible=!circulationGroup.visible;

// Voice
const commandV22=command;
command=function(text){
 const t=normalize(text);
 const organAliases={heart:["corazon","heart","cuore"],lungs:["pulmones","lungs","polmoni"],liver:["higado","liver","fegato"],stomach:["estomago","stomach","stomaco"],kidneys:["rinones","kidneys","reni"]};
 for(const [key,list] of Object.entries(organAliases))if(list.some(a=>t.includes(normalize(a)))){showOrgan(key);return}
 if(t.includes("aorta")){showVessels("aorta");return}
 if(t.includes("vena cava")||t.includes("venas cavas")){showVessels("vena_cava");return}
 if(t.includes("circulacion pulmonar")||t.includes("pulmonary circulation")){showVessels("pulmonary");return}
 if(t.includes("latido")||t.includes("heartbeat")){document.getElementById("animateHeartBtn").click();return}
 commandV22(text);
};

// Bio3D v2.2 Beta — origen/inserción visual, tendones y sistema nervioso
const attachmentGroup=new THREE.Group();scene.add(attachmentGroup);attachmentGroup.visible=false;
const tendonGroup=new THREE.Group();scene.add(tendonGroup);tendonGroup.visible=false;
const nerveGroup=new THREE.Group();scene.add(nerveGroup);nerveGroup.visible=false;

const originMat=new THREE.MeshStandardMaterial({color:0x4aa3ff,emissive:0x0b2844});
const insertionMat=new THREE.MeshStandardMaterial({color:0xffb24a,emissive:0x44280b});
const tendonMat=new THREE.MeshStandardMaterial({color:0xe8ddd0,roughness:.85});
const nerveMat=new THREE.MeshStandardMaterial({color:0xf2d54a,emissive:0x4a3b08});

function clearGroup(g){while(g.children.length){const o=g.children.pop();o.geometry?.dispose?.();}}
function marker(pos,mat,scale=.055){
 const m=new THREE.Mesh(new THREE.SphereGeometry(scale,16,12),mat.clone());m.position.set(...pos);return m;
}
function tubeBetween(a,b,mat,r=.025){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),mid=A.clone().add(B).multiplyScalar(.5);
 const len=A.distanceTo(B),geo=new THREE.CylinderGeometry(r,r,len,10),m=new THREE.Mesh(geo,mat.clone());
 m.position.copy(mid);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());return m;
}

// Educational attachment coordinates matched to the procedural body proportions.
const ATTACHMENTS={
 deltoid:{origin:[.48,2.18,.02],insertion:[.64,1.72,.02]},
 pectoralis_major:{origin:[.05,2.03,.20],insertion:[.55,1.82,.08]},
 biceps_brachii:{origin:[.52,1.92,.04],insertion:[.61,1.03,.06]},
 triceps_brachii:{origin:[.53,1.92,-.08],insertion:[.61,.98,-.08]},
 rectus_abdominis:{origin:[0,.82,.18],insertion:[0,1.92,.18]},
 gluteus_maximus:{origin:[.12,1.18,-.20],insertion:[.32,.63,-.08]},
 quadriceps:{origin:[.24,.88,.10],insertion:[.24,-.24,.08]},
 hamstrings:{origin:[.23,.95,-.12],insertion:[.24,-.20,-.10]},
 gastrocnemius:{origin:[.24,-.20,-.10],insertion:[.24,-1.18,-.08]},
 latissimus_dorsi:{origin:[.05,.92,-.18],insertion:[.55,1.82,-.05]}
};
function showAttachments(key){
 const a=ATTACHMENTS[key];if(!a){status.textContent="No hay puntos visuales para este músculo.";return}
 clearGroup(attachmentGroup);
 attachmentGroup.add(marker(a.origin,originMat),marker(a.insertion,insertionMat));
 attachmentGroup.visible=true;
 nameEl.textContent=`${MUSCLES[key].name} · origen e inserción`;
 descEl.textContent="Azul: origen anatómico aproximado para la visualización educativa. Naranja: inserción.";
 factsEl.textContent=MUSCLE_ACADEMIC[key]?`Origen: ${MUSCLE_ACADEMIC[key].origin} Inserción: ${MUSCLE_ACADEMIC[key].insertion}`:"";
}
document.getElementById("showAttachmentsBtn").onclick=()=>{
 const key=selectedMuscleKey||document.getElementById("muscleSelect").value;if(!key)return;
 selectMuscle(key);showAttachments(key);
};
function showTendon(key){
 const a=ATTACHMENTS[key];if(!a)return;
 clearGroup(tendonGroup);
 const def=MUSCLES[key],center=[def.pos[0],def.pos[1],def.pos[2]];
 tendonGroup.add(tubeBetween(a.origin,center,tendonMat,.018),tubeBetween(center,a.insertion,tendonMat,.018));
 tendonGroup.visible=true;
 status.textContent=`Tendones educativos visibles para ${def.name}.`;
}
document.getElementById("showTendonsBtn").onclick=()=>{
 const key=selectedMuscleKey||document.getElementById("muscleSelect").value;if(key)showTendon(key);
};

const NERVES={
 axillary:{name:"Nervio axilar",path:[[.05,2.05,-.08],[.42,2.02,-.10],[.64,1.85,-.04]],info:"Inerva, entre otros, al deltoides y redondo menor."},
 musculocutaneous:{name:"Nervio musculocutáneo",path:[[.18,2.00,.02],[.48,1.75,.04],[.60,1.10,.05]],info:"Principal nervio motor del compartimento anterior del brazo."},
 radial:{name:"Nervio radial",path:[[.12,2.00,-.10],[.52,1.62,-.12],[.65,.92,-.06]],info:"Inerva gran parte de la musculatura extensora del miembro superior."},
 median:{name:"Nervio mediano",path:[[.10,1.95,.06],[.50,1.50,.08],[.62,.55,.10]],info:"Nervio importante del antebrazo y mano; atraviesa el túnel carpiano."},
 ulnar:{name:"Nervio ulnar",path:[[.10,1.94,-.02],[.56,1.32,-.06],[.68,.54,-.04]],info:"Pasa cerca del epicóndilo medial y participa ampliamente en la inervación de la mano."},
 femoral:{name:"Nervio femoral",path:[[.18,1.05,.10],[.24,.62,.14],[.25,-.05,.12]],info:"Principal nervio del compartimento anterior del muslo."},
 sciatic:{name:"Nervio ciático",path:[[.15,1.02,-.18],[.24,.45,-.18],[.24,-.20,-.16]],info:"Nervio de gran calibre que desciende por la región posterior del muslo."},
 tibial:{name:"Nervio tibial",path:[[.24,-.18,-.14],[.24,-.65,-.15],[.24,-1.15,-.10]],info:"Rama del ciático que continúa por el compartimento posterior de la pierna."}
};
function showNerve(key){
 const n=NERVES[key];if(!n)return;
 clearGroup(nerveGroup);
 for(let i=0;i<n.path.length-1;i++)nerveGroup.add(tubeBetween(n.path[i],n.path[i+1],nerveMat,.018));
 nerveGroup.visible=true;
 nameEl.textContent=n.name;descEl.textContent=n.info;factsEl.textContent="Trayecto 3D esquemático con finalidad educativa.";
 breadcrumb.textContent=`Sistema nervioso › ${n.name}`;
}
document.getElementById("showNerveBtn").onclick=()=>showNerve(document.getElementById("nerveSelect").value);
document.getElementById("toggleNervesBtn").onclick=()=>nerveGroup.visible=!nerveGroup.visible;

// Voice commands for attachments, tendons, nerves
const commandV21=command;
command=function(text){
 const t=normalize(text);
 if(selectedMuscleKey&&(t.includes("origen visual")||t.includes("mostrar origen")||t.includes("insercion visual"))){showAttachments(selectedMuscleKey);return}
 if(selectedMuscleKey&&(t.includes("tendon")||t.includes("tendones"))){showTendon(selectedMuscleKey);return}
 for(const [key,n] of Object.entries(NERVES)){
  if(t.includes(normalize(n.name))||t.includes(normalize(key))){showNerve(key);return}
 }
 commandV21(text);
};

// Bio3D v2.1 Beta — importación de modelo muscular real y sincronización de movimiento
let importedMuscleModel=null;
let importedMuscleIndex={};
const MUSCLE_ALIASES={
 deltoid:["deltoid","deltoide","deltoides"],
 pectoralis_major:["pectoralis major","pectoralis_major","pectoral major","pectoral mayor"],
 biceps_brachii:["biceps brachii","biceps_brachii","biceps"],
 triceps_brachii:["triceps brachii","triceps_brachii","triceps"],
 rectus_abdominis:["rectus abdominis","rectus_abdominis","recto abdominal"],
 gluteus_maximus:["gluteus maximus","gluteus_maximus","gluteo mayor"],
 quadriceps:["quadriceps","rectus femoris","vastus lateralis","vastus medialis","vastus intermedius"],
 hamstrings:["biceps femoris","semitendinosus","semimembranosus","hamstring"],
 gastrocnemius:["gastrocnemius","gastrocnemio"],
 latissimus_dorsi:["latissimus dorsi","latissimus_dorsi","dorsal ancho"]
};
function indexMuscleModel(){
 importedMuscleIndex={};
 if(!importedMuscleModel)return;
 importedMuscleModel.traverse(o=>{
  if(!o.isMesh)return;
  const n=cleanName(o.name);
  Object.entries(MUSCLE_ALIASES).forEach(([key,list])=>{
   if(list.some(a=>n.includes(cleanName(a))))(importedMuscleIndex[key]??=[]).push(o);
  });
 });
}
function finishMuscleModel(model,fileName){
 if(importedMuscleModel)scene.remove(importedMuscleModel);
 importedMuscleModel=model;importedMuscleModel.name=fileName;
 importedMuscleModel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 const box=new THREE.Box3().setFromObject(importedMuscleModel);
 const size=box.getSize(new THREE.Vector3()),maxDim=Math.max(size.x,size.y,size.z,.0001);
 importedMuscleModel.scale.multiplyScalar(3.8/maxDim);
 const box2=new THREE.Box3().setFromObject(importedMuscleModel),c=box2.getCenter(new THREE.Vector3());
 importedMuscleModel.position.sub(c);
 scene.add(importedMuscleModel);importedMuscleModel.visible=true;
 indexMuscleModel();analyzeMuscleModel();
 muscleGroup.visible=false;
 document.getElementById("toggleProceduralMusclesBtn").textContent="◉ Mostrar músculos demo";
}
document.getElementById("muscleModelFile").onchange=e=>{
 const file=e.target.files?.[0];if(!file)return;
 const url=URL.createObjectURL(file),ext=(file.name.split(".").pop()||"").toLowerCase();
 if(ext==="fbx"){
  new FBXLoader().load(url,obj=>{finishMuscleModel(obj,file.name);URL.revokeObjectURL(url)},undefined,()=>{status.textContent="No se pudo cargar el modelo muscular FBX.";URL.revokeObjectURL(url)});
 }else{
  new GLTFLoader().load(url,g=>{finishMuscleModel(g.scene,file.name);URL.revokeObjectURL(url)},undefined,()=>{status.textContent="No se pudo cargar el modelo muscular GLB/GLTF.";URL.revokeObjectURL(url)});
 }
};
function analyzeMuscleModel(){
 const el=document.getElementById("muscleModelStatus");
 if(!importedMuscleModel){el.textContent="Modelo muscular: geometría demostrativa";return}
 let meshes=0,verts=0;
 importedMuscleModel.traverse(o=>{if(o.isMesh){meshes++;verts+=o.geometry?.attributes?.position?.count||0}});
 const recognized=Object.keys(importedMuscleIndex).length;
 el.textContent=`${importedMuscleModel.name}: ${meshes} mallas · ${verts.toLocaleString()} vértices · ${recognized}/${Object.keys(MUSCLES).length} grupos reconocidos`;
}
document.getElementById("analyzeMuscleModelBtn").onclick=analyzeMuscleModel;
document.getElementById("toggleProceduralMusclesBtn").onclick=()=>{
 muscleGroup.visible=!muscleGroup.visible;
 document.getElementById("toggleProceduralMusclesBtn").textContent=muscleGroup.visible?"◉ Ocultar músculos demo":"◉ Mostrar músculos demo";
};

function highlightRealMuscle(key){
 if(!importedMuscleModel||!(importedMuscleIndex[key]||[]).length)return false;
 importedMuscleModel.traverse(o=>{
  if(!o.isMesh)return;
  if(!o.userData._bio3dMuscleBase)o.userData._bio3dMuscleBase=o.material;
  o.material=o.userData._bio3dMuscleBase;
 });
 const meshes=importedMuscleIndex[key];
 meshes.forEach(m=>m.material=muscleHighlight.clone());
 const box=new THREE.Box3();meshes.forEach(m=>box.expandByObject(m));
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.15);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(d*2,d*.7,d*2.4)));
 return true;
}

// integrate real meshes with existing selection
const selectMuscleV20=selectMuscle;
selectMuscle=function(key){
 selectMuscleV20(key);
 if(importedMuscleModel){
  importedMuscleModel.visible=true;
  if(highlightRealMuscle(key))muscleGroup.visible=false;
 }
};

// Educational synchronized joint movement
const JOINT_MOVEMENT={
 elbow_flexion:{axis:"z",angle:-.55,label:"flexión del codo"},
 elbow_extension:{axis:"z",angle:.45,label:"extensión del codo"},
 shoulder_abduction:{axis:"z",angle:.5,label:"abducción del hombro"},
 shoulder_adduction:{axis:"z",angle:-.35,label:"aducción del hombro"},
 shoulder_extension:{axis:"x",angle:.35,label:"extensión del hombro"},
 hip_extension:{axis:"x",angle:-.35,label:"extensión de cadera"},
 knee_extension:{axis:"x",angle:.45,label:"extensión de rodilla"},
 knee_flexion:{axis:"x",angle:-.5,label:"flexión de rodilla"},
 plantar_flexion:{axis:"x",angle:.35,label:"flexión plantar"},
 trunk_flexion:{axis:"x",angle:.2,label:"flexión del tronco"}
};
function animateFunctionalMovement(key){
 const academic=MUSCLE_ACADEMIC[key],move=JOINT_MOVEMENT[academic?.movement];
 if(!move)return;
 const target=importedMuscleModel||muscleGroup;
 const base=target.rotation[move.axis],start=performance.now(),duration=1500;
 function frame(now){
  const p=Math.min(1,(now-start)/duration),wave=Math.sin(p*Math.PI);
  target.rotation[move.axis]=base+move.angle*wave*.22;
  if(p<1)requestAnimationFrame(frame);else target.rotation[move.axis]=base;
 }
 requestAnimationFrame(frame);
 status.textContent=`Movimiento educativo sincronizado: ${move.label}.`;
}
const animateMuscleContractionV20=animateMuscleContraction;
animateMuscleContraction=function(key){
 animateMuscleContractionV20(key);
 animateFunctionalMovement(key);
};

// Bio3D v2.0 Beta — anatomía muscular funcional y animación educativa
const MUSCLE_ACADEMIC={
 deltoid:{
  origin:"Tercio lateral de la clavícula, acromion y espina de la escápula.",
  insertion:"Tuberosidad deltoidea del húmero.",
  action:"Abducción del brazo; sus porciones anterior y posterior colaboran en flexión/extensión y rotación.",
  innervation:"Nervio axilar (C5–C6).",
  movement:"shoulder_abduction"
 },
 pectoralis_major:{
  origin:"Clavícula medial, esternón y cartílagos costales superiores.",
  insertion:"Labio lateral del surco intertubercular del húmero.",
  action:"Aduce y rota medialmente el brazo; la porción clavicular ayuda a flexionarlo.",
  innervation:"Nervios pectorales lateral y medial.",
  movement:"shoulder_adduction"
 },
 biceps_brachii:{
  origin:"Cabeza larga: tubérculo supraglenoideo. Cabeza corta: proceso coracoides.",
  insertion:"Tuberosidad del radio y aponeurosis bicipital.",
  action:"Flexiona el codo y supina el antebrazo.",
  innervation:"Nervio musculocutáneo (C5–C6).",
  movement:"elbow_flexion"
 },
 triceps_brachii:{
  origin:"Cabeza larga: tubérculo infraglenoideo; cabezas lateral y medial: cara posterior del húmero.",
  insertion:"Olécranon de la ulna.",
  action:"Principal extensor del antebrazo en el codo.",
  innervation:"Nervio radial (C6–C8).",
  movement:"elbow_extension"
 },
 rectus_abdominis:{
  origin:"Cresta y sínfisis del pubis.",
  insertion:"Proceso xifoides y cartílagos costales 5–7.",
  action:"Flexiona el tronco y comprime el contenido abdominal.",
  innervation:"Nervios toracoabdominales.",
  movement:"trunk_flexion"
 },
 gluteus_maximus:{
  origin:"Ilion posterior, sacro y cóccix.",
  insertion:"Tracto iliotibial y tuberosidad glútea del fémur.",
  action:"Extiende y rota lateralmente la cadera.",
  innervation:"Nervio glúteo inferior (L5–S2).",
  movement:"hip_extension"
 },
 quadriceps:{
  origin:"Recto femoral: ilion; vastos: diferentes regiones del fémur.",
  insertion:"Rótula y, mediante el ligamento patelar, tuberosidad tibial.",
  action:"Extiende la rodilla; el recto femoral también flexiona la cadera.",
  innervation:"Nervio femoral (L2–L4).",
  movement:"knee_extension"
 },
 hamstrings:{
  origin:"Principalmente tuberosidad isquiática.",
  insertion:"Tibia y fíbula proximales según el músculo.",
  action:"Flexionan la rodilla y extienden la cadera.",
  innervation:"Principalmente división tibial del nervio ciático.",
  movement:"knee_flexion"
 },
 gastrocnemius:{
  origin:"Cóndilos medial y lateral del fémur.",
  insertion:"Calcáneo mediante el tendón calcáneo.",
  action:"Flexión plantar del tobillo y ayuda en flexión de rodilla.",
  innervation:"Nervio tibial (S1–S2).",
  movement:"plantar_flexion"
 },
 latissimus_dorsi:{
  origin:"Fascia toracolumbar, vértebras torácicas inferiores, cresta ilíaca y costillas inferiores.",
  insertion:"Suelo del surco intertubercular del húmero.",
  action:"Extiende, aduce y rota medialmente el brazo.",
  innervation:"Nervio toracodorsal (C6–C8).",
  movement:"shoulder_extension"
 }
};

function renderMuscleAcademic(key){
 const d=MUSCLE_ACADEMIC[key],el=document.getElementById("muscleAcademic");
 if(!d){el.textContent="No hay ficha funcional disponible.";return}
 el.innerHTML=`<b>Origen:</b> ${d.origin}<br><b>Inserción:</b> ${d.insertion}<br><b>Acción:</b> ${d.action}<br><b>Inervación:</b> ${d.innervation}`;
}
document.getElementById("muscleDetailsBtn").onclick=()=>{
 const key=selectedMuscleKey||document.getElementById("muscleSelect").value;
 if(!key){status.textContent="Selecciona primero un músculo.";return}
 renderMuscleAcademic(key);
};

let muscleAnim=null;
function animateMuscleContraction(key){
 const meshes=muscleMeshes[key]||[];
 if(!meshes.length)return;
 if(muscleAnim)muscleAnim.cancelled=true;
 const state={cancelled:false};muscleAnim=state;
 const base=meshes.map(m=>m.scale.clone());
 const start=performance.now(),duration=1800;
 function frame(now){
  if(state.cancelled){meshes.forEach((m,i)=>m.scale.copy(base[i]));return}
  const p=Math.min(1,(now-start)/duration);
  const pulse=Math.sin(p*Math.PI*4)*.07;
  meshes.forEach((m,i)=>{
   m.scale.set(base[i].x*(1+pulse),base[i].y*(1-pulse*.45),base[i].z*(1+pulse));
  });
  if(p<1)requestAnimationFrame(frame);
  else meshes.forEach((m,i)=>m.scale.copy(base[i]));
 }
 requestAnimationFrame(frame);
 status.textContent=`Animación educativa: contracción de ${MUSCLES[key].name}.`;
}
document.getElementById("animateMuscleBtn").onclick=()=>{
 const key=selectedMuscleKey||document.getElementById("muscleSelect").value;
 if(!key){status.textContent="Selecciona primero un músculo.";return}
 selectMuscle(key);renderMuscleAcademic(key);animateMuscleContraction(key);
};

// Amplía selección muscular para mostrar ficha funcional resumida
const selectMuscleV19=selectMuscle;
selectMuscle=function(key){
 selectMuscleV19(key);
 if(MUSCLE_ACADEMIC[key]){
   const d=MUSCLE_ACADEMIC[key];
   document.getElementById("muscleAcademic").innerHTML=`<b>Acción:</b> ${d.action}<br><b>Inervación:</b> ${d.innervation}`;
 }
};

// Comandos de voz para anatomía funcional y animación
const commandV19=command;
command=function(text){
 const t=normalize(text);
 if(selectedMuscleKey&&(t.includes("origen")||t.includes("insercion")||t.includes("insertion")||t.includes("innervation")||t.includes("inervacion"))){
   renderMuscleAcademic(selectedMuscleKey);return;
 }
 if(selectedMuscleKey&&(t.includes("animar")||t.includes("contraer")||t.includes("contraccion")||t.includes("animate")||t.includes("contract"))){
   animateMuscleContraction(selectedMuscleKey);return;
 }
 commandV19(text);
};

// Bio3D v1.9 Beta — primer módulo muscular funcional
const muscleMatSuperficial=new THREE.MeshStandardMaterial({color:0x9e3b3b,roughness:.68});
const muscleMatDeep=new THREE.MeshStandardMaterial({color:0x6f2d2d,roughness:.75});
const muscleHighlight=new THREE.MeshStandardMaterial({color:0xe66a5a,emissive:0x3b120d,roughness:.45});
const muscleGroup=new THREE.Group();scene.add(muscleGroup);

const MUSCLES={
 deltoid:{name:"Deltoides",layer:"superficial",boneKeys:["humero","escapula"],info:"Músculo superficial del hombro que participa principalmente en la abducción del brazo.",pos:[.63,2.02,0],scale:[.24,.42,.23]},
 pectoralis_major:{name:"Pectoral mayor",layer:"superficial",boneKeys:["humero","esternon"],info:"Músculo anterior del tórax que interviene en aducción y rotación medial del brazo.",pos:[0,1.95,.27],scale:[.72,.38,.14]},
 biceps_brachii:{name:"Bíceps braquial",layer:"superficial",boneKeys:["humero","radio"],info:"Músculo anterior del brazo que participa en flexión del codo y supinación del antebrazo.",pos:[.59,1.46,.08],scale:[.16,.48,.15]},
 triceps_brachii:{name:"Tríceps braquial",layer:"superficial",boneKeys:["humero","cubito"],info:"Músculo posterior del brazo y principal extensor del codo.",pos:[-.59,1.46,-.10],scale:[.16,.50,.15]},
 rectus_abdominis:{name:"Recto abdominal",layer:"superficial",boneKeys:["pelvis","esternon"],info:"Músculo anterior del abdomen que contribuye a la flexión del tronco.",pos:[0,1.37,.23],scale:[.24,.66,.12]},
 gluteus_maximus:{name:"Glúteo mayor",layer:"superficial",boneKeys:["pelvis","femur"],info:"Potente músculo extensor de la cadera.",pos:[0,.98,-.28],scale:[.62,.40,.23]},
 quadriceps:{name:"Cuádriceps",layer:"superficial",boneKeys:["femur","tibia","rotula"],info:"Grupo muscular anterior del muslo y principal extensor de la rodilla.",pos:[.23,.39,.15],scale:[.20,.70,.18]},
 hamstrings:{name:"Isquiotibiales",layer:"deep",boneKeys:["pelvis","femur","tibia"],info:"Grupo posterior del muslo que participa en extensión de cadera y flexión de rodilla.",pos:[-.23,.39,-.16],scale:[.18,.68,.15]},
 gastrocnemius:{name:"Gastrocnemio",layer:"superficial",boneKeys:["femur","tibia"],info:"Músculo superficial de la pantorrilla que participa en flexión plantar del pie.",pos:[.25,-.67,-.12],scale:[.15,.56,.16]},
 latissimus_dorsi:{name:"Dorsal ancho",layer:"superficial",boneKeys:["humero","columna","pelvis"],info:"Músculo amplio de la espalda que participa en extensión y aducción del brazo.",pos:[0,1.62,-.24],scale:[.72,.72,.12]}
};

function makeMuscle(key,def,mirror=false){
 const geo=new THREE.SphereGeometry(1,24,18);
 const mat=(def.layer==="deep"?muscleMatDeep:muscleMatSuperficial).clone();
 const m=new THREE.Mesh(geo,mat);
 m.name=`muscle_${key}${mirror?"_mirror":""}`;
 const x=mirror?-def.pos[0]:def.pos[0];
 m.position.set(x,def.pos[1],def.pos[2]);
 m.scale.set(def.scale[0],def.scale[1],def.scale[2]);
 m.userData={muscleKey:key,layer:def.layer};
 m.castShadow=true;
 muscleGroup.add(m);
 return m;
}
const muscleMeshes={};
Object.entries(MUSCLES).forEach(([key,def])=>{
 muscleMeshes[key]=[makeMuscle(key,def)];
 if(Math.abs(def.pos[0])>.05)muscleMeshes[key].push(makeMuscle(key,def,true));
});
muscleGroup.visible=false;

function resetMuscleMaterials(){
 Object.entries(muscleMeshes).forEach(([key,list])=>{
  const mat=(MUSCLES[key].layer==="deep"?muscleMatDeep:muscleMatSuperficial);
  list.forEach(m=>m.material=mat.clone());
 });
}
function applyMuscleLayer(){
 const layer=document.getElementById("muscleLayer").value;
 Object.entries(muscleMeshes).forEach(([key,list])=>{
  list.forEach(m=>m.visible=MUSCLES[key].layer===layer);
 });
 muscleGroup.visible=true;
 anatomy.visible=true;
 if(importedModel)importedModel.visible=true;
 nameEl.textContent=layer==="superficial"?"Musculatura superficial":"Musculatura profunda";
 descEl.textContent=layer==="superficial"?"Capa externa de músculos visibles en una disección superficial.":"Capa de músculos situada por debajo de la musculatura superficial.";
 breadcrumb.textContent=`Sistema muscular › ${layer==="superficial"?"Superficial":"Profunda"}`;
}
document.getElementById("muscleLayer").onchange=applyMuscleLayer;

function selectMuscle(key){
 const def=MUSCLES[key];if(!def)return;
 resetMuscleMaterials();muscleGroup.visible=true;
 const layer=document.getElementById("muscleLayer").value=def.layer;
 Object.entries(muscleMeshes).forEach(([k,list])=>list.forEach(m=>m.visible=MUSCLES[k].layer===layer));
 muscleMeshes[key].forEach(m=>{m.visible=true;m.material=muscleHighlight.clone()});
 const box=new THREE.Box3();muscleMeshes[key].forEach(m=>box.expandByObject(m));
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,.18);
 controls.target.copy(center);camera.position.copy(center.clone().add(new THREE.Vector3(d*2,d*.7,d*2.5)));
 nameEl.textContent=def.name;
 descEl.textContent=def.info;
 factsEl.textContent=`Capa: ${def.layer==="superficial"?"superficial":"profunda"}. Relacionado con: ${def.boneKeys.map(k=>atlasNames[k]||k).join(", ")}.`;
 breadcrumb.textContent=`Sistema muscular › ${def.name}`;
 selectedMuscleKey=key;
}
let selectedMuscleKey=null;
document.getElementById("showMuscleBtn").onclick=()=>selectMuscle(document.getElementById("muscleSelect").value);

document.getElementById("showMuscleRelationsBtn").onclick=()=>{
 const key=selectedMuscleKey||document.getElementById("muscleSelect").value;
 const def=MUSCLES[key];if(!def){status.textContent="Selecciona primero un músculo.";return}
 resetImportedHighlight();
 const related=meshesForMain(def.boneKeys);
 if(importedModel&&related.length){
   related.forEach(m=>{if(!m.userData._bio3dOriginalMaterial)m.userData._bio3dOriginalMaterial=m.material;m.material=selectMat.clone();m.visible=true});
 }
 muscleGroup.visible=true;muscleMeshes[key].forEach(m=>{m.visible=true;m.material=muscleHighlight.clone()});
 nameEl.textContent=`${def.name} · relación músculo-hueso`;
 descEl.textContent=`Bio3D resalta el músculo y los huesos principales con los que se relaciona anatómicamente.`;
 factsEl.textContent=`Huesos relacionados: ${def.boneKeys.map(k=>atlasNames[k]||k).join(", ")}.`;
};

// activar módulo muscular desde navegación
document.querySelectorAll('.module[data-module="muscular"]').forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));b.classList.add("active");
   muscleGroup.visible=true;applyMuscleLayer();
 }
});

// comandos de voz musculares
const commandV18=command;
command=function(text){
 const t=normalize(text);
 const aliases={
  deltoid:["deltoides","deltoid"],
  pectoralis_major:["pectoral mayor","pectoralis major","pettorale maggiore"],
  biceps_brachii:["biceps","biceps braquial","biceps brachii"],
  triceps_brachii:["triceps","triceps braquial","triceps brachii"],
  rectus_abdominis:["recto abdominal","rectus abdominis","addominale"],
  gluteus_maximus:["gluteo mayor","gluteus maximus","grande gluteo"],
  quadriceps:["cuadriceps","quadriceps"],
  hamstrings:["isquiotibiales","hamstrings"],
  gastrocnemius:["gastrocnemio","gastrocnemius","gemello"],
  latissimus_dorsi:["dorsal ancho","latissimus dorsi","gran dorsale"]
 };
 for(const [key,list] of Object.entries(aliases)){
  if(list.some(a=>t.includes(normalize(a)))){selectMuscle(key);return}
 }
 if(t.includes("musculo superficial")||t.includes("superficial muscle")){document.getElementById("muscleLayer").value="superficial";applyMuscleLayer();return}
 if(t.includes("musculo profundo")||t.includes("deep muscle")){document.getElementById("muscleLayer").value="deep";applyMuscleLayer();return}
 commandV18(text);
};

// Bio3D v1.8 Beta — articulaciones, suturas y capas anatómicas
const JOINTS={
 shoulder:{name:"Articulación del hombro",keys:["humero","escapula"],info:"Articulación glenohumeral: conecta la cabeza del húmero con la cavidad glenoidea de la escápula."},
 elbow:{name:"Articulación del codo",keys:["humero","radio","cubito"],info:"Complejo articular entre húmero, radio y ulna que permite principalmente flexión y extensión."},
 wrist:{name:"Articulación de la muñeca",keys:["radio"],detail:["scaphoid","lunate","triquetrum"],info:"La articulación radiocarpiana conecta el radio con la fila proximal del carpo."},
 hip:{name:"Articulación de la cadera",keys:["pelvis","femur"],info:"Articulación coxofemoral de tipo esferoidea entre acetábulo y cabeza femoral."},
 knee:{name:"Articulación de la rodilla",keys:["femur","tibia","rotula"],info:"Complejo entre fémur, tibia y rótula; permite flexión, extensión y pequeños movimientos de rotación."},
 ankle:{name:"Articulación del tobillo",keys:["tibia","perone"],detail:["talus"],info:"La articulación talocrural conecta tibia y fíbula con el astrágalo."}
};
const SUTURES={
 coronal:{name:"Sutura coronal",bones:["frontal","parietal"],info:"Une el hueso frontal con los huesos parietales."},
 sagittal:{name:"Sutura sagital",bones:["parietal"],info:"Une ambos huesos parietales en la línea media del cráneo."},
 lambdoid:{name:"Sutura lambdoidea",bones:["parietal","occipital"],info:"Une los parietales con el occipital."},
 squamous:{name:"Sutura escamosa",bones:["parietal","temporal"],info:"Une el temporal con el parietal a cada lado del cráneo."}
};

function highlightMeshSet(meshes,title,info){
 if(!importedModel||!meshes.length){status.textContent="No se encontraron las mallas necesarias en el modelo cargado.";return}
 resetImportedHighlight();
 meshes.forEach(m=>{if(!m.userData._bio3dOriginalMaterial)m.userData._bio3dOriginalMaterial=m.material;m.material=selectMat.clone();m.visible=true});
 const box=new THREE.Box3();meshes.forEach(m=>box.expandByObject(m));
 const c=box.getCenter(new THREE.Vector3()),s=box.getSize(new THREE.Vector3()),d=Math.max(s.x,s.y,s.z,.12);
 controls.target.copy(c);camera.position.copy(c.clone().add(new THREE.Vector3(d*1.7,d*.8,d*2.2)));
 nameEl.textContent=title;descEl.textContent=info;factsEl.textContent=`Bio3D está mostrando ${meshes.length} malla(s) relacionadas.`;
 breadcrumb.textContent=`Atlas › ${title}`;
}
function meshesForMain(keys){return keys.flatMap(k=>importedMeshIndex[k]||[])}
function meshesForDetail(keys){return (keys||[]).flatMap(k=>detailedIndex[k]||[])}

document.getElementById("showJointBtn").onclick=()=>{
 const j=JOINTS[document.getElementById("jointSelect").value];if(!j)return;
 highlightMeshSet([...meshesForMain(j.keys),...meshesForDetail(j.detail)],j.name,j.info);
};
document.getElementById("showSutureBtn").onclick=()=>{
 const s=SUTURES[document.getElementById("sutureSelect").value];if(!s)return;
 highlightMeshSet(meshesForDetail(s.bones),s.name,s.info);
};

function updateLayers(){
 const sk=document.getElementById("layerSkeleton").checked;
 if(importedModel)importedModel.visible=sk;
 else anatomy.visible=sk;
 // Joint/suture controls are semantic overlays based on selected bone meshes.
 document.getElementById("jointSelect").disabled=!document.getElementById("layerJoints").checked;
 document.getElementById("showJointBtn").disabled=!document.getElementById("layerJoints").checked;
 document.getElementById("sutureSelect").disabled=!document.getElementById("layerSutures").checked;
 document.getElementById("showSutureBtn").disabled=!document.getElementById("layerSutures").checked;
}
["layerSkeleton","layerJoints","layerSutures"].forEach(id=>document.getElementById(id).onchange=updateLayers);

// comandos de voz para articulaciones y suturas
const commandV17=command;
command=function(text){
 const t=normalize(text);
 const voiceJoints=[
  ["hombro","shoulder"],["shoulder","shoulder"],["codo","elbow"],["elbow","elbow"],["muneca","wrist"],["wrist","wrist"],
  ["cadera","hip"],["hip","hip"],["rodilla","knee"],["knee","knee"],["tobillo","ankle"],["ankle","ankle"]
 ];
 if(t.includes("articul")||t.includes("joint")){
  for(const [word,key] of voiceJoints)if(t.includes(normalize(word))){const j=JOINTS[key];highlightMeshSet([...meshesForMain(j.keys),...meshesForDetail(j.detail)],j.name,j.info);return}
 }
 for(const [key,s] of Object.entries(SUTURES)){
  if(t.includes(normalize(s.name))||t.includes(key)){highlightMeshSet(meshesForDetail(s.bones),s.name,s.info);return}
 }
 commandV17(text);
};

// Bio3D v1.7 Beta — falanges, sacro/cóccix y huesos craneofaciales
const EXTRA_DETAILED={
 phalanges_hand:[
  ["hand_thumb_prox","Pulgar · falange proximal",["thumb proximal phalanx","proximal phalanx thumb"]],
  ["hand_thumb_dist","Pulgar · falange distal",["thumb distal phalanx","distal phalanx thumb"]],
  ...[2,3,4,5].flatMap(d=>[
   [`hand_${d}_prox`,`Dedo ${d} · falange proximal`,[`proximal phalanx ${d}`,`finger ${d} proximal`]],
   [`hand_${d}_mid`,`Dedo ${d} · falange media`,[`middle phalanx ${d}`,`finger ${d} middle`]],
   [`hand_${d}_dist`,`Dedo ${d} · falange distal`,[`distal phalanx ${d}`,`finger ${d} distal`]]
  ])
 ],
 phalanges_foot:[
  ["foot_hallux_prox","Hallux · falange proximal",["hallux proximal phalanx","great toe proximal"]],
  ["foot_hallux_dist","Hallux · falange distal",["hallux distal phalanx","great toe distal"]],
  ...[2,3,4,5].flatMap(d=>[
   [`foot_${d}_prox`,`Dedo del pie ${d} · falange proximal`,[`toe ${d} proximal phalanx`,`proximal phalanx toe ${d}`]],
   [`foot_${d}_mid`,`Dedo del pie ${d} · falange media`,[`toe ${d} middle phalanx`,`middle phalanx toe ${d}`]],
   [`foot_${d}_dist`,`Dedo del pie ${d} · falange distal`,[`toe ${d} distal phalanx`,`distal phalanx toe ${d}`]]
  ])
 ],
 axial_lower:[
  ["sacrum","Sacro",["sacrum","sacro"]],
  ["coccyx","Cóccix",["coccyx","coccygeal","coccige","coccix"]]
 ],
 skull:[
  ["frontal","Frontal",["frontal bone","os frontale"]],
  ["parietal","Parietal",["parietal bone","os parietale"]],
  ["temporal","Temporal",["temporal bone","os temporale"]],
  ["occipital","Occipital",["occipital bone","os occipitale"]],
  ["sphenoid","Esfenoides",["sphenoid","os sphenoidale"]],
  ["ethmoid","Etmoides",["ethmoid","os ethmoidale"]],
  ["maxilla","Maxilar",["maxilla","maxillary bone"]],
  ["mandible","Mandíbula",["mandible","mandibula"]],
  ["zygomatic","Cigomático",["zygomatic","malar bone"]],
  ["nasal","Nasal",["nasal bone","os nasale"]],
  ["lacrimal","Lagrimal",["lacrimal bone","os lacrimale"]],
  ["palatine","Palatino",["palatine bone","os palatinum"]],
  ["vomer","Vómer",["vomer"]],
  ["inferior_nasal_concha","Cornete nasal inferior",["inferior nasal concha","inferior turbinate"]]
 ]
};
Object.assign(DETAILED_ATLAS,EXTRA_DETAILED);

// información educativa específica para nuevas estructuras
const DETAIL_INFO={
 sacrum:["El sacro es un hueso triangular formado por vértebras fusionadas.","Transmite el peso de la columna hacia la pelvis."],
 coccyx:["El cóccix constituye el extremo inferior de la columna vertebral.","Sirve como punto de inserción para músculos y ligamentos del suelo pélvico."],
 frontal:["El frontal forma la frente y parte del techo de las órbitas.","Contribuye a proteger los lóbulos frontales del encéfalo."],
 parietal:["Los parietales forman gran parte de la bóveda craneal.","Se articulan en la línea media mediante la sutura sagital."],
 temporal:["El temporal forma parte de la pared lateral y base del cráneo.","Aloja estructuras relacionadas con la audición y el equilibrio."],
 occipital:["El occipital forma la región posterior e inferior del cráneo.","Contiene el foramen magno, por donde continúa la médula espinal."],
 sphenoid:["El esfenoides es un hueso central de la base del cráneo.","Se articula con numerosos huesos craneales y faciales."],
 ethmoid:["El etmoides participa en la cavidad nasal y las órbitas.","Su lámina cribosa permite el paso de fibras olfatorias."],
 maxilla:["El maxilar forma parte de la mandíbula superior.","Participa en la órbita, cavidad nasal y paladar duro."],
 mandible:["La mandíbula es el principal hueso móvil del cráneo.","Sostiene los dientes inferiores y participa en la masticación."],
 zygomatic:["El cigomático forma la prominencia de la mejilla.","Participa en la pared lateral de la órbita."],
 nasal:["Los huesos nasales forman el puente óseo de la nariz.","Se articulan con el frontal y los maxilares."],
 vomer:["El vómer forma parte del tabique nasal óseo.","Se sitúa en la línea media de la cavidad nasal."]
};

// enrich detailed selection with educational text
const selectDetailedV16=selectDetailed;
selectDetailed=function(key){
 const ok=selectDetailedV16(key);
 if(!ok)return false;
 const info=DETAIL_INFO[key];
 if(info){descEl.textContent=info[0];factsEl.textContent=info[1];}
 return true;
};

// Bio3D v1.6 Beta — atlas detallado: vértebras, costillas, mano y pie
const DETAILED_ATLAS={
 spine:[
  ["c1","C1 · Atlas",["c1","atlas vertebra"]],
  ["c2","C2 · Axis",["c2","axis vertebra"]],
  ["c3","C3",["c3"]],["c4","C4",["c4"]],["c5","C5",["c5"]],["c6","C6",["c6"]],["c7","C7",["c7"]],
  ...Array.from({length:12},(_,i)=>[`t${i+1}`,`T${i+1}`, [`t${i+1}`,`thoracic ${i+1}`]]),
  ...Array.from({length:5},(_,i)=>[`l${i+1}`,`L${i+1}`, [`l${i+1}`,`lumbar ${i+1}`]])
 ],
 ribs:Array.from({length:12},(_,i)=>[`rib${i+1}`,`Costilla ${i+1}`,[`rib ${i+1}`,`rib${i+1}`,`costilla ${i+1}`]]),
 hand:[
  ["scaphoid","Escafoides",["scaphoid","scafoide","escafoides"]],
  ["lunate","Semilunar",["lunate","lunatum","semilunar"]],
  ["triquetrum","Piramidal",["triquetrum","triquetral","piramidal"]],
  ["pisiform","Pisiforme",["pisiform"]],
  ["trapezium","Trapecio",["trapezium"]],
  ["trapezoid","Trapezoide",["trapezoid"]],
  ["capitate","Grande",["capitate"]],
  ["hamate","Ganchoso",["hamate"]],
  ...Array.from({length:5},(_,i)=>[`metacarpal${i+1}`,`Metacarpiano ${i+1}`,[`metacarpal ${i+1}`,`metacarpal${i+1}`]])
 ],
 foot:[
  ["talus","Astrágalo",["talus","astragalus","astragalo"]],
  ["calcaneus","Calcáneo",["calcaneus","calcaneo"]],
  ["navicular","Navicular",["navicular"]],
  ["cuboid","Cuboides",["cuboid","cuboides"]],
  ["cuneiform_medial","Cuneiforme medial",["medial cuneiform","cuneiform medial"]],
  ["cuneiform_intermediate","Cuneiforme intermedio",["intermediate cuneiform","cuneiform intermediate"]],
  ["cuneiform_lateral","Cuneiforme lateral",["lateral cuneiform","cuneiform lateral"]],
  ...Array.from({length:5},(_,i)=>[`metatarsal${i+1}`,`Metatarsiano ${i+1}`,[`metatarsal ${i+1}`,`metatarsal${i+1}`]])
 ]
};
let detailedIndex={};
function buildDetailedIndex(){
 detailedIndex={};
 if(!importedModel)return;
 importedModel.traverse(o=>{
  if(!o.isMesh)return;
  const n=cleanName(o.name);
  Object.values(DETAILED_ATLAS).flat().forEach(([key,label,aliases])=>{
   if(aliases.some(a=>n.includes(cleanName(a))))(detailedIndex[key]??=[]).push(o);
  });
 });
}
const regionSel=document.getElementById("detailRegion"), structureSel=document.getElementById("detailStructure");
regionSel.onchange=()=>{
 structureSel.innerHTML='<option value="">Seleccionar estructura…</option>';
 (DETAILED_ATLAS[regionSel.value]||[]).forEach(([key,label])=>{
   const o=document.createElement("option");o.value=key;o.textContent=label;structureSel.appendChild(o);
 });
};
function selectDetailed(key){
 const meshes=detailedIndex[key]||[];
 if(!importedModel||!meshes.length){status.textContent="Esa estructura no fue identificada en el modelo cargado.";return false}
 resetImportedHighlight();
 meshes.forEach(m=>{
  if(!m.userData._bio3dOriginalMaterial)m.userData._bio3dOriginalMaterial=m.material;
  m.material=selectMat.clone();m.visible=true;
 });
 const box=new THREE.Box3();meshes.forEach(m=>box.expandByObject(m));
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,.08);
 controls.target.copy(center);camera.position.copy(center.clone().add(new THREE.Vector3(d*2,d*.8,d*2.5)));
 const item=Object.values(DETAILED_ATLAS).flat().find(x=>x[0]===key);
 nameEl.textContent=item?.[1]||key;
 descEl.textContent="Estructura individual identificada dentro del modelo anatómico importado.";
 factsEl.textContent=`Bio3D encontró ${meshes.length} malla(s) asociadas a esta estructura.`;
 breadcrumb.textContent=`Atlas detallado › ${item?.[1]||key}`;
 document.getElementById("selectionDetails").textContent=`${item?.[1]||key} · ${meshes.length} malla(s)`;
 return true;
}
document.getElementById("selectDetailBtn").onclick=()=>{if(structureSel.value)selectDetailed(structureSel.value)};

// Rebuild detailed index after any model indexing
const indexImportedModelV15=indexImportedModel;
indexImportedModel=function(rootModel){indexImportedModelV15(rootModel);buildDetailedIndex();};

// Voice lookup for detailed structures
const commandV15=command;
command=function(text){
 const t=normalize(text);
 for(const [key,label,aliases] of Object.values(DETAILED_ATLAS).flat()){
  if(aliases.some(a=>t.includes(normalize(a)))||t.includes(normalize(label))){
   if(selectDetailed(key))return;
  }
 }
 commandV15(text);
};

// Bio3D v1.5 Beta — mapa exacto importable y exploración avanzada
const EXACT_MAP_KEY="bio3d-exact-mesh-map-v15";
let exactMeshMap={};
try{exactMeshMap=JSON.parse(localStorage.getItem(EXACT_MAP_KEY)||"{}")}catch{}

function normalizeSide(v){
 const s=normalize(String(v||""));
 if(["left","l","izquierdo","izquierda","sinistro","sinistra"].includes(s))return "left";
 if(["right","r","derecho","derecha","destro","destra"].includes(s))return "right";
 return "";
}
function updateMeshMapStatus(){
 const n=Object.keys(exactMeshMap).length;
 document.getElementById("meshMapStatus").textContent=n?`Mapa exacto activo: ${n} nombres de malla`:"Mapa: reconocimiento automático";
}
function applyExactMapIndex(){
 if(!importedModel)return;
 importedMeshIndex={};
 importedModel.traverse(o=>{
   if(!o.isMesh)return;
   const mapped=exactMeshMap[o.name];
   if(mapped?.key){
     (importedMeshIndex[mapped.key]??=[]).push(o);
     return;
   }
   const n=cleanName(o.name), aliases=currentAliases();
   Object.entries(aliases).forEach(([key,list])=>{
     if(list.some(a=>n.includes(cleanName(a))))(importedMeshIndex[key]??=[]).push(o);
   });
 });
 inspectImportedModel();
}
function parseCSV(text){
 const lines=text.split(/\r?\n/).filter(Boolean);
 if(lines.length<2)return {};
 const parseLine=line=>{
   const out=[];let cur="",q=false;
   for(let i=0;i<line.length;i++){
     const c=line[i];
     if(c==='"'&&line[i+1]==='"'){cur+='"';i++}
     else if(c==='"'){q=!q}
     else if(c===','&&!q){out.push(cur);cur=""}
     else cur+=c;
   }out.push(cur);return out;
 };
 const headers=parseLine(lines[0]);
 const map={};
 lines.slice(1).forEach(line=>{
   const vals=parseLine(line), row={};
   headers.forEach((h,i)=>row[h]=vals[i]||"");
   if(row.mesh_name&&row.recognized_key){
     map[row.mesh_name]={key:row.recognized_key,side:normalizeSide(row.side),label:row.recognized_label||""};
   }
 });
 return map;
}
document.getElementById("loadMeshMapBtn").onclick=()=>document.getElementById("meshMapFile").click();
document.getElementById("meshMapFile").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
   const text=await file.text();
   let map={};
   if(file.name.toLowerCase().endsWith(".json")){
     const data=JSON.parse(text);
     if(Array.isArray(data)){
       data.forEach(r=>{if(r.mesh_name&&r.recognized_key)map[r.mesh_name]={key:r.recognized_key,side:normalizeSide(r.side),label:r.recognized_label||""}});
     }else map=data;
   }else map=parseCSV(text);
   exactMeshMap=map;
   localStorage.setItem(EXACT_MAP_KEY,JSON.stringify(exactMeshMap));
   updateMeshMapStatus();applyExactMapIndex();
   status.textContent=`Mapa importado: ${Object.keys(exactMeshMap).length} mallas configuradas.`;
 }catch(err){console.error(err);status.textContent="No se pudo importar el mapa de mallas."}
};
document.getElementById("clearMeshMapBtn").onclick=()=>{
 exactMeshMap={};localStorage.removeItem(EXACT_MAP_KEY);updateMeshMapStatus();
 if(importedModel)indexImportedModel(importedModel);
};

let xrayMode=false;
function selectedImportedMeshes(){return importedModel&&selectedKey?(importedMeshIndex[selectedKey]||[]):[]}
document.getElementById("hideSelectedBtn").onclick=()=>{
 const meshes=selectedImportedMeshes();
 if(!meshes.length){status.textContent="Selecciona primero una estructura importada.";return}
 meshes.forEach(m=>m.visible=false);
 status.textContent=`Estructura oculta: ${atlasNames[selectedKey]||selectedKey}.`;
};
document.getElementById("xrayBtn").onclick=()=>{
 if(!importedModel)return;
 xrayMode=!xrayMode;
 const selected=new Set(selectedImportedMeshes());
 importedModel.traverse(o=>{
   if(!o.isMesh)return;
   if(!o.userData._bio3dBaseMaterial)o.userData._bio3dBaseMaterial=o.material;
   if(xrayMode&&!selected.has(o)){
     const mat=o.material.clone();
     mat.transparent=true;mat.opacity=.13;mat.depthWrite=false;
     o.material=mat;
   }else if(!selected.has(o)){
     o.material=o.userData._bio3dBaseMaterial;
   }
 });
 document.getElementById("xrayBtn").textContent=xrayMode?"Salir transparencia":"Modo transparente";
};

// En selección exacta, respeta lateralidad guardada en el mapa
const detectSideV14=detectSide;
detectSide=function(name){
 const mapped=exactMeshMap[name];
 return mapped?.side||detectSideV14(name);
};

// detalles en panel
const selectImportedStructureSideV14=selectImportedStructureSide;
selectImportedStructureSide=function(key,side=null){
 const ok=selectImportedStructureSideV14(key,side);
 const meshes=(importedMeshIndex[key]||[]).filter(m=>!side||detectSide(m.name)===side);
 const verts=meshes.reduce((a,m)=>a+(m.geometry?.attributes?.position?.count||0),0);
 document.getElementById("selectionDetails").textContent=
   `${atlasNames[key]||key}${side==="left"?" · lado izquierdo":side==="right"?" · lado derecho":""} · ${meshes.length} malla(s) · ${verts.toLocaleString()} vértices.`;
 return ok;
};
updateMeshMapStatus();

// Bio3D v1.4 Beta — FBX directo, mapa real de mallas y aislamiento
function meshMapRows(){
 if(!importedModel)return [];
 const rows=[];
 importedModel.traverse(o=>{
   if(!o.isMesh)return;
   const raw=o.name||"";
   const n=cleanName(raw);
   let key="",side=detectSide(raw)||"";
   const aliases=currentAliases();
   for(const [k,list] of Object.entries(aliases)){
     if(list.some(a=>n.includes(cleanName(a)))){key=k;break}
   }
   rows.push({
     mesh_name:raw,
     recognized_key:key,
     recognized_label:key?(atlasNames[key]||key):"",
     side,
     vertices:o.geometry?.attributes?.position?.count||0,
     visible:o.visible
   });
 });
 return rows;
}
document.getElementById("exportMeshMapBtn").onclick=()=>{
 if(!importedModel){status.textContent="Carga primero un modelo anatómico.";return}
 const rows=meshMapRows();
 const headers=["mesh_name","recognized_key","recognized_label","side","vertices","visible"];
 const csv=[headers.join(","),...rows.map(r=>headers.map(h=>`"${String(r[h]??"").replaceAll('"','""')}"`).join(","))].join("\n");
 downloadBlob(csv,"text/csv;charset=utf-8","Bio3D_mapa_mallas.csv");
 status.textContent=`Mapa exportado: ${rows.length} mallas.`;
};
document.getElementById("isolateSelectedBtn").onclick=()=>{
 if(!importedModel||!selectedKey){status.textContent="Selecciona una estructura del modelo primero.";return}
 const selected=new Set(importedMeshIndex[selectedKey]||[]);
 importedModel.traverse(o=>{if(o.isMesh)o.visible=selected.has(o)});
 status.textContent=`Aislado: ${atlasNames[selectedKey]||selectedKey}.`;
};
document.getElementById("showAllMeshesBtn").onclick=()=>{
 if(!importedModel)return;
 importedModel.traverse(o=>{if(o.isMesh)o.visible=true});
 status.textContent="Todas las mallas visibles.";
};

// mejora el informe con porcentaje de reconocimiento
const inspectImportedModelV13=inspectImportedModel;
inspectImportedModel=function(){
 inspectImportedModelV13();
 if(!importedModel)return;
 const rows=meshMapRows();
 const recognized=rows.filter(r=>r.recognized_key).length;
 const pct=rows.length?Math.round(recognized/rows.length*100):0;
 const out=document.getElementById("modelQualityStatus");
 out.innerHTML += `<br><span class="mesh-report">Reconocimiento de mallas: ${recognized}/${rows.length} (${pct}%). Archivo: ${importedModel.name||"modelo importado"}.</span>`;
};

// Bio3D v1.3 Beta — perfiles de importación y cumplimiento de licencia
const MODEL_PROFILES={
 generic:{
   label:"Genérico",
   aliases:anatomyAliases
 },
 zanatomy:{
   label:"Z-Anatomy",
   aliases:{
     ...anatomyAliases,
     craneo:[...anatomyAliases.craneo,"cranium","neurocranium","viscerocranium"],
     columna:[...anatomyAliases.columna,"vertebral column","vertebra cervical","vertebra thoracic","vertebra lumbar"],
     pelvis:[...anatomyAliases.pelvis,"os coxae","hip bone","ilium","ischium","pubis"],
     humero:[...anatomyAliases.humero,"humerus"],
     femur:[...anatomyAliases.femur,"femur"],
     tibia:[...anatomyAliases.tibia,"tibia"],
     radio:[...anatomyAliases.radio,"radius"],
     cubito:[...anatomyAliases.cubito,"ulna"],
     rotula:[...anatomyAliases.rotula,"patella"],
     perone:[...anatomyAliases.perone,"fibula"],
     esternon:[...anatomyAliases.esternon,"sternum"],
     escapula:[...anatomyAliases.escapula,"scapula"]
   }
 }
};
function currentAliases(){
 const p=document.getElementById("modelProfile")?.value||"generic";
 return MODEL_PROFILES[p]?.aliases||anatomyAliases;
}
function reindexImportedModel(){
 if(!importedModel)return;
 importedMeshIndex={};
 const aliasesMap=currentAliases();
 importedModel.traverse(o=>{
   if(!o.isMesh)return;
   const n=cleanName(o.name);
   Object.entries(aliasesMap).forEach(([key,aliases])=>{
     if(aliases.some(a=>n.includes(cleanName(a))))(importedMeshIndex[key]??=[]).push(o);
   });
 });
 inspectImportedModel();
}
document.getElementById("modelProfile").addEventListener("change",()=>{
 reindexImportedModel();
 status.textContent=`Perfil de modelo: ${document.getElementById("modelProfile").selectedOptions[0].textContent}`;
});

// override indexer to respect selected profile
indexImportedModel=function(rootModel){
 importedMeshIndex={};
 const aliasesMap=currentAliases();
 rootModel.traverse(o=>{
   if(!o.isMesh)return;
   const n=cleanName(o.name);
   Object.entries(aliasesMap).forEach(([key,aliases])=>{
     if(aliases.some(a=>n.includes(cleanName(a))))(importedMeshIndex[key]??=[]).push(o);
   });
 });
 const found=Object.keys(importedMeshIndex).map(k=>atlasNames[k]||k);
 status.textContent=found.length?`Modelo analizado: encontré ${found.join(", ")}.`:"Modelo cargado, pero no encontré nombres anatómicos reconocibles.";
};

const licenseModal=document.getElementById("licenseModal");
document.getElementById("licenseInfoBtn").onclick=()=>licenseModal.hidden=false;
document.getElementById("closeLicenseBtn").onclick=()=>licenseModal.hidden=true;
licenseModal.addEventListener("click",e=>{if(e.target===licenseModal)licenseModal.hidden=true});

// Bio3D v1.2 Beta — lateralidad anatómica y selección izquierda/derecha
let preferredSide=null;
const sideTokens={
 left:[" left","left ","_l"," l ","izquierd","sinistr","sx","左","يسار"],
 right:[" right","right ","_r"," r ","derech","dexter","dx","右","يمين"]
};
function detectSide(name){
 const n=" "+cleanName(name)+" ";
 if(sideTokens.left.some(t=>n.includes(cleanName(t))))return "left";
 if(sideTokens.right.some(t=>n.includes(cleanName(t))))return "right";
 return null;
}
function selectImportedStructureSide(key,side=null){
 const meshes=(importedMeshIndex[key]||[]).filter(m=>!side||detectSide(m.name)===side);
 if(!meshes.length)return selectImportedStructure(key);
 resetImportedHighlight();
 meshes.forEach(m=>{
   if(!m.userData._bio3dOriginalMaterial)m.userData._bio3dOriginalMaterial=m.material;
   m.material=selectMat.clone();
 });
 anatomy.visible=false;tissueGroup.visible=false;cellGroup.visible=false;importedModel.visible=true;
 const box=new THREE.Box3();meshes.forEach(m=>box.expandByObject(m));
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const d=Math.max(size.x,size.y,size.z,.25);
 controls.target.copy(center);camera.position.copy(center.clone().add(new THREE.Vector3(d*2,d*.7,d*2.4)));
 const sideLabel=side==="left"?" izquierdo":side==="right"?" derecho":"";
 nameEl.textContent=(atlasNames[key]||key)+sideLabel;
 breadcrumb.textContent=`Modelo importado › ${atlasNames[key]||key}${sideLabel}`;
 selectedKey=key;preferredSide=side;markVisited(key);
 return true;
}
document.getElementById("leftSideBtn").onclick=()=>{
 preferredSide="left";
 if(selectedKey&&importedModel)selectImportedStructureSide(selectedKey,"left");
 else status.textContent="Selecciona una estructura de un modelo importado.";
};
document.getElementById("rightSideBtn").onclick=()=>{
 preferredSide="right";
 if(selectedKey&&importedModel)selectImportedStructureSide(selectedKey,"right");
 else status.textContent="Selecciona una estructura de un modelo importado.";
};

// Amplía el comando de voz con lateralidad en varios idiomas
const commandV11=command;
command=function(text){
 const t=normalize(text);
 let side=null;
 if(["izquierdo","izquierda","left","sinistro","sinistra","左","يسار"].some(w=>t.includes(normalize(w))))side="left";
 if(["derecho","derecha","right","destro","destra","右","يمين"].some(w=>t.includes(normalize(w))))side="right";
 for(const [key,aliases] of Object.entries(anatomyAliases)){
   if(aliases.some(a=>t.includes(normalize(a)))){
     showBone();
     if(importedModel&&importedMeshIndex[key]?.length)selectImportedStructureSide(key,side);
     else selectStructure(key);
     return;
   }
 }
 commandV11(text);
};

// Bio3D v1.1 Beta — flujo de modelo anatómico profesional
function fitImportedModel(){
 if(!importedModel){status.textContent="Carga primero un modelo GLB/GLTF.";return}
 const box=new THREE.Box3().setFromObject(importedModel);
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3());
 const size=box.getSize(new THREE.Vector3());
 const maxDim=Math.max(size.x,size.y,size.z,.1);
 controls.target.copy(center);
 camera.position.copy(center.clone().add(new THREE.Vector3(maxDim*.8,maxDim*.35,maxDim*1.7)));
 controls.update();
}
function inspectImportedModel(){
 const out=document.getElementById("modelQualityStatus");
 if(!importedModel){out.textContent="Demo procedural activa · carga un GLB/GLTF para analizarlo.";return}
 let meshes=0,vertices=0,named=0;
 const names=[];
 importedModel.traverse(o=>{
   if(o.isMesh){
     meshes++;
     const p=o.geometry?.attributes?.position?.count||0;vertices+=p;
     if(o.name){named++; if(names.length<5)names.push(o.name)}
   }
 });
 const recognized=Object.keys(importedMeshIndex).length;
 out.innerHTML=`Mallas: <b>${meshes}</b> · Vértices: <b>${vertices.toLocaleString()}</b> · Mallas con nombre: <b>${named}</b> · Estructuras reconocidas: <b>${recognized}</b><br><span class="mesh-report">${names.length?"Ejemplos: "+names.join(", "):"El archivo no expone nombres de malla útiles."}</span>`;
}
document.getElementById("inspectModelBtn").onclick=inspectImportedModel;
document.getElementById("fitModelBtn").onclick=fitImportedModel;

// Al terminar una carga, el usuario puede analizar la calidad/nomenclatura.
const modelInput=document.getElementById("modelFile");
modelInput.addEventListener("change",()=>setTimeout(()=>{
 if(importedModel){inspectImportedModel();fitImportedModel();}
},1200));

// Selección táctil directa sobre un GLB importado
canvas.addEventListener("dblclick",e=>{
 if(!importedModel||!importedModel.visible)return;
 const r=canvas.getBoundingClientRect();
 pointer.x=((e.clientX-r.left)/r.width)*2-1;
 pointer.y=-((e.clientY-r.top)/r.height)*2+1;
 ray.setFromCamera(pointer,camera);
 const hit=ray.intersectObject(importedModel,true)[0];
 if(!hit)return;
 const obj=hit.object;
 const n=cleanName(obj.name);
 let matched=null;
 for(const [key,aliases] of Object.entries(anatomyAliases)){
   if(aliases.some(a=>n.includes(cleanName(a)))){matched=key;break}
 }
 if(matched){selectImportedStructure(matched);status.textContent=`Seleccionado: ${atlasNames[matched]||matched}`;}
 else{
   nameEl.textContent=obj.name||"Estructura 3D";
   descEl.textContent="Malla seleccionada directamente en el modelo. Su nombre no coincide todavía con el diccionario anatómico de Bio3D.";
   breadcrumb.textContent="Modelo importado › "+(obj.name||"Malla");
 }
});

// Bio3D v1.0 Beta — modos de producto y navegación modular
const APP_PREF_KEY="bio3d-app-v1";
let appPrefs={mode:null,module:"skeletal"};
try{appPrefs={...appPrefs,...JSON.parse(localStorage.getItem(APP_PREF_KEY)||"{}")}catch{}
const welcome=document.getElementById("welcomeScreen");
function setAppMode(mode,closeWelcome=true){
 appPrefs.mode=mode;
 document.body.classList.toggle("teacher-mode",mode==="teacher");
 document.body.classList.toggle("student-mode",mode==="student");
 document.getElementById("modeBadge").textContent=mode==="teacher"?"🧑‍🏫 Docente":"🎓 Estudiante";
 localStorage.setItem(APP_PREF_KEY,JSON.stringify(appPrefs));
 if(closeWelcome)welcome.classList.add("hidden");
}
document.getElementById("studentModeBtn").onclick=()=>setAppMode("student");
document.getElementById("teacherModeBtn").onclick=()=>setAppMode("teacher");
document.getElementById("changeModeBtn").onclick=()=>welcome.classList.remove("hidden");
if(appPrefs.mode)setAppMode(appPrefs.mode,false);

const moduleMessages={
 skeletal:{title:"Sistema esquelético",text:"Explora huesos, tejido óseo y células."},
 muscular:{title:"Sistema muscular",text:"Módulo preparado para la siguiente expansión de Bio3D."},
 organs:{title:"Órganos",text:"Módulo preparado para corazón, pulmones, hígado y otros órganos."},
 nervous:{title:"Sistema nervioso",text:"Módulo preparado para cerebro, médula espinal y nervios."}
};
document.querySelectorAll(".module").forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".module").forEach(x=>x.classList.remove("active"));
   b.classList.add("active");appPrefs.module=b.dataset.module;localStorage.setItem(APP_PREF_KEY,JSON.stringify(appPrefs));
   const m=moduleMessages[b.dataset.module];
   if(b.dataset.module==="skeletal"){showBone();nameEl.textContent=m.title;descEl.textContent=m.text}
   else{
     anatomy.visible=false;if(importedModel)importedModel.visible=false;tissueGroup.visible=false;cellGroup.visible=false;
     nameEl.textContent=m.title;descEl.textContent=m.text;factsEl.textContent="Este módulo está incluido en la arquitectura de Bio3D v1.0 Beta y se ampliará con modelos anatómicos específicos.";
     breadcrumb.textContent="Bio3D › "+m.title;
   }
 }
});

// Bio3D v0.9 — perfiles, unidades, bancos por nivel y exportación docente
const UNIT_DEFS={
 skeletal_basics:{name:"Sistema esquelético",keys:["craneo","columna","pelvis","femur","tibia"]},
 upper_limb:{name:"Miembro superior",keys:["humero","radio","cubito","escapula"]},
 lower_limb:{name:"Miembro inferior",keys:["pelvis","femur","rotula","tibia","perone"]}
};

const QUIZ_BANK_SECONDARY=[
 {q:"¿Cuál es el hueso más largo del cuerpo humano?",answer:"femur",options:["femur","humero","tibia","radio"]},
 {q:"¿Qué estructura protege principalmente el encéfalo?",answer:"craneo",options:["pelvis","craneo","esternon","rotula"]},
 {q:"¿Qué hueso está en el brazo entre hombro y codo?",answer:"humero",options:["humero","femur","radio","tibia"]},
 {q:"¿Qué hueso principal soporta peso en la pierna?",answer:"tibia",options:["tibia","cubito","radio","escapula"]},
 {q:"¿Qué estructura conecta el tronco con las extremidades inferiores?",answer:"pelvis",options:["pelvis","rotula","esternon","radio"]},
 {q:"¿Qué hueso está delante de la articulación de la rodilla?",answer:"rotula",options:["rotula","perone","radio","humero"]}
];

const QUIZ_BANK_UNIVERSITY=[
 {q:"¿Qué hueso articula proximalmente con el acetábulo?",answer:"femur",options:["femur","tibia","humero","radio"]},
 {q:"¿Qué hueso del antebrazo se ubica del lado del pulgar en posición anatómica?",answer:"radio",options:["radio","cubito","humero","escapula"]},
 {q:"¿Qué hueso forma el componente medial principal del antebrazo?",answer:"cubito",options:["cubito","radio","tibia","perone"]},
 {q:"¿Qué hueso sesamoideo incrementa la eficacia del mecanismo extensor de la rodilla?",answer:"rotula",options:["rotula","tibia","pelvis","esternon"]},
 {q:"¿Qué hueso lateral de la pierna contribuye a la estabilidad del tobillo?",answer:"perone",options:["perone","tibia","radio","cubito"]},
 {q:"¿Qué hueso plano participa en la cintura escapular?",answer:"escapula",options:["escapula","esternon","pelvis","rotula"]}
];

const PROFILE_KEY="bio3d-profile-v09";
let profileState={name:"",unit:"skeletal_basics",history:[]};
try{
 const saved=JSON.parse(localStorage.getItem(PROFILE_KEY)||"null");
 if(saved) profileState={...profileState,...saved};
}catch{}

function saveProfile(){
 profileState.name=document.getElementById("profileStudentName").value.trim();
 profileState.unit=document.getElementById("unitSelect").value;
 localStorage.setItem(PROFILE_KEY,JSON.stringify(profileState));
 document.getElementById("profileStatus").textContent=profileState.name?`Perfil: ${profileState.name}`:"Perfil guardado sin nombre";
 updateTeacherSummary();
}
function restoreProfile(){
 document.getElementById("profileStudentName").value=profileState.name||"";
 document.getElementById("unitSelect").value=profileState.unit||"skeletal_basics";
 document.getElementById("profileStatus").textContent=profileState.name?`Perfil: ${profileState.name}`:"Sin perfil guardado";
}
document.getElementById("saveProfileBtn").onclick=saveProfile;
document.getElementById("unitSelect").addEventListener("change",()=>{
 profileState.unit=document.getElementById("unitSelect").value;
 localStorage.setItem(PROFILE_KEY,JSON.stringify(profileState));
});

function getActiveQuizBank(){
 const base=educationLevel==="university"?QUIZ_BANK_UNIVERSITY:QUIZ_BANK_SECONDARY;
 const unit=UNIT_DEFS[document.getElementById("unitSelect").value]||UNIT_DEFS.skeletal_basics;
 const relevant=base.filter(q=>q.options.some(k=>unit.keys.includes(k)) || unit.keys.includes(q.answer));
 return relevant.length>=3?relevant:base;
}

// override startQuiz from v0.8
startQuiz=function(){
 const bank=getActiveQuizBank();
 quizState={active:true,index:0,score:0,questions:shuffled(bank).slice(0,Math.min(5,bank.length))};
 renderQuiz();
};

// wrap renderQuiz completion to store history
const renderQuizV08=renderQuiz;
renderQuiz=function(){
 const beforeActive=quizState.active;
 const beforeIndex=quizState.index;
 renderQuizV08();
 if(beforeActive && beforeIndex>=quizState.questions.length && !quizState.active){
   const result={
     date:new Date().toISOString(),
     student:profileState.name||"Sin nombre",
     level:educationLevel,
     unit:document.getElementById("unitSelect").value,
     score:quizState.score,
     total:quizState.questions.length
   };
   const last=profileState.history[profileState.history.length-1];
   if(!last || last.date!==result.date){
     profileState.history.push(result);
     localStorage.setItem(PROFILE_KEY,JSON.stringify(profileState));
     updateTeacherSummary();
   }
 }
};

function updateTeacherSummary(){
 const h=profileState.history||[];
 const el=document.getElementById("teacherSummary");
 if(!h.length){el.textContent="Aún no hay resultados registrados.";return}
 const avg=Math.round(h.reduce((a,r)=>a+(r.total?r.score/r.total*100:0),0)/h.length);
 const last=h[h.length-1];
 el.textContent=`Intentos: ${h.length} · Promedio: ${avg}% · Último: ${last.score}/${last.total}`;
}

function downloadBlob(content,type,filename){
 const blob=new Blob([content],{type});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
}
document.getElementById("exportResultsBtn").onclick=()=>{
 const rows=[["Estudiante","Fecha","Nivel","Unidad","Puntaje","Total","Porcentaje"]];
 (profileState.history||[]).forEach(r=>{
   rows.push([r.student,r.date,r.level,UNIT_DEFS[r.unit]?.name||r.unit,r.score,r.total,Math.round(r.score/r.total*100)+"%"]);
 });
 const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
 downloadBlob(csv,"text/csv;charset=utf-8","Bio3D_resultados.csv");
};
document.getElementById("exportJsonBtn").onclick=()=>{
 const payload={profile:profileState,learning:learningState,version:"0.9"};
 downloadBlob(JSON.stringify(payload,null,2),"application/json","Bio3D_respaldo.json");
};

restoreProfile();
updateTeacherSummary();

// Bio3D v0.8 — lecciones, quiz y dominio
const LESSONS=[
  {key:"craneo",title:"Cráneo",text:"El cráneo protege el encéfalo y forma la estructura ósea de la cabeza."},
  {key:"columna",title:"Columna vertebral",text:"La columna sostiene el tronco, protege la médula espinal y permite movilidad."},
  {key:"pelvis",title:"Pelvis",text:"La pelvis conecta el tronco con los miembros inferiores y transmite el peso corporal."},
  {key:"femur",title:"Fémur",text:"El fémur es el hueso más largo del cuerpo y conecta la cadera con la rodilla."},
  {key:"tibia",title:"Tibia",text:"La tibia soporta una gran parte de la carga de la pierna."}
];

const QUIZ_BANK=[
  {q:"¿Cuál es el hueso más largo del cuerpo humano?",answer:"femur",options:["femur","humero","tibia","radio"]},
  {q:"¿Qué estructura protege principalmente el encéfalo?",answer:"craneo",options:["pelvis","craneo","esternon","rotula"]},
  {q:"¿Qué hueso forma parte principal de la pierna y soporta peso?",answer:"tibia",options:["radio","tibia","cubito","escapula"]},
  {q:"¿Qué estructura conecta la columna con los miembros inferiores?",answer:"pelvis",options:["pelvis","rotula","radio","esternon"]},
  {q:"¿Qué hueso se encuentra en el brazo entre hombro y codo?",answer:"humero",options:["perone","humero","femur","tibia"]}
];

learningState.mastery=learningState.mastery||{};
learningState.quizBest=learningState.quizBest||0;

let lessonIndex=-1;
function renderLesson(){
  const item=LESSONS[lessonIndex];
  if(!item)return;
  showBone();selectStructure(item.key);
  document.getElementById("lessonText").textContent=`${lessonIndex+1}/${LESSONS.length} — ${item.title}: ${item.text}`;
  document.getElementById("prevLessonBtn").disabled=lessonIndex<=0;
  document.getElementById("nextLessonBtn").disabled=lessonIndex>=LESSONS.length-1;
}
document.getElementById("guidedLessonStartBtn").onclick=()=>{lessonIndex=0;renderLesson()};
document.getElementById("prevLessonBtn").onclick=()=>{if(lessonIndex>0){lessonIndex--;renderLesson()}};
document.getElementById("nextLessonBtn").onclick=()=>{if(lessonIndex<LESSONS.length-1){lessonIndex++;renderLesson()}};

let quizState={active:false,index:0,score:0,questions:[]};
function shuffled(arr){return [...arr].sort(()=>Math.random()-.5)}
function startQuiz(){
  quizState={active:true,index:0,score:0,questions:shuffled(QUIZ_BANK).slice(0,5)};
  renderQuiz();
}
function renderQuiz(){
  const q=quizState.questions[quizState.index];
  const qEl=document.getElementById("atlasQuizQuestion");
  const ans=document.getElementById("atlasQuizAnswers");
  ans.innerHTML="";
  if(!q){
    quizState.active=false;
    qEl.textContent=`Quiz terminado. Puntuación: ${quizState.score}/${quizState.questions.length}.`;
    learningState.quizBest=Math.max(learningState.quizBest||0,quizState.score);
    saveLearning();
    document.getElementById("quizProgress").textContent=`${quizState.questions.length}/${quizState.questions.length}`;
    return;
  }
  qEl.textContent=q.q;
  document.getElementById("quizScore").textContent=`${quizState.score} puntos`;
  document.getElementById("quizProgress").textContent=`${quizState.index+1}/${quizState.questions.length}`;
  shuffled(q.options).forEach(key=>{
    const b=document.createElement("button");
    b.className="quiz-answer";
    b.textContent=atlasNames[key]||key;
    b.onclick=()=>answerQuiz(b,key,q.answer);
    ans.appendChild(b);
  });
}
function answerQuiz(button,key,answer){
  document.querySelectorAll(".quiz-answer").forEach(b=>b.disabled=true);
  const ok=key===answer;
  button.classList.add(ok?"correct":"wrong");
  document.querySelectorAll(".quiz-answer").forEach(b=>{
    if((b.textContent||"")===(atlasNames[answer]||answer)) b.classList.add("correct");
  });
  const mastery=learningState.mastery[answer]||{correct:0,total:0};
  mastery.total++;
  if(ok){quizState.score++;mastery.correct++}
  learningState.mastery[answer]=mastery;
  markVisited(answer);
  setTimeout(()=>{quizState.index++;renderQuiz()},650);
}
document.getElementById("startQuizBtn").onclick=startQuiz;

// Extiende panel de aprendizaje con dominio
const learningCard=document.querySelector(".learning-card");
const masteryWrap=document.createElement("div");
masteryWrap.innerHTML='<hr style="border-color:#183744;border-width:1px 0 0;margin:14px 0"><strong>Dominio</strong><div id="masteryList" class="mastery-list"></div>';
learningCard.appendChild(masteryWrap);

const oldUpdateLearningUI=updateLearningUI;
updateLearningUI=function(){
  oldUpdateLearningUI();
  const list=document.getElementById("masteryList");
  if(!list)return;
  list.innerHTML="";
  const entries=Object.entries(learningState.mastery||{});
  if(!entries.length){list.innerHTML="<small>Aún no hay resultados de quiz.</small>";return}
  entries.forEach(([key,m])=>{
    const row=document.createElement("div");row.className="mastery-row";
    const pct=m.total?Math.round(m.correct/m.total*100):0;
    row.innerHTML=`<span>${atlasNames[key]||key}</span><span class="mastery-chip">${pct}%</span>`;
    list.appendChild(row);
  });
};

// Bio3D v0.7 — progreso educativo y favoritos persistentes
const STORAGE_KEY="bio3d-learning-v07";
let learningState={visited:[],favorites:[],educationLevel:"secondary",language:"es"};
try{
 const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
 if(saved) learningState={...learningState,...saved};
}catch{}
function saveLearning(){
 learningState.educationLevel=educationLevel;
 learningState.language=document.getElementById("language").value;
 localStorage.setItem(STORAGE_KEY,JSON.stringify(learningState));
 updateLearningUI();
}
function markVisited(key){
 if(!key)return;
 if(!learningState.visited.includes(key)) learningState.visited.push(key);
 saveLearning();
}
function toggleFavorite(){
 if(!selectedKey){status.textContent="Selecciona primero una estructura.";return}
 const i=learningState.favorites.indexOf(selectedKey);
 if(i>=0)learningState.favorites.splice(i,1);else learningState.favorites.push(selectedKey);
 saveLearning();
}
function updateLearningUI(){
 const total=Object.keys(atlasNames).length;
 const studied=learningState.visited.filter(k=>atlasNames[k]).length;
 const pct=Math.round(studied/total*100);
 document.getElementById("visitedCount").textContent=studied;
 document.getElementById("favoriteCount").textContent=learningState.favorites.length;
 document.getElementById("atlasProgressText").textContent=`${pct}%`;
 document.getElementById("progressBar").style.width=`${pct}%`;
 const favBtn=document.getElementById("favoriteBtn");
 favBtn.textContent=selectedKey&&learningState.favorites.includes(selectedKey)?"★ Quitar de favoritos":"☆ Añadir a favoritos";
 const list=document.getElementById("favoritesList");list.innerHTML="";
 if(!learningState.favorites.length){list.innerHTML="<small>Aún no hay favoritos.</small>";}
 learningState.favorites.forEach(key=>{
   if(!atlasNames[key])return;
   const row=document.createElement("div");row.className="favorite-item";
   const b=document.createElement("button");b.textContent=`★ ${atlasNames[key]}`;
   b.onclick=()=>{showBone();selectStructure(key)};
   row.appendChild(b);list.appendChild(row);
 });
}
document.getElementById("favoriteBtn").onclick=toggleFavorite;
document.getElementById("resetAtlasProgressBtn").onclick=()=>{
 if(confirm("¿Reiniciar el progreso educativo de Bio3D?")){
   learningState.visited=[];learningState.favorites=[];saveLearning();
 }
};
document.getElementById("language").addEventListener("change",saveLearning);
document.getElementById("secondaryBtn").addEventListener("click",saveLearning);
document.getElementById("universityBtn").addEventListener("click",saveLearning);

// Restaura preferencias del estudiante
if(["es","en","it","ar","zh"].includes(learningState.language)){
 document.getElementById("language").value=learningState.language;
 applyLanguage();
}
if(learningState.educationLevel==="university"){
 document.getElementById("universityBtn").click();
}
updateLearningUI();


// Bio3D v0.6 — PWA e interfaz móvil
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
let deferredInstall=null;
const installBtn=document.getElementById("installBtn");
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstall=e;installBtn.hidden=false;
});
installBtn.addEventListener("click",async()=>{
  if(!deferredInstall)return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall=null;installBtn.hidden=true;
});
window.addEventListener("appinstalled",()=>{installBtn.hidden=true;deferredInstall=null});

const leftPanel=document.querySelector(".left-panel");
const infoPanel=document.querySelector(".info");
function closeMobilePanels(){leftPanel.classList.remove("mobile-open");infoPanel.classList.remove("mobile-open")}
document.getElementById("mobileAtlas").onclick=()=>{
  const open=!leftPanel.classList.contains("mobile-open");closeMobilePanels();if(open)leftPanel.classList.add("mobile-open");
};
document.getElementById("mobileInfo").onclick=()=>{
  const open=!infoPanel.classList.contains("mobile-open");closeMobilePanels();if(open)infoPanel.classList.add("mobile-open");
};
document.getElementById("mobileMic").onclick=()=>document.getElementById("mic").click();
canvas.addEventListener("pointerdown",()=>{if(innerWidth<=900)closeMobilePanels()},{capture:true});

function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w||canvas.height!==h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}
function loop(){resize();controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}
showBone();loop();
