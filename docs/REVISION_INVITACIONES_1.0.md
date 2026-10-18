# Revisión de invitaciones Online — checkpoint v1.0

## 2026-10-14 — QR final Poker: letrero bajo cartas, combinación y nombre avatar

Dirección humana final sustituye ON-D-118ubicación bajo stacks: placa debajo de CARTAS del ganador, semitransparente y categoría real. PokerScreen/OnlinePokerTable usan anclas de cartas rival y borde inferior bajo propias; empate compartido. Se restauran fichas/money en posiciones previas (sin subirtray ni mover saldo). Ganar porfold conserva retiro/bote sin categoría inventada ni revelar cartas. Showdown conserva categoría de describePokerResult/resultadofiltradoOnline. Learningbutton oculto solo resultado para no invadirplaca. Marco/sparklesconreducedmotion se mantienen.

Nombrelocal ahora displayNameavatarseleccionado (selfie nombrepropio), coincidePlayingas; no usa nombresPoker/Blackjack/Domino cruzados. Auditoría causal: fallbackantiguo constname=pokerName||blackjackName||domino.playerName||You yaenHEAD21ad0de ybundleprevio poker-learning-android.bundle14oct16:59:54; nointroducidoporprimerbloqueletreros. Online ya toma nombredeavatar al entrar; diagnóstico distingue modos, no acusa cachehumana. Testnuevo reproduceAna≠Yuniantes; despuéscambiarYuni→Yase actualizalabelsinresetearmano.32testsPoker/TypeScript pasan; suite719/719 posteriorcorrecta. Logs poker-cards-name-before/after/full/types raíz .local/expo-go-20261013. No cambiosotrosjuegos/componentescompartidos enestebloque.

Entrega final solicitada (sinotrasaccionesdetienda): mirrorC:/do-5486con3fuentesPokeractuales. MetrosehabíainiciadoCI ydeshabilitówatch; mapaFuenteactualNOgarantizabacódigoJSactual. Detectado fallbackviejo enbundlecompilado; reiniciado sinCI yclear. PID29084vivo; exp://192.168.1.194:8130 LANmismaWiFiPC/teléfono. Verificador11fuentes+PNGactualpíxeles, manifestSDK57/version0.1.4/Androidbundle10164405bytes; además ausenciafallbackviejo ypresenciaancla rivalWidth*1.43+16 enJScompilado. Evidencia poker-final-qr-verification.log/expo.log. QR PNG poker-winner-expo-qr.png inspeccionado; mismoURLyaactualizado. Confirmaciónfísica última presentación/categoría pendiente. Capturasanterioresbajostacks NO pruebanposiciónfinal; source/tests/bundle sí, no presentarlascomofinal.

TestFlightpreviamenteautorizado: perfil social-club-ios-testflight preparado (firma remota, Team79C77F44DM, app6793746031/com.yht.dominoparty),8testsconfig y718apppruebas snapshotinicial; iOS13EAS51bfcd91FINISHED contieneversiónantesúltimafijaciónnombre/posición. Nose distribuyó13. Build14 iniciada previamente paraincorporarcorrecciones, no consultar/subir/distribuir enpedidoúltimoQR. Estadoexterno pendiente de retoma, sin declararlistotesters. No nuevoAAB/publicaciónPoker/commit/push. Diffs anteriores preservados.

## 2026-10-14 — Letrero Poker bajo fichas del ganador y QR Expo Go

Fuente humana: colocar victoria/fold bajo fichas del ganador real; letrero más artístico, minimizar cambios ajenos; pide QRExpoGo para prueba. Implementación exclusivamente PokerScreen.tsx, OnlinePokerTable.tsx, PokerResultBanner.tsx y3pruebasPoker. Rival: placa debajo de su stack, boardreserva espacio solo durante ese resultado. Local: placa bajo fichasderechas en madera, fichas ascienden36px solo resultado para dejar46pxplaca sin taparlas; saldo permanece visible izquierda. Empate conserva letrero compartido. Dorado/verde conmarco/sparkles/confetti y reducciónmovimiento; texto completo de fold+pot en accesibilidad, potbrevevisible. No nuevo cálculo de ganador ni ledger/timers, privacidad yHoldconservados. Online mapea winnercontra self en ambos roles. Ningún componente compartidoDomino/Blackjack modificado en este bloque; diffs previos preservados.

TDD: pruebasrojas para ancla propiaCPU/online, luego31/31green (OnlinePokerTable, PokerContinuation, PokerResultBanner, PokerScreen.balance), TypeScript0/diffcheck0. CPUHold/cobro/avance3000ms intactos; testonline ambos roles, ambos winners ytie. Navegador real confirma trasFOLD placaYOIWINS debajo rivalstack58.8px: stackbottom285.22/bannerTop288.38/bottom334.38/boardtop406.78, no solapamiento. Screenshotroot poker-rival-winner-plaque.png. Prueba navegadorallinposterior perdió y llegórebuy; poker-local-winner-plaque.png NO demuestra victoria local (capturómodalrebuy), no usar como evidencia afirmativa. Presentación victoria local/online verificada por pruebas con mocks; teléfono pendiente.

PreviewmirrorC:/do-5486 recibiósolo3fuentesPoker, dependencias intactas; servidorExpoGoLANPID34108 vivo alcomprobar, exp://192.168.1.194:8130 requierePC/teléfonoMISMAWiFi. PNGreal raíz .local/expo-go-20261013/poker-winner-expo-qr.png inspeccionado ypixelescomparadoscontraURL. ManifestSDK57/app0.1.4/bundleAndroid10165184bytes; source-map11fuentesexactas candidato, incluidos3Poker yDominoexistente. Verificadorverify-poker-winner-preview.cjs/log/manifests/bundle enmisma carpeta. Esto prueba entrega, NO prueba física ni voz nativaExpoGo. No AAB/APKnuevo/storePoker/commit/push; versiónpublicada28no incluyeesta mejora.

IconofichaGoogle: guardado y envío confirmado; Publishingoverview Changesinreview, quickchecks completados, soloChangeappiconenGB. Pendiente aprobación/propagación, noasegurariconopúblicoverde. Morado permanecebiblioteca. iOSacceso se comprueba por peticiónhumana, sin build/submitnuevo autorizado enestebloque.

## 2026-10-14 — Icono verde de ficha Google Play enviado

Usuario autoriza sustituir solo icono morado de ficha, sin juego/build/metadatos ajenos. Confirmación humana directa: icono verde creado/editado con IA. Asset existente assets/store/play-icon-512.png512x512/383012bytes/SHA2560EA289BB0AC06598E165956D923DBCC1F505F6FC8F1D2F67D55B60D9BD4D38ED, sin modificación. Inspección fuente/APK28 confirma iconos verdes y adaptivebackground04130D; morado pertenece a asset independiente de ficha cargado4julio.

En consola: recurso anterior play-icon-512.png morado permanece en biblioteca (visualizado junto al verde14oct), no eliminado de biblioteca; URIrecuperación https://lh3.googleusercontent.com/NK5NTAci0vpntdhG6oT879-QiRCnf5bE8TZcoQ-6LrcLPsOFxYMxYAQsHXcVU2FECiCp8YaP9mA42k1dPvx4ZQ . Nuevo asset https://lh3.googleusercontent.com/IxdXjh3C-thNz7PW9LhZOIDFbm60blmc7K5OKec5-WkrKNEDmIuglA6QwsXGvmSWjTYhvbli2KRLZuG-fYHUQWE . Aplicado y guardado. DeclaraciónAIindividual solo checkboxAppicon seleccionada; demás sinmodificar. Publishingoverview mostró exactamente1change DefaultstorelistingEnglishenGB Changeappicon; Sendchangesforreview confirmado. Estadofinal en consola se verificará antes cierre; no afirmar propagación pública por upload. Screenshotroot .local/expo-go-20261013/social-club-green-icon-selected.png. Sin recompilación, versión, cambio código, commit/push.

## 2026-10-14 — Google Play confirma publicación de producción 1.0.14 (28)

Estado terminal verificado en consola autenticada, Submission17: Production1.0.14(28)Startfullrollout, StatusPublished, submitted14Oct8:18pm/publicado9:27pm según UI. URL https://play.google.com/console/u/0/developers/5185556269972090494/app/4975472091994835130/publishing/submission-activity/17/details . Sustituye estado previo Changesinreview; no seguimiento automático creado. Screenshot real raíz .local/expo-go-20261013/social-club-production28-published.png. Se conservó ManagedpublishingOFF y rollout100%países existentes. Esto prueba estado de consola, no actualización física ni propagación individual a cada teléfono.

APK oficial Google descargado a C:/Users/yunie/Downloads/28.apk, copia con nombre claro C:/Development/Dominos Codex Online/.local/expo-go-20261013/Domino-Social-Club-1.0.14-code28-Google-signed.apk;276254853bytes/SHA25677CF3E3AFFF2FE7598CC035B1BE5FAB1700D432F5D2EC7CE9B584F254973D30E. apksigner verifyv2/v3SourceStampOK; signer26E1ED66...A395D08C coincide firmaPlay (no uploadkey). aaptdump com.yht.dominoparty1.0.14code28/min24/target36. Evidencia root social-club-apk28-google-signature.log. keytoolJar no firmaJAR porque APKsinv1; apksigner valida v2/v3 correctamente. DescargaUI tardó y el evento devolviótimeout; el archivo completo apareció enDownloads y fue validado, no se inventó path.

Actualización Android autorizada completada en tienda y servidor. Prueba humana pendiente: actualizar app Play SINdesinstalar/verificardatos, invitar por código y enlace con appcerrada/abierta en ambos teléfonos, vozbidireccional/reconexión/cancelación. APKtest anterior posee packagepiloto separado, esteAPK esapppublicada y no migra datos de piloto. Instalación diferida sigue requerir volveralenlace trasinstalar. iOS aúnno build/submit/TestFlight; accesoAppStoreConnect pendiente. No cambios de UI/lógica ni dependencias adicionales en este bloque, sin commit/push. WIP anterior preservado y gitdiffcheckcorrecto.

## 2026-10-14 — Android enviado a producción; invitaciones activas

Autorización humana ON-D-116 sustituye gate anterior. Worker662418dd-3318-4bb4-aced-0297893f6e08 desplegado con namespaces/bindings/secrets existentes. Asociaciones Android publicada+piloto, AASA Apple, configuración y ambos portales responden200; healthok. Evidencia backend/domino-online/.local/social-club-approved-deploy.log y social-club-live-associations.json. Primer URL sintético incorrecto rechazado invalid_invitation; evidencia final corregida usa onlineRoom/pokerRoom ABCDEF0123 y termina correctamente, sin crear salas.

GooglePlay interno7: 1.0.14(28) Availabletointernaltesters confirmado. PromoteProduction->release1.0.14(28), notas públicas sustituyen notas internas, rollout100%países existentes. Save+Sendchangesforreview ejecutados con autoridad explícita. Publishingoverview confirma Changesinreview/Production1.0.14(28)Startfullrollout, ManagedpublishingOFF; quickchecks en curso (hasta14min indicado). Esto es envío aceptado pendiente checks/revisión, NO disponibilidad pública ni aprobación hoy. Screenshot raíz .local/expo-go-20261013/social-club-production28-in-review.png. AABhash28 reconfirmado6F1BBDFFCA77B008A09E7DD46A406B81A7EDCD72422AFF2D42869C1B2F7AE3C3. Code27no distribuido.

Google muestra3warningsnoerrores: seis modelos pierden soporte (2teléfonos4tablets), tamaño de descarga154MBvs127MB, sin mappingdeobfuscation. Causa exacta dispositivos aúnno confirmada; no cambios de código/dependencias para silenciar avisos. Prueba física del paquete firmadoPlay (conservar datos, cold/warm invitación código/enlace, voz) sigue pendiente. APKGoogle en obtención; iOSbuild/TestFlight pendiente de accesoApple. Ninguna edición de lógica/UI en este bloque. Diffs previos conservados, sin nuevo commit/push.

Fecha: 2026-10-13. Alcance: candidato Online; Dominó y Póker. Fuente de código: etiqueta v1.0, commit21ad0de. No se modifica Social Club/Pro ni publicación de tiendas. APK Android solicitado para pruebas físicas, no aprobación de producción.

## Borrador Google Play guardado; gate de despliegue pendiente — 2026-10-14

Estado final observado: AAB28 procesado por Google y mostrado28(1.0.14), firma/idaceptadas, en release INTERNAL7. SaveasDraft ejecutado y confirmación ChangesSavedYouCanNowPreviewYourReleaseBeforePublishingIt, SaveasDraft/DiscardChanges disabled después guardar. Nombre1.0.14(28)-Onlinevalidation, enGBnotasinternastestonline/voz/análisis/updatepreservardatos. NoNext/Confirm/rollout ejecutados. Producción1.0.13/code26 ytestersprevios25 siguen vigentes. URLdraft https://play.google.com/console/u/0/developers/5185556269972090494/app/4975472091994835130/tracks/4701586554701115404/releases/7/prepare . Screenshotroot .local/expo-go-20261013/social-club-play-draft28.png muestra guardado.

DialogAppBundle28Downloads: Google indica You need to publish the artifact to any track before sharing it. NoAPKsdescargadosniAPKuniversalfinalcompilado; APKfirmadoGoogle seobtiene despuéshabilitartrack. Detalles:18820devices,4features,14permissions,4ABIs/API24+/target36; comparaciónconrelease26contaba18826devices, causalidadnofijada, no cambiosadicionaleshardwarehechos.

Bloqueo: deployCloudflare asociaciones+portal necesita respuesta directa a preguntaasync, norespuestaal cierre. Assetschanges15testsdryrun listos ybackup; servidorlive todavía d077…sinmutar. No reintentar porotrotool/surface antesautorización. Siguienteaccióncuandoautorice: deployactualInternetconfig, comprobarpublicassetlinksambasapps/AASAteam/portal/APIhealth; habilitarinternaltestsegúnalcanceconfirmado, descargarAPKfirmadoPlay yprueba físicaactualización/invitaciones/voz; luego producciónsegúnresultado. FuenteUI/rules sin cambios fuera3linksscheme. iOSAppStoreactual/TestFlight/deferredinstallautopendientes. Todoen discoSINcommit/push.

## AAB corregido code28 final validado; carga en Play — 2026-10-14

EAS475f6acf-5208-4271-a6dd-02e804f71285 Succeeded observado enweb,8m33build/8m39total. Archivo final raíz .local/expo-go-20261013/Domino-Social-Club-1.0.14-code28.aab,213526357bytes,SHA2566F1BBDFFCA77B008A09E7DD46A406B81A7EDCD72422AFF2D42869C1B2F7AE3C3. Jarverified/bundletoolvalidateexit0, certupload91:96…31:C1coincidePlay ymanifestrealcode28/version1.0.14/packagecom.yht.dominoparty. Proof-aab28-manifest/cert/signature/validation en mismafolder. Fuente de links corregida17testpassed antescompilar; prueba física pendiente. NoAPKfirmadoPlaydescargadotodavía.

Code27 retirado correctamente deldraft (confirmdialogRemoveappbundlefromrelease indica recuperablebiblioteca, toastAppbundleRemoved). Appbundlegridsolo25deanterior antescargar28. Nueva carga28iniciada, nombres/notasdraft1.0.14(28)Onlinevalidation; noNextConfirmRolloutpublicado. No transformar botónRemovefilename en evidencia de exclusión; fue necesaria confirmaciónRemoveappbundle. Testers yproducción continúan versiones previas hastaacciónrelease explícita.

Avisos realesEASdoctor28:19/21checks; metadatosRNDirectory reportanreact-native-incall-manager yreact-native-webrtc UntestedNewArchitecture, y patchesExposugeridosexpo57.0.29/asset57.0.20/crypto57.0.4/linking57.0.13/splash57.0.10frenteinstaladasprevias. Buildnative/JARstructure pasan; no tratar advertencias como fallonativo confirmado ni ocultarlas medianteexclude; no actualizarSDK/deps probadas por estas advertencias solamente. Vozphysicalfix2evidenciaanterior, no garantizaAPK28runtime. Conservadasversionsparaalcanceusuarioevitarregresión; pruebaonline/updatenewpackage pendiente.

Cloudflaredeploy noejecutado y approvalasync pendiente. StageWorker activo d077…,assetsasociacionespreparadas ambos paquetes+Apple ylandingpilot, noactivar hastaautorizar. Ninguna publicaciónGoogleAppStore/Apple/nuevocommit/push.

## Sustitución del primer AAB por corrección de identidad de enlace — 2026-10-14

La revisión adicional encontró import estático app.json→scheme piloto en OnlineLinkListener, PokerOnlineLinkListener y PokerOnlineScreen, aunque manifest/EAS producción usan dominoparty. Enlaces HTTPS usan base correcta, pero fallback URI publicado no podía abrir la sala automáticamente. Test nuevo publishedInvitationScheme reproduce rojo (Domino abre entrada manual connull en lugar de sala). Corregido SOLO esquema de enlaces usando EXPO_PUBLIC_DOMINO_ONLINE_SCHEME del build con fallback appJSON anterior; se conserva consentimiento, deduplicación, rutas/code, UI y reglas. Diecisiete tests listener/invitaciones/config pasan, TypeScript/diffcheckcorrectos. Log published-scheme-before/after en artefactos raíz.

Primero code27 fue cargado/procesado en borrador INTERNAL de Play, identidad/version/certificado aceptados; no guardado/publicado a testers ni producción. Al detectarse defecto, removido de selección delrelease por Manageartifact→Removeappbundle; diálogo explicita recuperación en biblioteca y toastAppbundleRemoved confirma. Remover nombre del fichero solo no excluía fila; NO asumir éxito hasta confirmacióntoast. Archivo27 local y biblioteca retenidos, NO ENTREGAR como candidato final. Código27 usado enPlay no se reutiliza.

Nuevo Androidcode28/versionName1.0.14, misma ficha/firma/proyecto y perfil. BuildEAS475f6acf-5208-4271-a6dd-02e804f71285 aceptada, último estadoIN_PROGRESS sinerror. Logsocial-club-android-build28.log/status.json. Anterior AAB27 validaciónfirmamanifest/ARM64so LOADsegments todos≥16KB correcta pero SUPERADA pordefectoinvitación, no prueba finalde28. Web/assets preparados no cambiaron desde rechazo; deploylive sigue pendiente aprobaciónasynchumana (sinrespuesta). Playdraftmantienenotasdeprueba, debe renombrarse28 y subir paquete final, guardarcomoDraftsinrollout hasta resolver enlaces/pruebaupdate. NoAPKfinalniGoogleproductionpublicado.

## AAB Android terminado y verificado — 2026-10-14

EASbuild7bd09aa3-61f7-44a3-91c1-f7af96898ee7 FINISHED, sinerror. Descarga local en raíz artefactos .local/expo-go-20261013/Domino-Social-Club-1.0.14-code27.aab,213526472bytes,SHA2560D87832F1CD3F3BE18F26A44B18A2F4567FA67BC77678B424FFBE29EBB3BC3C7. keytool/JARfirma coteja certificado completo upload91:96…31:C1 con Play; jarsignerjarverified exit0. bundletoolGoogle1.18.3validate exit0; manifest REAL packagecom.yht.dominoparty/versionName1.0.14/code27/minSDK24/target36, RECORD_AUDIO/MODIFY_AUDIO_SETTINGS y HTTPSdomainexacto /online/invite. Logs/certificado/manifest en misma carpeta artefactos, no secretos.

Comparación readonly publicsource autorizado de almacenamiento y Firebase: contenido normalizado (sin CRLF) idéntico al checkout app publicada; primeras comparacioneshashsin normalizar difieren solo por finales de línea. No cambiosstorage/configFirebase realizados. Esto no sustituye actualización física con datos antiguos.

Preparación GooglePlayinternal iniciada en consola autenticada; aún no archivo subido ni releasecreado en este registro. DeployCloudflare continúa BLOQUEADOporautoreview/preguntaasyncsinrespuesta; servidoractualasociacionesNO actualizado. AABlisto para draft, no declarar AppLinksnativoslistosniproducción publicada. APKcompatiblefirmaPlay requiere procesamiento/descargaPlay o prueba porcanalinterno. UI/lógicaSin cambios nuevos.

## Actualización Android 1.0.14 preparada y AAB en curso — 2026-10-14

Autoridad: usuario confirma actualizar ambas tiendas y pide continuar exportación/upgrade Android; preservación de lógica/UI. Firma completa EAS uploadkeystore cotejada VISUALMENTE en tooltip de huella con Play: SHA25691:96:CD:BD:9B:EC:74:03:B8:19:FE:73:4B:7F:FD:75:57:4B:FA:DD:25:2D:B2:BE:0D:BF:CD:46:97:BD:31:C1. La lectura de clipboard no dio equivalencia; no fue la evidencia del cotejo. AppSigning de Play26:E1:ED:66:7D:08:6E:B5:35:64:73:B6:A0:BC:9F:E8:C2:C6:39:99:05:10:97:72:66:F3:CD:3E:A3:95:D0:8C. EAS cuenta autenticada, proyecto publicado domino-party disponible. Team Apple79C77F44DM obtenido de credenciales EAS existentes (certificado/perfil AppStore muestran Valid), no prueba física iOS ni vigencia AppStoreConnect consultada.

Consola Play Latest releases and bundles: última producción26(1.0.13), interno25(1.0.12), alpha16(1.0.7), draftopen sinbundle; lista latestbundles ordenada26,25,24,23,22. Preparada1.0.14/code27. Metadatos públicos del app.json publicado consultados solo como referencia, sin editar ese checkout: nombre/slug/scheme, package/bundle, EASproject4ca6648b-ec5a-4b08-b425-519db3c4ebd7. No se copió código/historial de otro proyecto.

Implementación mínima de empaquetado: config/social-club-update.json discriminator application=domino-social-club-update; validación permite SOLO ficha confirmada, TeamID/proyecto correctos y versiones superiores, mantiene rechazo piloto/certificado debug. app.config.js activa identidad/versión reales únicamente por ese perfil, configuración piloto/LAN intacta; permisos/íconos/plugins/orientación conservados. eas.json perfiles social-club-android-update AAB/credencialesremote y social-club-android-update-apk disponible (no compilado). app.json default intacto. No src/juegos/UI alterados en este bloque. Nueve tests de preparación/perfil y TypeScript pasan. EASconfigresuelto coincide com.yht.dominoparty/dominoparty/proyecto publicado/1.0.14(27).

BuildAAB EAS7bd09aa3-61f7-44a3-91c1-f7af96898ee7 aceptada; último estado comprobado IN_PROGRESS, sin error/artifact todavía. Archivo build.log y config/status en artefactos raíz .local/expo-go-20261013/social-club-*. Sin autoSubmit ni subida/publicaciónPlay. Snapshot cloud anterior a cambios solo web/scripts de preparación posteriores, excluidos del paquete móvil por .easignore; src/perfil móvil siguen iguales. No commit/push.

Servidor: asociaciones Android ambas identidades/pilot+published y AASA Apple preparadas en .release-audit/social-club-update/public. Página ofrece primaria dominoparty y secundaria app piloto; automática desviación a tienda deshabilitada para no interrumpir pruebas. Token/code exactos conservados, apertura/aceptación explícitas. Quince tests perfiles+landing correctos. Copia recuperable assets anterior en .release-audit/social-club-update/before-assets, copia nueva en .release-audit/internet/public; wranglerdryrun pasó,9assets, enlaces/reglasWorker sin fuente nueva. Versión activa registrada d077b3eb-9e1e-43f8-9e2f-f2d277aef6de.

DESPLIEGUE LIVE RECHAZADO por revisión automática: preparar la actualización no cubre claramente desplegar Worker activo y posible impacto en invitaciones/salas/configuración. No se ejecutó, no eludir. Pregunta async enviada al usuario para autorizar exactamente asociaciones+página de invitación manteniendo piloto/reglas/salas. Await respuesta humana; tiempo transcurrido no autoriza. BuildAAB no afectada por bloqueo. Si autoriza, desplegar config Internet existente y comprobar asociaciones/portal/APIhealth sin crear salas innecesarias.

Pendiente: terminar build/guardarAAB/verificar firma e identidad y fuente crítica; consentimiento de despliegue; prueba actualización por Playinterno para conservar datos (APK firmado uploadkey no actualiza instalación firmada por AppSigningPlay). APK compatible con instalada puede descargarse de procesamientoPlay del AAB; no instruir desinstalar/borrar datos. iOS/TestFlight y recuperación automática posinstalación siguen pendientes. Dominio/backend usados aún son servicio Internet de pruebas existente; no afirmar separación servidorprod ni AppStorepublicado.

## Preparación de actualización de Domino Social Club — 2026-10-14

Usuario confirma actualizar la app existente en ambas tiendas; Android primero. Conservación explícita de lógica/UI probadas. Este bloque prepara el destino; no sustituye revisiones anteriores ni declara release listo.

Comprobación actual: app.json y eas.json conservan identidad/piloto y perfiles internos. El validador scripts/lib/onlineLinksConfig.cjs rechaza expresamente com.yht.dominoparty y la URL iOSid6793746031 por la separación de pruebas original. Para la actualización autorizada se necesita un perfil de producción explícito que acepte SOLO identidad publicada verificada, conservando los controles actuales de HTTPS, paths, identidad/firma, rechazo de certificado piloto y separación de staging. No eliminar validaciones globalmente ni cambiar el perfil de pruebas/QR.

Antes de build de actualización:
1. Play Console: verificar ficha, package, mayor versionCode ya utilizado, clave de subida disponible y certificado App Signing publicado; el certificado usado para App Links debe corresponder al instalado desde Play.
2. App Store Connect/Apple Developer: verificar ficha existente, BundleID, TeamID real, versiones/builds usados, permisos de firma y distribución. No asumir TeamID ni generar otra app.
3. Definir dominio/servicio de producción y asociaciones exactas /online/invite para ambas firmas; confirmar la ruta compartida/código manual sin cambiar reglas/UI.
4. Preparar AAB para Play y APK de prueba; build firmada TestFlight para iOS. Verificar actualización sobre versión publicada conservando partidas, ajustes/fotos y permisos; prueba específica invitación cold/warm, código, voz, cancelación/reconexión Android↔Android y Android↔iOS.
5. Mantener explícito pendiente posinstalación: abrir enlace tras instalar funciona como fallback; recuperación automática no implementada. No declarar que el enlace universal por sí solo satisface esa parte.

Acceso actual: apertura Google Play Console bloqueada por revisión automática al redirigir a origen diferente google.play, sin continuar por esa ruta. App Store Connect muestra pantalla de inicio de sesión; no acceso autenticado a ficha/versiones/TeamID. Se requiere intervención humana para entrar a las consolas oficiales. No contraseña/MFA por chat; no build/cambio versión/firma/publicación realizados aquí.

## Requisitos recibidos

- Un enlace compartible para Android e iOS, abre el juego/sala correctos si está instalada la app.
- Si no está instalada: instalar y conservar la invitación para continuar.
- Código manual como alternativa; dos revisiones antes de generar APK.
- Invitación y aceptación siguen voluntarias: no cambiar sala/activar micrófono sin aceptar.

## Primera revisión: fuente y configuración

App identifica com.nextcodestudios.dominoonline.test, scheme domino-online-test; dominio HTTPS servidor de pruebas. app.config.js y perfil Internet fuerzan endpoints/apertura exacta /online/invite. Plugin Android autoVerify con huella pública del certificado piloto. Listeners procesan cold/warm/repeated links y evitan sobrescritura por initialURL tardía. Mensaje compartido contiene enlace público/código, sin credencial de miembro. Código manual seis dígitos y enlace sala10hex utilizan mismo join/aceptación.

Diferencias con Invite Friends de Settings: sus URLs de tiendas apuntan com.yht.dominoparty/id6793746031, aplicación distinta. NO sirven para instalar este candidato. Config Online stores.android/iosnull, ios.teamIdnull; no inventar URLs/TeamID ni heredar identidades de otra app.

## Segunda revisión: pruebas y servidor público

- App completa675/675; backend65/65dominio +25/25integración; TypeScript app/backend0. Estos checks previos cubren cambios presentes en v1.0.
- Revisión enfocada cliente40/40 (enlaces, listeners, pantalla entrada, share-return) y configuración/landing15/15.
- Servidor público: asociación Android200/packagecorrecto. AASA iOS404.
- Cuatro salas sintéticas: Dominó/Póker por código y por enlace. Creación201, aceptación200, ambas proyeccionesplaying; credencial ajena401; cierre confirmado para ambos. Todas salas de prueba cerradas. No audio personal activado.
- Esto es evidencia automatizada/servidor, NO apertura Android verificada por SO ni prueba de dos teléfonos.

## Estado por recorrido

| Recorrido | Estado actual | Validación pendiente |
|---|---|---|
| Android instalada → enlace | Plugin/servidor/listeners preparados y tests pasan | Tap real WhatsApp/SMS con app cerrada/abierta; verificación OS dominio |
| Android instalada → código | Backend y clientes comprobados | Dos Android en redes móviles distintas |
| Android sin instalar | Instalar APK de pruebas, regresar al mismo enlace o usar código del mensaje | No instalación diferida automática |
| iOS instalada | Scheme/listener y perfil preparados | TeamID real, AASA público, firma/build instalada y prueba física |
| iOS sin instalar | No build/tienda Online configurada | Distribución iOS y estrategia explícita para conservar invitación tras instalar |

## Instalación diferida

Universal/App Links resuelven apertura si la app ya está instalada; no transportan automáticamente una sala desde una descarga de APK/App Store al primer arranque. El landing conserva el enlace en navegador y explica volver después de instalar. Este flujo manual funciona como fallback, pero NO satisface recuperación automática pedida.

Android desde Play: Install Referrer puede transportar referencia al primer arranque; exige publicación/distribución Play propia y manejo validado de referencia en app. APK descargada directamente no usa ese mecanismo. iOS: se necesita diseñar recuperación posinstalación (servicio de deferred links o asociación explícita por cuenta/código/retorno al enlace). No elegir proveedor con costes/acceso/tracking ni añadir SDK a ciegas. La alternativa fiable y actual: conservar enlace/código y tocar Abrir después de instalar. No atribuir instalación diferida al redirect de tiendas de Invite Friends.

## Requisitos iPhone

Cuenta Apple Developer/equipo vigentes y autorizados, bundle propio, TeamID en configuración/AASA y Associated Domains en app. Para pruebas: build adHoc con UDID registrado o TestFlight; certificado/perfil correctos; iOS mínimo configurado16.4. WebRTC nativo y permiso micrófono incluidos en futura build; ExpoGo no acredita voz nativa. Windows puede preparar fuente; compilación/firma iOS requieren EAS cloud o Mac. No se creó firma, dispositivo, build iOS, proyecto Apple ni tienda en esta revisión.

## Prueba física antes de aceptar el candidato

Mismo APK en ambos Android, Wi-Fi apagado/redes distintas. Dominó y Póker: código; enlace recibido WhatsApp/SMS; app cerrada y abierta; repetición misma invitación; confirmación antes de cambiar sala; terceros sin acceso; un par de jugadas por usuario; cancelar y aviso del otro; pérdida/reconexión. Voz aceptar/rechazar, mute, salida/fondo, cierre5min. Nuevo usuario sin instalar: instalar y volver al enlace (registrar que todavía es fallback manual). iPhone requiere su build propia, no APK.

## Fuentes primarias consultadas

- [Apple Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [Apple Associated Domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Google Play Install Referrer](https://developer.android.com/google/play/installreferrer)
- [Expo distribución interna](https://docs.expo.dev/build/internal-distribution/)
- [Expo TestFlight](https://docs.expo.dev/submit/testflight/)

## APK generado y verificado

Archivo: C:/Development/Dominos Codex Online/.local/expo-go-20261013/Domino-Online-Test-v1.0-Internet.apk

Compilación local desde archive v1.0 en C:/do-5486, perfil Internet; BUILD SUCCESSFUL,3m34s. Etiqueta Git v1.0 identifica la fuente; metadatos internos conservados0.1.4/versionCode5. No confundir con APK anterior: archivo nuevo y SHA256 diferente. 202801932bytes (193.4MiB), arm64-v8a/armeabi-v7a, minSDK24/target36. FirmaV2 válida, certificado pilotoSHA256 coincide exactamente assetlinks público. Manifest contiene scheme/autoVerify/pathHTTPS exacto, permiso RECORD_AUDIO; WebRTC y Hermes nativos ambasABIs. Bundle incluye servidor HTTPS, guías actuales, indicadores y acción flotante; no endpointLAN192.168.1.194:8792 ni nombre del secreto TURN. Source map compilado coincide exactamente con seis archivos críticos del checkpoint.

SHA256:8127FBC7FA6DA467761B5183B20935A3A22E93E35067F0F6D5D50F16BD4475E9. Log raíz .local/expo-go-20261013/online-v1.0-android-build.log. Sin instalación física, uploadEAS/tienda/Worker ni sustitución APK público anterior. Instalar este mismo archivo en ambosAndroid, luego volver a invitación o introducir código. Descargar desde un enlace público/QR requerirá publicar este archivo; enlace anterior continúa sirviendo APK anterior.


Entrega elegida después: carpeta C:/Users/yunie/Downloads/Domino-Online-v1.0 con APK y LEEME.txt. Usuario lo copiará porUSB. Hash de copia verificado; publicación autorizada previamente pero NO ejecutada al elegir alternativa local. Enlace público anterior permanece sin actualizar.


## 2026-10-17 — Revisión de enlaces Android Poker/Dominó y arranque

Alcance humano final: limitar cambios exclusivamente a enlaces para jugar Online de Poker y Dominó, conservar funciones probadas; sin commit/push/build/deploy/publicación. Raíz principal master a5e19a1 limpia: no es el candidato32. Trabajo aplicado únicamente en worktree864b, a5e19a1+diff aprobado preservado. Se consultaron instrucciones canónicas y documentación Expo v56 antes de editar; dependencias reales permanecen SDK57, sin actualización.

### Qué está confirmado

- Última entrega interna documentada: 1.0.14(32), com.yht.dominoparty, release11, 16oct16:43 Nueva York. Fuente: `.local/internal-release-20261016/release32-final.json`, captura y manifiesto fuente de786archivos. No nueva consulta a consola ni número instalado confirmado. Cabecera29 de CONTEXTO es histórica y no identifica la entrega más reciente.
- APK32 local SHA256 `07f0cb8ff95bb0610587dace292d9eac3cfe75e16e3bb2da378b984bf34127f1`; Hermes `e131746decb471c7ad74ef160c38e74840caf6743151eaa0fb4709cb80e7fe46`. Verificados bytes actuales del APK; AAB/APK31 también comparten Hermes45a7816f5229b3128cf2d386d4162229aed99c84c97e8a86af52f03f339cba95. APK28 separado contiene `poker-online-invite` y carece de `poker-link-acceptance-screen`; APK31/32 invierten ambos marcadores. No prueba de cuál ejecuta un teléfono.
- Reproducción EN MEMORIA con fuente21ad0de y dobles: link entrante+sesión previa+connection_error presenta crear1/aceptar1/reconexión1 y llama resume. RC31 en mismo escenario: crear0/aceptar1/reconexión0, sin resume. Demuestra el mecanismo antiguo, no identifica el binario humano ni prueba su causa actual.
- GET públicos actuales: portal canónico, landing.js, configuration.js y assetlinks200. Landing conserva pokerRoom al producir dominoparty://online?pokerRoom=...; configuración release usa dominoparty, automaticStoreFallback=false y también ofrece piloto domino-online-test. Assetlinks asocia tanto com.yht.dominoparty como com.nextcodestudios.dominoonline.test. El manifiesto APK32 registra MainActivity/singleTask, esquema dominoparty y rutaHTTPS exacta /online/invite. Instalación tester no identifica por sí misma qué paquete resolvió el intent. No navegador ni micrófono ni sala humana consultados/modificados.

### Defecto demostrado y cambio mínimo

AppShell devolvía FullScreenLoader antes de montar ambos listeners cuando !ready o !loaded. Un evento cálido durante esa carga no llegaba a navegación; getInitialURL puede conservar el intent inicial del launcher, por lo que no reproduce necesariamente el nuevo evento. Prueba real de App+NavProvider+listeners+parsers, con fronteraOS/storage simulada e initialURLnull:6/6 fallan antes, quedanHome tras terminar carga. El fix mueve los DOS listeners, sin cambiar su código, a sus mismos proveedores antes de AppShell.6/6 pasan después. No se altera deduplicación ni prioridad cálido sobre inicial antiguo: el descarte de un initialPoker viejo tras un eventoDomino nuevo ya estaba protegido y es intencional; no se trató como defecto.

Prueba adicional integra generador real Poker/Dominó -> función real invitationShareContent Android -> landing local real -> listeners/NavProvider reales, con IDsfixture y estadoOS simulado.12casos cubren HTTPS/esquema de landing por cold/boot-warm/ready-warm y verifican código final real de NavContext. No inyecta pendingCode ni llama openPokerOnline desde el test; tampoco prueba WhatsApp ni intentAndroid real ni sala remota.

### Matriz de cobertura y límites

| Tramo | Evidencia disponible | Brecha real |
|---|---|---|
| Crear sala, alias6cifras y código10hex | Clientes/dominio reales mediante transport/vault en memoria; pruebas previas HTTP públicas16oct | No creación humana ni nuevo backendQA en este bloque |
| Generar enlace/texto y compartir | Generadores y payloadAndroid reales; Share nativo sustituido; códigosfixture | WhatsApp enviado/recibido real no capturado |
| Landing y asociaciones | GET públicos200 actual; esquema/juego/certificados inspeccionados | Defaults/paquetes y verificaciónAppLinks del Android desconocidos |
| Intent -> listener -> navegación | App real+NavProvider+listeners/parsers;18pruebas controladas de arranque/URL | Sin captura de intentAndroid; URLhumana aún ausente |
| Sesión previa, consentimiento, retry, errores | PokerInvitationEntry y OnlineFriendScreen, UI+clientes con dobles; contratos backend reales en otras pruebas | No ejecución nativa/estadoSecureStore humano |
| Código manual y juego correcto | useCodeInvitation con cliente/dominio real en memoria, colisiones y cancelación | No prueba física de entradaS8/S24 en este bloque |
| Sala compartida/reconexión/cancelar | PokerOnlineClient, invitationRecovery/cancelInvitation y dominios; QAHTTP16oct histórica | Android nativo y dos teléfonos de esta prueba pendientes |

Validación final:120/120 pruebas dirigidas en17archivos, TypeScript exit0, diffcheck0. Log `.local/invitation-review-20261017/targeted-tests.log`. Inventario `.local/invitation-review-20261017/candidate-delta.json`:786archivos base comprobados, ninguno ausente, SOLOApp.tsx difiere de build32; nueva prueba App.invitationBoot.test.mjs adicional. El resto del candidato32 queda preservado; no se recompiló ni se modificaron artefactos existentes. Pruebas/UI controladas no acreditan corrección física.

### Diagnóstico pendiente del caso de tres botones

No hay causa física confirmada. Hipótesis discriminables: (1) resolverAndroid abre otra instalación/piloto o implementación que contiene el panel antiguo; ambas identidades están asociadas al dominio. No implica que usuario instalara una versión vieja. (2) URLrecibida distinta: parserrechaza parámetros añadidos/hash/ruta distinta; landing admite slashfinal pero parser/manifiesto usan rutacanónica exacta. No se parchea esta variante sin enlacehumano/evidencia de recorrido. (3) pérdida de evento durante arranque, corregida en fuente, pero por sí sola NO explica crear+aceptar+reconectar en32. (4) error de aceptación/reanudación después del enlace: falta error/intent/estado real para atribuirlo a red/almacenamiento/servidor.

Única pieza mínima siguiente: enlace EXACTO que llegó por WhatsApp, copiado como texto completo. Después contrastar su destino e intent con paquete/versionCode realmente receptores; no repetir preguntas de origeninstalación ya contestadas. Antes de otra entrega: mantener base32+fixApp trazables, nueva build solo con autorización, verificar APK/AAB contra ese inventario y ejecutar sobre ambos Android el MISMO enlace/código en ambos sentidos, cold/warm/background, sesiónvacía/previa, confirmar consentimiento y misma sala, jugar/reconectar/reintentar/cancelar. No declarar resuelto todo el fallo ni sugerir reescritura sin esa evidencia.


## 2026-10-17 — Ampliación: WhatsApp, regreso directo y revisión visual S24

Nueva evidencia humana: AMBOS dispositivos de esta prueba son Samsung S24; las menciones históricas S8 pertenecen a otras pruebas. El invitado abre enlace y queda esperando; tocar el anfitrión su propio enlace permite conectar, pero regresar directamente desde WhatsApp no. Se retira como requisito inmediato pedir URLexacta: la diferencia de retorno permite investigar/restaurar el flujo. Criterio autorizado: el anfitrión vuelve directamente y ambos llegan automáticamente a la MISMA mesa cuando el invitado consiente, tanto si acepta mientras anfitrión sigue fuera como después. No autoaceptar enlaces nuevos ni crear otra sala. Revisión visual adicional Poker/Blackjack autorizada, sin ajustes especulativos ni implementación visual.

### Recorrido y dos defectos demostrados

RN Android instalado `ShareModule.kt` resuelve la promesa inmediatamente después de startActivity(chooser); no espera regresar de WhatsApp. InvitationShareOptions llama onDone al resolverse. Los dos clientes conservan credenciales pero AppStatebackground llama disconnect; el dominio real deja al anfitrión sin lease vigente y joinrechaza not_connected mientras está ausente. Heartbeat del regreso sí renueva su lease en la prueba controlada: no se atribuye sin evidencia todo el fallo a resume del anfitrión.

1. Poker: el invitado que consintió mientras anfitrión estaba fuera conserva pendingJoin/token con errornot_connected. La pantalla mantiene sessionActivefalse durante aceptación y su timer no reintenta esa rama; el regreso correcto del anfitrión NOlibera al invitado detenido. Fix mínimo PokerOnlineScreen: callbackref actual reintenta SOLOsi attemptedCode===códigoactual, canResume y errornot_connected, al tickactivo/regresoactivo. Usa acceptCurrentInvitation/resume con MISMOtoken/target; al éxito hace la transición existente a mesa. Ningún retry sinconsentimientoactual, tras nuevoenlace o de erroresgenéricos/terminales. No cambios al cliente/protocolo/servidor.
2. Dominó: onDone hacía setInvitationStarted(true)+onBack(), ocultando OnlineFriendScreen en el wrapperlocal. La transición posterior a playing llama onStarted SOLOsi !invitationStarted, condición ya desactivada por compartir. Puede haber misma sala conectada, pero anfitrión permanece oculto. Fix mínimo: conservar setInvitationStarted(true) y retirar SOLOnBack de ese callback; anfitrión permanece en su invitación visible y abre mesa mediante snapshotexistente. No se modifican volvermanual, cancelación, timer, reglas, pantallaCPU ni código manual.

Reproducción nueva `src/online/invitationShareReturn.test.mjs`: pantallas reales+InvitationShareOptionsreal+OnlineClient/PokerOnlineClientreales+dominiosreales; fronteraOS/Share/transporte/vault en memoria controlados. Fuenteantes:8casos,6fallan por not_connectedPoker o anfitriónDominooculto;2Poker con aceptación despuésretorno pasan. Log share-return-before.log incluye esta reproducción, separado de los primeros ajustes del fixture. Fuenteactual:12/12casos Share resuelto antesbackground/despuésbackground/despuésregreso × invitadoaceptaantes/despuésregreso × ambosjuegos. Verifica guestcomputer/hosthuman, mismocode, SOLO1create, tokensintactos,0joinanfitrión, ambas mesas visibles, sin tocar propio enlace. Es integración enmemoria, NO ejecuciónWhatsApp/Android física.

Más2regresionesPoker: no retry sinconsentimientoactual; enlace nuevo corta retrytargetanterior. Total60/60 dirigidas (shareReturn, PokerInvitationEntry, PokerOnlineScreen, OnlineFriendScreen), TypeScriptexit0 y diffcheck0. Se actualiza expectativa anterior de pruebaDominó que exigía ocultarhost: la nueva instrucción humana exige volver a su invitación/mesa directamente. Log `.local/invitation-review-20261017/share-return-after.log`. Suite120anterior no se repitió completa: evidencia previa conservada; las60cubren las ramas ahora modificadas. Corrupción accidental al guardar con localeWindows detectada por tests de textos y restaurada: comprobación SHA256 obligatoria confirmó que retirando SOLOestosparches ambasfuentes coincidían EXACTAMENTE con manifiesto32; revisiónautomática rechazó conversión general inicial, luego admitió reparación protegida por hashes. No cambio de textos/codificación residual.

### Trazabilidad actual y siguiente validación

Inventario786 de build32 recontrastado: únicos3archivos de aplicación distintos App.tsx(fixarranqueprevio), src/poker/PokerOnlineScreen.tsx y src/online/OnlineFriendScreen.tsx. Nuevas pruebas App.invitationBoot.test.mjs/invitationShareReturn.test.mjs, regresiónPoker añadida y expectativaDominó actualizada. APK/AAB32 no modificados y NOcontienen estosfixes; no build/deploy/commit/push/publicación. Historial/diffs32 previos preservados.

Próxima validación física del candidato recompilado SOLOtrasautorización: MISMAentrega comprobada en los2S24; anfitrión comparteWhatsApp y regresa por app/back SINsu enlace; invitado consiente duranteausencia y despuésretorno, en ambosroles/juegos. Debe abrirse la mismamesa enambos, 1sala, credencial anfitrión conservada. Incluir cancelación/nuevoenlace/guestbackground/redintermitente, y regresióncódigomanual. No se afirma que el propio enlace sea obligatorio, que todo falle por versiónvieja o que esta integración ya cierre físicamente el caso.

### Revisión visual sin cambios

PokerOnline: cálculo de rectángulos usando inicializadores extraídos del ASTreal y helper tablePlayerCardWidthreal. Ancho360, mano normal sin resultado/rebuy: alturaútil719 -> rival60/propias65 y separaciónrectangular209.25dp; altura720 -> rival74/propias80 y separación89.78dp. El salto de umbral720 cambia franja84->144 y escala/tamaños, no solo1dp de espacio. A844 separación192.78dp. Se demuestra sensibilidad/discontinuidad de layout, NO que los S24 tengan esas medidas. Alto medidoonLayout, insets, modoCPU/Online, resultado/rebuy y viewport son entradas a contrastar; fontScale también reserva espacio del hint/comunitarias, no se culpa a ajustes/versión. Falta capturar panelW/H reales y estado en ambos S24 para atribuir diferencia. No cambioPoker visual aplicado.

BlackjackScreen:126 apuesta/pote anclado left40, width70, bottom34compact/31alto; TotalBubble usa top-17. Demuestra que el número sobresale porarriba; no hay cajasnativas deltexto/manos/scroll para afirmar solapamientofísico. Propuesta revisable SINaplicar: contenedorleft28 y bottom18compact/15alto (12dpizquierda/16dpabajo), labeltop-9 (importe24dpabajototal). Conservarpotref, importes y trayectorias porref; antesdeaplicar revisar Clear, manos2/3+/scroll, importeslargos/fontScale y altura real. Es propuesta de geometría, no remedio certificado. Cálculos y propuesta `.local/invitation-review-20261017/visual-review.json`. No se tocó BlackjackScreen ni mesasPoker.


## 2026-10-17 — Corrección humana: cartas juntas en Blackjack, Poker correcto

Fuente humana final vía coordinador: ambos teléfonos son SamsungS24. Poker sí mostró separadas las cartas de ambos jugadores y del centro; el problema de cartas dealer/propias casi juntas corresponde a BLACKJACK. Sustituye atribución visual anterior aPoker, sin borrar historia. El breakpointPoker observado es incidental y NOmotiva cambio. Se mantiene revisiónsinimplementar y fixesWhatsApp intactos. Pregunta causal: si pote/número cambia posición de cartas o solo puede taparlas.

### Resultado verificable

BlackjackScreen.tsx:126: padre delpote y número `position:absolute`, left40/bottom34compact31alto/zIndex12, hermano del ScrollView de manos, no hijo del flujo vertical. EtiquetaTotalBubble top-17 también absoluta dentro delpote. Por estructura no reserva ni consume altura en la distribución de manos; puede ocluir visualmente por superposición, pero moverlo NOcorrige la separación entre filas. Se renderizó la pantalla real con arnésReactexistente y contextoBETcontrolado: cambio confirmado de texto `$20` a `$500` en8escenarios; se compararon estilos reales de main/hero/rack/banda dealer/banda propia y anchosde4cartas: sinningunadiferencia. No medir texto nativo ni negar solapamiento visual por tamaño deimporte/fontScale.

El espacio vertical se determina por `usableHeight=window.height-insets.top-insets.bottom`, umbralcompact<720, franja48header, madera94/98, paddingScroll12 y el flujoBlackjack: mainminHeight445/540, paddingBottom170/144, gap1/12; hero105 o min165/20%altura; rack48 con margen-20/-16; filasdecartas; banda propiaflex1 alineadaabajo, margen-6/0 y translateY6/10. Cartas reposadas usan height=width*1.43; dealer60/74 ypropias65/80 a360dpdeancho. La altura mínima fija NOgarantiza espacio entre las dos manos al crecerlos elementos del modoalto. No se usa rootHeight medido para elegircompact: rootHeight sirve a destinosfallback de vuelos. Esto es una dependencia de altura disponible, no evidencia de que el usuario haya cambiado ajustes.

### Rectángulos controlados, no mediciones Android

Pantalla real renderizada con stubsOS/UI del arnés existente; estilos tomados del árbol y fórmulas de flexcolumn calculadas. Supuesto explícito: root=ventana-insets, ScrollView llena superficie, contenido mínimorespetado y filas horizontales tienen altura deuna carta. SINmotorYoga ni cajas nativas/texto/scroll real; resultados son modelo geométrico, no reproducción física certificada. Coordenadas relativas alcontenidoScroll.

| Ancho/altura útil dp | Dealer top..bottom | Propias top..bottom | Separación |
|---|---|---|---|
|360×640|135..220.80|229.05..322|8.25dp|
|360×719|135..220.80|308.05..401|87.25dp|
|360×720|203..308.82|313.60..428|4.78dp|
|360×780|215..320.82|373.60..488|52.78dp|
|360×568|135..220.80|188.05..281|-32.75dp (solapamiento enmodelo)|

A393×ventana780, insets24+36 ->720útiles y4.78dp; insets24+37 ->719útiles y87.25dp. Es una variación CONTROLADA para aislar el umbral, no medidas ni cambios de ajustes de ninguno de losS24. Demuestra un mecanismo que puede dejar cartas casi juntas alentrarenmodoalto; falta alturaútil/cajas reales para atribuir físicamente el caso. Evidencia `.local/invitation-review-20261017/blackjack-review.json`,8escenarios, cadauno BET20->500 sin moverflujo.

Cartas adicionales permanecen en ScrollViewHORIZONTAL con ancho limitado: no hay wrap ni filas verticales nuevas porpedir cartas. El estado de motor es un player[]/dealer[]; no hay split implementado que explique variasmanos. Resultados/natural/importe/totalbubbles son capasabsolutas o texto, no reasignan el gap. Reparto tiene translate/rotate animados: los rectángulos de esta revisión corresponden a reposo. FontScale puede agrandar etiquetas superpuestas; no cambia width/heightnuméricos ni compact directamente enesta fuente. Ninguno de estos puntos acredita quéestado tenía el S24 afectado.

### Propuesta revisable, sin edición visual

Separación de manos: reservar mínimo16dp entre rectángulos reposados de dealer ypropias, calculando mínimo de contenido a partir de alturas reales y dejando ScrollView absorber déficit. Fórmula delmodelo: `mainMin=max(minActual,paddingBottom-translateYPropias+altoCartaPropia+bottomDealer+16)`. A360×720 necesita573.22dp frente a main562disponibles:11.22dp adicionales decontenido desplazable. A360×640 mínimo493.75 frente486:7.75adicionales. Mantiene tamañoscartas/posicionesajenas/reglas y NOmuevepote como supuestoarreglodelgap. Antesdeimplementar requiere comprobar layoutYoga/scroll y medidas reales, no fijar un número por modelo como solución física.

Propuesta anterior de poteizquierda/abajo permanece SINaplicar y separada: sería solo para oclusión comprobada delimporte, no para separar manos. Sin capturanativa no recomendar aplicarla como remedio de estereporte. No modificación de BlackjackScreen, PlayingCard, helpercardSize ni Pokerlayout; no nuevas pruebas generales, build/deploy/commit/push. Siguiente dato mínimo: UNA captura COMPLETA delBlackjack afectado en reposo, con ambasmanos y pote/número visibles; permitirá distinguir cartaspegadas deoverlay. Dimensionesútiles/insets reales serían el siguiente discriminante si lacapturaconfirma compresión.


## 2026-10-17 — Entrega trazable de los fixes: Android33 interno

Autorizaciónhumanaposteriorpermitióbuild/subida/publicacióninternapara2S24. Completado: 1.0.14(33), com.yht.dominoparty, Playrelease12 Availabletointernaltesters17oct21:11NY, opt-inactual https://play.google.com/apps/internaltest/4701586554701115404 . EASca33b98e-665d-4e4f-a9c9-5b65601e2868 FINISHED, nosegundabuildAPK.

Evidencia `.local/internal-release-20261017/`: release33-final.json (estado/URLs/hashes), source-manifest.json (786archivosconhashes; soloApp/OnlineFriendScreen/PokerOnlineScreen/configversiondistintos32), prebuild-tests.log (91/91dirigidos), published-config.json, manifest33.xml ymanifest-cert33-proof.json (manifiestorealidéntico32salvocode), bundle33-proof.json+verify-bundle33.mjs (inspecciónSEMÁNTICAdebytecodeHermesextraídoAAB:3fixescompilados,9marcadores32), preserved-native-assets.json(4libsWebRTC+KnockWAVidénticos32), firmasAAB/APK, apk33-content.json (Googlefirmado/SourceStamp/mismoHermes), screenshotplay33-available-internal.png. Sin sourcemapscomosustitutodebytecode.

AABSHA2561dcbbfae9d1ced348a700cab15723a0fce4c5989644d3778637b3ef90bd1b9ef; APKGoogleSHA2567b09a44e96796b59b3772ad366d98c10e5f56c446f48cc9011e56d4ceee44f72; Hermescomún1df7d2f8ac02488a8621c94ee4dc19557780a2a465bd2cd0d6d499c27ef5c431. Uploadcertconfig9196...31C1 yPlaycertconfig26E1...A395D08Cverificados.0erroresPlay,1warningdesofuscación,0pérdidadispositivos. Candidato864b/diffs32+fixespreservados,sincommitpush/producción/iOS/backend/web/correo. VisualesBlackjackNOimplementados; PokerlayoutNOtocado.

Checklist física pendiente: ambosS24actualizarPlayyconfirmar33; Poker/Dominoambosroles,linkWhatsAppconhostregresandoDIRECTOappsinpropioenlace; guestconsienteduranteausenciaydespuésretorno;ambosmisma salaautomática;jugadayreconexión;codigomanual;cancelación/retry/nuevoenlace. Loentregadoesdisponibilidad/paqueteverificado,no prueba físicaresuelta.


## Entrega iOS TestFlight — 2026-10-17

**1.0.14 (15)** de la misma app está procesado y disponible en **Testing** para el grupo interno existente Domio Tester. Apple build `4bf5d7d5-546e-4fe9-bcea-a81945db2dd3`; EAS build `dd913aef-8b1a-4ba2-862d-2b5746516f35` y submission `09e5f65e-4e24-467a-a705-c6922d93bfa6` terminados. Las mismas tres correcciones Online de Android33 fueron verificadas en el Hermes del IPA. Info, perfil, firma principal, entitlements y módulos nativos verificados con el alcance Windows documentado en `ipa15-proof.json`. What to Test guardado en ASC para ambos juegos y sentidos Android↔iOS.

Captura del grupo y registro final en `.local/ios-testflight-20261017/testflight15-testing.png` y `release15-final.json`. No cambios visuales Blackjack/Poker, backend, web, producción, nuevos testers ni email iOS manual. Prueba física de invitaciones entre Android33 e iOS15 pendiente; disponibilidad TestFlight y métricas de instalación de ASC no prueban ese comportamiento.
