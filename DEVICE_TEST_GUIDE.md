# Bio3D v3.2 — Prueba real de dispositivo

## En Android
1. Abre Bio3D desde un servidor HTTP/HTTPS.
2. Pulsa **Ejecutar prueba de dispositivo**.
3. Pulsa **Probar toque** y gira/acerca el modelo.
4. Pulsa **Probar voz**.
5. Cambia entre capas anatómicas.
6. Inicia un recorrido.
7. Responde un quiz.
8. Prueba Modo Profesor.
9. Si algo falla, escribe la incidencia y pulsa **Guardar incidencia**.
10. Exporta `Bio3D_device_report.json`.

## Qué contiene el informe
- navegador;
- resolución;
- puntos táctiles;
- WebGL;
- disponibilidad de voz;
- memoria aproximada si el navegador la informa;
- pixel ratio;
- estado online;
- incidencias;
- checklist de aula;
- progreso de prueba.

## Objetivo
El informe permite corregir problemas específicos del teléfono o navegador sin depender de descripciones vagas como “no funciona”.
