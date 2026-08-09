# Instalar Bio3D en Android

Bio3D v3.4 está preparado como **PWA (Progressive Web App)**. Una PWA puede aparecer en Android con icono propio y abrirse como una aplicación.

## Importante
El ZIP por sí solo NO se instala como un APK. Bio3D debe publicarse primero en un sitio HTTPS.

## Una vez publicado
1. Abre la dirección de Bio3D en **Google Chrome** en Android.
2. Espera a que cargue completamente.
3. Pulsa **Instalar Bio3D** si aparece activo.
4. Si no aparece, abre el menú **⋮** de Chrome.
5. Elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
6. Bio3D aparecerá con su icono entre tus aplicaciones.

## Primer uso
Mantén Internet conectado durante la primera carga para que se almacenen las librerías 3D externas.

## Después
Prueba Bio3D sin conexión. El Service Worker intentará utilizar los archivos almacenados en caché.

## Para convertirlo en APK
Hace falta un proceso adicional de empaquetado Android (por ejemplo, Trusted Web Activity/Capacitor) y una URL HTTPS estable o dependencias web empaquetadas localmente. Esta carpeta no afirma ser un APK.
