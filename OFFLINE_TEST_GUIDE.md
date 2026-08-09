# Bio3D v3.3 — Prueba offline

## Primer uso
1. Conecta el dispositivo a Internet.
2. Abre Bio3D desde HTTP/HTTPS.
3. Espera a que el modelo 3D cargue.
4. Pulsa **Comprobar caché offline**.
5. Navega por varias estructuras para que las dependencias usadas queden almacenadas.

## Prueba sin conexión
1. Cierra Bio3D.
2. Desactiva Wi‑Fi/datos.
3. Vuelve a abrir la aplicación instalada/PWA.
4. Confirma que la interfaz arranca y que el visor 3D continúa disponible.
5. Si aparece el mensaje “Bio3D no pudo iniciar”, la dependencia externa no llegó a almacenarse y tendrás que volver a conectarte una vez.

## Limitación actual
Three.js y sus cargadores todavía se obtienen inicialmente desde jsDelivr. Esta versión los guarda en caché tras su descarga, pero no los incluye físicamente en el ZIP.
