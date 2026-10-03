# Contexto del proyecto

Actualizado: 2026-10-02 (America/New_York).
Proyecto: Domino Social Club, repositorio `C:\Development\Dominos Codex Pro`.

## Objetivo

Mantener el candidato de la mesa individual y su comportamiento aprobado, y preparar la próxima evaluación iOS/App Store cuando el usuario indique ese trabajo. Esta sesión configura continuidad documental aislada por proyecto y un patrón global de trabajo, sin cambiar código.

## Estado actual comprobado

- Rama local `master`, HEAD `10f58b13266404685165cee8fc6466d07be1d447` (candidato del 2026-10-01). Antes de configurar continuidad el árbol estaba limpio. Al guardar contexto ahora: `AGENTS.md` modificado y `docs/CONTEXTO.md` y `docs/DECISIONES.md` nuevos sin seguimiento; no hay cambios de código. HEAD y la referencia local `origin/master` coinciden (0/0). No se consultó el remoto en vivo hoy. El push fue confirmado en la sesión anterior.
- [package.json](../package.json) declara Expo `^57.0.26`; [app.json](../app.json) conserva versión `1.0.13`, build iOS `12` y versionCode Android `26`. La instrucción existente de consultar Expo v56 antes de escribir código sigue en [AGENTS.md](../AGENTS.md); no implica cambiar la versión instalada.
- El audio activo Madera cálida, muestra 12, conserva hoy el SHA-256 `df7dda04356c60a21effa475e5e3a3ae074b36149a281917f59fb0efcba8f035`. Véase [procedencia](../assets/sounds/tile-contact-plastic-warm-v3.provenance.txt).
- En la inspección inicial no se encontraron convenciones CompanyOS. Posteriormente el usuario estableció la fuente organizativa en [Organization](../../Organization/README.md); las reglas comunes se consultan allí, sin trasladar el contexto de Domino.

## Completado y comprobado

El [candidato del 2026-10-01](CANDIDATE_2026-10-01.md) es la referencia de alcance y pruebas: pozo animado con huecos estables, preferencias persistentes, sonido único al aterrizar, preparación inicial silenciosa Android, celebración sin recorte y Next round sin interceptación táctil. Incluye la eliminación del regalo automático de victoria, manteniendo las bebidas manuales.

Evidencia histórica de ese checkpoint: 107 pruebas automatizadas aprobadas, TypeScript correcto, prueba de navegador R1 → R2 conservando 6–0 y confirmación del usuario de que la primera ficha Android ya se oye. Las pruebas nativas simuladas y el avance del reproductor no prueban audibilidad. No se volvieron a ejecutar pruebas de producto en esta sesión documental.

Configuración del 2026-10-02: instrucciones de inicio/cierre en AGENTS.md, este estado y [registro de decisiones y resúmenes Doti](DECISIONES.md). Son cambios documentales locales; no se ha creado commit ni push para ellos en esta sesión.

La configuración documental se aplicó a Domino y el patrón general se añadió a `C:\Users\yunie\.codex\AGENTS.md`, conservando la regla Cyber. No se recorrieron ni modificaron otros proyectos. D-006 aprueba aplicar el patrón al trabajar en cada uno; no afirma que sus documentos ya estén configurados. La rutina propuesta por el usuario es preparar el resumen en Doti, pegarlo en Codex para integrarlo y pedir «Guarda contexto» antes de cerrar. No se ha verificado transferencia directa ni sincronización automática.

## Pendientes

- Evaluar iOS y distribución antes de considerar cualquier envío; dispositivos, credenciales y disponibilidad para esa prueba no comprobados hoy.
- Verificar requisitos actuales de tienda, firma y numeración al autorizarse una release. Los números guardados no prueban que sean reutilizables.
- Incorporar resúmenes Doti cuando el usuario los pegue; ninguno recibido para este proceso. La propuesta de rutina queda registrada en DECISIONES.md.
- Comprobar la carga de las instrucciones globales y locales desde un chat nuevo. Los documentos de otros proyectos se revisarán únicamente al trabajar en ellos (D-006).
- Revisar el README general cuando se autorice actualizarlo: su descripción de datos solo locales no cubre el flujo Firebase descrito en la entrega histórica. No usarlo como prueba de arquitectura completa.

## Bloqueos y desconocidos

No hay bloqueo para leer o continuar el código. No hay evidencia de validación iOS/App Store de este candidato ni comprobación actual del estado de las tiendas. La [entrega 1.0.13](RELEASE_1.0.13_HANDOFF.md) es histórica; sus estados de revisión no representan el presente. Estado de Metro, red e IP actual: no comprobado hoy.

## Próximo paso y cómo retomar

La revisión de solo lectura del chat nuevo se completó: rama, HEAD, cambios documentales, audio y versiones coincidieron; se señalaron README desactualizado y diferencia entre Expo declarado y documentación exigida. Para verificar ahora el patrón ampliado, abrir otro chat nuevo en el mismo proyecto local Domino con la petición explícita de leer AGENTS.md y estos documentos y contrastarlos con el repositorio, sin modificar archivos, commit ni push. Debe informar dónde quedamos, completado, decisiones pendientes, próximo paso y discrepancias. Esta revisión de solo lectura está autorizada por el usuario; no autoriza implementación. Después, comprobar el alcance de cualquier nueva petición. Si se solicita probar la app, seguir «Retomar mañana» en la nota del candidato: reutilizar Metro si está activo o ejecutar `npx expo start --go --lan --port 8092`, usando el QR de la sesión y la misma red. No prometer vigencia de un QR anterior. La continuidad documental no autoriza iniciar una publicación.

## Cierre y verificación documental

En este bloque se actualizaron AGENTS.md, CONTEXTO.md y DECISIONES.md sobre los cambios locales existentes. Se preservan README, CLAUDE.md, la instrucción Expo y notas de release/candidato. También se amplió el AGENTS.md global con solo instrucciones de trabajo, conservando Cyber; no contiene estado ni decisiones de Domino. Se verificaron enlaces locales y ambos git diff --check. Los cambios siguen en disco, sin commit ni push; no se repitieron pruebas de producto.

## Alcance del entorno y patrón global (2026-10-02)

- Raíz Git y proyecto abierto: `C:\Development\Dominos Codex Pro`; rama `master`, HEAD `10f58b1`. La lectura del repositorio y del archivo global fue comprobada. No se inventarió el acceso a otros repositorios ni se recorrieron sus carpetas.
- El entorno declara lectura amplia del sistema de archivos, sujeta a permisos reales, y escritura ordinaria en este proyecto y en la carpeta de visualizaciones de esta sesión (`C:\Users\yunie\.codex\visualizations\2026\10\02\01a0fd42-69d0-7382-8114-31d495f71bfc`). Las áreas protegidas, incluida `.git`, y otros destinos requieren los permisos correspondientes. Git advierte que no puede leer el archivo global de exclusiones; no se cambió su configuración.
- `CODEX_HOME` no está definido en el proceso consultado. Existe el archivo global predeterminado `C:\Users\yunie\.codex\AGENTS.md`; no se encontró `AGENTS.override.md` global. Su escritura pasó la revisión de permisos y se verificó leyendo el resultado. El entorno volvió a cargar el bloque actualizado en este chat.
- El mecanismo global está documentado en la [guía oficial de AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md). Su alcance son sesiones de Codex que carguen ese perfil, sujeto a instrucciones más específicas; no garantiza propagación a otras máquinas, perfiles, chats de Doti o aplicaciones. No es sincronización ni servicio de guardado. La memoria de continuidad de Domino permanece en estos documentos; no se cambiaron almacenes de memoria del producto ni sus opciones.

## Referencia organizativa actualizada (2026-10-02)

La fuente común ahora es [Company OS](../../Organization/COMPANY_OS.md) y [REGLAS.md](../../Organization/REGLAS.md). El archivo global de Codex pasó de contener las reglas a referenciarlas; las menciones anteriores a su contenido describen el paso previo. Esta actualización solo cambia la ubicación de consulta: el estado, las decisiones y la documentación de Domino permanecen aquí. No se cambió código ni se hizo commit o push.

## Prueba de arranque Android — 2026-10-03

Se inició Expo Go LAN en puerto 8092 para mostrar el QR. El usuario reportó «Failed to download remote update». La comprobación local reprodujo HTTP 500 al solicitar el manifiesto Android aunque `/status` respondía activo. Tras detener esa instancia y reiniciar Expo con acceso de red fuera del sandbox, manifiesto y bundle Android respondieron HTTP 200 (bundle de 8 445 307 bytes). Esto verifica la descarga desde la computadora; queda pendiente confirmar carga en el teléfono. No se aisló la causa interna exacta del 500. No se modificó código ni permisos del sistema, ni se hizo commit/push. QR local excluido en `.release-audit/expo-qr-2026-10-03.png`; su dirección solo es válida mientras esta sesión/red siga activa. Próximo paso: reescanear el QR con Expo Go en la misma red.
## Audio de mesa — 2026-10-03

El usuario confirmó que la app abrió en el teléfono tras reiniciar Metro. Después aprobó sustituir el sonido sintético por la opción 3 de Pixabay (D-007). Se añadió assets/sounds/tile-contact-real-table.wav y su archivo de procedencia; sounds.ts y el mock de contactPlayback.test.mjs apuntan a ese recurso. La lógica de aterrizaje, silencio y preparación Android permanece. Se recortó el primer impacto y se ajustó su nivel; falta comprobar la preferencia auditiva del resultado en el teléfono. Quince pruebas con mocks de contacto/apertura aprobadas; no equivalen a audibilidad física. TypeScript y diff se verifican al cierre. Sin commit/push. Los datos anteriores de Madera cálida describen el checkpoint histórico, ya no el audio activo. Próximo paso: recargar Expo Go y escuchar una colocación; elegir por separado el sonido del reparto. Referencias de búsqueda: https://freesound.org/people/UnycodeAdmin/sounds/705349/ y https://freesound.org/people/UnycodeAdmin/sounds/705348/ .
Corrección del mismo bloque: el usuario reportó silencio. Se comprobó que la primera exportación WAV tenía pico y RMS cero; las pruebas con mocks no examinaban el contenido del recurso. Se regeneró desde el PCM completo, aplicando recorte antes del fade. Pico actual 18990/32768, duración 0.425 s, sin clipping. Se añadió contactAsset.test.mjs para detectar WAV silencioso/ataque ausente; pasó. El hash servido por Metro coincide con el archivo corregido. Pendiente confirmación auditiva física tras recarga; no afirmar que el avance del reproductor la sustituye.

Ajuste posterior D-008: a petición del usuario, se sustituyó la adaptación por un recorte PCM directo del original (0.500–1.100 s), manteniendo estéreo/24000 Hz y nivel original, sin fades. Test del recurso aprobado; pendiente preferencia auditiva en teléfono. Las cifras de ganancia y mono anteriores son históricas.

Seguimiento 2026-10-03: el usuario sigue percibiendo el audio anterior en telefono y cuestiona tambien el sample. Para descartar cache se copio el mismo PCM a tile-contact-original-pixabay-v2.wav y se actualizaron sounds.ts y tests; 8 pruebas de recurso/playback aprobadas, recarga de Metro solicitada. No hay confirmacion fisica ni causa de cache demostrada. Se volvio a presentar el recorte para comparar. Poker registrado como propuesta P-004, pendiente definir variante; sin implementacion. Sin commit/push.

Audio D-009: recurso nuevo con tramo original 7.430-8.050 s, stereo 24000Hz sin ganancia/fade. Igualdad PCM con origen comprobada; ocho pruebas recurso/playback pasan. Conserva todos los transitorios de ese tramo en una reproduccion. Pendiente confirmar que es el golpe buscado y audibilidad en telefono; sin commit/push.

Correccion definitiva de limites pendiente de oido del usuario: al analizar el primer golpe se encontro contacto suave a 0.400s y fuerte a 0.540s; el recorte anterior desde 0.500s omitia el primero. Nuevo recurso tile-contact-original-complete-v4.wav conserva PCM 0.380-1.100s intacto. Ocho tests pasan. Metro sirve bytes iguales al archivo local. Recarga remota no llego porque no habia telefonos conectados; abrir de nuevo Expo Go para probar. Sin confirmacion auditiva fisica.

Usuario confirma por voz que v4 suena bien en telefono. Solicita analizar segundo golpe, sin sustitucion todavia. Preview .release-audit/domino-second-complete.wav conserva PCM original 2.20-3.00s: pequeno transitorio a 2.23s, contactos a 2.36/2.38s y otro a 2.45s. Sin procesamiento. App mantiene primer golpe v4; pendiente comparacion del usuario.

D-011 aplicado: sounds.ts y tests apuntan a segundo golpe v5. Ocho tests aprobados; servido por Metro con hash igual al local; recarga solicitada. Falta confirmacion fisica de esta variante. Primer golpe conservado para posible propuesta P-005 de impacto final mas contundente; sin cambios a celebracion. Sin commit/push.

D-012 implementado: sounds.ts selecciona reproductor final separado cuando contexto winning=true, reutiliza callback de aterrizaje existente y respeta silencio. Nuevo recurso y procedencia final-first-v1. Prueba de seleccion fallo antes y pasa despues; 25 tests de audio/apertura/ultima ficha pasan. Sin commit/push. Pendiente escuchar ultima ficha ganadora en telefono; mocks no confirman audibilidad ni sincronizacion fisica.

Cuatro variantes originales implementadas con seleccion aleatoria y reproductores reutilizados; preparacion Android recuerda cada reproductor preparado. Recortes PCM contrastados byte a byte con fuente decodificada. 29 tests aprobados (recursos, seleccion aleatoria controlada, apertura y ultima ficha); TypeScript aprobado. Ultima ficha confirmada por usuario; pendiente oir variedad aleatoria en telefono. Recursos cycle-1..4 y procedencias, sounds.ts y tests modificados; sin commit/push.

Reparto inicial D-014: RoundDeal.tsx anima cada ficha desde lateral izquierdo a manos humana/rival; stockSlots identifica ronda para no repetir al retomar. ComputerGameScreen bloquea turno humano/CPU durante reparto y muestra Repartiendo fichas. Interrupcion por fondo/modal detiene sonido y deja manos asentadas. Movimiento reducido omite desplazamiento. round-deal-v1.wav es mezcla de 14 contactos con llegadas escalonadas, procedencia adjunta. sounds.ts tiene reproduccion cancelable independiente. 45 tests pasan y TypeScript aprobado; no verificado visualmente en telefono. Sonidos aleatorios y ultima ficha ya confirmados por usuario. Sin commit/push.

Cierre solicitado antes de poker (2026-10-03): usuario acepta dejar reparto actual; archivos guardados en disco. Copia local .release-audit/domino-checkpoint-2026-10-03.zip conserva cambios y audios/previews antes de poker (no repositorio completo). 45 tests y TypeScript aprobados; no commit/push. Autorizado comenzar Texas Hold'em sin limite contra rival virtual reutilizando mesa/personajes, saldo virtual y selector de modo; no dinero real ni online acordados.

## Poker jugable — 2026-10-03

Guardado bloque Domino y respaldo local antes de Poker. Primera mesa Texas Hold’em implementada conforme D-015/D-016: motor puro, rival casual, dealer visual nuevo, misma mesa/avatars, cartas animadas, apuestas no-limit, selector con confirmacion y estados separados en memoria. Se mantiene el audio aprobado de Domino. Archivos nuevos src/poker/*, assets/poker-dealer-v1.png y procedencia, docs/POKER.md; integracion App.tsx y ComputerGameScreen.tsx.

56 pruebas pasan (incluye 2000 manos variadas y 100 con rival), tsc y diff check pasan, Android bundle HTTP200. En navegador se verificaron pantallas 390x844/360x640, cancelar/cambiar, call/flop, all-in/showdown y preservacion al alternar. Corrigida repeticion de animacion al volver a Poker mediante estado de presentacion compartido. No se ha probado Poker fisicamente en telefono ni iOS/tiendas. Proximo paso: prueba del usuario en Expo Go, especialmente teclado, selector y reparto. Todo permanece sin commit/push. Ver POKER.md para detalles y referencias.

Ajuste visual solicitado: selector de regreso a Domino ahora usa abanico vectorial de cinco fichas marfil/dorado inspirado en social-club-logo.png. Confirmacion y estados sin cambios.

## Refinamiento visual de poker — 2026-10-03
Implementado por peticiones directas del usuario: abanico de domino y cartas con indices en selector; retratos de poker rel iluminados con transparencia (imagenes 2D, no modelos 3D); dealer completo sustituido por mano lateral con carta sostenida y gesto de liberacion; chips con colores y denominaciones; reversos rojos tramados. PokerScreen centra ambas manos independientemente de saldos laterales, mueve bote/fase/mano arriba a la derecha, separa turno de cartas y compacta acciones en una fila con RaiseWheel. Reinicio disponible desde reglas; quitado pie de texto solicitado. Domino conserva sus imagenes originales y sonidos aprobados.
Evidencia actual: tsc y 11 pruebas de motor/importe pasan; vista compacta en navegador muestra manos centradas, saldos laterales y textos separados. Gesto de mano sigue pendiente de evaluacion visual del usuario en telefono, al igual que legibilidad/tacto de controles compactos. No se afirma confirmacion fisica. Archivos src/poker/*, src/computer/opponents.ts, assets/opponent-depth-* y procedencias, assets/poker-dealing-hand-v1.*. Sin commit/push. Proximo paso: validar reparto, reversos y barra en Expo Go.

Ajuste posterior 2026-10-03: chips desplazados a 44px del lateral para quedar dentro del tapete; manos siguen centradas. Raise abre modal con importe editable, rueda, Cancelar y Confirmar; barra solo Fold, Check/Call, All-in, Raise. TypeScript y diff check pasan. Navegador confirma modal y bloqueo de confirmar importe cero; interaccion del usuario impidio verificar cancelacion en ese intento. Pendiente prueba fisica del teclado y gesto.

Dealer actualizado: poker-dealing-poses-v2.png contiene cuatro poses (agarre, descenso, liberacion, retirada), mezcladas por DealerHands con movimiento de muneca. Recurso generado con imagegen integrado y procedencia guardada. Es animacion 2D por poses, no rig 3D; naturalidad pendiente de inspeccion en movimiento y telefono. Panel superior comprimido para no invadir tapete. tsc/diff check aprobados.

Reparto dirigido: DealerHands ahora se ancla a cada carta humana/rival/comunitaria con retraso individual. Suelta a 28-52px del destino y 18px arriba; PlayingCard completa arco corto de 240ms. Solo cartas nuevas reciben gesto. Usuario aclara aproximacion y lanzamiento, no colocacion exacta. tsc y diff check pasan; naturalidad y alineacion final pendientes de telefono. Sin commit/push.

Pilas de chips 2026-10-03: saldos de ambos jugadores ahora muestran hasta tres pilas representativas con capas y denominaciones; importe numerico sigue siendo exacto. Posicion anclada a 12px a la izquierda de cada mano centrada, no al borde de pantalla. tsc/diff check pasan; navegador revisado antes del ultimo acercamiento. Sin commit/push.

Aviso rival: burbuja sobre zona del personaje durante 3.5 segundos para call/check/fold/raise, importe total en raise. Se limpia al siguiente movimiento humano o nueva mano; texto ES/EN y anuncio accesible. tsc/diff check pasan, pendiente confirmacion visual en telefono.

Panel bote horizontal: pilas compactas junto a importe; fase/mano debajo, ancho108. Captura navegador confirma panel por encima del borde del tapete y saldos junto a manos. tsc/diff check pasan. Aviso temporal rival implementado; pendiente validacion de usuario. Sin commit/push.

Reversos rival: usuario aclara cartas boca abajo, no chips. Margen blanco pasa de3px fijo a3.5% del ancho (min1px), contorno rojo0.5px; aumenta centro tramado. tsc/diff check pasan. Sin commit/push.

Combinacion ganadora: bestFive comparte evaluador y devuelve cinco cartas concretas; contorno/brillo dorado sutil al terminar showdown y reparto. Marca comunitarias y privadas del ganador; en empate union de ambas mejores manos; fold no revela ni marca. 11 tests de motor pasan incluyendo seleccion full house/escalera/mesa; tsc aprobado. Pendiente validacion visual en telefono.

Pista de mano actual: etiqueta sobre cartas humanas muestra categoria con cartas propias y comunitarias visibles; preflop pareja/sin pareja. Se oculta durante reparto y resultado para no anticipar revelacion ni duplicar ganador. tsc/diff check pasan; usa evaluador probado, no informacion rival.

Raise sin teclado: importe solo lectura, presets10/20/30/40/100 como total de calle y rueda custom; valores ilegales deshabilitados. Confirmacion final conserva validacion del motor. tsc/diff check pasan.

Raise: presets definitivos confirmados 5/10/20/50/100, manteniendo deshabilitados los totales ilegales.

Raise tipo cajero: sustituye presets y rueda por cinco filas5/10/20/50/100 con botones menos/mas que restan/suman ese paso al total mostrado solo lectura. Limites deshabilitan operaciones que exceden minimo/maximo. Sin custom swipe ni teclado. tsc y diff check pasan; pendiente prueba tactil.

Raise: filas menos/valor/mas centradas con valor de ancho52 y separacion6, manteniendo botones tactiles48x42. Ajuste solicitado para acercar controles al numero; sin cambios de logica.

Raise: importe acumulado solo lectura ahora junto a titulo Raise to/Subir a; eliminada fila independiente para compactar dialogo, por solicitud del usuario.

Raise: retirado texto explicativo Total bet for this street y rango visible por solicitud; conserva titulo/importe, filas menos/mas y Cancelar/Confirmar. Limites legales siguen activos.

Raise: ventana centrada limitada a290px, padding18 y gap14 para reducir espacio vacio lateral; adapta ancho a pantallas menores.

Raise: etiqueta de confirmacion abreviada a Confirm/Confirmar por solicitud del usuario.

Pista en vivo resaltada: combinationCards marca solo cartas de combinacion nombrada (pareja2, doble pareja4, trio3, poker4, escalera/color/full5, alta1). Se aplica a mano humana y comunitarias visibles, nunca privadas rivales; preflop solo pareja. Se oculta durante reparto. 12 tests motor y tsc pasan; diff check aprobado. Pendiente revision visual telefono.

Portada/entradas: retirado encabezado Play Computer; botones Play Dominoes, Play Poker y Play Blackjack. Watch/History en fila con texto una linea; Watch abreviado. Poker/Blackjack tienen CardGameLobby con cartas y estilo mesa. Poker permite nombre/rival/fichas iniciales500/1000/2000 solo antes de iniciar; configuracion conservada para reinicios. Blackjack es entrada informativa, motor no implementado. Navegador confirma navegacion Home a Poker y opciones; tsc/diff check pasan. Cartas humanas/centro ampliadas y palos SVG con posiciones/tamanos definidos para evitar overlap; texto turno18/accion14. Telefono pendiente.

Home: selector circular de temas movido de footer inferior derecho a overlay superior izquierdo; eliminada reserva inferior76 para liberar altura de opciones de juego. Scroll conserva padding inferior. tsc/diff check pasan; pendiente confirmacion telefono.

Dealer origen comun: ancla medida en centro del borde superior de mesa; cada mano calcula desplazamiento desde esa misma coordenada hacia su punto de liberacion y regresa al origen. Sustituye offsets laterales independientes. tsc/diff check pasan; pendiente revision animada en telefono. Home selector temas confirmado por usuario como muy bien.

Dealer: origen comun reubicado al lateral derecho de mesa, alineado verticalmente al centro de cartas comunitarias. Se mide desde esa fila para adaptarse a altura disponible; reemplaza borde superior. tsc/diff check pasan; pendiente prueba fisica.

Cartas: mano humana crece60px compacta/72 amplia; comunitarias limitadas a (ancho-80)/5 max72, dejando32px por lado con gaps incluidos para no pisar bordes. En pantallas estrechas prima cabida sobre aumento. tsc/diff check pasan; prueba fisica pendiente.

Ajustes recientes: comunitarias ajustadas por geometria del tapete con9px de margen; tableFit prueba anchos320-580. Rival movido al header derecho en Domino/Poker; dos selectores apilados izquierda incluyendo Blackjack con confirmacion hacia lobby pendiente. Textura vectorial sutil de papel en caras de cartas; tsc pasa. Busqueda de referencia de reparto: Pixabay Playing Cards Being Dealt27024 y Freesound423769, sin descarga ni integracion/aprobacion de audio.

Selectores juegos: Blackjack reemplaza letras sueltas por dos cartas A/J, Poker A/K; contenedores centrados50x34 y padding exterior4 evitan tocar borde. Abanico tambien contenido y centrado. tsc/diff check pasan.

Sonido poker aprobado e integrado: poker-card-deal-v1.wav recorte1.02-1.50s de Playing Cards Being Dealt Pixabay27024, PCM identico al tramo original decodificado; sin filtros/ganancia. DealerHands programa sonido por carta al soltar, respeta tileSound y cancela al interrumpir/desmontar. tsc/diff check pasan; falta confirmacion auditiva real. Selectores66px fondo semitransparente y etiqueta una linea. TableDrinkGift trasladado de posavasos izquierdo60/400 al derecho340/400.

Iconos diferenciados: Blackjack dos cartas A/J, Poker abanico tres Q/K/A, SVG centrado para evitar saltos de glifos. tsc/diff check pasan.

Correccion Android SVG: usuario reporta .55 invalid number or percentage al abrir Poker. Coincide con offset string de textura; reemplazados decimales string sin cero por props numericas en PlayingCard y TableGameContext. tsc/diff check pasan; pendiente reapertura telefono.

## Rigo — 2026-10-03
Avatar generado desde la foto indicada por el usuario, integrado en el catalogo compartido de Domino y Poker: [imagen](../assets/opponent-rigo-seated-v1.png), [procedencia y prompt](../assets/opponent-rigo-seated-v1.provenance.txt), src/computer/opponents.ts. Reutiliza seleccion, persistencia y reglas existentes. Prueba de restauracion de Rigo fallo antes de la integracion y pasa despues; 7 pruebas de preferencias, TypeScript y diff check pasan (advertencias existentes de React test renderer). Alpha real comprobado, servidor Expo y recurso PNG responden HTTP200 en 192.168.1.194:8092. Pendiente confirmar apariencia y seleccion en telefono; no hay poses propias para beber, usa fallback estatico como Alex. Siguiente paso: prueba fisica y completar poses de bebida si se requiere paridad con los cinco rivales animados. Cambios en disco sobre master/10f58b1, sin commit/push; cambios previos preservados.

### Rigo: bebidas completadas — 2026-10-03
Sustituye el pendiente de poses indicado arriba: generadas con imagegen 6 secuencias propias de 9 poses (54 PNG RGBA de700x400) para Nubo, Duna, Orbe, Milo, Margarita y Daiquiri. [Prompts/procedencia](../assets/opponent-drinks-v2/rigo/provenance.json). Registradas con scripts/generate-drink-frames.mjs; extraccion reproducible en scripts/extract-rigo-drink-frames.mjs. Rigo participa en ANIMATED_OPPONENTS y usa reposo propio alineado con sus poses; conserva invitacion, consumo tras victoria rival, reduccion de movimiento y cancelacion existentes. 19 pruebas de preferencias/bebidas/ciclo/recursos pasan, tsc y diff check pasan; Android bundle HTTP200 y pose05 de cada bebida HTTP200. Revisadas visualmente las seis hojas generadas y transparencia de poses; pendiente validacion animada en telefono, no equivale a confirmacion fisica. Sin commit/push. Proximo paso: elegir Rigo, invitar una bebida y observar su siguiente victoria.

### Bebida al lado de recogida — 2026-10-03
Tras prueba del usuario, TableDrinkGift vuelve al posavasos x60/400 (izquierda en pantalla, derecha anatomica del avatar), coincidente con las poses propias de Rigo y rivales animados. Antes estaba x340/400 por D-036. No se invierte la imagen; altura, entrada y consumo se conservan. Alcance: DominoTableBackground; Poker no renderiza TableDrinkGift. TypeScript pasa; pendiente confirmacion fisica de alineacion y espacio junto a selectores.

### Selectores despejan bebida — 2026-10-03
Usuario amplia D-039: selectores de juego a derecha de pantalla y panel Bote/Mano a izquierda. Invertida solo la fila superior en ComputerGameScreen y PokerScreen; avatar conserva orientacion, selectores y confirmaciones existentes. Domino: Invitar bebida queda arriba izquierda (control corto), botella permanece debajo en posavasos izquierdo; Poker: panel Bote/Fase/Mano izquierdo y selectores Domino/Blackjack derechos. Aviso del rival ajustado al espacio central. Blackjack sigue pendiente, no se crea motor nuevo. TypeScript/diff check pasan; requiere telefono para confirmar que ningun control tape la bebida en su tamano real.

### Confirmacion fisica y orden de jugadas — 2026-10-03
El usuario confirma en telefono que bebida y controles de D-039/D-040 quedaron bien. Esta confirmacion no valida animaciones, audio ni cambios posteriores.
Investigacion: el turno rival arrancaba timer850ms desde estado logico; PlacedTile esperaba prepareTileContact (hasta3000ms en Android), manteniendo opacity0. Eso permite acumular dos fichas antes de iniciar su animacion. Reproducido con promesa de preparacion retenida en openingContact.test.mjs; las dos nuevas expectativas fallaron antes del cambio.
Correccion: animacion visual independiente de preparacion de audio (playTileContact conserva preparacion y preferencias). AnchoredBoard informa finalizacion de aterrizaje a usePresentedTurn; timer rival850ms empieza solo tras ese acuse del tablero actual. Entradas humanas esperan aterrizaje rival; place verifica humanTurn y snapshot para rechazar doble accion. Callbacks antiguos no desbloquean otro tablero; pausa/cambio rival/reset/salida cancelan el turno programado. Reglas y puntuacion sin cambios.
Verificacion: 51 tests de presentacion, apertura, victoria, tap/drag/accesibilidad, stock, estado terminal y audio pasan (mocks, no telefono); TypeScript y diff check pasan. Pendiente prueba fisica del orden y sonido en frio; no se afirma reproduccion del fallo real en dispositivo. Archivos: src/computer/usePresentedTurn.ts y test, AnchoredBoard.tsx, openingContact.test.mjs, src/screens/ComputerGameScreen.tsx. Sin commit/push; siguiente paso jugar varias fichas en telefono y comprobar humano, pausa visible, rival.

### Audio al aterrizaje — 2026-10-03
Confirmacion fisica: usuario valida la secuencia/aspecto visual de D-041; reporta audio tardio, NO confirmado correcto. Causa en codigo: playTileContact esperaba preparingContact y luego seekTo/configuracion al aterrizar. Nuevo adaptador placementAudio.ts prepara silenciosamente los cuatro contactos y golpe final en Android, rebobina antes de habilitar interaccion (mesa visible, mensaje Preparando sonidos); reserva un original listo al comenzar animacion y ejecuta play sin awaits al aterrizar. Rebobina entre contactos; si un clip sigue ocupado escoge aleatoriamente otro listo. Mute, reducido, hapticos y relevo visual conservados. Una carga fallida/tardia no dispara un sonido atrasado; no se bloquea una ficha invisible. Reserva cancelada no reproduce al salir/reset; callback repetido no duplica golpe.
No se editaron WAV ni volumen aprobado: se conservan los cuatro recortes originales y golpe final actualmente referenciados por sounds.ts; no se revierte a una muestra historica. Expo real57.0.26, expo-audio57.0.5 verificado localmente; consultada documentacion v56 requerida y tipos reales (play sincrono/seekTo Promise).
Verificacion: 56 pruebas con mocks pasan, incluyen frio/caliente, preparacion silenciosa cinco recursos, recurso lento, cancelacion, rapido siguiente golpe y regresiones audio/visual. tsc y diff check pasan; Android bundle HTTP200. Pendiente validacion fisica nueva del primer golpe y siguientes; latencia de salida nativa no medida. Sin commit/push. Archivos nuevos src/sound/placementAudio.ts y test; integracion sounds.ts, AnchoredBoard.tsx, ComputerGameScreen.tsx; pruebas de componente adaptadas.

### Revision de audio, rivales y cartas — 2026-10-03
Estado fisico: el usuario rechazo D-042 y la siguiente revision con anticipacion PCM: audio variable, doble y a veces ausente. No estan resueltos fisicamente. La secuencia visual D-041 sigue aprobada.

Evidencia nueva: el registro Android muestra seis solicitudes contact-play para seis colocaciones, pero las dos reutilizaciones de recursos no muestran primer progreso nativo. El adaptador rebobinaba al EOF sin pause; el codigo instalado de expo-audio Android delega seekTo/play/pause a ExoPlayer y no pausa al emitir didJustFinish. Se corrigio pause antes de seekTo, exclusividad de reservas y proteccion contra una nueva preparacion durante uso. Tres regresiones fallaron antes del cambio y pasan despues: rebobinado con intencion nativa de reproduccion retenida, preparacion sobre reserva y descarte por callback tardio. Se retiro ese descarte temporal: una colocacion activa ya no se silencia por vencer el timer. Mute/salida siguen cancelando. Robo usa el mismo adaptador, sin la antigua cola asincrona. Los WAV aprobados y sus contactos naturales permanecen sin editar. Se conserva anticipo basado en pico PCM de cada archivo; NO compensa ni demuestra latencia fisica Android. Archivo principal: [placementAudio.ts](../src/sound/placementAudio.ts), [pruebas](../src/sound/placementAudio.test.mjs), [medicion PCM](../src/sound/contactTiming.test.mjs). Falta prueba fisica tras esta ultima correccion; los mocks no reproducen toda la salida de audio del dispositivo.

Rivales: retirado solo Alex del catalogo; preferencia antigua alex cae en Yuni. Rigo permanece con sus seis bebidas/54 poses, sin borrar recursos previos. [Catalogo](../src/computer/opponents.ts), [preferencias](../src/computer/opponentPreference.test.mjs).

Selectores: correccion explicita del usuario sustituye unificar todos. Landing de Domino y Poker conserva carrusel horizontal; solo los modales dentro de partida comparten tarjetas estilo Poker. Carousel recupera dimensiones/gestos del selector Domino en HEAD; Poker usa esa misma variante horizontal. No hay snapshot previo independiente de Poker para afirmar igualdad pixel a pixel. Blackjack sigue entrada Coming soon, sin selector ni motor nuevo. [Componentes](../src/computer/OpponentChoices.tsx), [pruebas](../src/computer/OpponentChoices.test.mjs).

Cartas: indices J/palos separados, palos vectoriales en iconos, textura fina de papel. Revisado render SVG real de J-corazon y diez-trebol a 30/52/60/64/72px en .release-audit/card-definition-preview.png; no equivale a revision nativa. [PlayingCard](../src/poker/PlayingCard.tsx), [iconos](../src/poker/TableGameContext.tsx).

Validacion final: 153/153 pruebas src/**/*.test.mjs, TypeScript sin errores y Android bundle HTTP200 en puerto8092. Registro local .release-audit/all-regression.log. Actualizado mock de navegacion del test de cambio de juego; comprueba cancelar/confirmar y conservar Poker tambien al abrir Blackjack. Rama master/10f58b1, cambios previos conservados, todo en disco sin commit/push. Proximo paso: recargar Expo Go, verificar carrusel previo/modal interno y jugar varias colocaciones (primer uso y reutilizacion); registrar audio doble, ausente o desfase por separado. QR local .release-audit/phone-reload-qr.png; endpoint exp://192.168.1.194:8092 depende de servidor y red actuales.

### Confirmacion fisica del audio actual — 2026-10-03
Usuario confirma sobre la ultima version: «Ahora se escucha bien, esta bien sincronizado». Actualiza el pendiente fisico de D-043 solo para audio de colocacion probado; no valida otros requisitos ni todos los dispositivos. Consulta posterior verificada sin cambiar codigo: AnchoredBoard/BoneyardPanel llaman reservePlacementContact; sounds.ts registra cuatro originales cycle-1..4 y final separado. placementAudio.ts usa Math.random entre slots normales ready, reserva uno exclusivamente y usa indice4 para victoria. Con cuatro listos, probabilidad25% por sonido; si alguno esta ocupado solo participan los disponibles. No es secuencia ni bolsa sin repeticion; permite repetir un clip entre jugadas. Pruebas existentes cubren reserva, reuso y seleccion de otro recurso ocupado; no constituyen prueba estadistica de distribucion. No requiere reimplementacion. Solo contexto/decisiones actualizados en este bloque, sin commit/push.

### Check-in autorizado y congelamiento Play Domino — 2026-10-03
D-047: Play Domino finalizado hasta nueva autorizacion humana. AGENTS.md registra congelamiento directo e indirecto al trabajar Poker/Blackjack; no bloqueo automatico. Se prepara commit local sobre master/10f58b1 con fuentes Domino completas, 54 poses Rigo y procedencia/extraccion, avatares vigentes, cuatro sonidos aleatorios originales, impacto final, reparto, sincronizacion confirmada, pruebas y continuidad. Incluye dependencias actuales transitivas de navegacion/Poker necesarias para conservar botones y flujos aprobados, sin cambiar una linea de producto al separar el checkpoint. La preparacion standalone se descarto antes de staging: quitaba controles de cambio de juego; no es el estado congelado.

Manifest local .release-audit/domino-checkin/manifest.json: 142 archivos, todos copiados exactamente de disco. Snapshot verificado desde HEAD mas ese manifest, sin depender de archivos Poker excluidos. TypeScript pasa. Quedan fuera recursos dealer antiguos, retrato Alex retirado, RaiseWheel/raiseAmount y test sin referencias desde pantallas actuales. No se eliminan. No se incluye nuevo trabajo de resaltado ganador, aumento de cartas rivales o placeholders de Poker (autorizado para despues del checkpoint). No push/publicacion. El hash final se reportara tras comprobar el commit.
Validacion del snapshot completo a registrar: 152/152 pruebas aprobadas (excluye una prueba del control RaiseWheel sin uso), TypeScript correcto. La version completa en disco tenia 153/153; se conserva. No equivale a validar Poker nuevo en telefono.
