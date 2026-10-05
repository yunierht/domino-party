# Blackjack local

Implementado el 2026-10-03 por peticion explicita. Motor y contexto independientes en `src/blackjack`; integra rutas `blackjackLobby` y `blackjackTable` en App/Nav. Reutiliza sin editar el tema, retratos y PlayingCard de Poker. Seleccion de dealer y nombre propios; volver/cambiar de juego conserva la ronda mientras la app este abierta. No persistencia tras cerrar el proceso.

Reglas elegidas para esta primera implementacion: una baraja nueva de 52 cartas por ronda, reparto alterno jugador/dealer, ases 1/11 y figuras 10. Natural solo en las dos primeras cartas; ambos naturales empatan. Pedir/plantarse; 21 pasa automaticamente al dealer. Bust humano termina inmediatamente. Dealer pide por debajo de 17 y se planta en todo 17 (S17); su politica consulta exclusivamente sus propias cartas. Empatan totales iguales. Carta tapada y total del dealer ocultos durante el turno humano; ambos se revelan al terminar ese turno. Sin apuestas, pagos, seguro, doblar ni dividir en este alcance. Personaje es dealer, no un tercer asiento.

Pantalla ES/EN con mesa verde, oro, cartas y retrato coherentes con Poker. Reparto bloquea acciones; modal de reglas, cambio de juego e inactividad pausan timers del dealer. PlayingCard conserva su soporte de movimiento reducido. No audio nuevo.

Validacion: TDD motor 8 fallos por comportamiento con stub antes de implementar; pruebas renderer de pantalla escritas antes de pantalla. 205/205 pruebas completas posteriores, incluidos 500 rounds simulados, ases multiples, dealer multietapa, naturales, empates, turno invalido, agotamiento, conservacion de cartas, carta oculta, bloqueo, pausa y retencion de contexto. Renderer usa dobles nativos: no equivale a telefono. `npx tsc --noEmit` pasa. `npx expo export --platform android --output-dir .release-audit/blackjack-android` genera bundle Hermes local; no APK/AAB distribuible. Evidencia local: `.release-audit/blackjack-red.log`, `blackjack-ui-red.log`, `blackjack-regression.log`, `blackjack-android.log`. Expo v56 exacta consultada antes del codigo: https://docs.expo.dev/versions/v56.0.0/ ; dependencias Expo57 existentes se conservan.

Pendiente: apariencia/interacciones en dispositivo Android y validacion iOS. No commit, push ni publicacion. Domino/Poker conservan sus cambios previos sin nuevas ediciones en sus archivos de juego.

## Revision adicional

Navegador local Expo8093: comprobados Home/lobby, carta tapada, pedir/bust, plantarse/dealer multietapa, nueva ronda, cambio a Poker y retorno con la misma ronda. Revisado a390x844 y320x568. Acciones ahora fijas al pie; mesa desplazable en compactos. Texto de reglas desplazable con altura acotada. Capturas locales: `.release-audit/blackjack-mobile.png`, `.release-audit/blackjack-compact.png`.

Suite final213/213, TypeScript y bundleAndroid final pasan. Pruebas nuevas cubren background/reactivacion, hardwareBack, cancelacion/confirmacion de cambio, lobby nuevo/resume ES/EN y perfil independiente. Evidencia de navegador no equivale a validacion fisica ni iOS. Version lista para prueba en Expo, sin commit/push/build distribuible/publicacion.

## Estado vigente al cierre del 2026-10-04

Las secciones anteriores describen checkpoints historicos; este estado sustituye «sin apuestas», «no audio nuevo» y controles inferiores. La sesion actual usa fichas virtuales y apuestas10 o mas, en multiplos de10; pagos1:1 y natural3:2, credito calculado una sola vez por session.ts. No dinero real, split/double/insurance. Bandeja inferior visible solo denominaciones, Clear junto a apuesta central con marca tenue, Deal/Hit/Stand laterales siempre visibles y ancho112; habilitados por fase. Vuelos de fichas al apostar/cobrar, saldo progresivo y apuesta central0 al finalizar cobro. Cartas reutilizan sonido Poker; fichas usan Casino Audio de Kenney CC0. Silenciamiento respeta tileSound existente. Usuario reporto ausencia temporal del sonido y luego confirmo que regreso; no se demostro causa nativa.

Poker tambien fue autorizado y adaptado en D-058/D-059: no atribuir sus cambios a la implementacion inicial aislada. Domino conserva freeze y su diff previo. Evidencia actual232/232 pruebas, TypeScript y export Android local en .release-audit/blackjack-reference/android; capturas actualizadas poker-mobile.png/blackjack-mobile.png alli. Cierre y paso para manana en CONTEXTO.md, D-057 a D-059 en DECISIONES.md. Confirmacion fisica del ultimo layout pendiente; cambios en disco sin commit/push/publicacion. Expo LAN8092 activo al cierre, verificar antes de reutilizar manana.

### Vista y transicion entre juegos (2026-10-04, D-064)
Flechas superiores ajustan perspectiva del tablero entre0 y20 grados, inicialmente6; bandeja y acciones quedan estables. Poker usa la misma baraja clasica, borde de madera y estilo de grabado, conservando su distribucion de cartas/reglas. Blackjack separa cartas dealer del grabado y muestra resultados debajo con pulso suave; no muestra barra de scroll horizontal ni total del jugador vacio. Validacion navegador390x844 y236 pruebas; pendiente confirmacion fisica.
