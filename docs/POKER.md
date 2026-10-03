# Texas Hold’em local — primera mesa jugable

2026-10-03. Alcance aprobado por voz: uno contra uno, usuario y rival elegido, dealer visual que no apuesta; no-limit con fichas virtuales. Se conservan fondo, paleta y personajes de Domino. El selector muestra el juego de destino y requiere Cancelar/Cambiar.

## Reglas implementadas

- 1.000 fichas iniciales por jugador; ciegas 10/20. El botón rota entre manos. Botón = ciega pequeña, primero preflop y último postflop.
- Baraja de 52, dos cartas privadas por jugador, flop/turn/river con carta quemada. Evaluación de la mejor mano de cinco entre siete, as bajo, desempates y reparto del bote.
- Fold/check/call/raise-to/all-in; subida mínima basada en último incremento completo. Devuelve apuestas no igualadas; heads-up no necesita botes laterales multijugador.
- Rival casual, sin acceso a cartas humanas ni baraja a través del contrato de observación. No es un solver ni una simulación profesional.
- Dos partidas independientes en memoria del proveedor de la aplicación. Cambiar modo las conserva y pausa la CPU; cerrar/reiniciar la app no garantiza persistencia. No se implementó guardado permanente ni juego en red.

## Archivos

`src/poker/engine.ts`: reglas y observación del rival. `PokerScreen.tsx`: presentación, apuestas y pausas. `PlayingCard.tsx`: cartas y movimiento reducido. `TableGameContext.tsx`: estado y confirmación. `App.tsx`: proveedor y ruta. El acceso se inserta bajo el selector de personajes en `src/screens/ComputerGameScreen.tsx`.

Arte: `assets/poker-dealer-v1.png`, generado para este proyecto. El resto de personajes y fondo se reutilizan sin modificación. Los sonidos de Domino aprobados permanecen separados.

## Evidencia y límites

Tres pasadas: reglas/TDD, integración visual y revisión de continuidad/responsividad. 56 pruebas del bloque combinado pasan; incluyen 2.000 manos con acciones legales variadas, conservación de fichas y finalización, además de 100 manos con el rival. TypeScript y diff check pasan. Bundle Android responde HTTP 200.

Navegador local: comprobados Cancelar y Cambiar, apertura de póker, call/flop, all-in/showdown, devolución a Domino manteniendo su mano y regreso a Poker manteniendo cartas/saldos. Revisado a 390×844 y 360×640. Evidencia local: `.release-audit/poker-compact-2026-10-03.jpg`. No equivale a validación Android/iOS física ni a revisión de tienda. El usuario aún no ha aprobado visualmente Poker.

Referencias de reglas: [Hold’em](https://www.pokerstars.com/poker/games/texas-holdem/) y [ciegas heads-up/subidas](https://www.pokerstars.com/help/articles/poker-rules-master/229151/). Consultadas 2026-10-03.

## Prueba física pendiente

Abrir Expo Go, entrar a la mesa Domino, tocar cartas bajo el selector del rival. Cancelar debe conservar Domino; Cambiar abre Poker. Jugar, alternar de nuevo y comprobar estado. Validar cartas, teclado de apuestas, animación y legibilidad en el teléfono. El respaldo previo a Poker está en `.release-audit/domino-checkpoint-2026-10-03.zip`; conserva cambios locales, no es una copia completa del repositorio.

### Refinamiento visual del 3 de octubre
La figura completa del dealer queda sustituida por DealerHands, con carta sostenida hasta el gesto de soltar; se omite con movimiento reducido. Chips vectoriales con denominaciones, reverso rojo tramado y retratos rel iluminados transparentes exclusivos de poker. Saldos laterales independientes de manos centradas; panel superior derecho para bote/fase/mano. Barra de una fila con rueda vertical de importe; reiniciar desde reglas. Validado tipo y 11 pruebas motor/importe; distribucion compacta inspeccionada en navegador. Validacion fisica y naturalidad del gesto pendientes.
