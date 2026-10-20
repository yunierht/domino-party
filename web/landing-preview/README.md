# Vista previa local — 16 de octubre de 2026

## Promoción del candidato aprobado a producción

El usuario aprobó tv08 y autorizó commit local y publicación en el servicio Cloudflare existente. Las notas de preview siguientes se conservan como historial; sus límites de «sin publicación/Git» quedan sustituidos únicamente para esta entrega web.

`base.html` conserva la plantilla anterior a la promoción para que el generador no vuelva a transformar una página ya generada. No es un archivo público. `build-production.mjs` genera `docs/index.html` y `docs/landing`, elimina fixtures/ramas locales y prepara **solo 25 recursos públicos** en `.local/web-site-release/site`. `wrangler.jsonc` ejecuta ese generador antes de publicar; nunca subir `docs` completo ni el directorio de preview. `live.js`, imágenes, sonidos, `/join/`, privacidad y legales se conservan. No modifica app, Android o backend.

```powershell
node web/landing-preview/build-production.mjs
node web/landing-preview/watch-history.test.mjs
node web/landing-preview/production.test.mjs
node web/landing-preview/serve-preview.mjs --production
```

La última orden sirve el paquete público en <http://127.0.0.1:8145/> sin publicar. Los enlaces reales `?watch=` y `#watch-` conservan suscripción existente; parámetros antiguos de preview no activan ejemplos. Pruebas VM/dobles no prueban una partida remota ni teléfono físico.

Destino comprobado por API autenticada: Worker `domino-party`, dominio personalizado `dominoparty.com`, entorno `production`, sin bindings. Versión previa para rollback: `09b52d7d-df54-4c28-92e7-2d8bf00d2564`. Publicación directa por Wrangler: no necesita push a GitHub ni cambios DNS. Resultado final en `docs/CONTEXTO.md`.

**Vigente tv08:** <http://127.0.0.1:8144/?previewScore=1&previewResults=1&review=20261016-tv08>. Marca Follow copiada del HTML interior de landing y estilos comunes `brand-lockup.css`; igualdad exacta de dimensiones/tipografía/espacios/color/HTML comprobada en escritorio y390px, con portada visualmente conservada. Toolbar ahora texto sencillo+línea dorada inferior como referencia landing (sustituye pills/rellenos de versiones anteriores), sin iconoHistory, speakerSVG+estado. Callbacks/aria intactos, primerresultado alineado a tarjetaequipo con delta0. Capturas/evidencia `.local/web-landing-preview/watch-tv08-landing-brand-toolbar.png`, `landing-reference-brand-toolbar.png`, `brand-exact-parity-{desktop,mobile}.json`. Demo sin publicación.

**Revisión vigente tv07:** <http://127.0.0.1:8144/?previewScore=1&previewResults=1&review=20261016-tv07>. Sustituye el anclaSVG de tv06: primera tarjeta historial alineada al borde superior exterior de tarjetas equipo (delta0 comprobado). Botón History/Historial solo texto, sin icono; otros controles modernos intactos. Captura `watch-tv07-card-alignment.png` en `.local/web-landing-preview`. Datos de ejemplo; sin publicación.

Revisión de entrega actual: <http://127.0.0.1:8144/?previewScore=1&previewResults=1&review=20261016-tv06>. Abrir en panel nuevo; no recargar una partida previa para sustituirla por demo. Ruedas TV280px cerrado/260abierto; primera tarjeta de historial alineada al SVG mediante token CSS compartido. Chips inferiores muestran solo numeral (etiqueta accesible completa), fuente18px e izquierda. Toolbar moderna aislada con HistorySVG/EN/ES/speakerSVG+estado, mismos callbacks. Capturas `watch-tv06-toolbar-open.png` y `watch-tv06-toolbar-closed.png`, en `.local/web-landing-preview`.

Paridad: este executor verificó su pestaña local identificada, no el panel IAB enfocado del chat principal que describió el usuario. No atribuir diferencias a caché ni a Chrome público. El HTML/estilos/handler de chips es común a seguimiento y fixture; no hay estilos manuales limitados a demo. Prueba responsiva actual usa iframe390px, sin overflow y controles>=44px; no dispositivo físico. Datos remotos actuales siguen sin certificar.

Estado visual vigente: marca vertical (círculo96px escritorio/80móvil, texto debajo), ruedas centradas con nombres arriba y puntos/restantes dentro, controles visibles para color y forma. Historial en tarjetas compactas sin tabla de conteos, sin marco exterior o título grande redundante; ganador arriba y dos equipos con totales oro/rojo lado a lado. Esta revisión sustituye los diseños intermedios descritos más abajo; sin publicación.

`watch-dials.js/css` adapta geometría de `src/components/TrackingCounter.tsx`: `robotic`=engranaje, `speedometer`=velocímetro, `orbital`=planetario. Orden de formas y colores corresponde a `src/state/trackingAppearanceStore.ts`; paleta exacta de `src/state/useTrackingAppearance.ts` (verde #65C59A, dorado #D7A63D, azul #68B9F5, rojo #AA463B). Forma compartida y color independiente por equipo, como app. Iconos basados en controles paleta/medidor de `TrackingColorButton.tsx`/`GameScreen.tsx`. Preferencias locales `domino-watch-dials-v1`; no puntuaciones ni claves privadas. Borde/acento sigue color elegido; resultados históricos conservan colores semánticos. Rueda animada700ms y reduced-motion sin transición; loaders intactos.

QA actual: tres formas y cuatro colores sin alterar55/45 o22/78, bordeB y ruedaB coinciden al seleccionar verde; historial sin tablas, tarjetas basadas en `HistoryScreen.tsx`. Capturas `watch-phone-style-history.png`, `watch-speedometer.png`, `watch-orbital.png`, `landing-stacked-logo.png`. Responsive comprobado en iframe390px sin overflow; override de ventana no se mantuvo, no prueba física. Fixtures etiquetados como datos de ejemplo. El historial compartido real sigue pendiente por límite de acceso ya registrado.

Candidato independiente para revisar la portada de `dominoparty.com`. No sustituye `docs/index.html`, no modifica recursos de la app y no está publicado.

Desde la raíz del checkout:

```powershell
node web/landing-preview/build-preview.mjs
node web/landing-preview/serve-preview.mjs
```

Abrir <http://127.0.0.1:8144/>. El generador copia `docs` a `.local/web-landing-preview/site` y sustituye solo la portada de esa copia, añadiendo estilos y logo específicos. El servidor escucha únicamente en loopback. No usar este servidor como hosting público.

La barra superior permanece; sus enlaces llevan a secciones de la portada. Entrada principal de código o enlace de seguimiento, sin CTA de descarga; enlaces legales originales al pie. Idiomas inglés/español. Las imágenes de las tarjetas proceden de `docs/img/screens`.

Última revisión: botón superior dorado abre el diálogo original para introducir código/enlace; formulario inline del hero eliminado. Botón visible en escritorio y móvil. Wordmark textual `SOCIAL CLUB` centrado debajo de `DOMINO`, sin modificar el emblema. `follow-entry.js` valida y normaliza antes del handler original, sin crear partidas. QA confirma apertura y foco, código inválido, cierre con Escape/cruz y retorno de foco al CTA. Capturas vigentes `desktop-dialog-cta.png`, `mobile-dialog-cta.png`, `dialog-desktop.png` en la carpeta de evidencia.

`logo-circle.svg` describe el recorte circular de `docs/img/icon.png`; el generador incrusta los bytes originales sin editar el PNG para que el SVG se pueda usar como imagen. Exterior transparente, centro `(515,510)`, radio `274` sobre el original de 1024 píxeles. El remate inferior permanece dentro del recorte. Logo visible 80 px en escritorio / 64 px móvil. Favicon y recursos de la app conservados.

La revisión vigente conserva el hero original: tres imágenes `new-game.jpg`, `home.jpg` y `score-board.jpg` superpuestas, mismas clases, giros, profundidades y transiciones originales de 560/480 ms al hover/foco. Las reglas originales de `prefers-reduced-motion` permanecen intactas. Sustituye el monitor ilustrativo de la primera propuesta, rechazado por el usuario; aquella captura se conserva en `.local/web-landing-preview/monitor-proposal.png` solo como antecedente. El formulario transfiere códigos de 4–6 caracteres al formulario de seguimiento existente. Admite enlaces `?watch=ABCD` y `#watch-ABCD` del dominio público o del host de preview; no admite enlaces de invitación Online de otra identidad. `live.js`, marcador, historial y rutas de seguimiento existentes se copian del sitio actual. Único ajuste de compatibilidad: proteger el acceso al CTA de tienda eliminado en iOS. Una partida real activa sigue pendiente de comprobar; no se afirma validación física ni del servicio remoto.

QA de navegador: portada e imágenes, inglés/español, error de código inválido, ancho móvil observado 389 px sin desbordamiento, marcador local existente `?previewScore=1` con 55/22. Hero revisado: tres imágenes cargadas, transformaciones de foco observadas y transiciones 560/480 ms. Movimiento reducido verificado en fuente conservada; no se emuló la preferencia del sistema. Sin errores de consola en portada. Capturas vigentes en `.local/web-landing-preview/{desktop-phones,mobile-phones}.png`, copia actualizada en `{desktop,mobile}.png`; original público en `before.png`. El fixture de marcador es local y no demuestra actualización de una partida remota.

Sin commit, push o despliegue. Revisar la propuesta antes de integrar o publicar.

## Visor con resultados al lado

El candidato incluye también `watch-history.js` y `watch-history.css`, inyectados solo en la copia generada. Historial es un toggle, cerrado inicialmente: al abrir redistribuye marcador y QR a la izquierda, historial de resultados y tabla Ganados/Perdidos a la derecha; al cerrar restaura composición original. En móvil se apilan al abrir. `aria-expanded`/`aria-controls`, foco conservado, transición280ms sin movimiento si el sistema pide reduced-motion. Usa `subscribeToDominoHistory` existente y la referencia que comparte el documento de partida, sin mostrar su clave. Conserva orden del lector, nombres, jugadores, totales, ganador, fechas y meta; calcula ganados/perdidos solo de partidas terminadas recibidas. Sin referencia, indica que no hay resultados anteriores compartidos; solo puede mostrar resultado actual terminado. Loading/error/empty explícitos y suscripciones canceladas al cerrar/salir/cambiar referencia, sin interrumpir score. `live.js` y backend sin cambios. QR compacto con título `Follow on your phone` / `Sigue en tu teléfono`, sin descripción larga; generación/destino preservados.

Ejemplo revisable: <http://127.0.0.1:8144/?previewScore=1&previewResults=1>. Tocar Historial para abrir; volver a tocar para cerrar. Reutiliza datos de la función de preview local ya existente, con banner visible DATOS DE EJEMPLO incluso cerrado; no es la partida del usuario ni prueba remota. Capturas vigentes `watch-history-open.png`, `watch-history-closed.png` y `watch-history-mobile.png`. El visor público activo no se inspeccionó: revisión automática bloqueó acceso por posible alteración de pestaña, incluso al intentar seleccionar su ID; no se navegó ni recargó la partida. No copiar códigos privados al candidato.

```powershell
node web/landing-preview/watch-history.test.mjs
```

Pruebas con dobles DOM/datos cubren filtro de finalización, ausencia de archivo, idioma, no duplicación, errores, cambio/salida y cancelación tardía. QA local confirma panel simultáneo, foco de Historial, idiomas y móvil sin overflow. Pendiente juego real con historial compartido.
