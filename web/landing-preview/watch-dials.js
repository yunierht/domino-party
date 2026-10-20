// Web SVG adaptation of TrackingCounter's classic dial, using the viewer's score model.
var watchDialFractions = {};
var watchDialStyles=['robotic','speedometer','orbital'], watchDialColorOrder=['green','yellow','blue','red'];
var watchDialColors={yellow:'#D7A63D',green:'#65C59A',red:'#AA463B',blue:'#68B9F5'};
var watchDialAppearance={style:'robotic',teamAColor:'yellow',teamBColor:'red'};
try {
  var savedDials=JSON.parse(localStorage.getItem('domino-watch-dials-v1')||'null');
  if(savedDials){if(watchDialStyles.includes(savedDials.style))watchDialAppearance.style=savedDials.style;['teamAColor','teamBColor'].forEach(function(key){if(watchDialColorOrder.includes(savedDials[key]))watchDialAppearance[key]=savedDials[key];});}
} catch (_) {}
function updateWatchDialAppearance(key,values) {
  watchDialAppearance[key]=values[(values.indexOf(watchDialAppearance[key])+1)%values.length];
  try {localStorage.setItem('domino-watch-dials-v1',JSON.stringify(watchDialAppearance));}catch(_){}
  if(currentGame)renderWatchDials(currentGame);
}
function renderWatchDials(game) {
  (game.teams || []).slice(0,2).forEach(function(team,index) {
    var key=index?'b':'a', host=document.getElementById('team-'+key+'-score');
    var score=teamTotal(game,team.id), target=Number(game.targetScore||0), remaining=Math.max(0,target-score);
    var style=watchDialAppearance.style, speedometer=style==='speedometer',orbital=style==='orbital';
    var colorKey=index?'teamBColor':'teamAColor',color=watchDialColors[watchDialAppearance[colorKey]];
    host.style.color=color;
    host.dataset.dialStyle=style;
    var fraction=target>0?Math.min(1,Math.max(0,score/target)):0;
    var length=speedometer?Math.PI*92*1.5:orbital?Math.PI*(3*(85+62)-Math.sqrt((3*85+62)*(85+3*62))):Math.PI*146;
    var previous=watchDialFractions[team.id] == null ? fraction : watchDialFractions[team.id];
    watchDialFractions[team.id]=fraction;
    var marks=Array.from({length:speedometer?21:40},function(_,i){
      var major=i%5===0, angle=(speedometer?-135+i*13.5:i*9)*Math.PI/180, start=speedometer?(major?70:78):(major?91:94),end=speedometer?85:98;
      return '<line x1="'+(100+Math.sin(angle)*start)+'" y1="'+(100-Math.cos(angle)*start)+'" x2="'+(100+Math.sin(angle)*end)+'" y2="'+(100-Math.cos(angle)*end)+'" stroke="'+(major?(speedometer?'#F5F0E4':'currentColor'):'#657682')+'" stroke-width="'+(major?1.8:1)+'"/>';
    }).join('');
    host.setAttribute('role','img');
    host.setAttribute('aria-label',team.name+': '+score+' / '+target+'; '+remaining+(watchLang==='es'?' para ganar':' to win'));
    host.innerHTML='<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><defs><radialGradient id="watch-dial-'+key+'" cx=".34" cy=".24" r=".78"><stop offset="0" stop-color="#2B3540"/><stop offset=".65" stop-color="#151D26"/><stop offset="1" stop-color="#050A10"/></radialGradient></defs><circle cx="100" cy="100" r="98" fill="#0B141B" stroke="#75818B" stroke-width="1.5"/><circle cx="100" cy="100" r="84" fill="url(#watch-dial-'+key+')" stroke="#050A10" stroke-width="3"/>'+marks+'<circle cx="100" cy="100" r="60" fill="#111A23" stroke="#53616B" stroke-width="2"/><path d="M100 27 A73 73 0 1 1 99.999 27 Z" fill="none" stroke="#30404D" stroke-width="9"/><path class="dial-progress" d="M100 27 A73 73 0 1 1 99.999 27 Z" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="'+length+'" stroke-dashoffset="'+(length*(1-previous))+'" stroke-linecap="round"/></svg><span class="dial-values" aria-hidden="true"><strong>'+score+'</strong><small>'+remaining+'</small></span>';
    var arc=host.querySelector('.dial-progress');
    if(orbital){
      host.querySelector('svg').innerHTML='<defs><radialGradient id="orbital-'+key+'" cx=".34" cy=".24" r=".78"><stop offset="0" stop-color="#2B3540"/><stop offset=".65" stop-color="#151D26"/><stop offset="1" stop-color="#050A10"/></radialGradient></defs><ellipse cx="100" cy="100" rx="99" ry="65" transform="rotate(-16 100 100)" fill="#182638" stroke="#7399AC" stroke-width="2"/><ellipse cx="100" cy="100" rx="91" ry="61" transform="rotate(16 100 100)" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/><ellipse cx="100" cy="100" rx="77" ry="54" fill="url(#orbital-'+key+')" stroke="#526C80" stroke-width="2"/><path d="M100 38 A85 62 0 1 1 99.999 38 Z" fill="none" stroke="#30404D" stroke-width="9"/><path class="dial-progress" d="M100 38 A85 62 0 1 1 99.999 38 Z" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="'+length+'" stroke-dashoffset="'+(length*(1-previous))+'" stroke-linecap="round"/>';
      arc=host.querySelector('.dial-progress');
    } else if(speedometer) {
      var svg=host.querySelector('svg');
      svg.querySelector('circle[r="84"]').setAttribute('r','90');
      svg.querySelector('circle[r="60"]').remove();
      var paths=svg.querySelectorAll('path');
      paths.forEach(function(path){path.setAttribute('d','M34.946 165.054 A92 92 0 1 1 165.054 165.054');path.setAttribute('stroke-width','5');});
      var scale=[25,50,75].map(function(value){var angle=(-135+value*2.7)*Math.PI/180;return '<text x="'+(100+Math.sin(angle)*56)+'" y="'+(105-Math.cos(angle)*56)+'" text-anchor="middle" fill="#E9E7DF" font-size="14">'+Math.round(target*value/100)+'</text>';}).join('');
      svg.insertAdjacentHTML('beforeend',scale+'<g transform="rotate('+(-135+fraction*270)+' 100 100)"><path d="M97 101 L98 39 L100 30 L102 39 L103 101 Z" fill="currentColor"/><line x1="100" y1="100" x2="100" y2="43" stroke="#FFF4D8" stroke-width="1" opacity=".7"/></g><circle cx="100" cy="100" r="6" fill="#ADB8C0" stroke="#091018" stroke-width="2"/><rect x="50" y="125" width="100" height="52" rx="9" fill="#0B131B" stroke="#43505C"/>');
      arc.setAttribute('stroke-dasharray',String(length));
      arc.setAttribute('stroke-dashoffset',String(length*(1-previous)));
    }
    requestAnimationFrame(function(){arc.style.strokeDashoffset=String(length*(1-fraction));});
    var card=document.getElementById('team-'+key+'-card'),controls=card.querySelector('.dial-controls');
    card.style.setProperty('--dial-color',color);
    if(!controls){
      controls=document.createElement('div');controls.className='dial-controls';
      controls.innerHTML='<button type="button" class="dial-color"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1 1 0 0 1 1-1.7h2A4 4 0 0 0 21 12a9 9 0 0 0-9-9Z"/><circle cx="7" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/></svg></button><button type="button" class="dial-shape"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18a9 9 0 1 1 16 0M12 13l5-5M6 14h1M17 14h1M12 5v1"/><circle cx="12" cy="13" r="1"/></svg></button>';
      controls.querySelector('.dial-color').addEventListener('click',function(){updateWatchDialAppearance(colorKey,watchDialColorOrder);});
      controls.querySelector('.dial-shape').addEventListener('click',function(){updateWatchDialAppearance('style',watchDialStyles);});
      card.appendChild(controls);
    }
    controls.querySelector('.dial-color').style.setProperty('--dial-choice',color);
    controls.querySelector('.dial-color').setAttribute('aria-label',(watchLang==='es'?'Cambiar color de ':'Change color of ')+team.name+': '+watchDialAppearance[colorKey]);
    controls.querySelector('.dial-shape').setAttribute('aria-label',(watchLang==='es'?'Cambiar marcador: ':'Change counter style: ')+style);
  });
}
