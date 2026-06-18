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
