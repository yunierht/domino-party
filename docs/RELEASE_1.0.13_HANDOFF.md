# Entrega de release 1.0.13

Fecha de entrega: 23 de agosto de 2026
Proyecto: Domino Social Club (`com.yht.dominoparty`)

## Estado de tiendas

| Plataforma | Versión | Estado actual |
| --- | --- | --- |
| Android | `1.0.13` / `versionCode 26` | En revisión de Google Play Producción. El rollout configurado es 100 % y Managed Publishing está desactivado: Google lo publicará al aprobarlo. |
| iOS | `1.0.13` / build `12` | `Waiting for Review` en App Store Connect. La liberación automática después de App Review está seleccionada. |

Los artefactos se construyeron desde el árbol de trabajo original de este repositorio, incluyendo los cambios locales de esta entrega. Este documento y las exclusiones de archivos locales se añadieron después de las compilaciones; no cambian el código incluido en los artefactos enviados.

## Funcionalidad incluida

- La pantalla **History** del jugador principal conserva su navegación y comportamiento normal. **Statistics** mantiene su acceso independiente desde History y desde los puntos existentes fuera de la cabecera de Game.
- En **Watch game**, el icono de libro abre la misma UI de History en modo estrictamente de solo lectura. No aparecen ni funcionan borrar, limpiar, editar partidas ni anotar rondas.
- El espectador recibe el archivo completo de partidas terminadas compartidas, ordenado por finalización descendente. Mientras una partida sigue activa, esa partida se muestra como respaldo en la parte superior; al finalizar y sincronizarse pasa al archivo inmutable.
- En la cabecera de Game se eliminó el lápiz de la meta: se sigue editando tocando el texto de la meta. La cabecera conserva Live/compartir, History y Settings; Statistics ya no ocupa ese espacio. Las áreas táctiles y el modo compacto para pantallas estrechas se ajustaron para mantener visible la meta.
- En las tarjetas de History se eliminó el pie de `Points to win · rounds`. Se mantiene el encabezado visible de ganador; el ganador se presenta en dorado y el perdedor en rojo, con etiqueta de accesibilidad que no depende solo del color.
- El aviso de privacidad aclara que compartir una partida comparte el historial completo del anfitrión con espectadores autenticados que tengan acceso al enlace/código.

## Compartir y Firestore

- URL de invitación canónica: `https://dominoparty.com/join/?code=<CÓDIGO>`.
- Deep link de la app: `dominoparty://watch?code=<CÓDIGO>`.
- Vista web de seguimiento: `https://dominoparty.com/#watch-<CÓDIGO>`.
- Tiendas: Android `https://play.google.com/store/apps/details?id=com.yht.dominoparty`; iOS `https://apps.apple.com/app/id6793746031`.

El juego en vivo usa `games/{code}`. El historial compartido usa `historySpaces/{spaceId}` y sus hijos `historySpaces/{spaceId}/matches/{matchId}`. El espacio tiene propietario (`ownerId`) y se crea de forma idempotente, sin sobrescribir el documento padre create-only. Cada historial terminado se crea con `ownerId`, `historySpaceId`, `sourceMatchId`, `schemaVersion: 1`, `winnerTeamId` y `finishedAt`, respetando el identificador de origen.

La compatibilidad se ajustó a las reglas ya desplegadas de `domino-book`: lectura autenticada de historial, padre de propietario, hijos inmutables tras creación y sin concesiones globales de escritura. El modelo es append-only para resultados terminados: la partida activa permanece en `games/{code}` y no se escribe como hijo mutable. No se cambiaron reglas de Firebase en esta release.

Limitación conocida: si un controlador que no es el propietario termina una partida, las reglas de propietario pueden impedir archivar su resultado final en `historySpaces`; la transmisión en vivo sigue funcionando. El flujo normal del anfitrión/controlador propietario sí archiva el resultado.

## Comprobaciones realizadas

- `npx tsc --noEmit`: correcto.
- `git diff --check`: correcto antes de la entrega a tiendas.
- `npx expo config --type public --json`: confirmó Expo SDK 56, versión `1.0.13`, Android `26` e iOS `12`.
- EAS Production: AAB Android e IPA iOS finalizados; los metadatos de EAS y las consolas confirmaron los números anteriores antes de enviar.
- Prueba de flujo compartido desde Expo: Share inicia correctamente y Watch History se suscribe a `historySpaces` con fallback de la partida activa.

### Nota de Expo Go

El proyecto usa Expo SDK 56. Un Android antiguo puede mostrar que Expo Go requiere una versión más nueva aun usando la última Expo Go disponible para ese dispositivo. Para probar desarrollo use un dispositivo compatible con el runtime de SDK 56; para teléfonos que no lo soporten, use la compilación de tienda o un development build autorizado. No se debe interpretar ese mensaje como un fallo de la lógica de History.

## Dónde comenzar al retomar

- [App.tsx](../App.tsx): enrutamiento de `watchHistory`.
- [src/firebase/sync.ts](../src/firebase/sync.ts): contratos `games` y `historySpaces`, creación/sincronización/suscripción.
- [src/screens/WatchScreen.tsx](../src/screens/WatchScreen.tsx) y [src/screens/WatchHistoryScreen.tsx](../src/screens/WatchHistoryScreen.tsx): Watch game y el History de solo lectura.
- [src/screens/HistoryScreen.tsx](../src/screens/HistoryScreen.tsx), [src/screens/GameScreen.tsx](../src/screens/GameScreen.tsx) y [src/components/Header.tsx](../src/components/Header.tsx): UI final de historial y cabecera.
- [docs/index.html](index.html), [docs/join/index.html](join/index.html), [docs/privacy/index.html](privacy/index.html) y [docs/live.js](live.js): web, enlaces y privacidad.
- [app.json](../app.json), [eas.json](../eas.json), [STORE_LISTING.md](../STORE_LISTING.md): versionado, perfiles y metadatos de tienda.

## Guardarraíles y próximos pasos

1. No cambie ni retire los envíos actuales de Google Play o App Store Connect mientras estén en revisión, salvo una instrucción explícita.
2. No cambie reglas de Firebase para esta release: las reglas desplegadas actuales son el contrato que usa la sincronización.
3. Vigile las respuestas de Apple y Google. Si cualquiera solicita metadatos o una corrección, haga el ajuste mínimo, pruebe y cree una nueva versión; no reemplace el artefacto ya enviado.
4. Para la próxima release incremente ambos identificadores: Android debe ser mayor que `26`; iOS debe usar una versión pública/build no reutilizados y mayores que `1.0.13`/`12`.
5. Mantenga fuera de Git y de EAS los directorios `.release-audit/`, `.release-build/`, `.idea/` y los PNG de QR locales. Son resultados de inspección/prueba, no fuente de la app.
