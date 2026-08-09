const statusEl=()=>document.getElementById("runtimeStatus");
async function startBio3D(){
  try{
    if(statusEl()) statusEl().textContent="Cargando…";
    await import("./app.js");
    if(statusEl()) statusEl().textContent="✓ Activa";
    window.__BIO3D_RUNTIME_OK__=true;
  }catch(err){
    console.error("Bio3D bootstrap failure:",err);
    if(statusEl()) statusEl().textContent="✗ Error";
    window.__BIO3D_RUNTIME_OK__=false;
    showRuntimeError(err);
  }
}
function showRuntimeError(err){
  if(document.getElementById("bio3dRuntimeError")) return;
  const wrap=document.createElement("div");
  wrap.id="bio3dRuntimeError";wrap.className="runtime-error";
  wrap.innerHTML=`<div class="runtime-error-card">
    <h2>Bio3D no pudo iniciar</h2>
    <p>La causa más habitual es que las librerías 3D externas todavía no estén disponibles en caché o que la conexión esté bloqueada.</p>
    <p style="font-size:12px;opacity:.8">${String(err?.message||err)}</p>
    <button id="runtimeReloadBtn">Reintentar</button>
  </div>`;
  document.body.appendChild(wrap);
  document.getElementById("runtimeReloadBtn").onclick=()=>location.reload();
}
window.addEventListener("online",()=>{const e=document.getElementById("networkStatus");if(e)e.textContent="Online"});
window.addEventListener("offline",()=>{const e=document.getElementById("networkStatus");if(e)e.textContent="Offline"});
document.addEventListener("DOMContentLoaded",()=>{
  const net=document.getElementById("networkStatus");
  if(net)net.textContent=navigator.onLine?"Online":"Offline";
  document.getElementById("retryRuntimeBtn")?.addEventListener("click",()=>location.reload());
  document.getElementById("checkOfflineBtn")?.addEventListener("click",async()=>{
    const out=document.getElementById("cacheStatus");
    if(!("caches" in window)){if(out)out.textContent="No disponible";return}
    const keys=await caches.keys();
    const active=keys.filter(k=>k.includes("bio3d"));
    if(out)out.textContent=active.length?`✓ ${active.length} caché(s)`:"Vacía";
  });
});
startBio3D();

let deferredInstallPrompt=null;
function isStandalone(){
 return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
window.addEventListener("beforeinstallprompt",e=>{
 e.preventDefault();deferredInstallPrompt=e;
 const b=document.getElementById("installAppBtn"),s=document.getElementById("installStatus");
 if(b)b.disabled=false;if(s)s.textContent="Lista para instalar";
});
window.addEventListener("appinstalled",()=>{
 deferredInstallPrompt=null;
 const b=document.getElementById("installAppBtn"),s=document.getElementById("installStatus");
 if(b)b.disabled=true;if(s)s.textContent="✓ Instalada";
});
document.addEventListener("DOMContentLoaded",()=>{
 const b=document.getElementById("installAppBtn"),s=document.getElementById("installStatus");
 if(isStandalone()){if(s)s.textContent="✓ Instalada";if(b)b.disabled=true}
 else if(s)s.textContent="Esperando permiso de Chrome";
 if(b)b.onclick=async()=>{
   if(!deferredInstallPrompt){
     document.getElementById("installHelp").textContent="Si el botón no se activa, abre el menú ⋮ de Chrome y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.";
     return;
   }
   deferredInstallPrompt.prompt();
   await deferredInstallPrompt.userChoice;
   deferredInstallPrompt=null;b.disabled=true;
 };
});
