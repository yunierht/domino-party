# Domino Online — backend local aislado

Primer bloque autorizado el 2026-10-08. Worker/DO propio; sin cuenta, login, despliegue, DNS, hosting ni Firebase. No tiene rutas/assets del sitio existente. `LOCAL_ONLY` rechaza hosts públicos; habilitar producción requiere otro alcance/diseño. No es release ni piloto de teléfonos.

Desde esta carpeta, Node 24 y dependencias del lockfile:

```powershell
npm ci
npm run types
npm run check
npm test
```

`npm run dev:local` abre solamente runtime local en puerto8791; no hace falta dejarlo activo para las pruebas. En Windows sandbox puede requerir permiso de ejecutar workerd/loopback. Wrapper Wrangler desactiva métricas y escribe logs dentro de `.local`. `node_modules`, bundles/runtime/logs y estado local están excluidos por el gitignore propio. No cambiar package/lockfile/config de la app para ejecutar este backend.

## Fronteras y protocolo v1

- [room.ts](src/room.ts): políticas de sala, identidad por hash de credencial, presencia y proyección; importa únicamente el [motor puro existente](../../src/computer/engine.ts). Sin Firebase/React/transporte; el motor original no se modifica ni ejecuta IA Online.
- [protocol.ts](src/protocol.ts): validación acotada y aleatoriedad segura. `createGuestCredential()` genera secreto32bytes; guardar de forma segura en cliente **antes** de crear/unirse. Este bloque no implementa almacenamiento nativo: perder secreto impide recuperar asiento. Un secreto por sala; no usuario Prime/cuenta. Servidor conserva hash, nunca secreto.
- [worker.ts](src/worker.ts): Worker de entrada y DO SQLite por código, transacción de estado+recibo+alarma, WebSockets con vistas por asiento. Asientos estables `human`=anfitrión, `computer`=segundo humano; son etiquetas heredadas del motor, no IA ni nombres identificadores.
- [wrangler.jsonc](wrangler.jsonc): config independiente, sin rutas, assets, accountId, dominios, credenciales o bindings remotos. Tipos generados por Wrangler en worker-configuration.d.ts.

HTTP siempre lleva `Authorization: Bearer <secreto hex de64caracteres>`; no secreto en query/enlace. POST JSON máximo8192bytes; errores estructurados sin estado privado ni stacks.

| Ruta | Acción |
| --- | --- |
| `GET /health` | Salud del backend local, independiente de tracking |
| `POST /rooms` | `{name,target?,mode?}`; código derivado criptográficamente por servidor, reserva atómica y retry estable para misma credencial |
| `POST /rooms/{code}/join` | `{name}`; reserva segundo invitado pendiente de aprobación, rechaza tercero |
| `GET /rooms/{code}` | Snapshot de mesa pública y mano **propia**, solo miembros |
| `POST /rooms/{code}/commands` | `{commandId,epoch,revision,round,type,...}`: approve/start/play/draw/pass/nextRound |
| `POST /rooms/{code}/heartbeat` | `{}` renueva lease y reconecta antes del vencimiento |
| `POST /rooms/{code}/disconnect` | `{}` señal explícita de pérdida/salida; pausa sin otorgar puntos |
| `GET /rooms/{code}/socket` | Upgrade WebSocket autenticado; snapshots propios, mensajes `{type:"heartbeat"}` |

Play lleva tileId/end; draw lleva slot opaco devuelto por snapshot; pass solo cuando pozo agotado y sin jugada. Código no autentica ni da membresía. Reintentar mismo comando devuelve mismo ACK antes de comprobar revisión; diferente payload con mismo ID falla. Un ACK repetido puede ser histórico: cliente debe respetar revisión y pedir snapshot actualizado. Vista rival no incluye mano, stock real, orden/semilla, last.tile de robo ni hash de credencial.

## Defaults locales de diseño, pendientes de ratificación de producto

Reglas Domino conservadas. Lease30s renovable (cliente futuro debe emitir heartbeat antes); pérdida detectada por cierre/error del socket o vencimiento del lease. Grace120s desde ese instante **lógico de detección servidor**, no desde pérdida física de red; alarmas tardías no amplían derecho a reconectar. Acciones/avance de ronda pausados; si cualquiera no vuelve se cierra sala/partida sin ganador nuevo, preservando puntos ya liquidados. Si ambos faltan el servidor cierra solo. Salida explícita usa misma gracia; background sin heartbeat expira lease. No distingue automáticamente outage del proveedor de abandono humano.

Aprobación explícita del anfitrión para el segundo invitado; siguiente ronda requiere ambos ready, sin temporizador competitivo ni cambio a apertura/puntuación. Sala sin empezar expira15min. Código10hex no se reutiliza en este bloque; misma credencial recupera misma sala, nueva sala requiere nuevo secreto. Son defaults revisables de backend local, no acuerdos humanos inventados; inicio exacto de grace y políticas de aceptación/background siguen sujetos a revisión.

Una conexión nueva reemplaza la anterior del mismo asiento; callback de cierre antiguo no pausa la nueva. Alarma duradera y estado/recibos se escriben en la misma transacción SQLite. Restaurar runtime no requiere manos del cliente; ni setTimeout del teléfono ni memoria de DO son autoridad. Observabilidad desactivada localmente para evitar logging de credenciales; antes de remoto diseñar logging redactado y métricas.

## Evidencia y límites

Pruebas de dominio contrastan veinte partidas deterministas con motor offline y privacidad, apertura libre, pausa/rejoin/cierre. Integración ejecuta workerd/SQLite real local: dos clientes HTTP/WebSocket, ronda completa, carreras y ACK perdido, hostile payload, reinicio del runtime y alarma. La prueba de alarma usa **subclase solo de test con fechas envejecidas** para activar alarma real sin esperar150s; no existe endpoint/hook de reloj/admin en bundle normal.

Sin llamadas externas en Worker; sin imports de tracking/Firebase. `LOCAL_ONLY` y límites locales no constituyen hardening público: antes de despliegue faltan protección de abuso global/IP/creaciones/códigos, retención/borrado de salas cerradas, token lifecycle/almacenamiento nativo, rechazo de invitado pendiente y políticas finales de sesión. Límite120requests/min por asiento autenticado y4096recibos/sala acotan operaciones locales; no son dimensionamiento aprobado. No borrar recibos silenciosamente y ejecutar comandos antiguos otra vez.

Miniflare instalado es5.20261006.1-alpha (también dependencia de Wrangler4.149.0); harness usa conversión de opciones V4 y paths persistentes explícitos V5. Lockfile fija tooling. Persistencia real local no certifica backups/cloud; mocks/runtime local no son red/dispositivo/coste de producción. UI, enlace/install real, SecureStore, piloto remoto, medición Firebase y despliegue quedan fuera de este bloque. La selección posterior de Cloudflare no exige construir Firebase ahora.

Continuidad/alcance humano: [CONTEXTO](../../docs/CONTEXTO.md), [DECISIONES](../../docs/DECISIONES.md), [plan](../../docs/PLAN_DOMINO_ONLINE_2026-10-08.md).

## Extensión local de invitación y preview — 2026-10-08

El bloque anterior documenta el backend inicial. ON-D-008/009 autorizan su cliente local: crear con `invitation: {avatar}` preautoriza al segundo asiento; unirse con `acceptInvitation: true` y `avatar` reparte inmediatamente si el anfitrión está presente. La operación es atómica e idempotente; no traslada el juego AI. Solo estas salas incluyen `presentation` con avatares públicos y ficha de apertura. Las salas diagnósticas antiguas mantienen aprobación/ready y su contrato anterior. ON-D-011 modifica siguiente ronda en salas de invitación: un solo comando de cualquiera de los dos jugadores reparte, sin duplicar por carreras/reintentos; partida completa no admite siguiente ronda.

Desde esta carpeta, `node scripts/friend-preview.mjs` compila y sirve la simulación desde Home en puerto8099; requiere `npm run dev:local` en8791. No sustituye el preview diagnóstico8098. Dos iframes usan sesiones independientes. Componentes visuales y audio de fichas reales; adaptadores solo del harness excluyen Firebase y música y sustituyen almacenamiento general. Prueba de navegador no certifica teléfono ni despliegue.

Actualización de prueba2026-10-09 (ON-D-018): el arnés ya no sustituye almacenamiento general; usa `src/storage/storage.ts` y AsyncStorage web real (localStorage). Preferencias/foto sobreviven recarga por origen; GameContext tracking sigue sustituido y Firebase excluido. Este ajuste permite verificar persistencia web sin cambiar producto. Cámara/foto personal no usada; fixture sintético para preview/guardar/aplicar, recarga y recuperación de sala local comprobados en CONTEXTO.

Evidencia posterior: 12tests dominio y8integración local workerd/SQLite; tras simplificar invitación, cliente yUI incluidos en409tests raíz, TypeScript aprobado. Menú Invitar amigo muestra código directamente; Aceptar invitación pide solo código. Invitación activa al volver a AI, aceptación abre ambos asientos automáticamente; recuperación conserva identidad y no reparte de nuevo. Recorrido visual Juni/Andy y dos colocaciones sincronizadas, con capturas/riesgos descritos en CONTEXTO. Credenciales web por sessionStorage; nativas por SecureStore aún sin prueba física. No push, dominio, cuentas ni publicación modificados.

### Reloj de turno optativo para clientes nuevos

ON-D-012: nueva interfaz crea con `invitation: {avatar, turnTimer:true}`. Solo ese opt-in activa30s autoritativos; salas guardadas y clientes anteriores permanecen sin reloj. `presentation.turnClock` comunica duración, restante, deadline, hora servidor y pausa; sin ronda activa es null. La interfaz dibuja un aro bajo el avatar sobre madera usando tiempo monotónico, sin adjudicar turnos localmente.

`pauseTurnTimer`/`resumeTurnTimer` son comandos idempotentes autorizados solo al dueño del turno. Pausan el reloj, no impiden jugar; cambiar turno/ronda reinicia30s, robar no. Desconexión congela restante a la detección lógica y conserva gracia120s; pausa manual persiste al reconectar/reiniciar. Sin máximo de pausa manual acordado. Vencimiento en alarma/transacción cambia turno una vez, sin mover fichas/puntos ni simular bloqueo. Reloj vencido precede validación de comandos; carreras no permiten jugar fuera de turno. Alarma tardía no consume varios turnos que los jugadores no vieron.

Validación posterior:21tests dominio y10integraciones reales workerd/SQLite, incluida persistencia del reloj y recibos tras reinicio;418tests raíz y TypeScript aprobados. Conteos anteriores son historial de bloques previos; no prueba física de teléfono, audio o redes remotas.

### Pozo, resultado y avisos posteriores

ON-D-013: `openBoneyard` reinicia30s y pausa hasta primer `draw`; `cancelBoneyard` reanuda si no se eligió. Robos posteriores no reinician. Invitaciones nuevas usan además `autoNextRound:true` y `quickActions:true`: resultado autoritativo3s, `holdResult`/`releaseResult` con último hold liberado, pausa por ausencia y recuperación persistente. `presentation.resultClock` solo aparece para clientes capaces; partida completa no reparte otra ronda.

`attention` con `kind: wave|knock|look` solo desde quien espera, ambos presentes, cooldown3s privado (ON-D-014 sustituye10s). `presentation.attention` contiene evento efímero3s únicamente para esa capacidad. Acción válida del receptor o cambio de turno/ronda elimina evento sin borrar cooldown; UI descarta al intentar jugar/robar/pasar y cancela sonido pendiente. Sin cambios de manos, puntos o reloj por avisos. Validación del bloque original32dominio+13integraciones reales y440tests raíz; ajuste3s con32dominio+22UI/banner y TypeScript aprobado, evidencia navegador en CONTEXTO.
