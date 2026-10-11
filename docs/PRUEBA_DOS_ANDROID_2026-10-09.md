# Prueba de Domino Online en dos Android

## Candidato conjunto vigente: 0.1.2 / code3 — 2026-10-09

Incluye Domino final y Poker Online, con dos humanos y $5.000 virtuales por persona. Actualizar ambos teléfonos S24 Ultra/S8 con el mismo APK conjunto, conservando instalación/datos; no desinstalar. Los apartados siguientes de0.1.0/0.1.1 quedan como evidencia histórica, no instrucciones del candidato vigente.

Archivo vigente `.release-audit/joint-v3/Domino-Online-Test-0.1.2-code3-joint.apk`, 202720208 bytes. SHA256 `A9C72B75D5CDA8FAC3FBEF9753A3995FF86D951F406D71F846FD519793F26E96`; firma igual aAPKprevias. Build/bundle verificados. No usar `candidate-before-look-review.apk` ni versiones anteriores para validar esta entrega.

1. Conectar computadora y ambos teléfonos a CyberNet. Abrir [salud LAN](http://192.168.1.194:8792/health); requiere servidor local activo.
2. Elegir Domino o Poker → Play with a friend → Online. A elige nombre/avatar e Invite a friend; B elige nombre/avatar, introduce código de SEIS cifras y acepta invitación. Ambos deben elegir el mismo juego.
3. En Poker verificar $5.000 iniciales por humano, descontando ciegas; total entre saldos y POT $10.000. Revisar manos privadas, turno30s (Check legal o Fold), fichas10/20/50/100, selección provisional/Clear/Confirm/autoconfirmación3s y que débito ocurra una sola vez.
4. En ambos juegos comprobar avatar/nombre sobre madera, timerderecha, vozizquierda, nudges del rival. Activar voz enA, aceptar enB y dar permiso micrófono; probar conversación/mute/salida/rechazo/cancelación e invertir quien llama. Probar cámara y retorno sin perder sala.

Evidencia disponible: navegador con dos sesiones en320x640/440x900, audio sintético, smokeLAN y regresiones aprobadas; NO valida físicamente este APK. Mantener la computadora encendida enCyberNet; no usarlo como prueba entre redes distintas. Dominio elegido online-test.dominoparty.com aún sin despliegue.

## Actualización lista: 0.1.1 / código 2 — llamada con aceptar/rechazar

APK nuevo: `.release-audit/two-android-v2/Domino-Online-Test-0.1.1-code2-call-accept.apk` dentro de este worktree.202655832bytes; SHA256 `78E0E5F6E146908D75982E3CD8C3FBA8C8A6A00B7DE561B0A0DD405EA2A76C7D`. Mismo paquete `com.nextcodestudios.dominoonline.test` y MISMO certificado de firma que0.1.0; versionCode sube1→2. El archivo anterior permanece conservado como evidencia.

**Actualizar AMBOS teléfonos sin desinstalar ni borrar datos:** abrir este APK y elegir instalar/actualizar sobre Domino Online Test. Con ADB autorizado: `adb -s SERIAL_A install -r RUTA_ABSOLUTA_APK_NUEVO` y lo mismo paraSERIAL_B. No usar una copia de0.1.0 para validar llamadas del servidor nuevo. Si Android informa conflicto de firma o error, conservar datos y consultar el error; no resolverlo desinstalando.

1. Conectar S24 Ultra y S8 a **CyberNet**, y confirmar `/health` en `http://192.168.1.194:8792/health`. Backend nuevo activo con la misma persistencia, sin nueva regla de firewall.
2. Abrir ambas apps delante. Crear/aceptar invitación con código; si la sala previa venció durante la ausencia, usar **Crear nueva invitación**, sin borrar almacenamiento.
3. A toca micrófono: B debe recibir aviso con el nombre de A y **Aceptar/Rechazar**. No tocar micrófono en B antes del aviso. Comprobar que B no adquiere micrófono hasta aceptar.
4. Probar **Rechazar** desde B y **Cancelar** desde A antes de aceptación; volver a llamar y aceptar. Conversar, silenciar/reactivar y salir; después repetir iniciando desde B. Llamada sin respuesta caduca30s; conexión que no termina en20s libera captura y permite reintentar.
5. Revisar SOLOmesaOnline: avatar centrado/nombre debajo, timer derecha y madera menor (mínimo133→94 compacto,138→98 normal). Confirmar físicamente mensajes, mano y controles en ambos tamaños. No se modificó la mesa local.

Pruebas nuevas:497app,1pluginred,38dominio,16integraciones workerd/SQLite y1regresión adicional de migración V1→V2; TypeScript raíz/backend. SmokeLAN sintético verifica llamada/consentimiento/rechazo/cancelación y SDP rechazado antes de aceptación, conservando partida. Build424tareas/3m11s, firma v2/RTC/endpoint/bundlefuente nuevos verificados. Logs `.release-audit/two-android-v2/`. No micrófono personal utilizado durante verificaciones.

**Límite físico:** el usuario ya reportó partida y conversación reales con0.1.0 en S24 Ultra/S8/CyberNet. Esa confirmación no valida el nuevo flujo de llamada ni el layout0.1.1. Aceptar/rechazar/cancelar/mute/salir/reconexión físicos de esta revisión siguen por probar. Sin endpoint público, TURN, prueba entre redes distintas, cloud/tiendas/commit/push.

Preparación local autorizada desde chat coordinador `01a12235-0430-7de2-ad2a-b554d7bbec70`. Worktree aislado, HEAD base `e135055`; original `C:\Development\Dominos Codex Online` no modificado. La copia de fuente pendiente queda inventariada por SHA-256 en `.release-audit/online-source-copy.json`. No integrar este documento sobre el CONTEXTO original concurrente automáticamente.

## Entorno de esta prueba

- App independiente **Domino Online Test**, paquete `com.nextcodestudios.dominoonline.test`, versión `0.1.0`, code `1`, esquema `domino-online-test`. Son identidades locales de prueba, no decisión de tienda/release.
- Android 7/API24 o superior; build para `arm64-v8a` y `armeabi-v7a`. WebRTC `124.0.8` integrado nativamente; no usar Expo Go para validar voz.
- Backend propio local en `http://192.168.1.194:8792`, DO/SQLite dentro de `backend/domino-online/.local/android-two-device-state`. No Firebase para jugar; tracking manual y su configuración permanecen intactos. No probar compartir tracking durante este piloto.
- Ambos teléfonos y computadora deben estar en la misma Wi-Fi, sin aislamiento de clientes. IP fechada, no permanente. No se abrió firewall ni se creó túnel/despliegue.
- Voz actual con `iceServers: []`: prueba de LAN; no garantiza conectividad entre redes/NAT distintos. Para redes distintas se requiere endpoint público autorizado y diseño STUN/TURN, sin credenciales TURN permanentes en el APK.
- HTTP está permitido exclusivamente a la IP privada elegida mediante `plugins/withOnlineLan.js`; HTTPS mantiene la política normal. Nunca enviar contactos ni grabar conversaciones. Micrófono solo al activar voluntariamente voz en cada teléfono.

## Preparar servidor e instalar

**Actualización tras intento desde teléfono:** el servidor sigue activo y health responde200desdePC. Usuario autorizó con «Sí, autorizo» corregir el bloqueo entranteTCP exacto. Excepción aplicada/verificadaSOLOworkerdactual/TCP8792/local192.168.1.194/red192.168.1.0/24/interfazWi-Fi/perfilPublic. OtrosTCP yUDP conservanbloqueo; firewallglobal activo. PrimerApplysinadmin se detuvosinmutar; UACelevado completóexit0. Snapshot `firewall-8792-before.json`, evidencia `firewall-8792-after.json` bajo `.release-audit/two-android/`; Restoreconcreto en `scripts/online-firewall-8792.ps1 -Mode Restore` (requiereadmin/autorización). Por defectoModeReview sinmutación. Falta reabrirhealth desdecadaAndroid; no requiere regenerarAPK porqueIPpermanece192.168.1.194.

**APK anterior conservado, sustituido para la nueva prueba de llamada por0.1.1 arriba**: `.release-audit/two-android/Domino-Online-Test-0.1.0-two-android.apk`,202648640bytes. SHA-256 `E11B1C52ACC3143D9886958AAE1C4F724504D46695CB56A66BDC95CAC3C97588`. Firma v2 de prueba AndroidDebug; bundle Hermes/RTC integrado. Partida y voz de este piloto reportadas físicamente por el usuario en S24 Ultra/S8, ambosCyberNet. Los párrafos de preparación/evidencia inicial siguientes conservan su historia; actualización vigente en el primer bloque de este documento.

Desde `backend/domino-online`, con sus dependencias instaladas:

```powershell
node scripts/wrangler.mjs dev --local --ip 192.168.1.194 --port 8792 --inspector-port 9242 --persist-to .local/android-two-device-state
```

En navegador de **cada teléfono**, abrir `http://192.168.1.194:8792/health`. Debe mostrar `status: ok`. Si no responde, comprobar Wi-Fi/IP/aislamiento y firewall antes de jugar; la respuesta desde la computadora no demuestra acceso desde el teléfono. No cambiar firewall automáticamente.

Instalar el mismo APK en ambos, conservando las apps heredadas. Con ADB, usar sus seriales reales:

```powershell
adb devices -l
adb -s SERIAL_A install -r RUTA_ABSOLUTA_APK
adb -s SERIAL_B install -r RUTA_ABSOLUTA_APK
```

No desinstalar ni borrar datos para resolver conflictos de firma. Confirmar APK/ruta/hash y dispositivo antes de instalar. También puede abrirse el APK local desde Archivos si el usuario lo transfiere por un medio autorizado; esta tarea no transmite APK a terceros. No se detectaron dispositivos ADB al preparar.

## Matriz física

Usar nombres de prueba A/B, personajes incluidos y música apagada. Preferir auriculares para evitar realimentación si están juntos. Anotar Android/modelo y resultado por teléfono; sin fotos/contactos personales.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Arranque | Abrir Domino Online Test, sin Metro/Expo Go | App abre usando bundle integrado; nombre y paquete propios |
| Invitación | A entra Play Domino → avatar → Invitar amigo; B acepta código | Misma sala, reparto inmediato; cada uno ve su propia mano y al rival enfrente |
| Enlace | Compartir invitación; abrir enlace con app cerrada y después abierta | Esquema `domino-online-test://online?onlineRoom=CODIGO`; misma sala, no Watch ni app heredada; código manual como respaldo |
| Jugadas | Ambos juegan alternadamente, roban si hace falta | Cadena y turno sincronizados, rival nunca ve mano privada; sin doble jugada por toque/reintento |
| Llamada voluntaria | A llama; B recibe nombre y acepta | Micrófono de B solo al aceptar; estado conectado y conversación continua bidireccional durante jugadas; comprobar oído/altavoz reales |
| Rechazo/cancelación | B rechaza o A cancela antes de aceptación | Aviso desaparece, micrófono de B no se activa; nueva llamada posible sin afectar partida |
| Silenciar | A silencia, B sigue hablando; A reactiva | B deja de oír A, A sigue oyendo B; no corta partida ni requiere pulsar para hablar |
| Permiso denegado | Denegar micrófono en un teléfono | Error recuperable de voz; partida sigue; no captura silenciosa |
| Salir de voz | Desactivar voz/salir de sala | Micrófono liberado, indicador Android desaparece; otro jugador informado |
| Reconexión | Quitar Wi-Fi brevemente y recuperar antes de 120s lógicos | Pausa autoritativa, misma sala/mano/puntos al volver; voz recuperable, no nuevo reparto |
| Ausencia prolongada | No recuperar durante gracia | Sala cierra sin ganador ni puntos nuevos; no revive al volver |
| Ronda/resultado | Terminar ronda, mantener/soltar Hold, continuar hablando | Puntuación única, siguiente ronda única; voz no se sustituye por avisos de partida |
| Background | Llevar app al fondo y volver | Verificar pausa/reconexión y liberación o recuperación del micrófono; no asumir servicio de voz en background |

La gracia empieza cuando el servidor detecta desconexión/vencimiento de lease, no exactamente al apagar Wi-Fi. Permisos/config/APK/tests no prueban sonido, conectividad ni render nativo físico.

## Evidencia actual y cierre pendiente

TypeScript raíz/backend aprobado;495tests app (94Online incluidos),1plugin red,35dominio,16integraciones workerd/SQLite con señalización. Smoke LAN con dos invitados sintéticos: aceptación, dos jugadas legales, manos separadas, señalización sin audio, pausa/reconexión. Archivos de evidencia en `.release-audit/`.

Prebuild y assembleRelease completados en `C:\do-5486`, copia corta aislada con Java17/SDK/cache propios copiados del mismo proyecto;424tareas,5m48s. AndroidManifest incluye RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, esquema propio y restricción HTTP exacta a192.168.1.194. Integración final del chat de voz recibida tras idle/completed; sourcemap del bundle confirma contenido EXACTO de VoiceControl/Table/FriendScreen/plataforma native/controller del worktree. APK/firma/identidad/móduloRTC comprobados. Logs en `.release-audit/two-android/`; primer intento fallido por transformaciones de cache heredado conservado en C:\do-5486/assemble-release.log, reintento usó cache fresco sin borrar original.

Script reproducible para una copia corta YA preparada y sincronizada con fuente final: `scripts/build-online-android.ps1 -Endpoint http://192.168.1.194:8792 -BuildRoot C:\do-5486`. No sincroniza fuente automáticamente ni instala teléfonos; exige Java/SDK/dependencias propios existentes. Para cambiar IP, regenerar política de red y bundle mediante el script, y usar servidor LAN en esa IP. No basta editar una variable después de instalar.

Listo para **instalar e iniciar la prueba física en misma Wi-Fi**; voz real, salida audible, compatibilidad/runtime y acceso desde cada Android siguen pendientes. ADB permanece sin dispositivos. Esta build es un piloto local; no prueba TURN/redes distintas, tienda, producción ni distribución. Sin commit/push/cloud/deploy/publicación ni instalación física. Revisar cambios propios de configuración/plugins/invitación/tests antes de integrar al original, usando merge acotado y preservando los documentos concurrentes; no copiar el worktree entero sobre él.

Fuentes consultadas: [Expo v56](https://docs.expo.dev/versions/v56.0.0/), [configuración v56](https://docs.expo.dev/versions/v56.0.0/config/app/), [WebRTC Android 124.0.8](https://github.com/react-native-webrtc/react-native-webrtc/blob/124.0.8/Documentation/AndroidInstallation.md), [Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/). Dependencias reales siguen Expo57/RN0.86; leer v56 por AGENTS no cambia la versión instalada ni certifica compatibilidad.
