# Recepción en Domino Codex Online — 2026-10-08

Destino confirmado por el usuario: `C:\Development\Dominos Codex Online`; nombre definitivo: **Domino Codex Online**. Handoff recibido en esta carpeta y leído íntegramente. Faltaba en la copia: se copió desde `C:\Development\Dominos Codex Pro\docs\TRASPASO_ONLINE_DISCOVERY_2026-10-08.md` y se verificó igualdad SHA-256 antes de añadir esta nota. Pro no se modificó.

La recepción y los hechos propios del destino constan en [CONTEXTO](CONTEXTO.md) y ON-D-001/ON-D-002/ON-P-001/ON-P-002 de [DECISIONES](DECISIONES.md). Las menciones originales de nombre/ruta/destino pendientes son historia de preparación en Pro; quedan aclaradas aquí sin reescribir el texto fuente. Aclaración humana recibida durante el traspaso: **Play Domino online primero, Poker después**, con **salas privadas de conocidos por enlace/código** como dirección aceptada de discovery. La secuencia queda resuelta; distribución, monetización, proveedor y detalle del MVP siguen pendientes. Generación del código en servidor y controles de unión son propuesta, sin longitud/vencimiento/aceptación aprobados. Alcance completado: únicamente recepción documental, sin comenzar implementación.

## Documento fuente de Pro — texto íntegro preservado

# Traspaso de conocimiento de Pro hacia el proyecto Online

Fecha: 2026-10-08, America/New_York. Estado: documento preparado en la fuente; destino pendiente de identificar. No es autorización de implementación, publicación ni contratación.

## 1. Origen, destino y autorización

- Fuente verificada: `C:\Development\Dominos Codex Pro`, rama `master`, HEAD `e1350552b37181c6056b1531f8bb53c9191e19f0`. Árbol limpio antes de este bloque documental. El candidato de código es `a1af46e93ae790746e98625a3745ca3cfc094339`; los commits posteriores descritos en continuidad son documentales. No se comprobó GitHub en vivo en este traspaso.
- Fuente humana: discovery de este chat; petición más reciente por voz transmitida desde chat `01a11e1e-1c9a-7691-a639-449d301a5e41`, solicitando knowledge transfer mientras el usuario copia Pro para desarrollar multiplayer de dominó y póker.
- Nombres mencionados: primero “Domino’s Codex Online”, después “Codex Pro Online”. Nombre definitivo, ruta, estado de copia y registro del proyecto no confirmados. No se inspeccionó ni escribió el destino.
- Alcance autorizado ahora: documentación revisable en Pro y enlaces desde [CONTEXTO](CONTEXTO.md) y [DECISIONES](DECISIONES.md). Sin código, dependencias, configuración, cuentas, servicios, commit, push ni tiendas.
- Transferencia de conocimiento expresamente solicitada: conservar procedencia y fechas de Pro; iniciar después continuidad propia de Online. No convertir evidencia, permisos o historial heredados en estado actual de Online.
- Reglas comunes consultadas: [REGLAS](../../Organization/REGLAS.md), [COMPANY_OS](../../Organization/COMPANY_OS.md). El [AGENTS de Pro](../AGENTS.md) exige documentación Expo v56 antes de escribir código, aunque package.json declara Expo57. No resolver esa diferencia cambiando versiones por inferencia.

## 2. Qué está decidido y qué sigue abierto

| Tema | Dirección humana y estado |
|---|---|
| Fase | El usuario aclaró expresamente: discovery; no implementar todavía. Se pidió completar planificación y una segunda revisión de omisiones, realizadas en este chat. |
| Separación de desarrollo | Dirección más reciente: copia separada de Pro para Online; transferencia documental autorizada. Ruta y separación Git aún no verificadas. |
| Juegos | Discovery previo: Domino primero; Poker y Blackjack posteriores. Petición más reciente menciona dominó y póker para Online. No decide simultaneidad del MVP, variante nueva ni exclusión definitiva de Blackjack. Reconcilia el alcance con el usuario antes de implementar. |
| Distribución | Dirección previa: update de la misma app existente, no nueva ficha. Separar el checkout no decide cambiar package/bundle, cuenta de tienda ni estrategia de distribución. Confirmar si esa intención se mantiene. |
| Producto | Orientación previa: app gratuita, membresía para online, cupo incluido de invitados gratuitos por uno o varios días. La copia nueva no ratifica ni sustituye automáticamente estas políticas. Precio, cupo, duración, algoritmo y planes pendientes. |
| Proveedor | Firebase puro, Cloudflare con Firebase Auth y Colyseus evaluados; ninguno seleccionado por el usuario. Recomendación técnica evolucionó de Firebase para MVP por turnos a Cloudflare por sala ante plataforma de varios juegos. RevenueCat recomendado para evaluación, no elegido. |
| Invitación | Personas con/sin app; enlace, instalación y recuperación de invitación. Diferenciar entrada a sala y pase temporal. No existe este multiplayer en Pro. |
| Dinero | Fichas actuales virtuales. No hay autorización ni requisito de apuestas de dinero real. Membresía de acceso es independiente del saldo del juego. |

Las recomendaciones de este documento son propuestas pendientes. La petición de copiar/transferir no autoriza desplegar, crear productos de suscripción, vender pases, usar infraestructura productiva ni implementar Online.

## 3. Base funcional y arquitectura comprobada en Pro

Inspección de fuente el 2026-10-08; no nueva ejecución de producto, backend o dispositivo.

| Área | Archivos y realidad observada |
|---|---|
| App y navegación | [App.tsx](../App.tsx), [NavContext](../src/nav/NavContext.tsx). Rutas home/newMatch/game/computerGame/pokerLobby/blackjackLobby/blackjackTable/history/stats/settings/watch/watchHistory/howto/privacy. `computerGame` monta TableScreen, que alterna Domino/Poker mediante TableGameContext; Poker no tiene ruta de mesa independiente. No Expo Router declarado. |
| Domino local | [engine](../src/computer/engine.ts), [ComputerGameContext](../src/computer/ComputerGameContext.tsx), [ComputerGameScreen](../src/screens/ComputerGameScreen.tsx), [usePresentedTurn](../src/computer/usePresentedTurn.ts). Doble seis, dos jugadores, siete fichas iniciales, pozo, puntos/victorias. Turnos `human/computer`; partida en memoria React y IA local. |
| Poker local | [engine](../src/poker/engine.ts), [TableGameContext](../src/poker/TableGameContext.tsx), [PokerScreen](../src/poker/PokerScreen.tsx), [CardGameLobby](../src/poker/CardGameLobby.tsx). Heads-up no-limit Hold'em, dos asientos humano/computadora, ciegas, calles, fold/check/call/raise, evaluación y liquidación virtual. Lobbies son preparación local, no salas de red. |
| Blackjack local | [engine](../src/blackjack/engine.ts), [session](../src/blackjack/session.ts), [context](../src/blackjack/BlackjackContext.tsx), [pantalla](../src/blackjack/BlackjackScreen.tsx). Jugador/dealer, S17, natural3:2, pago1:1, hit/stand/double, Repeat prepara y Deal reparte; sin split/insurance. La [nota Blackjack](BLACKJACK.md) contiene fases antiguas superadas: contrastar fuente actual. |
| Marcador y persistencia | [GameContext](../src/state/GameContext.tsx), [types](../src/types.ts), [storage](../src/storage/storage.ts). Match/Team/Round para anotación, historial y preferencias en AsyncStorage. No confundir este Match con el estado de manos de Play. Persistencia del marcador no demuestra recuperación de partida de cartas tras cerrar proceso. |
| Red existente | [firebase](../src/firebase/firebase.ts), [sync](../src/firebase/sync.ts), [Watch](../src/screens/WatchScreen.tsx), [WatchHistory](../src/screens/WatchHistoryScreen.tsx). Firebase JS Auth anónima persistida y Firestore; comparte marcador `games/{code}` e historial `historySpaces`, con control de anotación. No motor autoritativo remoto ni matchmaking de manos verificados. |
| Enlaces | [links](../src/config/links.ts), [join](join/index.html), App.tsx: entrada por código abre Watch, no asiento jugable. Página intenta esquema custom y ofrece/redirige a tiendas. No evidencia de recuperación post-install. |
| Hosting | [wrangler](../wrangler.jsonc): directorio assets=docs. No Durable Object ni servidor de partidas configurado allí. |
| Dependencias | [package](../package.json): Expo ^57.0.26, RN0.86.3, React19.2.3, Firebase ^12.14.0, TypeScript ~6.0.3. Son declaraciones, no certificación de compatibilidad con futuros SDKs. |

Identidad heredable de [app.json](../app.json): nombre Domino Social Club, iOS bundle y Android package `com.yht.dominoparty`, esquema `dominoparty`, versión1.0.13, build iOS12/versionCode26. Links locales apuntan a Apple ID6793746031 y package Android indicado. No se verificó estado/precio/versión/signing de tiendas. No alterar identidades ni reutilizar números para una release sin comprobar consolas.

No reproducir credenciales, claves de firma, tokens, datos de usuarios, archivos de entorno privados ni configuración sensible en el traspaso. Las referencias a configuración sirven para detectar conexiones heredadas, no para autorizar uso.

## 4. Comportamientos y decisiones de Pro a preservar como referencia

- Domino D-047/freeze2026-10-03 y freeze global renovado2026-10-07: Pro completo congelado; excepciones históricas no reabren cambios futuros. [Registro histórico](DECISIONES.md).
- Apertura D-052: mayor doble determina quién empieza; solo sin dobles, mayor suma y desempate por extremo mayor. Quien obtiene salida puede jugar cualquier ficha. Ronda posterior conserva prioridad del ganador según motor. IA D-055 utiliza mano propia y cadena pública, no información oculta.
- Avatar abre selector del rival (D-049); audio confirmado históricamente, contacto asociado al aterrizaje, música/silencio y movimiento reducido. Recursos, procedencia y licencias existentes deben conservarse; no inventar autorización para sustituciones.
- Poker: Clear/Confirm y autoconfirmación de3s; preservar saldos, reglas de all-in y rebuy virtual, privacidad visual y puntos amarillos discretos de cartas de combinación ganadora. Mesa plana, sin restaurar gesto de inclinación histórico.
- Resultados actuales: Poker3s, Domino3s, Blackjack2s. [Hold](../src/components/ResultHoldButton.tsx) y [timer](../src/components/useHeldResultTimer.ts) pausan mientras se mantiene; soltar retoma restante y retira botón en ese resultado. Son políticas locales: NO trasladar como pausa unilateral del reloj online.
- Blackjack mantiene próxima apuesta manual, sin Deal automático. Liquidación única independiente de animación/recogida. [Session](../src/blackjack/session.ts).
- Tracking: setup/apariencia/edición, Rounds0 solo partida vacía, pivote del dial y Back documentados al cierre. Online no autoriza modificar Pro ni eliminar funciones heredadas de la copia por inferencia.

La conservación de comportamiento offline es requisito propuesto para la evolución, no promesa de compatibilidad online ya demostrada. Componentes compartidos exigen regresiones; evitar abstraer todo anticipadamente.

## 5. Evidencia fechada y límites

- [CONTEXTO](CONTEXTO.md), cierre2026-10-07: suite387/387 y TypeScript con pila ampliada `node --stack_size=4096 node_modules/typescript/bin/tsc --noEmit`, logs en `.release-audit`. Son resultados registrados; no rerun en este traspaso. El compilador ordinario había desbordado pila: no heredar “tsc normal pasa”.
- Usuario reportó pruebas satisfactorias en teléfono del candidato; no hay matriz/casos/OS completos. No atribuir a Online ese reporte.
- APK local de candidato a1af46e compilado y estructura/firma de prueba/bundle/assets verificados según continuidad. Firma AndroidDebug no es firma de tienda; puede no actualizar instalación firmada diferente. Instalación/ejecución offline del APK nuevo seguían pendientes en último bloque registrado.
- Push de cierre consta en CONTEXTO2026-10-08 con comprobación remota de aquella sesión. Hoy solo HEAD/estado local; no verificar remoto por una ref local ni afirmar store release.
- [Candidato2026-10-01](CANDIDATE_2026-10-01.md) y [handoff1.0.13](RELEASE_1.0.13_HANDOFF.md) son historia preservada, no estado vivo. README y notas iniciales pueden describir datos solo locales o reglas antiguas; la fuente actual incluye Firebase, Poker y Blackjack ampliados.
- Procesos Expo, IP, QR y puertos históricos caducan. No reiniciar ni adoptar Metro del origen desde la copia; comprobar raíz y puertos cuando una prueba esté autorizada.

## 6. Discovery online acumulado: especificación propuesta

### Autoridad, datos y protocolo

Servidor reparte con aleatoriedad segura, valida identidad/asiento/turno/acción/reglas y liquida resultados. Teléfono envía intención, no estado o saldo autoritativo. Asientos estables, versiones de protocolo/reglas y manos separadas por jugador.

No enviar ambas manos, orden del pozo/deck/burned, semilla ni eventos privados. En Domino `stockSlots` usa IDs reales y `last` puede contener ficha robada: sustituir por posiciones opacas y vistas filtradas en futuro Online. Revelación de manos al terminar aún pendiente. En Poker preservar chips virtuales y liquidación idempotente; Blackjack futuro necesita definir mesa/dealer compartidos.

Comandos con ID único, room/match/round, revisión esperada y payload validado; identidad deriva de sesión. ACK/error explícito, secuencia de eventos, deduplicación y snapshot tras reconexión. Persistir antes de confirmar. Reintento tras conexión perdida no repite colocación, cobro, sonido ni celebración. Animaciones locales; inicialmente confirmación de servidor, sin predicción especulativa.

Estados sala: espera/preparados/juego/resultado/siguiente ronda/final, más cancelación y recuperación. Plazos de turno, gracia, abandono, revancha y readiness pendientes. Reloj servidor; abrir Settings/background/Hold no congela al rival. Caída del backend debe distinguirse de abandono voluntario. Una partida activa/cuenta y controlador/asiento son recomendaciones, no decisiones aprobadas.

### Identidad, invitaciones y acceso

Cuenta recuperable para miembros/invitados propuesta; vincular identidad anónima sin perder compras o historial. Definir conflictos, cambio de cuenta, reinstalación, restauración y uso iOS/Android. Eliminar cuenta no cancela automáticamente suscripción de tienda.

Enlace sala y entitlement/pase son permisos distintos. Emisión exige miembro/cupo; token no adivinable, hash, canje atómico/idempotente y asociado a usuario. Expiración de aceptación distinta de expiración de acceso. Abrir/previsualizar enlace NO canjea. Una única autoridad de presupuesto; operaciones recuperables entre servicio de acceso y sala, sin contadores independientes en dos proveedores.

Pendientes: días/24h/calendario, inicio del pase, renovar/acumular cupo, reservar al emitir o consumir al aceptar, cancelaciones, reenvío, invitado con solo patrocinador o cualquier miembro, patrocinador expira, abuso multicuenta/reinstalación. Propuesta: terminar partida iniciada ante expiración ordinaria con límite máximo y bloquear nuevas; revocación/fraude política separada.

Universal Links/App Links y página web de descarga propuestos; recuperación determinista con invitación ligada a cuenta cuando procede, volver a tocar enlace o código alternativo. No prometer deferred linking automático tras tienda. Android Install Referrer puede complementar; iOS exige alternativa fiable. Firebase Dynamic Links cerrado2025-08-25. Si sala expira durante instalación, responder claramente y conservar pase válido según política.

### Opciones técnicas y monetización

| Opción | Tradeoff evaluado, no selección |
|---|---|
| Firebase Auth/Functions/Firestore | Menor número de nuevos proveedores respecto fuente; transacciones, suscripciones y servidor por acción. Construir autoridad, privacidad, presencia y deadlines. Firestore presencia no nativa. |
| Workers/Durable Object por sala + Firebase Auth | Candidato recomendado posteriormente para varios juegos/WebSocket. Persistencia, protocolo, validación tokens, ubicación/latencia, operación y reconciliación de acceso por construir. No benchmark ni presupuesto probado. |
| Colyseus/Node | Salas/sync/reconexión/vistas aportadas por framework; reglas, persistencia y despliegue/escalado por resolver. Compatibilidad exacta RN/Expo por probar. |
| Billing nativo + backend propio | Mayor control; implementar validación Apple/Google, eventos, restauración y conciliación. |
| Billing nativo + RevenueCat | Candidato recomendado para reducir mantenimiento; añade proveedor/costo. App no recibe números de tarjeta; tarjetas pueden pagar a través de cuenta de tienda. |
| Stripe/cobro directo | Solo evaluar mercados/programas admisibles; no permiso global ni evasión de IAP. Checkout alojado es opción técnica condicionada. |

Estados de compra: pending/active/canceled con vigencia/grace/hold/expired/revoked. Validación server-side, reconocimiento Play, notificaciones autenticadas y deduplicadas, sandbox separado y reconciliación. No conceder premium por flag del cliente. Permisos almacenados con vigencia acotada; no depender de llamada a billing en cada jugada.

Apple IAP para features digitales y restricciones de códigos propios: patrocinio gratuito NO garantiza revisión favorable. Evaluar promoción oficial o flujo aceptable; no declarar aprobado voucher por horas/días. Google programas y ofertas tienen condiciones regionales. No precios, planes ni legalidad global acordados. Horas se exploraron antes; última orientación fue días y cupo.

Dirección histórica update misma app: contratos/pagos/impuestos, grupo subscriptions Apple y base plans/offers Play, textos localizados, restore/manage/terms/privacy/renovación, primera suscripción Apple con versión, revisión y testers. Cuenta recuperable implica deletion; backend/SDKs requieren App Privacy/Data Safety y revisión de edad/abuso. Builds nativas para billing/enlaces; Expo Go solo preview simulado de RevenueCat. No reutilizar firma de prueba ni versionCode por una nota local.

### Calidad, operación y evolución

Probar reglas y privacidad de payload, jugadas inválidas/concurrentes/duplicadas, canje concurrente del último cupo, compras/restore/gracia/revocación, dispositivosAndroid/iOS, redes distintas/WiFi-datos/background/cierre, reinicio servidor y recuperación, instalación desde invitación, upgrade conservando datos, clientes de versiones distintas, accesibilidad/ES-EN y regresiones offline.

Separar entornos y datos; secrets solo servidor; rate limits, sesión expirada, connection takeover, nombres/perfiles/reportar/bloquear, admin con permisos/auditoría y retención definida. Backend autoritativo no elimina colusión. Logs no revelan manos/tokens. Soporte debe diagnosticar compra sin acceso, canje/cupo, cuentas y partidas interrumpidas.

Métricas: creación/unión, ACK/latencia, reconexión/errores, consumo por partida y patrocinador incluyendo invitados, emisión/canje/expiración y errores billing. Ubicación de sala no garantiza cercanía a ambos usuarios. Definir capacidad, alertas/presupuesto, backups/restauración, incidentes neutrales, protocolo/migraciones compatibles y rollback sin invalidar partidas. Sin precio ni esfuerzo inventado: modelar usuarios/concurrencia/sesiones/acciones/retención más billing/comisiones/impuestos/reembolsos/soporte.

Fases propuestas: decisiones discovery -> contratos/matriz fallos -> prueba técnica autorizada -> MVP acordado -> membresía/invitaciones -> piloto con red/dispositivos/costos -> release autorizada -> juegos posteriores. No iniciar ninguna por este documento.

## 7. Segunda revisión: omisiones incorporadas

Se añadió en revisión: atomicidad de cupo entre servicios; bots previsualizando enlaces; restore en otra cuenta; delete no cancela cobro; Hold/background; replay sin efectos duplicados; instalación más lenta que sala; versiones/clientes/rollback; diferencia outage/abandono; ubicación real del servidor; cupo no implica uso ilimitado; semántica futura Blackjack. Son hallazgos de diseño, no bugs online reproducidos ni soluciones implementadas.

## 8. Checklist para recibir la copia sin contaminar Pro

1. Confirmar nombre y ruta absoluta del destino, finalización de copia y alcance de acceso. No deducirlos de los nombres hablados. Registrar el proyecto si el usuario lo pide; no crear otro por inferencia.
2. Comprobar raíz Git, rama/HEAD, diffs/untracked y contenidos de motores/assets/lockfile frente a la fuente indicada. Identificar si se copió `.git`, si comparte gitdir/worktree o si conserva `origin` de Pro. No hacer push, borrar historia ni resetear nada para separar.
3. Revisar AGENTS heredado y reglas organizativas con autorización del destino. Conservar freeze de Pro como procedencia; no asumir que copiar AGENTS autoriza modificar Online ni que una regla cambia en todas las máquinas.
4. Inicializar CONTEXTO/DECISIONES propios distinguiendo baseline importado de hechos observados en Online. Conservar historia de Pro como referencia fechada, sin presentar sus pruebas/releases/permisos como del proyecto nuevo ni sobrescribir documentos históricos sin revisión.
5. Inventariar referencias a servicios/IDs/dominios/configuración heredados sin imprimir secretos. Evitar escrituras accidentales a Firebase/hosting/tiendas de Pro; decidir aislamiento dev/test antes de ejecutar flujos con red. Copiar archivos no separa servicios, usuarios ni credenciales.
6. Si no recibió este documento por haber empezado la copia antes de crearlo, transferirlo después de identificar destino y confirmar permiso/ruta. Verificar enlaces relativos en la copia; nunca afirmar que ya llegó.
7. Confirmar distribución misma app o distinta, monetización, proveedor y MVP Domino/Poker. Ninguno se resuelve por cambiar el nombre del directorio.
8. Obtener autorización explícita de implementación scoped para Online antes de código/deps/config. Servicios, compras y publicación conservan alcance propio. Revalidar documentación Expo y compatibilidad SDK; puertos/procesos separados cuando se autoricen pruebas. No alterar Pro congelado.

## 9. Fuentes primarias del discovery

Consultadas durante2026-10-07/08; enlaces para revalidar antes de implementar. No verificación de cuentas privadas, eligibility ni pricing contractual. No copiar estimaciones antiguas como presupuesto.

- [Expo v56 exacta](https://docs.expo.dev/versions/v56.0.0/), [Firebase Expo](https://docs.expo.dev/guides/using-firebase/), [IAP Expo](https://docs.expo.dev/guides/in-app-purchases/).
- [Cloudflare WebSocket/hibernación](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [ubicación](https://developers.cloudflare.com/durable-objects/reference/data-location/), [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
- [Firebase transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [privacidad documentos](https://firebase.google.com/docs/firestore/security/rules-fields), [presence](https://firebase.google.com/docs/firestore/solutions/presence), [tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [link accounts](https://firebase.google.com/docs/auth/web/account-linking).
- [Colyseus](https://docs.colyseus.io/), [state views](https://docs.colyseus.io/state/view), [reconnection](https://docs.colyseus.io/room/reconnection), [scaling](https://docs.colyseus.io/scalability).
- [Universal Links](https://docs.expo.dev/linking/ios-universal-links/), [App Links](https://docs.expo.dev/linking/android-app-links/), [Install Referrer](https://developer.android.com/google/play/installreferrer), [Dynamic Links cierre](https://firebase.google.com/support/dynamic-links-faq).
- [Apple Review](https://developer.apple.com/app-store/review/guidelines/), [subscriptions](https://developer.apple.com/app-store/subscriptions/), [offer codes](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes), [primer IAP](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase), [agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements).
- [Google Payments](https://support.google.com/googleplay/android-developer/answer/9858738), [subscriptions](https://support.google.com/googleplay/android-developer/answer/140504), [promotions](https://support.google.com/googleplay/android-developer/answer/6321495), [lifecycle](https://developer.android.com/google/play/billing/lifecycle/subscriptions), [security](https://developer.android.com/google/play/billing/security), [regional billing](https://support.google.com/googleplay/android-developer/answer/17161464).
- [RevenueCat Expo](https://www.revenuecat.com/docs/getting-started/installation/expo), [identidad](https://www.revenuecat.com/docs/customers/identifying-customers), [webhooks](https://www.revenuecat.com/docs/integrations/webhooks), [pricing](https://www.revenuecat.com/pricing), [Stripe Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions).
- [Apple privacy](https://developer.apple.com/app-store/app-privacy-details/), [Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469), [Apple deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion), [Play deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight), [Play tests](https://developer.android.com/google/play/billing/test).

## 10. Estado de entrega

Documento generado en Pro; revisar con el usuario antes de adoptar decisiones en Online. Destino pendiente: no registro verificado, no copia recibida/validada, no implementación. Pro conserva código congelado y esta adición documental queda sin commit/push. Próximo paso: identificar la copia y realizar el checklist de recepción autorizado.
