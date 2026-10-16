// Injected inside the existing viewer closure: reuse its data helpers and history reader.
var watchHistoryState = {key:null,records:[],status:'idle',stop:null,epoch:0,open:false};
if (watchHistoryFixture) document.getElementById('watch-fixture-label').hidden=false;
function toggleWatchHistory() {
  var state=watchHistoryState, panel=document.getElementById('watch-results-panel'), button=document.getElementById('watch-history');
  state.open=!state.open;
  livePage.classList.toggle('history-open',state.open);
  panel.hidden=!state.open;
  button.setAttribute('aria-expanded',String(state.open));
  if(state.open) syncWatchHistory();
  else {
    if(panel.contains(document.activeElement)) button.focus({preventScroll:true});
    stopWatchHistorySubscription();
  }
}
function stopWatchHistorySubscription() {
  watchHistoryState.epoch++;
  if (watchHistoryState.stop) watchHistoryState.stop();
  watchHistoryState.stop = null;
  watchHistoryState.key = null;
  watchHistoryState.records = [];
  watchHistoryState.status = 'idle';
}
function renderWatchHistory() {
  var es = watchLang === 'es', state = watchHistoryState;
  var list = document.getElementById('watch-results');
  var status = document.getElementById('watch-results-status');
  document.getElementById('watch-results-title').textContent = es ? 'Historial de partidas' : 'Match history';
  var records = state.records.filter(function(record){return record.finishedAt!=null;});
  var current = followedGameRecord();
  // A shared archive has its own match IDs; do not duplicate the current result under its live code.
  if (!state.key && current && completedWinner(currentGame)) records = [current].concat(records);
  status.textContent = state.status === 'loading' ? (es ? 'Cargando historial compartido…' : 'Loading shared history…')
    : state.status === 'error' ? (es ? 'No se pudo cargar el historial compartido. El marcador sigue disponible.' : 'Shared history could not be loaded. The scoreboard is still available.')
    : state.status === 'unshared' ? (es ? 'Esta partida no comparte resultados anteriores.' : 'Previous results are not shared with this game.')
    : records.length ? (es ? 'Resultados compartidos · más recientes primero' : 'Shared results · latest first')
    : (es ? 'Aún no hay partidas terminadas compartidas.' : 'No completed shared games yet.');
  status.hidden=state.status==='ready'&&records.length>0;
  list.innerHTML = records.map(function(record) {
    var teams = record.teams || [], totals = recordTotals(record), winner = teams.find(function(team) {return team.id === record.winnerTeamId;});
    var time=record.createdAt == null?record.finishedAt:record.createdAt;
    var date = time == null ? '' : new Date(Number(time)).toLocaleDateString(es?'es':'en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    return '<article class="watch-result"><div class="watch-result-head"><span>'+(winner?(es?'Ganador':'Winner')+': <b>'+esc(historyTeamName(winner,teams.indexOf(winner),HS()))+'</b>':(es?'Sin ganador registrado':'No winner recorded'))+'</span><time>'+esc(date)+'</time></div>'
      + '<div class="watch-result-pair">'+teams.slice(0,2).map(function(team,index) {return (index?'<span class="watch-result-divider" aria-hidden="true">—</span>':'')+'<div class="watch-result-side '+historyScoreClass(record,team,index,totals)+'"><b>'+esc(historyTeamName(team,index,HS()))+'</b><strong>'+Number(totals[index]||0)+'</strong><small>'+esc((team.players || []).filter(Boolean).join(' · '))+'</small></div>';}).join('')+'</div>'
      + '</article>';
  }).join('');
}
function syncWatchHistory() {
  var state = watchHistoryState, key = historySpaceForLiveGame();
  if (!state.open) return;
  if (watchHistoryFixture) {
    state.records = watchHistoryFixture;
    state.status = 'ready';
    document.getElementById('watch-fixture-label').hidden = false;
    renderWatchHistory();
    return;
  }
  if (state.key === key) {renderWatchHistory();return;}
  stopWatchHistorySubscription();
  state.key = key;
  state.status = key ? 'loading' : 'unshared';
  renderWatchHistory();
  if (!key) return;
  var epoch = state.epoch;
  function failed() {if (epoch !== state.epoch) return;state.status='error';renderWatchHistory();}
  try {
    Promise.resolve(window.subscribeToDominoHistory(key,function(records) {
      if (epoch !== state.epoch) return;
      state.records = records;
      state.status = 'ready';
      renderWatchHistory();
    },failed)).then(function(stop) {
      if (epoch !== state.epoch) {if(typeof stop === 'function') stop();return;}
      state.stop = typeof stop === 'function' ? stop : null;
    }).catch(failed);
  } catch (_) {failed();}
}
