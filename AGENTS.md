# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Play Domino congelado — decisión del usuario, 2026-10-03

Play Domino se considera finalizado. No modificar su comportamiento, apariencia, audio, reglas ni recursos, directa o indirectamente, hasta que el usuario lo autorice explícitamente de nuevo. El trabajo en Poker o Blackjack no autoriza cambios en Domino.

Al trabajar en otros juegos, preservar Domino también en componentes compartidos: aislar los cambios y verificar regresiones cuando afecten dependencias compartidas. No crear refactors o abstracciones solo por este congelamiento. El checkpoint incluye las dependencias de navegación y Poker necesarias para conservar los selectores actuales de Domino; esto no congela Poker ni Blackjack. Conservar sin descartar el trabajo fuera del commit.

Esta regla se carga con este AGENTS.md y los documentos de continuidad del repositorio; no es un bloqueo técnico automático ni se propaga a otros entornos. El check-in local está autorizado para Domino; no implica push, publicación ni autorización para empezar otro juego. Véase D-047 en docs/DECISIONES.md.

Excepción explícita posterior, 2026-10-03 (D-049): el usuario autoriza también en Domino sustituir el botón independiente de cambiar rival por tocar el avatar para abrir el mismo selector. Solo este acceso cambia; no reabre el resto de Domino ni autoriza modificar audio, reglas, bebidas o reparto.

Excepción explícita adicional, 2026-10-03 (D-052): corregir únicamente la apertura: el doble más alto decide quién inicia; solo si ninguno tiene dobles se compara la ficha de mayor suma (desempate existente por extremo mayor). El derecho de salida permite jugar cualquier ficha de la mano. No cambia otras reglas, audio, animaciones, layout o recursos; sin nuevo commit/push autorizado.

## Continuidad del proyecto

Al iniciar cada sesión en este repositorio, antes de proponer cambios:

1. Lee `docs/CONTEXTO.md` y `docs/DECISIONES.md`, y las referencias pertinentes que enlazan. Conserva los documentos históricos de release; no crees otro estado o registro paralelo. Si aparecen convenciones CompanyOS aplicables, léelas y reconcilia los documentos equivalentes sin borrar contenido ni duplicarlos.
2. Contrasta lo escrito con el repositorio real: `git status --short`, rama, HEAD, diff pendiente y archivos relevantes. Un documento describe evidencia fechada, no garantiza el estado actual. No confundas refs locales del remoto con una comprobación de GitHub en vivo.
3. Señala discrepancias, datos desconocidos y validaciones antiguas. Preserva cambios existentes. Distingue pruebas estáticas, pruebas con mocks, navegador y confirmación física del usuario. No supongas arquitectura ni conversaciones ausentes.
4. Aplica decisiones aprobadas dentro del alcance autorizado. Propuestas e ideas no autorizan implementación; tampoco una lista de pendientes autoriza despliegues, cambios de versión o publicación.

Tras avances o decisiones importantes, al cerrar una sesión de trabajo de forma explícita, al finalizar un bloque de trabajo relevante o cuando el usuario diga «guardar contexto» (respetando instrucciones de solo lectura y permisos):

- Actualiza `docs/CONTEXTO.md`: fecha, objetivo, estado observado, completado y evidencia, pendientes, bloqueos y próximo paso; incluye archivos/commits y cambios aún sin commit.
- Actualiza `docs/DECISIONES.md` solo si hay decisiones, propuestas, ideas o resúmenes nuevos. Incluye fuente, motivo conocido y estado; conserva decisiones anteriores y marca las sustituidas con referencia a su reemplazo.
- Integra resúmenes de Doti según el proceso de ese registro. No inventes acceso al historial ni sincronización automática.
- Verifica enlaces locales, `git diff --check` y el alcance del diff. Informa qué quedó guardado en disco y qué tiene commit/push. Guardar contexto no implica por sí solo commit, push ni publicación.
- Mantén las notas breves; enlaza evidencia existente en vez de copiarla completa. No guardes secretos ni transcripciones privadas completas innecesarias.

### Alcance real de estas instrucciones

El contexto y el registro de decisiones pertenecen exclusivamente a este proyecto. No copies datos, estado, historial ni decisiones de otros proyectos, ni exportes los de este proyecto a instrucciones globales. El patrón global solo contiene reglas de trabajo; se aplica al trabajar en cada proyecto, sin recorrer otros repositorios. Si este repositorio incorpora varios proyectos, respeta sus documentos e instrucciones específicas y evita mezclar sus registros. Para resúmenes Doti, incorpora únicamente contenido atribuible a este proyecto según `docs/DECISIONES.md`.

AGENTS.md es una instrucción para el agente cuando el entorno la carga para este proyecto; no es un servicio ni un hook de cierre. Los documentos se leen por estas instrucciones, no se sincronizan solos. Si se cierra la app, se interrumpe el proceso o falta permiso de escritura, no se garantiza una actualización final: informa la limitación si puedes y reconcilia en la siguiente sesión. No hay tarea programada ni integración Doti creada por este archivo. Referencia: https://learn.chatgpt.com/docs/agent-configuration/agents-md

Excepcion adicional autorizada 2026-10-03 (D-055): mejora de estrategia interna del rival Domino, usando solo mano propia y cadena publica; no autoriza cambiar reglas, apariencia ni audio. Implementacion conserva apertura D-052. Futuras tareas Blackjack no amplian esta excepcion.

## Candidato congelado tras check-in — 2026-10-05

Al completar las verificaciones y el check-in local autorizados del candidato actual, no cambiar codigo de este proyecto sin pedir y obtener autorizacion humana previa explicita. Lecturas y pruebas siguen permitidas; pendientes e ideas no autorizan implementaciones. Regla vigente y fuente en [docs/DECISIONES.md](docs/DECISIONES.md#2026-10-05--candidato-y-congelamiento-del-codigo-tras-check-in). Conserva el historial de excepciones Domino; no aplica a otros proyectos.
