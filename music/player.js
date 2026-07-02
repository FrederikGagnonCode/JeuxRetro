/* ════════════════════════════════════════════════════════════════
   Lecteur de musique centralisé pour l'arcade rétro.
   À inclure dans n'importe quel jeu :
       <script src="../music/playlist.js"></script>
       <script src="../music/player.js"></script>
   Il injecte sa propre barre de contrôle (aucun HTML/CSS à dupliquer),
   mémorise le morceau/volume entre les jeux, et émet des événements :
       document 'arcademusic:play'  (detail = {name})
       document 'arcademusic:stop'
   pour que le jeu coordonne sa propre bande-son (ex. chiptune de Snake).
   API : window.ArcadeMusic = { isPlaying, hasSelection, resume, stop, play }
   ════════════════════════════════════════════════════════════════ */
(function () {
  if (window.ArcadeMusic) return;            // déjà chargé

  const LS = { song: 'arcadeMusicSong', shuffle: 'arcadeMusicShuffle',
               time: 'arcadeMusicTime', on: 'arcadeMusicOn', vol: 'arcadeMusicVol' };
  const AUDIO_EXTS = ['.mp3', '.m4a', '.wav', '.ogg', '.flac'];

  // PLAYLIST est un `const` global (déclaré dans playlist.js) : accessible par
  // référence directe, mais PAS via window.PLAYLIST. D'où le typeof.
  let playlist   = (typeof PLAYLIST !== 'undefined' ? PLAYLIST : []).slice();
  let shuffleMode = localStorage.getItem(LS.shuffle) === '1';
  let current     = -1;                       // index du morceau courant
  // choix auto d'un morceau au 1er geste (désactivable : window.ARCADE_MUSIC_AUTOSTART = false)
  const AUTOSTART = (window.ARCADE_MUSIC_AUTOSTART !== false);

  // les URLs de la playlist sont résolues par rapport à CE script (dossier music/),
  // pour fonctionner depuis le menu comme depuis les jeux, peu importe la profondeur.
  const SCRIPT_BASE = (document.currentScript && document.currentScript.src) || location.href;
  const resolveUrl = u => { try { return new URL(u, SCRIPT_BASE).href; } catch (e) { return u; } };

  const audio = new Audio();
  audio.volume = parseFloat(localStorage.getItem(LS.vol) ?? '0.7');

  /* ── styles ── */
  const css = `
  #arcade-music{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);
    z-index:9999;font-family:'Courier New',monospace;color:#eee;
    background:rgba(8,8,20,.92);border:1px solid #333;border-radius:10px;
    box-shadow:0 6px 24px rgba(0,0,0,.5);max-width:min(94vw,560px);}
  #arcade-music .am-head{display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;}
  #arcade-music .am-title{font-size:12px;letter-spacing:1px;color:#4ecca3;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis;flex:1;}
  #arcade-music .am-toggle{background:none;border:none;color:#888;font-size:14px;cursor:pointer;}
  #arcade-music .am-pausebtn{background:none;border:none;color:#4ecca3;font-size:15px;cursor:pointer;
    padding:0 2px;line-height:1;}
  #arcade-music .am-pausebtn:hover{color:#7df0c8;}
  #arcade-music .am-body{display:none;padding:0 10px 10px;}
  #arcade-music.open .am-body{display:block;}
  #arcade-music .am-row{display:flex;gap:6px;align-items:center;margin-top:6px;}
  #arcade-music select{flex:1;min-width:0;padding:6px 8px;background:#13132b;border:1px solid #333;
    border-radius:6px;color:#eee;font-size:12px;outline:none;cursor:pointer;font-family:inherit;}
  #arcade-music button.am-btn{padding:6px 9px;background:#4ecca3;color:#0b0b1a;border:none;
    border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;}
  #arcade-music button.am-btn:hover{background:#3bb890;}
  #arcade-music button.am-btn.off{background:#333;color:#999;}
  #arcade-music input[type=range]{width:90px;accent-color:#4ecca3;}`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;

  /* ── DOM ── */
  const root = document.createElement('div');
  root.id = 'arcade-music';
  root.innerHTML = `
    <div class="am-head">
      <span style="font-size:14px">🎵</span>
      <span class="am-title" id="am-now">Musique</span>
      <button class="am-pausebtn" id="am-pause" title="Lecture / Pause">▶</button>
      <button class="am-toggle" id="am-toggle" title="Afficher/masquer">▸</button>
    </div>
    <div class="am-body">
      <div class="am-row">
        <select id="am-select"></select>
      </div>
      <div class="am-row">
        <button class="am-btn" id="am-shuffle" title="Lecture aléatoire">🔀</button>
        <button class="am-btn" id="am-prev" title="Précédent">⏮</button>
        <button class="am-btn" id="am-next" title="Suivant">⏭</button>
        <button class="am-btn off" id="am-stop" title="Arrêter">⏹</button>
        <button class="am-btn" id="am-folder" title="Choisir un dossier de musique">📁</button>
        <input id="am-vol" type="range" min="0" max="1" step="0.05" title="Volume">
        <input id="am-folder-input" type="file" webkitdirectory multiple style="display:none">
      </div>
    </div>`;

  function mount() {
    document.head.appendChild(styleEl);
    // favicon commun (Space Invader) si la page n'en définit pas déjà un
    if (!document.querySelector('link[rel~="icon"]')) {
      const fav = document.createElement('link');
      fav.rel = 'icon'; fav.type = 'image/svg+xml';
      fav.href = resolveUrl('../favicon.svg');
      document.head.appendChild(fav);
    }
    document.body.appendChild(root);
    wire();
  }

  /* ── éléments ── */
  let elSelect, elNow, elShuffle, elStop, elVol;

  function fillSelect() {
    elSelect.innerHTML = '<option value="">— Aucune (silence) —</option>' +
      playlist.map((s, i) => `<option value="${i}">${s.name}</option>`).join('');
  }

  function emit(type, detail) {
    document.dispatchEvent(new CustomEvent('arcademusic:' + type, { detail }));
  }

  function play(index) {
    const song = playlist[index];
    if (!song) return Promise.reject();
    current = index;
    audio.src = resolveUrl(song.url);
    elSelect.value = index;
    elNow.textContent = '🎧 ' + song.name;
    elStop.classList.remove('off');
    localStorage.setItem(LS.song, index);
    localStorage.setItem(LS.on, '1');
    return audio.play().then(() => emit('play', { name: song.name, index }));
  }
  function playRandom() { return play(Math.floor(Math.random() * playlist.length)); }

  function step(delta) {
    if (!playlist.length) return;
    let idx;
    if (shuffleMode) {
      do { idx = Math.floor(Math.random() * playlist.length); }
      while (playlist.length > 1 && idx === current);
    } else {
      idx = (current + delta + playlist.length) % playlist.length;
      if (isNaN(idx)) idx = 0;
    }
    play(idx).catch(() => {});
  }

  function stop() {
    audio.pause(); audio.removeAttribute('src'); audio.load();
    current = -1;
    if (elSelect) elSelect.value = '';
    if (elNow) elNow.textContent = 'Musique';
    if (elStop) elStop.classList.add('off');
    localStorage.setItem(LS.on, '0');
    localStorage.removeItem(LS.song);
    localStorage.removeItem(LS.time);
    emit('stop', {});
  }

  function wire() {
    elSelect  = root.querySelector('#am-select');
    elNow     = root.querySelector('#am-now');
    elShuffle = root.querySelector('#am-shuffle');
    elStop    = root.querySelector('#am-stop');
    elVol     = root.querySelector('#am-vol');
    const elToggle = root.querySelector('#am-toggle');
    const elPause  = root.querySelector('#am-pause');
    const elHead   = root.querySelector('.am-head');
    const elPrev   = root.querySelector('#am-prev');
    const elNext   = root.querySelector('#am-next');
    const elFolder = root.querySelector('#am-folder');
    const elFolderInput = root.querySelector('#am-folder-input');

    fillSelect();
    elVol.value = audio.volume;

    // déplier / replier
    const toggle = () => {
      root.classList.toggle('open');
      elToggle.textContent = root.classList.contains('open') ? '▾' : '▸';
    };
    elHead.addEventListener('click', toggle);
    elToggle.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

    // bouton lecture/pause (visible en mode compressé, dans le head)
    const updatePauseIcon = () => { elPause.textContent = (!audio.paused && audio.src) ? '⏸' : '▶'; };
    elPause.addEventListener('click', (e) => {
      e.stopPropagation();                       // ne pas déplier/replier la barre
      if (!audio.paused && audio.src) audio.pause();
      else if (current >= 0 && audio.src) audio.play().catch(()=>{});
      else playRandom().catch(()=>{});           // rien en cours → démarre un morceau
      elPause.blur();
    });
    audio.addEventListener('play', updatePauseIcon);
    audio.addEventListener('pause', updatePauseIcon);
    updatePauseIcon();

    elSelect.addEventListener('change', () => {
      if (elSelect.value === '') stop(); else play(+elSelect.value).catch(()=>{});
      elSelect.blur();
    });
    elPrev.addEventListener('click', () => { step(-1); elPrev.blur(); });
    elNext.addEventListener('click', () => { step(1);  elNext.blur(); });
    elStop.addEventListener('click', () => { stop(); elStop.blur(); });
    elShuffle.addEventListener('click', () => {
      shuffleMode = !shuffleMode;
      elShuffle.classList.toggle('off', !shuffleMode);
      localStorage.setItem(LS.shuffle, shuffleMode ? '1' : '0');
      elShuffle.blur();
    });
    elShuffle.classList.toggle('off', !shuffleMode);

    elVol.addEventListener('input', () => {
      audio.volume = +elVol.value;
      localStorage.setItem(LS.vol, elVol.value);
    });

    elFolder.addEventListener('click', () => elFolderInput.click());
    elFolderInput.addEventListener('change', () => {
      const files = Array.from(elFolderInput.files).filter(f =>
        AUDIO_EXTS.some(ext => f.name.toLowerCase().endsWith(ext)));
      if (!files.length) { elNow.textContent = '⚠ Aucun audio dans ce dossier'; elFolderInput.value=''; return; }
      files.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      playlist = files.map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(f) }));
      current = -1;
      fillSelect();
      localStorage.removeItem(LS.song); localStorage.removeItem(LS.time);
      const folder = files[0].webkitRelativePath.split('/')[0];
      elNow.textContent = `📁 ${folder} — ${playlist.length} titres`;
      elFolderInput.value = '';
    });

    // avance auto à la fin d'un morceau
    audio.addEventListener('ended', () => step(1));
    // signaler un fichier introuvable (aide au diagnostic des chemins)
    audio.addEventListener('error', () => {
      if (audio.src) elNow.textContent = '⚠ fichier introuvable';
    });

    // ── démarrage : piocher une chanson au hasard et la jouer ──
    //    (chaque page = nouveau hasard → une autre chanson à chaque jeu lancé)
    //    On tente tout de suite ; si l'autoplay est bloqué par le navigateur,
    //    on démarre au tout premier clic/touche de la page.
    if (AUTOSTART && playlist.length) {
      playRandom().catch(() => {
        const go = () => {
          window.removeEventListener('pointerdown', go);
          window.removeEventListener('keydown', go);
          playRandom().catch(() => {});
        };
        window.addEventListener('pointerdown', go, { once: true });
        window.addEventListener('keydown', go, { once: true });
      });
    }
  }

  /* ════ Effets sonores + animation de mort (3 s) — dispo sur toutes les pages ════ */
  let _ac=null;
  function actx(){ try{ if(!_ac) _ac=new (window.AudioContext||window.webkitAudioContext)(); if(_ac.state==='suspended') _ac.resume(); }catch(e){} return _ac; }
  function noiseBuf(ac,dur){ const n=Math.floor(ac.sampleRate*dur), b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; return b; }
  function playSfx(kind){
    const ac=actx(); if(!ac) return; const t=ac.currentTime;
    const master=ac.createGain(); master.gain.value=0.5; master.connect(ac.destination);
    if(kind==='explosion'||kind==='thud'||kind==='splat'){
      const src=ac.createBufferSource(); src.buffer=noiseBuf(ac, kind==='splat'?0.5:1.4);
      const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(1800,t); lp.frequency.exponentialRampToValueAtTime(120,t+0.9);
      const g=ac.createGain(); g.gain.setValueAtTime(kind==='splat'?0.5:0.9,t); g.gain.exponentialRampToValueAtTime(0.001,t+(kind==='splat'?0.5:1.4));
      src.connect(lp); lp.connect(g); g.connect(master); src.start(t);
      if(kind!=='splat'){ const o=ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(40,t+0.8);
        const og=ac.createGain(); og.gain.setValueAtTime(0.7,t); og.gain.exponentialRampToValueAtTime(0.001,t+1.0); o.connect(og); og.connect(master); o.start(t); o.stop(t+1.1); }
    } else if(kind==='zap'){
      const o=ac.createOscillator(); o.type='square'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(80,t+0.5);
      const g=ac.createGain(); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.6); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.7);
    } else if(kind==='fall'){
      const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(700,t); o.frequency.exponentialRampToValueAtTime(90,t+1.0);
      const g=ac.createGain(); g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.1); o.connect(g); g.connect(master); o.start(t); o.stop(t+1.2);
    } else if(kind==='chomp'){
      for(let i=0;i<7;i++){ const o=ac.createOscillator(); o.type='square'; const f=520-i*55;
        o.frequency.setValueAtTime(f,t+i*0.12); o.frequency.linearRampToValueAtTime(f*0.5,t+i*0.12+0.1);
        const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t+i*0.12); g.gain.linearRampToValueAtTime(0.4,t+i*0.12+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+i*0.12+0.11);
        o.connect(g); g.connect(master); o.start(t+i*0.12); o.stop(t+i*0.12+0.13); }
    }
  }
  window.ArcadeSFX = { play: playSfx };

  // animation de mort/explosion de 3 s sur un calque au-dessus du canvas, clavier gelé
  function die(cv, x, y, kind, onDone){
    kind = kind||'explosion';
    // coordonnées sûres : un x/y invalide (NaN) ferait planter le dessin → repli au centre
    if(!isFinite(x)) x = (cv && cv.width) ? cv.width/2 : 200;
    if(!isFinite(y)) y = (cv && cv.height) ? cv.height/2 : 200;
    playSfx(kind);
    let ov=null, octx=null;
    try{
      const host=cv.parentNode||document.body;
      ov=document.createElement('canvas'); ov.width=cv.width; ov.height=cv.height;
      ov.style.position='absolute'; ov.style.left=cv.offsetLeft+'px'; ov.style.top=cv.offsetTop+'px';
      ov.style.width=cv.clientWidth+'px'; ov.style.height=cv.clientHeight+'px';
      ov.style.pointerEvents='auto'; ov.style.zIndex='8';
      // surtout pas hériter du style canvas{} du jeu (fond/bordure/ombre) → calque transparent
      ov.style.background='transparent'; ov.style.border='0'; ov.style.boxShadow='none'; ov.style.borderRadius='0';
      host.appendChild(ov); octx=ov.getContext('2d');
    }catch(e){}
    // on bloque les keydown (pas de redémarrage/action pendant la mort) mais on LAISSE
    // passer les keyup, sinon un relâchement de touche est avalé → touche « collée »
    const block=e=>{ e.stopImmediatePropagation(); e.preventDefault(); };
    window.addEventListener('keydown',block,true);
    const t0=performance.now(), DUR=3000;
    const tint = kind==='fall'?[150,190,255] : kind==='splat'?[120,230,120] : kind==='zap'?[140,210,255] : kind==='chomp'?[255,230,80] : [255,150,40];
    const ps=[], N=kind==='fall'?26:42;
    for(let i=0;i<N;i++){ const a=Math.random()*Math.PI*2, sp=Math.random()*(kind==='explosion'?5:3.4)+1;
      ps.push({x,y,vx:Math.cos(a)*sp, vy:Math.sin(a)*sp+(kind==='fall'?1:0), life:1,
        col: Math.random()<0.5?`rgb(${tint[0]},${tint[1]},${tint[2]})`:'#fff'}); }
    function frame(now){
      const e=(now-t0)/DUR;
      try{
        if(octx){
          octx.clearRect(0,0,ov.width,ov.height);
          if(e<0.5 && kind!=='fall'){ octx.strokeStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${Math.max(0,1-e*2)})`; octx.lineWidth=4; octx.beginPath(); octx.arc(x,y,e*130,0,Math.PI*2); octx.stroke(); }
          if(e<0.4 && kind!=='fall'){ const r=10+e*60, g=octx.createRadialGradient(x,y,0,x,y,r);
            g.addColorStop(0,'#fff'); g.addColorStop(0.4,`rgb(${tint[0]},${tint[1]},${tint[2]})`); g.addColorStop(1,'rgba(0,0,0,0)');
            octx.globalAlpha=1-e/0.4; octx.fillStyle=g; octx.beginPath(); octx.arc(x,y,r,0,Math.PI*2); octx.fill(); octx.globalAlpha=1; }
          ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.vx*=0.99; });
          octx.globalAlpha=Math.max(0,1-e);
          ps.forEach(p=>{ octx.fillStyle=p.col; octx.fillRect(p.x-1.5,p.y-1.5,3,3); });
          octx.globalAlpha=1;
        }
      }catch(err){ /* le dessin ne doit jamais bloquer la boucle ni onDone */ }
      if(e>=1) cleanup(); else requestAnimationFrame(frame);
    }
    function cleanup(){ window.removeEventListener('keydown',block,true);
      if(ov&&ov.parentNode) ov.parentNode.removeChild(ov); if(onDone){ try{onDone();}catch(e){} } }
    requestAnimationFrame(frame);
  }
  window.ArcadeFX = { die };

  /* ── API publique ── */
  window.ArcadeMusic = {
    isPlaying:   () => !audio.paused && !!audio.src,
    hasSelection:() => current >= 0,
    resume:      () => { if (current >= 0 && audio.paused) audio.play().catch(()=>{}); },
    stop, play,
    get audio() { return audio; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

/* ════ Meilleur score par jeu (localStorage) + badge RECORD + message ════
   Usage dans un jeu : appeler à chaque frame  ArcadeHi.submit(score)
   (le module détecte tout seul le début d'une nouvelle partie quand le score
    repart à la baisse). Affiche un badge « RECORD » et un message si battu.   */
(function () {
  if (window.ArcadeHi) return;
  // clé stable basée sur le dossier du jeu
  const segs = location.pathname.split('/').filter(s => s && !/index\.html?$/i.test(s));
  const name = segs.length ? decodeURIComponent(segs[segs.length - 1]) : (document.title || 'jeu');
  const KEY = 'arcadeHi_' + name;
  let best = parseInt(localStorage.getItem(KEY) || '0', 10) || 0;
  let prev = best, beaten = false, last = 0, badge = null, toast = null, toastT = null;

  function mount() {
    // pas de badge sur les pages sans zone de jeu (ex. le menu)
    if (!document.querySelector('canvas')) return;
    const st = document.createElement('style');
    st.textContent = `
      #arcade-hi{position:fixed;top:8px;right:10px;z-index:9998;font-family:'Courier New',monospace;
        font-size:12px;letter-spacing:1px;color:#ffd23a;background:rgba(8,8,20,.72);
        border:1px solid #3a3a52;border-radius:6px;padding:4px 9px;
        text-shadow:0 0 6px rgba(255,210,58,.5);pointer-events:none;}
      #arcade-hi.on-wrap{position:absolute;top:-27px;right:0;}
      #arcade-hi b{color:#fff;}
      #arcade-hi-toast{position:fixed;top:40px;left:50%;transform:translateX(-50%) scale(.5);
        z-index:9998;font-family:'Courier New',monospace;font-weight:bold;font-size:18px;
        color:#ffd23a;text-shadow:0 0 10px #ff2e88,0 0 22px #ffd23a;opacity:0;pointer-events:none;
        transition:opacity .25s ease, transform .25s ease;white-space:nowrap;}
      #arcade-hi-toast.show{opacity:1;transform:translateX(-50%) scale(1);}`;
    document.head.appendChild(st);
    badge = document.createElement('div'); badge.id = 'arcade-hi';
    // au-dessus de la zone de jeu si possible (le #wrap des jeux est en position:relative)
    const wrap = document.getElementById('wrap');
    if (wrap) { badge.classList.add('on-wrap'); wrap.appendChild(badge); }
    else document.body.appendChild(badge);
    toast = document.createElement('div'); toast.id = 'arcade-hi-toast';
    toast.textContent = '★ NOUVEAU RECORD ! ★'; document.body.appendChild(toast);
    refresh();
  }
  function refresh() { if (badge) badge.innerHTML = 'RECORD <b>' + best + '</b>'; }
  function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  window.ArcadeHi = {
    get: () => best,
    beaten: () => beaten,
    reset() { prev = best; beaten = false; last = 0; },     // optionnel : forcer un nouveau tour
    submit(score) {
      score = Math.floor(score) || 0;
      if (score < last - 1) { prev = best; beaten = false; }  // score reparti à la baisse = nouvelle partie
      last = score;
      if (!beaten && prev > 0 && score > prev) { beaten = true; showToast(); }
      if (score > best) { best = score; localStorage.setItem(KEY, best); refresh(); }
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

/* ════ Zone de jeu uniformisée : chaque canvas est AFFICHÉ au grand format ════
   La résolution interne (logique de jeu) ne change pas : on agrandit seulement
   l'affichage CSS, proportions conservées, jusqu'à ~520 px de haut / 760 de large. */
(function () {
  function fit() {
    const c = document.getElementById('game') || document.querySelector('canvas');
    if (!c || !c.width || !c.height) return;
    const k = Math.min(520 / c.height, 760 / c.width);
    if (k <= 1.02) return;                                  // déjà au grand format
    c.style.width  = 'min(' + Math.round(c.width * k) + 'px, 94vw)';
    c.style.height = 'auto';                                 // garde les proportions
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit);
  else fit();
})();
