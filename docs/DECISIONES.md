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
