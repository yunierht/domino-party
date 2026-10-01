# Candidato de código: mesa individual, 2026-10-01

Este checkpoint conserva el estado solicitado por el usuario como posible candidato para App Store. No es una compilación distribuida ni una certificación de publicación.

Incluye pozo animado con posiciones estables, preferencias persistentes de mesa y rival, sonido de contacto único al aterrizar, celebración de la ficha ganadora sin recorte, eliminación del regalo automático de victoria y corrección de los contenedores que interceptaban Next round. Se conservan las bebidas manuales.

El contacto activo es Madera cálida, muestra 12: `assets/sounds/tile-contact-plastic-warm-v3.wav`, SHA-256 `df7dda04356c60a21effa475e5e3a3ae074b36149a281917f59fb0efcba8f035`. Su generador y fuente original están incluidos. Android prepara el mismo reproductor una vez en silencio antes de la primera llegada; el usuario confirmó en su teléfono que la primera ficha ya se oye. Sonido activado por defecto, respetando silencio explícito; música desactivada por defecto.

Validación del checkpoint: TypeScript sin errores; 107 pruebas automatizadas de motor/componentes/preferencias/audio; git diff --check. Las pruebas de componentes/audio simulan APIs nativas. La prueba de navegador de Next round avanzó de R1 a R2 conservando 6-0 y repartiendo siete fichas por jugador y catorce en el pozo. La confirmación audible Android procede del usuario, no de inferir audibilidad de eventos de reproducción.

No se modifican versión 1.0.13, build iOS 12 ni versionCode Android 26. El proyecto permanece en su SDK instalado (Expo 57); la nota histórica RELEASE_1.0.13_HANDOFF.md describe una entrega anterior y no valida este checkpoint. iOS, compilación de distribución, firma, requisitos de tienda y App Store siguen pendientes. No se ejecutó publicación, envío ni subida a tiendas.

Los registros locales, capturas, QR, audiciones y salidas de herramientas de `.release-audit/` siguen excluidos de Git. Este commit identifica el candidato de forma durable; no requiere esos archivos para ejecutar el producto.

## Retomar mañana

Desde la raíz del repositorio: `npm ci` si faltan dependencias; después `npx expo start --go --lan --port 8092`. Usar el QR nuevo de esa sesión y un teléfono en la misma red; la IP y el QR anteriores pueden cambiar tras un reinicio o cambio de red. Si Metro continúa activo en ese puerto, reutilizarlo en vez de iniciar otro proceso. Probar primera ficha tras recarga y siguiente mano sin recargar. La primera ficha Android ya fue confirmada audible por el usuario; quedan por planificar y ejecutar las verificaciones iOS y de distribución antes de cualquier envío a App Store.
