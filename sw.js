const CORE_CACHE="bio3d-v3.3-core";
const RUNTIME_CACHE="bio3d-v3.3-runtime";
const CORE=["./","./index.html","./styles.css","./bootstrap.js","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CORE_CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>![CORE_CACHE,RUNTIME_CACHE].includes(k)).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;

  const url=new URL(req.url);
  const isExternalThree=url.hostname==="cdn.jsdelivr.net" && url.pathname.includes("/three@0.164/");

  if(isExternalThree){
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async cache=>{
        const cached=await cache.match(req);
        if(cached) return cached;
        try{
          const response=await fetch(req);
          if(response && response.ok) cache.put(req,response.clone());
          return response;
        }catch(err){
          return new Response("Bio3D external 3D dependency unavailable offline.",{status:503,statusText:"Offline dependency unavailable"});
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(response=>{
        if(response && response.ok){
          caches.open(RUNTIME_CACHE).then(cache=>cache.put(req,response.clone()));
        }
        return response;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
