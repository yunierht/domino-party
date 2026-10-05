# Decisiones y aportes de voz

Actualizado: 2026-10-02 (America/New_York). Proyecto: Domino Social Club / Dominos Codex Pro.

## Reglas del registro

Cada entrada debe tener ID, fecha (o «desconocida»), estado, fuente, contenido, motivo conocido, alcance y referencias. Estados: **aprobada**, **propuesta pendiente**, **idea de brainstorming**, **sustituida** o **descartada**. Implementación es un dato separado: aprobado no significa implementado ni validado. Una idea no autoriza implementarla. Si falta motivo o aprobación, indicarlo, sin completarlo por inferencia.

Las instrucciones explícitas más recientes del usuario prevalecen dentro de su alcance. Si un resumen contradice una decisión, conservar ambas evidencias, marcar el conflicto y pedir solo la aclaración necesaria antes de implementar lo afectado. No reescribir silenciosamente la historia.

Este registro contiene solo decisiones de este proyecto. No importar memorias, decisiones ni historial de otros proyectos; las instrucciones globales conservan únicamente el patrón de trabajo.

## Decisiones aprobadas

| ID / fecha | Decisión y motivo | Fuente / alcance / implementación |
| --- | --- | --- |
| D-001 / 2026-10-01 | Conservar el estado como posible candidato App Store, sin publicación ni cambios inferidos de versión. Motivo: disponer de una base guardada para continuar. | Petición explícita del usuario en esta conversación; commit `10f58b1` y [nota del candidato](CANDIDATE_2026-10-01.md). Implementado y subido en esa sesión; iOS pendiente. |
| D-002 / 2026-10-01 (registro) | Usar Madera cálida muestra 12 sin alterar su timbre/volumen; un golpe al aterrizar y silencio explícito respetado. Sustituye la selección anterior Seca. Motivo expresado: Seca no se escuchaba bien en el teléfono. | Selección explícita y confirmación física del usuario en esta conversación. [Audio](../src/sound/sounds.ts), [procedencia](../assets/sounds/tile-contact-plastic-warm-v3.provenance.txt), candidato `10f58b1`. Primera ficha Android confirmada tras preparación silenciosa; no equivale a validación iOS. |
| D-003 / 2026-10-02 | Persistir estado y decisiones en documentos del repositorio, conservando documentación equivalente. Motivo: retomar sesiones sin perder contexto. | Solicitud explícita actual. AGENTS.md, CONTEXTO.md y este registro; solo documentación, guardada localmente. |
| D-004 / 2026-10-02 | Incorporar resúmenes de Doti pegados por el usuario, separando ideas, decisiones y preguntas. Motivo: continuidad entre voz y trabajo del proyecto, sin inventar acceso ni sincronización. | Solicitud explícita actual; proceso definido abajo. Ningún resumen incorporado todavía. |

| D-005 / 2026-10-02 | Guardar el contexto de esta sesión sin cambios de código, commit ni push; abrir después un chat nuevo del mismo proyecto para contrastarlo en solo lectura. Motivo: comprobar continuidad entre chats. | Petición explícita del usuario al cerrar; documentos actualizados localmente. La revisión nueva no autoriza escribir archivos. |
| D-006 / 2026-10-02 | Adoptar continuidad aislada por proyecto y guardar globalmente solo el patrón de trabajo, conservando reglas existentes. Actualizar documentos tras avances o decisiones importantes y al pedir «guardar contexto», sin prometer guardado ante cierre abrupto. | Petición explícita del usuario en el chat de revisión de continuidad. Aplicado al AGENTS.md global y a los documentos existentes de Domino; sin código, commit ni push. Sustituye el pendiente de alcance P-002: aplicar el patrón en otros proyectos cuando se trabaje en ellos, sin recorrerlos desde esta tarea. |

Las fechas marcadas «registro» indican cuándo quedó documentado el acuerdo, no inventan la hora o fecha exacta de la conversación original. Para el resto del comportamiento aprobado del candidato, consultar su nota en vez de duplicar un inventario aquí.

## Propuestas pendientes

P-001 / 2026-10-02 — Rutina propuesta explícitamente por el usuario: (1) «Doti, prepara el resumen para Domino», con ideas, decisiones aprobadas, pendientes y próximo paso; (2) pegarlo en Codex y pedir «Integra este resumen en el contexto y las decisiones del proyecto»; (3) «Guarda contexto» antes de cerrar. Es compatible con D-004; la transferencia directa no está verificada ni implementada. No se recibió aún un resumen real de Doti.

P-002 / 2026-10-02 — **Sustituida por D-006.** Antes quedaba pendiente confirmar el alcance de continuidad en FIBRS/Fibers. La nueva petición aprueba el patrón general y su aplicación al trabajar en cada proyecto; no autoriza recorrerlos desde esta tarea. No se modificó FIBRS ni se inspeccionó su estado.

Los pendientes técnicos de CONTEXTO.md son trabajo por evaluar, no autorización automática de ejecución o publicación.

## Ideas de brainstorming

Ninguna idea Doti recibida. No crear ejemplos que puedan confundirse con conversaciones reales.

## Incorporar un resumen pegado desde Doti

1. Identificar proyecto, fecha de conversación si se conoce, fecha de incorporación y fuente («resumen pegado por el usuario desde Doti»). Si el proyecto es ambiguo, preguntar antes de adjudicarle decisiones; los campos ausentes quedan como desconocidos. Si contiene varios proyectos, incorporar aquí solo la parte atribuible a Domino; no copiar ni guardar aquí el contenido de los demás.
2. Revisar las entradas existentes para evitar duplicados. Separar hechos alegados, ideas, propuestas, decisiones explícitas, preguntas y siguientes pasos. Una recomendación de Doti, una intención vaga o una lista de tareas no son aprobación del usuario.
3. Añadir una entrada breve V-001, V-002, etc., usando la plantilla de abajo. Conservar el significado y, cuando haga falta, un fragmento mínimo de la aprobación; no almacenar secretos ni transcripciones privadas completas.
4. Contrastar los hechos técnicos con archivos y commits. Marcar lo no comprobado; registrar conflictos sin sobrescribir acuerdos. Vincular decisiones explícitas a una entrada D-*; el resto permanece en propuestas o brainstorming.
5. Actualizar CONTEXTO.md con el efecto concreto en objetivo, pendientes, bloqueos y próximo paso, sin convertir la ingesta documental en implementación. Implementar solo cuando la instrucción del usuario autorice el alcance correspondiente.
6. Informar qué se incorporó, qué quedó pendiente y dónde. No afirmar acceso al historial de Doti, captura automática de voz, sincronización ni programación de tareas.

### Plantilla para una entrada futura (no es una conversación registrada)

- ID: V-___
- Proyecto:
- Fecha de conversación: conocida / desconocida
- Fecha de incorporación y fuente:
- Resumen factual y verificación: hechos / referencias / desconocidos
- Ideas de brainstorming:
- Propuestas pendientes:
- Decisiones explícitas del usuario: texto o paráfrasis fiel, motivo conocido, alcance, enlaces D-*
- Preguntas pendientes o conflictos:
- Siguientes pasos: acción, responsable si consta, autorización y dependencia
- Referencias a archivos/commits y entrada equivalente si ya existía:

## Resúmenes incorporados

Ninguno a 2026-10-02. Este proceso queda preparado para cuando el usuario pegue un resumen.

## Referencia de reglas comunes (2026-10-02)

D-006 conserva su alcance de aislamiento. Su referencia de implementación queda actualizada: las reglas comunes están en [Organization/REGLAS.md](../../Organization/REGLAS.md) y Codex global las carga mediante una referencia. Los acuerdos organizativos se registran exclusivamente en [Organization/DECISIONES.md](../../Organization/DECISIONES.md); no se duplican aquí.

## D-007 / 2026-10-03 — Sonido real de colocación

Aprobada: el usuario eligió la opción 3 «domino stone on the table», Millavsb vía Pixabay, para colocar fichas. Fuente: selección explícita por voz en este chat; motivo: le suena más realista. Sustituye D-002 solo en la elección del audio, conservando un golpe al aterrizar y silencio explícito. Implementado: tile-contact-real-table.wav y procedencia en assets/sounds; recorte de 0.425 s del primer impacto, ganancia lineal 3 y salida suavizada de 20 ms. Pendiente: aprobación auditiva del recorte en teléfono. El archivo anterior permanece como antecedente.

P-003 / 2026-10-03 — Buscar sonido para fichas cayendo/reparto inicial y alternativas más realistas a Single Domino Tile Placement. Fuente: petición por voz. Encontradas muestras domino_out_pack y domino_draw de UnycodeAdmin en Freesound; sin selección ni integración del reparto. No sustituir D-007 por inferencia.
D-008 / 2026-10-03 — Aprobada por petición explícita por voz: recortar exactamente el archivo seleccionado, porque la adaptación no sonaba igual. Sustituye el procesamiento de D-007: primer golpe 0.500–1.100 s, estéreo y 24000 Hz originales, sin ganancia ni fades. Implementado; confirmación auditiva en teléfono pendiente.

P-004 / 2026-10-03 — Propuesta por voz: permitir alternar domino y poker mediante un icono, reutilizando mesa y personajes. Pendiente definir variante, reglas y alcance antes de implementar. La ubicacion exacta del selector requiere aclaracion. No se implemento poker en este bloque.

D-009 / 2026-10-03: Usuario pide conservar los contactos naturales del original, suave seguido de fuerte, antes de implementar poker. Se aplica tramo 7.430-8.050 s cercano a la captura, PCM sin procesamiento, tile-contact-original-double-v3.wav. Sustituye seleccion del primer golpe D-008; pendiente que usuario confirme correspondencia auditiva, no demostrada por la imagen. Usuario confirma Texas Hold'em sin limite contra personajes con fichas virtuales, pero aplaza implementacion hasta resolver audio.

D-010 / 2026-10-03: usuario confirma el MP3 completo y solicita un solo golpe con ambos contactos, sin cambios. Reemplaza seleccion D-009 por primer golpe completo 0.380-1.100s; incluye contacto suave que D-008 habia omitido. Implementado en recurso v4; aprobacion auditiva pendiente.

D-011 / 2026-10-03: usuario aprueba segundo golpe completo mostrado y ordena sustituir el primero. Implementado tile-contact-original-second-v5.wav, copia byte-identica del preview 2.20-3.00s, sin procesamiento; sustituye D-010 en seleccion activa. P-005: propone primer golpe mas agresivo/fuerte para ultima ficha animada; pendiente precisar muestra y aprobar, no implementado.

D-012 / 2026-10-03: usuario aprueba primer golpe mas fuerte exclusivamente al aterrizar ultima ficha ganadora; segundo golpe v5 permanece normal. Sustituye P-005. Implementado final-first-v1 desde primer recorte completo, ganancia lineal 3 (+9.54 dB), pico17796 sin clipping; mantiene dos contactos. Confirmacion fisica pendiente.

D-013 / 2026-10-03: usuario aprueba cuatro primeros golpes completos del original para seleccion aleatoria (aclara que NO quiere secuencia fija). Recursos cycle-1..4 son recortes PCM sin procesamiento: 0.38-1.10, 2.20-3.00, 5.49-6.25, 7.43-8.05s. Reemplaza D-011 para colocaciones normales. Seleccion uniforme independiente, permite repeticiones. D-012 sigue vigente para ultima ficha; usuario confirma que suena muy bien fisicamente.

D-014 / 2026-10-03: usuario confirma sonidos aleatorios D-013 en telefono. Solicita reparto visible desde lateral al empezar cada ronda para ambas manos, con sonido acorde. Implementado reparto escalonado 1.3s con bloqueo de turno hasta fin, sonido compuesto de contactos originales; respeta silencio y movimiento reducido. No cambia reglas de juego ni poker. Validacion visual/auditiva en telefono pendiente.

D-015 / 2026-10-03: usuario pide guardar bloque Domino y comenzar poker. Modalidad previamente confirmada: Texas Hold'em sin limite contra personajes con fichas virtuales. Implementacion ahora autorizada, preservando Domino. Primera mesa mantiene formato uno contra uno existente; no se ha aprobado multijugador en red ni dinero real.

D-016 / 2026-10-03 — Usuario confirma dos jugadores y dealer no jugador; selector con cartas en Domino y fichas Domino en Poker, debajo del selector de personajes, confirmacion Cancelar/Cambiar y conservacion independiente de partidas. Pide varias iteraciones y mismo look de mesa/personajes. Implementado en primera mesa local de Texas Hold’em; no cambia D-015 a multijugador online. Defaults de implementacion: 1000 fichas por jugador, ciegas10/20; configurables en futura peticion, no requisitos historicos inventados. Evidencia y limites en POKER.md.

D-017 / 2026-10-03 — Aprobado por peticiones directas durante refinamiento: selector Domino con abanico central sin logo completo; cartas del selector con indices; retratos con mayor profundidad visual; dealer solo manos laterales, sustituyendo figura completa de D-016; gesto suave de sostener/soltar; chips realistas con colores/numeros y reversos de cartas tramados. Mesa despejada, chips laterales y manos centradas, bote/fase/mano arriba derecha, turno separado de cartas. Acciones pequenas en una fila, importe por gesto vertical, sin pie virtual chips/no real money. Esto no cambia modalidad exclusivamente virtual. Representacion de manos es animacion de imagen 2D; calidad final pendiente de prueba fisica. No autoriza publicacion.

D-018 / 2026-10-03: usuario solicita ocultar importe de subida hasta tocar Raise, mediante popup; reemplaza rueda siempre visible de D-017. Tambien precisa chips a la izquierda pero dentro de la mesa. Implementado sin modificar reglas ni saldos.

D-019 / 2026-10-03: usuario precisa movimiento de dedos sosteniendo y soltando carta, no mera traslacion de foto, y panel informativo completamente sobre la mesa sin invadir tapete. Se integra primera iteracion por cuatro poses; no se considera aprobada visualmente hasta prueba del usuario.

D-020 / 2026-10-03: usuario precisa mano dirigida hacia cada destino, soltando cerca y dejando vuelo corto de carta, con alcance distinto para posiciones cercanas/lejanas. Sustituye interpretacion de colocar directamente en destino; implementado, pendiente aprobacion visual.

D-021 / 2026-10-03: usuario pide acumulacion de fichas como mesa real y luego acercarlas a las cartas de cada jugador. Implementadas pilas visuales representativas, sin modificar saldos/reglas.

D-022 / 2026-10-03: usuario solicita mensaje breve del rival indicando si iguala, se retira u otra accion. Implementado aviso temporal basado en accion real del motor, sin cambiar estrategia.

D-023 / 2026-10-03: usuario solicita panel superior derecho mas horizontal sin invadir mesa y bote representado por grupo de fichas. Implementado reutilizando pilas visuales.

D-024 / 2026-10-03: usuario solicita resaltado sutil de las cartas que forman cualquier combinacion ganadora, no solo full house. Implementado para showdown, preservando privacidad en fold.

D-025 / 2026-10-03: usuario solicita hint de combinacion actual mientras se revelan cartas. Implementado indicador descriptivo, sin probabilidades ni sugerencias de apuesta.

D-026 / 2026-10-03: usuario sustituye entrada de texto Raise por valores rapidos y scroller custom, importe read-only superior. Implementado como totales, manteniendo semantica Raise to y limites legales.

D-026 precisado por usuario: valores definitivos 5,10,20,50,100; sustituyen presets iniciales.

D-027 / 2026-10-03: usuario precisa interfaz tipo cajero, cada denominacion con menos/mas acumulativo, sin custom swipe. Sustituye seleccion directa y rueda de D-026. Implementado manteniendo total de calle y confirmacion final.

D-028 / 2026-10-03: usuario pide brillo sutil en cartas que corresponden a Your hand durante juego; complementa resaltado final D-024 y pista D-025. Implementado excluyendo kickers ajenos a categoria.

D-029 / 2026-10-03: usuario solicita cartas centro/humano mayores y realistas, rival pequeno, turno/accion mayores. Implementados palos vectoriales sin dependencia de glifos y separacion para indices. D-030: portada con accesos separados y Watch/History juntos; entradas Poker y Blackjack similares a Domino pero ajustes por juego. Poker fichas iniciales en vez de puntos; Blackjack pendiente, sin inferir autorizacion para motor ahora. Watch abreviado tras detectar salto de linea.

D-031 / 2026-10-03: usuario pide dealer partiendo siempre del mismo punto central de mesa. Implementada ancla comun en borde superior; se conserva lanzamiento corto hacia destino de D-020. Calidad visual aun no confirmada.

D-032 / 2026-10-03: usuario corrige posicion D-031: dealer en derecha del centro de mesa a altura de comunitarias, no arriba. Se conserva mismo origen para todos los repartos.

D-033 / 2026-10-03: usuario pide comunitarias maximizadas dentro tapete con margen, rival arriba derecha y dos selectores de otros juegos izquierda; implementado. D-034: textura sutil de papel en caras; implementado. Propuesta pendiente: sonido de reparto real, usuario pide busqueda de referencia, seleccion e integracion aun no aprobadas.

D-035 / 2026-10-03: usuario aprueba Playing Cards Being Dealt y pide extraer una carta e integrar; implementado sin alterar sonido. D-036: selectores algo mayores y semitransparentes; bebida Domino a derecha para evitar botones izquierdos. Implementado, pendiente validacion fisica.

D-037 / 2026-10-03: usuario solicita distinguir iconos Poker/Blackjack por cantidad/cartas; implementados tres y dos respectivamente.

D-038 / 2026-10-03: solicitud de avatar Rigo desde foto del usuario, recibida por delegacion del chat New voice chat. Implementados imagen sentada con profundidad, transparencia y catalogo compartido de Domino/Poker con preferencia persistente. Reglas de juego comunes sin cambios. Animacion propia de beber pendiente; no se reutiliza la cara ni poses de otro personaje. Fuente visual y prompt en assets/opponent-rigo-seated-v1.provenance.txt. Validacion fisica pendiente.

D-038 completada / 2026-10-03: aclaracion del alcance delegado: misma animacion de bebida que Yuni/Yoi/Yase/Andy/Chuchi, no limitar Rigo a fallback estatico. Implementadas seis secuencias propias; sustituye el pendiente de D-038. Se conservan reglas de consumo y cancelacion comunes. Apariencia en telefono aun pendiente de confirmacion.

D-039 / 2026-10-03: usuario pide devolver bebida a derecha del jugador para coherencia con recogida. Interpretacion contrastada con poses: derecha del avatar = izquierda en pantalla. Implementado x60/400 en TableDrinkGift; sustituye solo posicion de bebida de D-036, sin cambiar animaciones ni comportamiento. Pendiente revision telefono.

D-040 / 2026-10-03: usuario pide invertir los selectores de juego y la informacion de bote/mano para despejar cerveza. Implementados selectores a derecha en ambos modos y panel Poker a izquierda; bebida mantiene derecha anatomica del avatar (izquierda pantalla). Sustituye ubicacion de selectores de D-033; no altera modos, reglas ni confirmacion de cambio.

D-041 / 2026-10-03: usuario pide colocar primero ficha humana y despues rival, evitando aparicion simultanea. Implementado relevo por finalizacion visual y separacion850ms posterior; preparacion de audio no bloquea visibilidad. Se mantiene motor y efectos. Pruebas automatizadas pasan; pendiente confirmacion fisica de este cambio. Usuario si confirmo D-039/D-040 (bebida/controles).

D-042 / 2026-10-03: usuario confirma visual D-041, rechaza desfase del sonido. Implementada preparacion anticipada y contacto listo/cancelable al aterrizar; nunca cola de sonidos tardios. Conserva archivos originales vigentes y reglas del turno. Pruebas automatizadas pasan; audio fisico sigue pendiente de nueva confirmacion.

D-043 / 2026-10-03: usuario rechaza audio D-042 y revision posterior anticipada por PCM: doble y a veces ausente. Se exige un evento de reproduccion por colocacion; no sustituir duplicados por silencios. Correccion implementada: pause antes de rebobinar EOF, reserva exclusiva y protegida de preparacion concurrente, retiro de descarte por deadline. Conserva originales y secuencia visual aprobada. Estado: candidato probado con mocks y bundle; pendiente nueva confirmacion fisica, no se afirma causa unica ni latencia resuelta.

D-044 / 2026-10-03: usuario autoriza quitar solamente Alex; conservar Rigo, bebidas y persistencia. Implementado catalogo sin Alex y fallback de preferencia antigua; no se borran assets historicos.

D-045 / 2026-10-03: usuario pide mayor claridad J/corazon y textura de carton en cartas Poker/entrada Blackjack. Implementada separacion de indices y palos, textura sutil; sin autorizar motor Blackjack. Revision SVG estatica hecha; pendiente telefono.

D-046 / 2026-10-03: propuesta/peticion inicial de unificar todos los selectores queda SUSTITUIDA por aclaracion explicita del usuario: carrusel horizontal previo a partida; tarjetas de Poker compartidas SOLO dentro del juego. Implementado en Domino y Poker; Blackjack conserva entrada pendiente sin inventar controles de rival. No mezclar este acuerdo con autorizacion para implementar Blackjack.

D-043 confirmada fisicamente / 2026-10-03: usuario informa «Ahora se escucha bien, esta bien sincronizado» tras la correccion de pause/rewind. Sustituye pendiente de prueba del audio actual; no amplia aprobacion a cartas, selectores u otros dispositivos. Pregunta sobre cuatro variantes aleatorias: implementacion activa verificada y conservada, sin cambio solicitado ni realizado; golpe final separado.

D-047 / 2026-10-03: usuario autoriza check-in LOCAL de todo Play Domino y lo considera finalizado: «No le hagan mas cambios hasta que yo te indique». Sustituye prohibicion previa de commit solo para este checkpoint, no autoriza push/publicacion. Congelados comportamiento, apariencia, audio, reglas y recursos de Domino, incluidos efectos indirectos desde compartidos. Futuro Poker/Blackjack debe preservar Domino y validar regresiones; requiere nueva autorizacion explicita para cambiarlo. Regla persistida en AGENTS.md, sin bloqueo tecnico automatico. Para mantener selectores y navegacion aprobados, checkpoint incluye dependencias reales transitivas de Poker (contexto, router, pantallas, motor, cartas y reparto existentes); separarlas retiraba funcionalidad Domino, por eso no se usa el snapshot standalone exploratorio. No incluye el nuevo resaltado ganador ni mejoras Poker posteriores. Assets retirados/no usados y RaiseWheel obsoleto quedan fuera.

D-048 / 2026-10-03: tras checkpoint, usuario autoriza en Poker borde rojo/halo con pulso lento para combinacion ganadora, cartas rivales moderadamente mayores y placeholder fijo hasta aterrizaje real de carta. Reducido conserva marcador estatico. Implementado solo en presentacion Poker, no motor, audio ni recursos Domino. Nueva aclaracion sustituye resaltado de bestFive: destacar cartas de categoria nombrada, no kickers (pareja2/doblepareja4/trio3/poker4/full-escalera-color5/carta alta1). Q de mesa sigue siendo kicker legal para desempatar dos parejas, pero no se destaca. Caso humano registrado sin palos: rival2/10, mesa3/4/Q/2/10, humanoJ/8; test asigna palos sin color. Confirmacion fisica: selector y caida bien; ultima correccion de marcado pendiente telefono.

D-049 / 2026-10-03: excepcion explicita limitada a D-047: al proponer tocar avatar en Poker, usuario autoriza «puedes aplicarlo a domino tambien». Se retira solo boton separado y avatar abre selector existente con rol/label accesible. Conserva carrusel previo, selector interno, animaciones de bebida, audio y reglas. No autoriza otras modificaciones Domino. Implementacion posterior al checkpoint sin nuevo commit autorizado.

D-050 / 2026-10-03: usuario reemplaza indicador visual D-048: punto amarillo discreto DEBAJO de cada carta de combinacion ganadora, sin aro rojo, halo ni pulso. Domino solo referencia visual, no se modifica. Implementado en PokerCard con franja fija10px y punto6px, etiqueta accesible ES/EN; normal, reverso y kicker no muestran punto. Conserva seleccion combinationCards, reglas/desempate, placeholders, tamaño rival y excepcion avatar D-049. Ultima apariencia pendiente telefono.

D-051 / 2026-10-03: usuario precisa que el salto vertical viene de mostrar/ocultar evaluacion propia encima de mano humana (Your hand/No pair), no del resultado central. Implementada franja permanente de altura24px ajustada a escala accesible (max1.3) mediante PokerHandHint; desaparece solo contenido, no espacio. Sin cambios en region resultado ni otras pantallas. Mantiene puntos ganadores, cartas rivales, placeholders y excepcion avatar ya aprobados. Pendiente confirmacion fisica de estabilidad.

D-052 / 2026-10-03: excepcion explicita de usuario al freeze D-047 para apertura Domino. Jerarquia: doble mas alto entre manos decide quien inicia; SOLO si ninguno tiene doble se usa ficha mas alta (suma y desempate por extremo mayor existentes). Cualquier doble, incluido0-0, manda sobre no-dobles; pozo excluido. La ficha prioritaria concede turno, NO obliga a jugarla. Iniciador humano o virtual puede abrir con cualquier ficha propia. Se conserva regla existente de ganador anterior y reaplicacion de prioridad tras empate; no se autorizo modificar otras reglas. Implementados legalEnds/estrategia y texto ayuda ES/EN coherentes, sin cambios visuales/audio/recursos. Sin nuevo commit/push.

D-053 / 2026-10-03: compra simulada selectiva aprobada en Poker, opciones500/750/1000, sin pagos reales. Solo recibe credito quien queda en cero DESPUES de resolver; si es rival, usuario elige importe en dialogo identificado. Conserva saldo ajeno, rotacion y ciegas normales; cancelar no altera estado y permite reabrir. Propuesta de reiniciar ambos500 cancelada antes de implementacion. Fallo fisico posterior revelo falta de integracion: corregida ruta real PokerScreen, no cache supuesta. Implementado y probado con renderer/motor y bundleAndroid; confirmacion fisica nueva pendiente. No autoriza cambios Domino/Blackjack ni commit/push.

D-053 texto actualizado / 2026-10-03: usuario confirma fisicamente que compra funciona. Nueva mejora autorizada y aplicada: nombre dinamico del asiento sin saldo, «[nombre] se quedo sin fichas»/«[name] ran out of chips», indicacion de elegir cantidad y opciones500/750/1,000. Solo texto; credito y cancelacion conservados, sin pagos. Pruebas nuevas ES/EN humano/rival y tres cantidades pasan; apariencia nueva pendiente telefono.

D-053 refinamiento textual sustituye texto anterior: dialogo contiene solo «{Nombre} se quedo sin fichas.» / «{Name} ran out of chips.», tres cantidades500/750/1,000, Cancelar/Confirmar y aclaracion final «Simulacion; no es dinero real.» / «Simulation only; no real money.». Sin titulo ni explicaciones redundantes; credito intacto. Prueba verifica orden exacto de textos para ambos asientos e idiomas.

D-053 ajuste final: conservar encabezado visible «Comprar fichas» / «Buy chips» antes del estado con nombre. Siguen cantidades500/750/1,000, botones existentes y nota pequena de simulacion al final; sin mas explicaciones. Sustituye solo retirada del titulo anterior. Prueba de orden ES/EN actualizada.

D-054 / 2026-10-03: usuario autoriza mejorar rival Poker con informacion legal y riesgo; implementada estimacion Monte Carlo120 escenarios con cartas desconocidas simuladas, probabilidades de completar mesa, empates y ponderacion heuristica de rango ante apuesta grande. Compara equity con coste/bote y margen por fraccion de saldo expuesta; variacion pequena y subidas de valor. No consulta cartas humanas/deck real ni cambia reglas. No garantiza victoria ni nivel profesional.
D-055 / 2026-10-03: excepcion explicita limitada al freeze Domino: mejorar estrategia interna, no reglas/apariencia/audio. Implementada valoracion por descarga de puntos, continuaciones legales, extremos apoyados y escasez inferida de propias+cadena publica; penaliza quedarse sin salida y varia solo entre valores similares. No consulta mano humana ni identidades del pozo. Conserva apertura libre D-052. Usuario autoriza cerrar ambas mejoras tras validacion interna, sin esperar prueba fisica. Blackjack solo en futura tarea separada; no se inicia aqui. Sin commit/push.

D-056 / 2026-10-03 — Aprobada: implementar Blackjack nuevo y aislado, visualmente coherente con Poker, bajo TDD y varias verificaciones; conservar mejoras Poker y freeze Domino, sin commit/push/build distribuible/publicacion. Fuente: peticion explicita del usuario recibida en chat delegado. Implementado en src/blackjack con rutas separadas y contexto propio. Elecciones de implementacion documentadas (no requisitos historicos atribuidos al usuario): un jugador contra personaje dealer S17, una baraja por ronda, pedir/plantarse, naturales/ases/bust/empates; sin apuestas, split/double/insurance. Referencia [BLACKJACK.md](BLACKJACK.md). 205 pruebas, TypeScript y bundle Android local pasan; validacion fisica/iOS pendiente. No amplifica D-055 ni autoriza cambios Domino. Cambios locales sin commit.

D-056 evidencia ampliada:213/213 pruebas y revision de navegador real390x844/320x568, cambio/retorno Poker con ronda Blackjack conservada, hit/bust/stand/dealer/nueva ronda. Ajuste exclusivo Blackjack: acciones fijas fuera del scroll y reglas con altura acotada. TypeScript/bundleAndroid final pasan; telefono/iOS pendientes. Sin commit/push/publicacion.

D-057 / 2026-10-04 — Aprobada: presentacion Blackjack segun video aportado. Bandeja inferior acumulativa, vuelos de fichas al apostar/cobrar, contador visual progresivo sin duplicar credito, Deal/Hit/Stand laterales siempre visibles y habilitados por fase. Sonido de cartas reutiliza Poker; sonidos de fichas Kenney Casino Audio CC0 aislados. Usuario cancela grabados/letreros sobre mesa para todos los juegos; no queda cambio nuevo de fondo Domino. Limpiar apuesta central tras cobro. Pruebas de renderer cubren taps simultaneos, progreso, limpieza y pausa/mute. Sonido fisico pendiente.

D-058 / 2026-10-04 — Aprobada expresamente: Poker sustituye selector modal Raise por bandeja inferior acumulativa con Confirmar, respetando minimo/all-in y reglas actuales. Fold rojo izquierdo, Check/Call verde y All-in dorado derechos. Vuelos de fichas al indicador de subida derecho; saldo humano superior, mensaje de turno debajo de mano y espacios comunitarios libres. Cobro visual vacia bote, refleja credito ya liquidado por motor, contempla empate/moneda impar y conserva estado de cobro al volver de otro juego. Panel aprovecha margen inferior con reserva pequena para gesto del telefono. No modifica motor ni audio/apariencia Domino; cambios locales sin commit/push/publicacion. Usuario reporto texto suelto y solapamientos: corregidos; revisiones fisicas finales pendientes. Evidencia: .release-audit/blackjack-reference.
D-058 refinamiento aprobado: indicador de apuesta hacia dentro del margen derecho, Raise to + cantidad en una linea y pila superpuesta de denominaciones elegidas. Confirmar discreto/transparente como Limpiar; bandeja elimina importe duplicado, conserva minimo legal. Sustituye posiciones e importe inferior anteriores.
D-058 ultimo ajuste: retirar tambien etiqueta Raise/Subir de bandeja; solo minimo, Limpiar, Confirmar y denominaciones. Importe unico en pila lateral.

D-059 / 2026-10-04 — Aprobada: revisar rival Poker por exceso de checks/pases. Reproducido As-Rey preflop sin coste: subia4/24 semillas con umbral anterior .68. Politica ahora usa umbrales de valor .56 preflop/.60 postflop, apuesta mas manos favorables y semibluffs limitados a proyectos legales propios antes del river. Conserva pot odds, prudencia ante apuestas grandes, limite/all-in y uso exclusivo de cartas propias/mesa publica. No cambia reglas ni personalidad de Andy; aplica a politica comun de rivales. Nuevas pruebas de As-Rey, proyecto/fallo river y40 manos completas verifican legalidad/conservacion. No garantiza victoria ni demuestra win rate fisico.

D-058/D-057 refinamiento final aprobado: Poker conserva pila de apuesta DERECHA, Limpiar/Confirmar debajo de ella, importe en una linea; bandeja inferior sin etiquetas/minimo/separador ni relleno oscuro. Aclaracion final del usuario: son las CARTAS de Poker las que deben centrarse, nunca mover bandeja al centro; cartas humanas72/rival50, comunitarias ajustadas al tapete. Blackjack adopta estilo limpio Poker, Limpiar junto a apuesta central y marca sutil sin relieve profundo. Acciones laterales112 de ancho en ambos juegos. No cambiar Domino. Falta confirmar acomodo final en telefono.

Audio / 2026-10-04: usuario reporto ausencia de audio Poker/Blackjack y luego Domino, y posteriormente confirmo que volvio a escucharse. Se encontro condicion comun tileSound, pero no se demostro causa nativa ni preferencia del telefono. No se cambio configuracion de audio ni silenciamiento persistido; nuevo hook experimental sin integrar fue eliminado. Recursos de cartas/fichas aprobados siguen activos segun ajuste existente.

D-060 / 2026-10-04 — Aprobada en voz: Blackjack adopta referencia del video para bandeja de madera bajo borde curvo sombreado del tapete. Pila central superpone denominaciones y colores seleccionados; total unico encima en etiqueta negra translucida. Marca BET mas pequena con sombreado interior tenue, sin relieve exagerado; retirado Place your bet. Solo presentacion Blackjack; no cambia Poker, Domino, reglas ni preferencias de audio. Seleccion conservada durante mano; al remontar pantalla se reconstruye una combinacion equivalente al importe, no el historial original de taps. Revision navegador390x844 y renderer; telefono pendiente. Sin commit/push.
D-060 refinamiento: nombre Mateo/Elena · Dealer pegado bajo figura; sin guion inicial del dealer. Nombre/guion humano inferior conservados. TypeScript y35 pruebas Blackjack pasan; suite completa232 anterior pasa.
D-060 ultima indicacion: retirar interrogacion del dealer oculto; mostrar total solo tras revelar. Your turn sustituye You sobre mano humana, tamano16 y pulso suave solo cuando Hit/Stand habilitados; respeta movimiento reducido y detiene al pausar/salir. Sustituye ubicacion provisional encima de Hit.
D-060 sustitucion final por usuario: retirar nombre Mateo/Elena · Dealer de mesa para despejar espacio; selector de avatar conserva nombre accesible. Vista navegador persistente solicitada: wrapper local de prueba phone-preview.html/cjs en .release-audit/blackjack-reference, adapta390x844 al panel; no cambia app nativa ni Domino.
D-061 / 2026-10-04 — Aprobada en voz: Blackjack coloca mano humana mas arriba y apuesta debajo, entre acciones laterales; reserva130px inferiores para evitar solapamientos con cartas. Totales de fichas/cartas en globos translucidos junto a esquina superior derecha, ligeramente por fuera, punta izquierda hacia grupo. Sustituye etiqueta superior centrada y punta inferior D-060. Dealer oculto sin total; no cambia reglas/audio ni Poker/Domino. Navegador adaptable local verificado; telefono pendiente.
D-061 ultima referencia: total fichas con signo dolar encima de pila, globo redondeado translucido y punta ABAJO; totales cartas a esquina superior derecha, punta izquierda. Sustituye ubicacion derecha de fichas anterior. D-062 /2026-10-04 aprobado: corona y BLACKJACK/SOCIAL CLUB en tapete Blackjack con apariencia de grabado caliente, sombra oscura/borde inferior iluminado; revoca cancelacion previa solo para Blackjack. Icono Domino blanco solo desde Blackjack mediante whiteDomino opcional; no cambia juego Domino. Figuras CourtFigure nuevas ilustradas provisionales: usuario pide ahora opciones online antes de reemplazo definitivo. Comparacion Adrian Kennard CC0 https://www.me.uk/cards/ con tres variantes standard/ghost/blue, seleccion pendiente.
D-063 / 2026-10-04 — Aprobada en voz: usuario elige clasica a color (Standard deck de Adrian Kennard) y confirma aplicacion uniforme a52 caras/cuatro palos en Blackjack; pide mostrar resultado navegador. Descarga oficial SVG desde https://www.me.uk/cards/ (CC0), asset local assets/blackjack-classic-deck-v1.json y procedencia adjunta. ClassicPlayingCard reutiliza animacion actual con faceArtwork opcional; default Poker/Domino intacto. Sustituye CourtFigure provisional eliminado. Dorso rojo actual conservado. Sin commit/push/publicacion.
D-063 refinamiento aprobado: usuario reporta burbuja con guion antes de reparto; ocultar total humano hasta que exista al menos una carta. No cambia total calculado ni reglas.

## D-064 — Mesa coherente Poker/Blackjack y perspectiva ajustable (2026-10-04)
Estado: autorizado e implementado localmente. Fuente: usuario pide alinear Poker con Blackjack antes de su almuerzo, conservar textura/grabado, bandeja de madera y baraja clasica; aclara que la mano a retirar es la del reparto Poker. Solicita flechas para inclinar/aplanar suavemente hasta unos15-20 grados.
Aplicacion: ambos juegos tienen perspectiva ajustable0-20 grados (inicial6), con controles y bandeja estables. Poker mantiene comunitarias centradas y pila seleccionada lateral; incorpora corona/POKER/SOCIAL CLUB, madera y52 caras clasicas tambien en lobby. Reparto Poker usa el mismo vuelo de PlayingCard que Blackjack, sin DealerHands; CardDealSound conserva sonido y cancelacion al pausar/silenciar. Conservados reglas, estrategia, marcas amarillas de ganador, limites de subida y confirmacion. Domino no se modifica en este bloque.
Refinamientos Blackjack aprobados: cartas dealer mas cercanas al personaje, resultado/dealer-turn bajo grabado con pulso respetando movimiento reducido, barras horizontales ocultas y gesto conservado.
Evidencia:236/236 pruebas y TypeScript; navegador390x844 con ronda Blackjack completa y Poker desde preflop a flop/subida confirmada. Capturas en .release-audit/blackjack-reference/blackjack-result-unified.png, blackjack-tilt-20.png y poker-unified-mobile.png. Sonido y perspectiva nativa pendientes de confirmacion fisica. Sin commit/push/publicacion.

## D-065 — Gestos, pilas de saldo y acciones disponibles (2026-10-04)
Estado: autorizado en voz e implementado localmente. Sustituye las flechas D-064 por arrastre vertical suave sobre tapete Blackjack/Poker, eje central y rango0-20 grados; controles/bandeja fijos. No captura taps ni arrastre horizontal de cartas, respeta movimiento reducido y pausa.
Pilas: Blackjack cobra apuestas perdidas hacia pila del dealer (lado derecho anatomico/izquierda visual), contador de apuestas cobradas inicial0, una sola acreditacion; ganancias/empates vuelven a pila humana. Poker conserva liquidacion del motor y mueve cobro hacia pilas. Dealer/rival compactos en left42/top heroHeight-65, sin nombre y total arriba con dolar; humana debajo de cartas. Retirados saldos/bote duplicados del encabezado, importe del bote junto a sus fichas. Nombre compartido Blackjack/Poker con fallback Domino de solo lectura; switch Blackjack entra directo a mesa, conserva dealer elegido/default Mateo.
Blackjack limpia cartas/apuesta al concluir cobro y espera nueva seleccion+Deal. Deal/Hit/Stand entran/salen desde laterales solo cuando legales; ultima instruccion revoca visibilidad permanente D-057. Stand recibe la misma condicion que Hit. Pantalla conserva solo Won/Lost; empate sigue devolviendo apuesta.
Poker replica animacion legal de Fold/Check-Call/All-in, pila rival y bandeja de seis denominaciones10/20/50/100/500/1000 con mismo tamano/disposicion Blackjack. Next hand con pulso sobre fila comunitaria tras resultado; grabado POKER/SOCIAL CLUB permanece visible. Recompra conserva limites/confirmacion actuales.
Excepcion Domino explicita nueva: usuario autoriza unicamente marca central DOMINO/SOCIAL CLUB prensada como otras mesas. Se sustituye marca visual tenue previa en ComputerGameScreen; no modifica reglas, controles, gestos, audio ni recursos de juego. Freeze restante vigente.
Evidencia:247/247 pruebas, TypeScript, navegador390x844 verifica arrastre vertical/no captura horizontal, legalidad visual de acciones, salida al Fold, bote limpio y Next hand sobre comunitarias. Capturas blackjack-gesture-piles.png/poker-gesture-piles.png en .release-audit/blackjack-reference. Pendiente confirmar sonido, gesto/posiciones en telefono y marca Domino en partida fisica. Cambios guardados sin commit/push/publicacion.
D-065 refinamiento final aprobado: esquina superior izquierda Poker muestra solo HAND/MANO y numero; retirar etapa Hand complete/Pre-flop duplicada. Resultado y turno mantienen informacion operativa.
D-065 refinamiento visual aprobado: confirmacion desde Blackjack adopta el mismo titulo, descripcion, margenes y botones de la confirmacion Poker, sin cambiar rutas/pausa. Grabados Blackjack/Poker gris verdoso claro con borde sombreado; TableStamp light opcional conserva Domino actual.
D-065 excepcion visual ampliada expresamente: usuario pide tambien grabado Domino en gris claro; activar light solo en TableStamp DOMINO. No reabre apariencia restante, reglas, audio, recursos ni controles congelados.

## D-066 — Domino: encuadre estable mientras la cadena cabe (2026-10-04)
Autorizacion explicita en voz: mantener fichas colocadas sin movimiento; ajustar solo cuando falte espacio. fitBoardCamera elimina recenter automatico por distancia18 aunque cabia; conserva camara si cadena/extremos dentro de margen. Reset de ronda, redimensionado y boton Centrar conservan ajuste explicito; no modifica slots, reglas, animacion de llegada ni audio. TDD: prueba de crecimiento asimetrico reprodujo desplazamiento innecesario; ahora pasa. Suite248/248; telefono pendiente. Sin commit/push.
Musica: usuario solicita seis muestras jazz/salsa/regueton, solo uso comercial futuro monetizado sin pagar licencia/regalias ni atribucion. Primera lista CC-BY no cumple preferencia y se sustituye; no seleccion ni integracion aprobada todavia.
D-066 refinamiento tras prueba navegador: overflow ajusta desplazamiento minimo (clamp) en lugar de centrar cadena; useBoardCamera compensa cambios de alto/ancho del area para preservar coordenadas en pantalla y evita animar destino identico. Reset/Centrar sigue explicito. Pruebas de minimo desplazamiento y alto de mano pasan; suite250/250, TypeScript. Navegador muestra ajuste de zoom al crecer cadena fuera de limites, no prueba nativa.

## D-067 — Musica seleccionable y accesos uniformes (2026-10-04)
Autorizacion explicita en voz: integrar muestras1,2,6 y elegirlas en Settings; incorporar los puntos de ajustes y librito en esquina superior derecha de Domino/Poker/Blackjack, en orden librito->puntos. Excepcion concreta al congelamiento Domino para musica/estos accesos, primera ficha marfil y ocultar scrollbar del selector de avatares; no reabre otras reglas/audio de efectos/recursos.
Implementado localmente: tres MP3 descargados de paginas oficiales Pixabay en assets/music; catalogo y seleccion persistida tableMusicTrack validada, musica apagada por defecto, selector global y TableSettings. useTableMusic cambia recurso y elimina reproductor anterior, pausa al ir a segundo plano; Blackjack ahora comparte musica de mesa. Procedencia/licencia/hash en assets/music/PROVENANCE.txt; licencia Pixabay comercial sin regalias/atribucion, NO CC0. Pistas Content ID; muestra2 etiquetada IA. Certificado individual no obtenido (descarga del certificado agoto espera).
Poker/Blackjack abren TableSettings desde puntos y muestran librito antes; Domino conserva menu con Settings y suma librito, sin gap extra. Primera ficha de mesa usa el mismo marfil que otras, sin selected=opening; icono Domino Poker usa whiteDomino. Carrusel inicial oculta indicador horizontal y conserva gesto.
Evidencia: TypeScript,251/251 pruebas, git diff --check. Prueba nueva verifica cambio/cancelacion de reproductor y restauracion/fallback de seleccion; otras pantallas usan mocks nativos, no prueba de sonido fisico. Servidores locales8092/8094 reiniciados; vista adaptable abierta derecha. Pendiente comprobacion navegador final de selector y telefono para musica/gesto/layout; no se afirma exportacion Android actual. Sin commit/push/publicacion.

D-067 correccion puntual posterior autorizada: error SVG en telefono Poker por offset=".4". Usar representacion decimal canonica0.4 (y otros strings similares0.45/opacidades) en superficies Blackjack/Poker; no cambiar reglas ni apariencia prevista. No reabre propuestas pendientes de auditoria. Evidencia en CONTEXTO y svgGradient.test.mjs;252/252 pruebas, iOS bundle actual verificado; telefono pendiente.

D-067 ajuste visual puntual aprobado en voz: resultado Blackjack en franja propia sobre cartas humanas, sin top absoluto; Poker Next hand con aspecto de acciones Check/Fold (verde, borde dorado, tipografia fuerte y misma altura), conserva ubicacion/pulso/reglas de recompra. Ver CONTEXTO para evidencia; no autoriza propuestas de auditoria pendientes.

D-067 sustituida presentacion de dos iconos por nueva indicacion explicita: unicamente puntos superiores y reglas/librito dentro Settings de cada juego. Conserva reglas y pausas; no elimina acceso inicial historico Domino. Audio confirmado restablecido por usuario tras reload, sin cambio adicional de implementacion; no afirmar causa lenta confirmada.

D-067 sustitucion del anterior borde inferior extendido Poker: usuario reporta controles de sistema tapan bandeja/acciones; respetar SafeAreaView padre eliminando margen inferior negativo solo Poker. Mantener Blackjack, confirmado bien. Prueba con inset34 valida root dentro de zona segura; revision telefono pendiente.

D-067 revision expresamente autorizada en voz: retirar giro/gesto de inclinacion en ambas mesas, conservandolas planas (sustituye D-065 perspectiva). Mantener zona segura Poker, confirmada en telefono, y ampliar espacio de texto Blinds para no truncarlo. Excepcion visual Domino: solo Next round adopta aspecto dorado All-in, sin modificar logica, otros controles ni animaciones. Evidencia/pendientes en CONTEXTO; sin commit/push.
D-067 ampliacion visual puntual autorizada: Draw de Domino adopta el mismo estilo casino dorado aplicado a Next round/All-in. Se activa solo con stock disponible; Pass y logica de robo permanecen intactos. TypeScript pasa; aspecto fisico pendiente.
D-067 excepcion visual expresa adicional: aumentar ligeramente fichas centrales Domino; chainMetrics half36->40 (~11%). Espaciado, bounds, destinos/drag y camara usan mismas metricas; mano/rival permanecen intactos. Prueba de legibilidad compara tamano renderizado en lugar de escala relativa anterior.21 pruebas de layout/camara/drop y TypeScript pasan; telefono pendiente.
D-067 refinamiento autorizado: elevar ligeramente texto de ciegas Poker tras persistir solapamiento fisico; desplazar franja informativa12px, bandeja confirmada bien permanece. Pendiente comprobacion del usuario.

## D-068 — Guardar y enviar posible candidato, APK de prueba (2026-10-04)
Fuente: autorizacion explicita en voz tras confirmar Blinds correcto. Guardar todos los cambios y hacer push; preparar APK Android instalable para revision fisica. No solicita publicar tiendas ni aumentar version. Usar perfil preview existente (internal, apk), cuenta/proyecto actuales; mantener version1.0.13/versionCode26. Pruebas252/252 y TypeScript actuales; APK instalado sigue pendiente. Propuestas de auditoria sin implementar.
