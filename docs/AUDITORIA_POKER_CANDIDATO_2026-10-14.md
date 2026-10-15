# Auditoria del candidato Poker y ganancia neta - 2026-10-14

Fuente: candidato aislado indicado en el snapshot adjunto, HEAD 21ad0de. No es un diff exacto contra Google Play 28: no existe aqui un checkpoint Git verificado del codigo exacto publicado. No se investigaron ni cambiaron tiendas en este bloque.

## Ultimo bloque Poker

- PokerScreen.tsx y OnlinePokerTable.tsx: placa bajo las cartas del ganador, compacta y parcialmente transparente; categoria real en showdown, motivo de retirada sin inventar mano ni revelar cartas ocultas. Empate neutral. Reserva vertical adicional de comunitarias solo cuando gana rival. Control de analisis oculto durante resultado para no tapar placa.
- PokerResultBanner.tsx: estilo compacto, celebracion para ganador de cualquier asiento y movimiento reducido conservado.
- resultPresentation.ts: texto compartido CPU/online con ganancia NETA. En raise40/fold el total provisional60 incluye20 no igualados: el motor devuelve20, liquida bote40 y la ganancia es20. La propia aportacion no se cuenta como ganancia. Empate0. Importes incompatibles no inventan ganancia.
- Nombre local Poker: cambio autorizado por separado para usar el mismo avatar/nombre de Playing as (selfie usa nombre propio). Ya no depende del nombre de Blackjack o de una partida anterior de Domino.
- Posiciones de dinero/fichas restauradas tras prototipo inicial: bandeja top10, saldo bottom2/right12 y pila rival left32/top hero+14. El bloque final no conserva el desplazamiento provisional de esas piezas.
- Pruebas de presentacion, continuacion, balance e identidad local y mesa online actualizadas. No cambia engine, payoutPresentation, onlineContract ni pokerRoom frente a HEAD; los calculos de reparto/pago siguen siendo del motor existente.

## Trabajo previo acumulado, adicional a los letreros

| Grupo | Cambios presentes respecto al checkpoint |
|---|---|
| Entrenamiento Poker | PokerLearningControl, pokerOdds, usePokerWinEstimate y pruebas; adaptadores CPU/online para pausa, cartas publicas, puntos de combinacion, probabilidades; PokerHandHint con porcentaje fijo; eje del avatar centrado |
| Espaciado lobbies | GameSetupLayout paddingTop8 antes de opciones en los tres juegos, aprobado anteriormente |
| Identidad Domino | ComputerGameContext sincroniza nombre de partida conservada con avatar elegido; prueba de regresion |
| Controles Domino online | Avisos/acciones a la derecha del avatar, filas adaptables en estrecho y estado de voz bajo microfono; pruebas |
| Recuperacion invitacion | OnlineFriendScreen ofrece Ahora no ante sala cerrada; prueba |
| Voz nativa Android | incall-manager4.3.0, voicePlatform.native, voiceAudioLease y voiceAudioStats; ruta de llamada, liberacion segura y diagnostico; pruebas. Expo Go no valida audio nativo |
| Proteccion de voz | voiceBudgetPolicy y adaptadores backend/cliente: espera5s,60 solicitudes diarias, limite mensual preventivo y errores distintos; pruebas |
| Empaquetado/invitaciones publicadas | app.config, eas/config, validadores/scripts y listeners de enlaces distinguen identidad publicada/piloto y conservan esquema correcto; portal invita a instalada o descarga; pruebas |
| iOS previo | perfil TestFlight/submit y configuracion build14. No se consultaron ni generaron builds aqui; gestion separada |
| Continuidad | CONTEXTO, DECISIONES e informe de invitaciones acumulan estados y evidencia historica |

## Causa comprobada del nombre You

HEAD contiene pokerName||blackjackName||domino?.playerName||(es?'Tu':'You'). El bundle Android archivado poker-learning-android.bundle de antes de los letreros tambien contiene ese fallback. PlayingIdentity usa el nombre del avatar; online usa v.names de la sala. Por tanto la divergencia local/online ya existia en esas fuentes previas y la correccion reciente la elimina en CPU. Esto NO demuestra cual modo/version se veia en cada observacion humana ni compara todo el codigo con el APK publicado. No atribuirlo a cache ni invalidar la observacion del usuario.

## Verificacion y limites

37 pruebas enfocadas y723 de la app, TypeScript sin errores; mocks y motor local, no confirmacion fisica. Antes de estos fixes hubo3 fallos (codificacion mixta y expectativa antigua de bote); quedan corregidos. Motor/pagos/contrato/backend de Poker y motores Domino/Blackjack coinciden byte-normalizado con HEAD segun snapshot. Cambios anteriores en otros componentes compartidos SI existen: no afirmar que todo el candidato solo cambia letreros.

El mirror C:/do-5486 recibe solo los3 archivos Poker runtime actualizados en este bloque. Validacion adicional coteja fuentes del sourcemap y presencia real del helper neto en JavaScript compilado. QR LAN requiere misma Wi-Fi. No commit/push/build/deploy/publicacion en este bloque. El snapshot JSON enumera hashes SHA256 de fuentes/config/assets del candidato para relevo; no incluye secretos ni es autorizacion de distribucion.

## Inventario exacto acumulado respecto a HEAD

- M app.config.js
-  M backend/domino-online/package.json
-  M backend/domino-online/src/voiceBudget.ts
-  M backend/domino-online/src/worker.ts
-  M backend/domino-online/test/cancellation.integration.test.mjs
-  M docs/CONTEXTO.md
-  M docs/DECISIONES.md
-  M eas.json
-  M package-lock.json
-  M package.json
-  M scripts/lib/onlineLinksConfig.cjs
-  M scripts/prepare-online-links.mjs
-  M src/components/GameSetupLayout.tsx
-  M src/computer/ComputerGameContext.tsx
-  M src/computer/dominoAvatars.test.mjs
-  M src/online/OnlineDominoTable.test.mjs
-  M src/online/OnlineDominoTable.tsx
-  M src/online/OnlineFriendScreen.test.mjs
-  M src/online/OnlineFriendScreen.tsx
-  M src/online/OnlineLinkListener.tsx
-  M src/online/OnlineQuickActions.test.mjs
-  M src/online/OnlineQuickActions.tsx
-  M src/online/OnlineVoiceControl.test.mjs
-  M src/online/OnlineVoiceControl.tsx
-  M src/online/voicePlatform.native.ts
-  M src/poker/OnlinePokerTable.test.mjs
-  M src/poker/OnlinePokerTable.tsx
-  M src/poker/PokerContinuation.test.mjs
-  M src/poker/PokerHandHint.test.mjs
-  M src/poker/PokerHandHint.tsx
-  M src/poker/PokerOnlineLinkListener.tsx
-  M src/poker/PokerOnlineScreen.tsx
-  M src/poker/PokerResultBanner.test.mjs
-  M src/poker/PokerResultBanner.tsx
-  M src/poker/PokerScreen.balance.test.mjs
-  M src/poker/PokerScreen.tsx
-  M src/poker/resultPresentation.test.mjs
-  M src/poker/resultPresentation.ts
-  M web/online-invitation/index.html
-  M web/online-invitation/landing.js
-  M web/online-invitation/landing.test.cjs
- ?? backend/domino-online/src/voiceBudgetPolicy.ts
- ?? backend/domino-online/test/voice-budget.test.mjs
- ?? config/social-club-update.json
- ?? docs/REVISION_INVITACIONES_1.0.md
- ?? scripts/lib/publishedUpdate.test.cjs
- ?? src/online/publishedInvitationScheme.test.mjs
- ?? src/online/voiceAudioLease.test.mjs
- ?? src/online/voiceAudioLease.ts
- ?? src/online/voiceAudioStats.ts
- ?? src/online/voicePlatform.native.test.mjs
- ?? src/poker/PokerLearningControl.test.mjs
- ?? src/poker/PokerLearningControl.tsx
- ?? src/poker/pokerOdds.test.mjs
- ?? src/poker/pokerOdds.ts
- ?? src/poker/usePokerWinEstimate.test.mjs
- ?? src/poker/usePokerWinEstimate.ts
