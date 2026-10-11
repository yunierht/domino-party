# Enlaces Online: revisión y paquete de staging

Preparación autorizada, sin hosting/DNS/deploy/publicación. El usuario confirma controlar dominoparty.com; no se verificó acceso a cuenta/zoneDNS. Destino PROPUESTO separado: `online-test.dominoparty.com`, Worker `domino-online-links-staging`. No cambiar la web actual ni `/join/` de Watch. No hace falta comprar otro dominio; workers.dev sería alternativa con host propio realmente asignado y sus asociaciones, pendiente de selección/aprobación.

## Revisión heredada: qué existe realmente

`Menu.tsx` comparte `https://dominoparty.com/` como invitación general a la app. La web pública respondióHTTP200: adapta el botón principal a AppStore en iOS y resalta los botones de plataforma; NOredirige automáticamente a tienda al abrir la raíz. `GameScreen.tsx` comparte marcador/Watch mediante `https://dominoparty.com/join/?code=...` yQR del mismo enlace.

`/join/` pública respondióHTTP200; su script coincide con el local después de normalizar finales de línea. Android se detecta porUserAgent; iPhone/iPad/iPod porUserAgent, iPadOS porMacIntel+touch>1. Con código, limita a6caracteres, intenta `dominoparty://watch?code=...` a450ms y fallbacktienda a1600ms. Sin código, móvil va a la tienda correspondiente; escritorio conserva botones. Targets: Android `com.yht.dominoparty`, Apple6793746031, appSocialClubheredada. No guardvisibility/pagehide en ese fallback: es heurístico y no demuestra que se abrió laapp, ni que el código se conserve despuésdeinstalar.

Online es distinto: `onlineRoom` lleva canonicalID10hex, listener dedicado excluido deWatch, y buildpiloto usa `domino-online-test://online?...`. Fuenteoriginal activa ya tiene aliasmanual6 en texto, pero URL siguecanonical10; no se copiósnapshot incompleto. `/join/` NOprocesa `onlineRoom`, trunca10→6 y abreWatch; no reutilizarlo como landingOnline. Ningún linktienda heredado instala el piloto con paquete/bundle propio. No hay deferredinstallimplementado.22tests existentes deLinkListener/invitation/share pasan; simulaciónJS local de4UserAgents también concuerda. Esto no validaOS, WhatsApp, instalación, disponibilidad privada de tiendas ni retorno postinstall. Ningún enlace heredado fue modificado.

## Qué está preparado

`config/online-links.staging.proposal.json` contiene origen propuesto y package/bundle piloto propios; fingerprintAndroid REAL del certificado de prueba y teamAppleNULL, storesNULL. No valoresinventados deAppStore ni enlaces de descarga falsos. `config/online-links.example.json` queda genérico. El generador falla si falta dominio/equipo/firma o hay identidadheredada, y no permite certificadoDebugpiloto comoReleasePlay.

`scripts/prepare-online-links.mjs` genera landing, configpública, `assetlinks.json` y AASA SOLOconidentidades completas validadas. Previewlocal se genera con `--preview`, sin asociaciones y sin URLstienda. Canonicalroute `/online/invite?onlineRoom=ID10HEX`; NOtoken deasiento, nombre/voz/manos ni sesiónprivada. Código mostrado/copiar es el IDENTIFICADORcanonical10, no el aliasmanual6; conservar el código manual del mensaje para entrada por teclado. Tras instalación, volver al mismo enlace abrecanonicalroom; integrar/probar esta distinción con la fuentefinal de alias6, no inventar un alias por truncado ni prometer recuperaciónsinretorno.

`plugins/withOnlineInvitationLinks.js` registrado e INACTIVO por defecto. Se activa únicamente con `DOMINO_ONLINE_LINKS_CONFIG` apuntando a configreal y `EXPO_PUBLIC_DOMINO_ONLINE_INVITE_BASE` exactamenteigual aorigen+/online/invite. Exigeidentidad nativa coincidiente y añade associatedDomains/intentFilters SOLOaesehost/path. No cambia linksWatch/scheme/backend ni dominios conconfigausente. AASA usa team/prefixdel signing real: verificar `application-identifier`/entitlements delIPA antesactivar, no inferirlo deapppublicada anterior.

Landing valida ruta/query/código exactos y rechaza tokens/duplicados/credenciales/hash; texto portextContent. Conserva copiarID/volveralmismoenlace y Openappcustomscheme. Tienda de plataforma solo siURLpropia verificada; stageNULL ofrece instalaciónmanualAPK/IPAadHoc. EnReleaseconfigcompleto, fallbacktienda1600ms cancelado alabrirapp/copiar/ocultar/salir; navegación instalada depende principalmente deasociaciónOS. No detector fiable deappinstalada ni deferredautoinstall iOS afirmados; WhatsApp/inappbrowser requieren prueba real.

Workerpropuesto sirve únicamente landing/scripts y dos `.well-known` porHTTPS delhostexacto. No redirecciona asociaciones; MIMEJSON, políticaCSP/no-referrer/no-sniff y HTMLno-store. No pasa Authorization/Cookie/query albindingASSETS, noAPIpartidas, DO, Firebase, almacenamiento o micrófonos. Código/config en `web/online-invitation/`, revisados con guíasCloudflare actuales y tiposWorkers5.20261009.1.12tests Node/DOMfalso +typecheck delWorker y schemaWranglertypes; no equivalen a runtimecloud ni pruebaOS. Preview local en `.release-audit/online-links-preview/`, no publicado. Chrome local renderizó identificador sintético, copiar y retorno, sin tiendas ni lanzamiento nativo disponibles; screenshot inspeccionado, ningún contacto/clipboard real/micrófono usado. IAB inicial no respondió; Chrome propio de prueba funcionó, sin alterar pestañas del usuario.

Este contrato de enlace corresponde a Domino y su canonicalID10 vigente. Al integrar la fuente final Poker, contrastar el discriminador/ruta de juego y el contrato de invitación para no abrir una sala Poker en Domino; no se inspeccionó ni modificó el checkoutPoker ni se afirma que estos enlaces ya cubran su protocolo.

## Acción de hosting que falta aprobar

Antesdeploy: autenticaciónCloudflare segura y confirmaciónaccount/zonepropios; dominio/nombreWorker elegidos; teamApple/entitlementsIPA y certificadosAPK verificados; sourcefinalDomino+Poker listo; generar paquete real y revisarreadiness. No emitirAASA conteam ficticio ni reutilizarPlayAppSigning deSocialClub. iOSadHoc puede probarUniversalLinks antesAppStore; Androiddebug soloStaging. Alpublicar después, cambian firmaPlayAppSigning y quizásidentidades: regenerarasociaciones y hacer smoke final detiendas.

Propuesta concreta para aprobación final: crear SOLOWorker `domino-online-links-staging` conassetsgenerados y customdomain `online-test.dominoparty.com`, sirviendo `/online/invite` y losarchivosasociación, sin tocarapex/www/hosting/Worker heredados, sin backendpúblico/tiendas/TURN/compra. Configrevisable `wrangler.staging.proposal.jsonc`; comando DESDEcarpeta `backend/domino-online`: `node scripts/wrangler.mjs deploy --config ../../web/online-invitation/wrangler.staging.proposal.jsonc` únicamente trasaprobación y generaciónvalidada. No ejecutado. Workerassetsdirectory previsto `.release-audit/online-links-staging`; faltateamApple y nohaypaquetopublicablecompleto todavía.

## Prueba física antes de tiendas

1. Deploy autorizado y luego HTTPS200sinredirect/MIMEcorrecto enambos `.well-known`; fingerprintAPK y entitlementIPA iguales aassets; verificar dominioOS y cacheasociaciones.
2. Instalar buildsPILOTOconentitlements/intentFilters; ambosusuarios enCyberNet porquebackend sigueLAN. Crear sala actual y compartirHTTPS real porWhatsApp, no tocarcontactos/transmitir sinordenhumana.
3. Android+iPhone: appabierta, cerrada y enbackground; tocarlink enWhatsApp y navegadorfuera debarraURL; confirmarcanonicalroomyaliasmanualcorrectos, misma sala, nombre/consentimiento, manosprivadas.
4. Dispositivo sinapp: landing,código visible/copiar, instruccionesinstalaciónAPK/IPAadHoc registrada; instalar manualmentey volver alMISMOlink. No se puede probar descarga desdefichasOnline no publicadas. Sala vencida debe fallarclaramente y requerirnueva invitación, sin revivir porlink ni borrar datos.
5. Copiaequivocada dealias/URL, código inválido/duplicado, sala cerrada/llena, faltaWi-Fi/VPN ycancelación; datos/token nunca enenlace. No abrirjuegoWatch/otra app.
6. Traspublicación autorizadafutura: smoke adicional conbuilds firmadasdefinalPlay/AppStore, links realesdetiendas e instalación/retorno; staging no elimina esaúltima validación.

APKAndroid nuevo enespera PORPEDIDOHUMANO hasta cerrar/integrarDomino+PokerOnline. EASCloudinternal autorizado, proyectoOnlinecreado, Applelogin/UDID/provision pendientesdeinteracciónhumana; no IPAfuenteparcial. No commit/push/deploy/tiendas ni asociaciónnativaverificada en este bloque.
