const en = {
  title: 'Play Computer', human: 'Human players', computer: 'Computer', you: 'You',
  rules: 'Double-six · 1 vs 1 · 7 tiles each. In the first round, whoever holds the highest double starts, excluding the stock. Only if neither player has a double, the highest pip sum decides who starts; ties favor the higher end. The starter may play any tile from their hand. After that, the previous winner opens with any tile. After a tied round, use the first-round opening rule. Match either end. Draw until you can play; pass only with an empty stock. Empty your hand to score the opponent’s remaining pips. If blocked, fewer pips wins the difference; a tie scores zero. First to the target wins.',
  offline: 'Offline practice. This game stays in memory while the app is open and does not count toward shared matches or statistics.',
  yourTurn: 'Your Turn', thinking: 'Computer is thinking…', choose: 'Tap a highlighted tile to play.',
  chooseEnd: 'Choose where to place your tile:', left: 'Left', right: 'Right', cancel: 'Cancel',
  draw: 'Draw a tile', pass: 'Pass', stock: 'Stock', tiles: 'tiles', round: 'Round', target: 'Target',
  openFreely: 'opens with any tile',
  open: 'The starting player may open with any tile', played: 'played', drew: 'drew a tile', passed: 'passed',
  blocked: 'The table is blocked.', tie: 'Draw — no points.', wonRound: 'wins the round', wonMatch: 'wins the match!',
  points: 'points', next: 'Next round', again: 'Play again', resume: 'Resume computer game',
  showRules: 'Rules', hideRules: 'Hide rules', newGame: 'New computer game',
};
const es: typeof en = {
  title: 'Jugar contra PC', human: 'Jugadores humanos', computer: 'Computadora', you: 'Tú',
  rules: 'Doble seis · 1 contra 1 · 7 fichas por jugador. En la primera mano empieza quien tenga el doble más alto, sin contar el pozo. Solo si ninguno tiene dobles, la ficha de mayor suma decide quién empieza; si empatan, cuenta el extremo más alto. Quien empieza puede jugar cualquier ficha de su mano. Después sale quien ganó la mano anterior, con cualquier ficha. Tras una mano empatada se aplica la regla de salida de la primera mano. Une extremos iguales. Roba hasta poder jugar; pasa solo con el pozo vacío. Al quedarte sin fichas sumas los puntos restantes del rival. En un cierre, gana quien tiene menos puntos y suma la diferencia; un empate no puntúa. Gana quien llegue a la meta.',
  offline: 'Práctica sin conexión. La partida se conserva en memoria mientras la app esté abierta y no cuenta en partidas compartidas ni estadísticas.',
  yourTurn: 'Tu turno', thinking: 'La computadora está pensando…', choose: 'Toca una ficha resaltada para jugar.',
  chooseEnd: 'Elige dónde colocar la ficha:', left: 'Izquierda', right: 'Derecha', cancel: 'Cancelar',
  draw: 'Robar ficha', pass: 'Pasar', stock: 'Pozo', tiles: 'fichas', round: 'Ronda', target: 'Meta',
  openFreely: 'sale con cualquier ficha',
  open: 'Quien inicia puede abrir con cualquier ficha', played: 'jugó', drew: 'robó una ficha', passed: 'pasó',
  blocked: 'La mesa está cerrada.', tie: 'Empate: sin puntos.', wonRound: 'gana la ronda', wonMatch: 'gana la partida',
  points: 'puntos', next: 'Siguiente ronda', again: 'Volver a jugar', resume: 'Continuar contra PC',
  showRules: 'Reglas', hideRules: 'Ocultar reglas', newGame: 'Nueva partida contra PC',
};
export const COMPUTER_STRINGS = { en, es };
