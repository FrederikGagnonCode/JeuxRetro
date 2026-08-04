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
/* ════ Thème (sombre / clair) + Langue (FR EN JA CS ZH KO) ════
   Mémorisés dans localStorage, appliqués sur tout le site.
   API : window.ArcadeI18n.t('cle') — utilisée par les autres modules. */
(function () {
  if (window.ArcadeI18n) return;
  const LST = 'arcadeTheme', LSL = 'arcadeLang';
  const LANGS = [['fr','FR'],['en','EN'],['ja','日本語'],['cs','ČEŠ'],['zh','中文'],['ko','한국어']];
  const T = {
    fr:{ sub:'Choisis ton jeu — Insert Coin', games:'JEUX', random:'🎲 Jeu au hasard',
      all:'Tous', y70:'Années 70', y80:'Années 80', y90:'1990 +', search:'🔍 Rechercher…',
      records:'💾 Records', importBtn:'📥 Importer', play:'▶ JOUER', back:'← Menu Arcade',
      record:'RECORD', bestTitle:'★ MEILLEURS SCORES ★', newRecord:'★ NOUVEAU RECORD ! ★',
      promptTitle:'★ MEILLEUR SCORE ! ★', enterInit:'pts — entre tes initiales',
      initHelp:'Lettres A-Z · Retour = effacer · Entrée = valider',
      noScore:'Aucun score encore…', music:'Musique', silence:'— Aucune (silence) —',
      toTop:'Remonter en haut',
      notice:"Ce site est un hommage amateur à l'âge d'or du jeu vidéo. Chaque jeu est une réinterprétation originale écrite de zéro, qui ne cherche en aucun cas à reproduire les jeux originaux ni à s'y substituer. Les titres évoqués appartiennent à leurs ayants droit respectifs." },
    en:{ sub:'Pick your game — Insert Coin', games:'GAMES', random:'🎲 Random game',
      all:'All', y70:'The 70s', y80:'The 80s', y90:'1990 +', search:'🔍 Search…',
      records:'💾 Scores', importBtn:'📥 Import', play:'▶ PLAY', back:'← Arcade Menu',
      record:'RECORD', bestTitle:'★ HIGH SCORES ★', newRecord:'★ NEW RECORD! ★',
      promptTitle:'★ HIGH SCORE! ★', enterInit:'pts — enter your initials',
      initHelp:'Letters A-Z · Backspace = erase · Enter = OK',
      noScore:'No scores yet…', music:'Music', silence:'— None (silence) —',
      toTop:'Back to top',
      notice:'This site is an amateur tribute to the golden age of video games. Every game is an original reinterpretation written from scratch — in no way does it attempt to reproduce or replace the original games. All referenced titles belong to their respective rights holders.' },
    ja:{ sub:'ゲームをえらんでね — INSERT COIN', games:'ゲーム', random:'🎲 ランダム',
      all:'すべて', y70:'70年代', y80:'80年代', y90:'1990+', search:'🔍 検索…',
      records:'💾 スコア', importBtn:'📥 インポート', play:'▶ プレイ', back:'← メニューへ',
      record:'記録', bestTitle:'★ ハイスコア ★', newRecord:'★ 新記録！ ★',
      promptTitle:'★ ハイスコア！ ★', enterInit:'pts — イニシャルを入力',
      initHelp:'A-Z · Backspace=消す · Enter=決定',
      noScore:'まだスコアがありません…', music:'音楽', silence:'— なし —',
      toTop:'先頭へ戻る',
      notice:'当サイトはレトロゲーム黄金期へのファンメイドのオマージュです。各ゲームはゼロから書かれたオリジナルの再解釈であり、原作の再現や代替を意図するものではありません。言及されるタイトルは各権利者に帰属します。' },
    cs:{ sub:'Vyber si hru — Insert Coin', games:'HER', random:'🎲 Náhodná hra',
      all:'Vše', y70:'70. léta', y80:'80. léta', y90:'1990 +', search:'🔍 Hledat…',
      records:'💾 Skóre', importBtn:'📥 Import', play:'▶ HRÁT', back:'← Zpět do menu',
      record:'REKORD', bestTitle:'★ NEJLEPŠÍ SKÓRE ★', newRecord:'★ NOVÝ REKORD! ★',
      promptTitle:'★ NEJLEPŠÍ SKÓRE! ★', enterInit:'b. — zadej iniciály',
      initHelp:'Písmena A-Z · Backspace = smazat · Enter = OK',
      noScore:'Zatím žádné skóre…', music:'Hudba', silence:'— Žádná (ticho) —',
      toTop:'Zpět nahoru',
      notice:'Tento web je amatérská pocta zlaté éře videoher. Každá hra je originální reinterpretace napsaná od nuly — v žádném případě se nesnaží reprodukovat původní hry ani je nahradit. Zmiňované tituly patří jejich vlastníkům práv.' },
    zh:{ sub:'选择你的游戏 — INSERT COIN', games:'个游戏', random:'🎲 随机游戏',
      all:'全部', y70:'70年代', y80:'80年代', y90:'1990+', search:'🔍 搜索…',
      records:'💾 记录', importBtn:'📥 导入', play:'▶ 开始', back:'← 返回菜单',
      record:'纪录', bestTitle:'★ 最高分 ★', newRecord:'★ 新纪录！ ★',
      promptTitle:'★ 最高分！ ★', enterInit:'分 — 输入名字缩写',
      initHelp:'字母A-Z · 退格=删除 · 回车=确认',
      noScore:'暂无记录…', music:'音乐', silence:'— 无（静音）—',
      toTop:'返回顶部',
      notice:'本站是对电子游戏黄金时代的业余致敬之作。每个游戏都是从零编写的原创重新演绎，绝非试图复制或替代原作。所提及的作品归各自版权方所有。' },
    ko:{ sub:'게임을 선택하세요 — Insert Coin', games:'게임', random:'🎲 랜덤 게임',
      all:'전체', y70:'70년대', y80:'80년대', y90:'1990 +', search:'🔍 검색…',
      records:'💾 기록', importBtn:'📥 가져오기', play:'▶ 플레이', back:'← 메뉴로',
      record:'기록', bestTitle:'★ 최고 기록 ★', newRecord:'★ 신기록! ★',
      promptTitle:'★ 최고 기록! ★', enterInit:'점 — 이니셜 입력',
      initHelp:'A-Z · Backspace=지우기 · Enter=확인',
      noScore:'아직 기록이 없습니다…', music:'음악', silence:'— 없음 —',
      toTop:'맨 위로',
      notice:'이 사이트는 비디오 게임 황금기에 바치는 아마추어 헌사입니다. 모든 게임은 처음부터 새로 작성된 독창적 재해석으로, 원작 게임을 재현하거나 대체하려는 것이 아닙니다. 언급된 타이틀은 각 권리자의 소유입니다.' }
  };
  let lang = localStorage.getItem(LSL) || 'fr'; if (!T[lang]) lang = 'fr';
  let theme = localStorage.getItem(LST) || 'dark';
  const t = k => (T[lang] && T[lang][k]) || T.fr[k] || k;
  window.ArcadeI18n = { t, get lang(){ return lang; } };

  document.documentElement.dataset.theme = theme;

  /* — thème clair : surcharges génériques (menu + pages de jeux + modules) — */
  const st = document.createElement('style');
  st.textContent = `
  [data-theme=light] body{background:#e9e7f2 !important;color:#1c1c28 !important;}
  [data-theme=light] #psych,[data-theme=light] #veil{opacity:.14 !important;}
  [data-theme=light] h1{color:#241f3a;text-shadow:0 1px 0 #fff !important;}
  [data-theme=light] .sub,[data-theme=light] #hint{color:#5a5a6e !important;}
  [data-theme=light] canvas{border-color:#241f3a !important;}
  [data-theme=light] a.back{color:#0a7a5a !important;}
  [data-theme=light] .card{background:#fdfdff !important;border-color:#c9c6da !important;}
  [data-theme=light] .year{background:#f0eefa !important;color:#0a7a5a !important;
    border-color:#dcd8ec !important;text-shadow:none !important;}
  [data-theme=light] .title{color:#241f3a !important;}
  [data-theme=light] .tag,[data-theme=light] footer{color:#77748c !important;}
  [data-theme=light] .count{color:#241f3a !important;}
  [data-theme=light] #toolbar .tbtn,[data-theme=light] #toolbar input{
    background:#fdfdff !important;color:#33304a !important;border-color:#c9c6da !important;}
  [data-theme=light] #toolbar .tbtn.on{background:#0a7a5a !important;color:#fff !important;}
  [data-theme=light] #arcade-music{background:#fdfdff !important;color:#241f3a !important;
    border-color:#c9c6da !important;}
  [data-theme=light] #arcade-music .am-title{color:#0a7a5a !important;}
  [data-theme=light] #arcade-music select{background:#f0eefa !important;color:#241f3a !important;
    border-color:#c9c6da !important;}
  [data-theme=light] #arcade-hi{background:#fdfdff !important;color:#8a6d00 !important;
    border-color:#dcd8ec !important;text-shadow:none !important;}
  [data-theme=light] #arcade-hi b{color:#241f3a !important;}
  [data-theme=light] #arcade-hi-table{background:#fdfdff !important;color:#241f3a !important;}
  [data-theme=light] #arcade-hi-table .row b{color:#0a7a5a !important;}
  [data-theme=light] #arcade-pref button,[data-theme=light] #arcade-pref select{
    background:#fdfdff !important;color:#241f3a !important;border-color:#c9c6da !important;}
  #arcade-pref{position:fixed;left:10px;bottom:10px;z-index:9999;display:flex;gap:6px;
    font-family:'Courier New',monospace;}
  #arcade-pref button,#arcade-pref select{background:rgba(8,8,20,.85);color:#eee;
    border:1px solid #3a3a52;border-radius:8px;font-family:inherit;font-size:13px;
    padding:4px 8px;cursor:pointer;outline:none;}
  body.touch-ctl #arcade-pref{display:none;}
  /* — bouton « remonter en haut » : bas-droite, le seul coin encore libre — */
  [data-theme=light] #arcade-top{background:#fdfdff !important;color:#0a7a5a !important;
    border-color:#c9c6da !important;}
  #arcade-top{position:fixed;right:10px;bottom:10px;z-index:9999;
    width:42px;height:42px;border-radius:50%;
    background:rgba(8,8,20,.85);color:#4ecca3;border:1px solid #3a3a52;
    font-family:'Courier New',monospace;font-size:20px;line-height:1;
    cursor:pointer;outline:none;padding:0;
    display:flex;align-items:center;justify-content:center;
    opacity:0;visibility:hidden;transform:translateY(12px);
    transition:opacity .25s ease,transform .25s ease,visibility .25s;}
  #arcade-top.on{opacity:1;visibility:visible;transform:none;}
  #arcade-top:hover{color:#ff2e88;border-color:#4ecca3;}
  #arcade-top:focus-visible{border-color:#4ecca3;box-shadow:0 0 0 2px rgba(78,204,163,.4);}
  body.touch-ctl #arcade-top{display:none;}
  @media (prefers-reduced-motion:reduce){ #arcade-top{transition:none;} }`;
  document.head.appendChild(st);

  /* — petite barre de préférences : 🌙/☀️ + langue — */
  function mount() {
    const bar = document.createElement('div'); bar.id = 'arcade-pref';
    const bt = document.createElement('button');
    bt.textContent = theme === 'dark' ? '☀️' : '🌙';
    bt.title = 'Thème clair / sombre';
    bt.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LST, theme);
      document.documentElement.dataset.theme = theme;
      bt.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
    const sel = document.createElement('select');
    sel.title = 'Langue';
    sel.innerHTML = LANGS.map(([c, n]) => `<option value="${c}"${c===lang?' selected':''}>${n}</option>`).join('');
    sel.addEventListener('change', () => {
      localStorage.setItem(LSL, sel.value);
      location.reload();                       // retraduit toute la page proprement
    });
    bar.appendChild(bt); bar.appendChild(sel);
    document.body.appendChild(bar);
    mountToTop();
    translate();
  }

  /* — bouton flottant « remonter en haut » —
     Injecté partout, mais il ne se montre qu'au-delà de 300 px de défilement :
     les pages de jeux tiennent dans l'écran, donc il y reste invisible. */
  function mountToTop() {
    const b = document.createElement('button');
    b.id = 'arcade-top';
    b.type = 'button';
    b.textContent = '↑';
    document.body.appendChild(b);
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    b.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    });
    let queued = false;                        // scroll → une seule maj par frame
    const sync = () => {
      queued = false;
      b.classList.toggle('on', (scrollY || document.documentElement.scrollTop) > 300);
    };
    addEventListener('scroll', () => {
      if (queued) return;
      queued = true; requestAnimationFrame(sync);
    }, { passive: true });
    sync();                                    // état initial (rechargement à mi-page)
  }

  /* — traduction des éléments partagés + du menu — */
  function translate() {
    const set=(cs,txt)=>{ const el=document.querySelector(cs); if(el) el.textContent=txt; };
    const back=document.querySelector('a.back'); if(back) back.textContent=t('back');
    const up=document.getElementById('arcade-top');
    if(up){ up.title=t('toTop'); up.setAttribute('aria-label', t('toTop')); }
    // menu d'accueil
    set('.sub', t('sub'));
    set('.notice', t('notice'));
    const cnt=document.querySelector('.count');
    if(cnt && cnt.lastChild && cnt.lastChild.nodeType===3) cnt.lastChild.textContent=' '+t('games');
    set('#btnRandom', t('random'));
    set('[data-dec="all"]', t('all')); set('[data-dec="70"]', t('y70'));
    set('[data-dec="80"]', t('y80'));  set('[data-dec="90"]', t('y90'));
    set('#btnExport', t('records'));   set('#btnImport', t('importBtn'));
    const sr=document.querySelector('#search'); if(sr) sr.placeholder=t('search');
    document.querySelectorAll('.play span').forEach(s=>{ s.textContent=t('play'); });
    // pages de jeux : consignes de l'écran d'accueil + ligne d'aide
    // (dictionnaire GAME_I18N fourni par music/i18n-games.js)
    if (lang !== 'fr' && typeof GAME_I18N !== 'undefined') {
      const segs = location.pathname.split('/').filter(s2 => s2 && !/index\.html?$/i.test(s2));
      const game = segs.length ? decodeURIComponent(segs[segs.length - 1]) : '';
      const g = (GAME_I18N[game] || {})[lang];
      if (g) {
        if (g.p) {
          const ps = document.querySelectorAll('#overlay p');
          g.p.forEach((txt, i) => { if (ps[i]) ps[i].innerHTML = txt; });
        }
        if (g.hint) { const h = document.getElementById('hint'); if (h) h.innerHTML = g.hint; }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

(function () {
  if (window.ArcadeMusic) return;            // déjà chargé

  const LS = { song: 'arcadeMusicSong', shuffle: 'arcadeMusicShuffle',
               time: 'arcadeMusicTime', on: 'arcadeMusicOn', vol: 'arcadeMusicVol' };

  // PLAYLIST / LIBRE_PLAYLIST sont des `const` globaux (playlist.js) : accessibles
  // par référence directe, mais PAS via window.*. D'où les typeof.
  // Partout : la musique libre (CC0) incluse dans le dépôt.
  // En local seulement : la bibliothèque OneDrive s'ajoute à la suite
  // (jamais poussée en ligne — droits d'auteur).
  const HOSTED = /\.github\.io$/i.test(location.hostname);
  const libre  = (typeof LIBRE_PLAYLIST !== 'undefined' ? LIBRE_PLAYLIST : []);
  let playlist = libre.concat(!HOSTED && typeof PLAYLIST !== 'undefined' ? PLAYLIST : []);
  // page d'accueil (pas de zone de jeu) : ambiance douce ; jeux : tout le répertoire
  const IS_MENU = !document.querySelector('canvas');
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
    box-shadow:0 6px 24px rgba(0,0,0,.5);
    /* le titre est en nowrap : sans cette reserve laterale, un nom de piste long
       fait deborder la barre sur #arcade-pref (a gauche) et #arcade-top (a droite) */
    max-width:min(560px,calc(100vw - 300px));}
  /* ecrans etroits : plus de place pour trois bandeaux cote a cote,
     on remonte le lecteur au-dessus des deux autres */
  @media (max-width:560px){
    #arcade-music{bottom:58px;max-width:min(94vw,560px);}
  }
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
        <input id="am-vol" type="range" min="0" max="1" step="0.05" title="Volume">
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

  const TR = k => (window.ArcadeI18n ? ArcadeI18n.t(k) : k);
  function fillSelect() {
    elSelect.innerHTML = '<option value="">' + TR('silence') + '</option>' +
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
  function playRandom() {
    // sur l'accueil : uniquement les morceaux doux ; dans les jeux : tout
    let pool = playlist.map((s, i) => i);
    if (IS_MENU) {
      const douce = pool.filter(i => playlist[i].douce);
      if (douce.length) pool = douce;
    }
    return play(pool[Math.floor(Math.random() * pool.length)]);
  }

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
    if (elNow) elNow.textContent = TR('music');
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
      if (!audio.paused && audio.src) {
        audio.pause();
        localStorage.setItem(LS.on, '0');        // choix retenu : silence sur tout le site
      } else if (current >= 0 && audio.src) {
        audio.play().catch(()=>{});
        localStorage.setItem(LS.on, '1');
      } else playRandom().catch(()=>{});         // rien en cours → démarre un morceau
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
    //    SAUF si l'utilisateur a mis en pause ou arrêté : son choix est retenu
    //    sur tout le site tant qu'il ne relance pas lui-même la lecture.
    const wantMusic = localStorage.getItem(LS.on) !== '0';
    if (AUTOSTART && playlist.length && wantMusic) {
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
  const TR2 = k => (window.ArcadeI18n ? ArcadeI18n.t(k) : k);
  // clé stable basée sur le dossier du jeu
  const segs = location.pathname.split('/').filter(s => s && !/index\.html?$/i.test(s));
  const name = segs.length ? decodeURIComponent(segs[segs.length - 1]) : (document.title || 'jeu');
  const KEY = 'arcadeHi_' + name;
  const TKEY = 'arcadeHiTab_' + name;
  let best = parseInt(localStorage.getItem(KEY) || '0', 10) || 0;
  let prev = best, beaten = false, last = 0, badge = null, toast = null, toastT = null;
  let tab = []; try { tab = JSON.parse(localStorage.getItem(TKEY) || '[]') || []; } catch (e) { tab = []; }
  let prompting = false, tablePop = null, tableT = null, promptedScore = -1;
  function saveTab() { tab.sort((a, b) => b.s - a.s); tab = tab.slice(0, 5); localStorage.setItem(TKEY, JSON.stringify(tab)); }
  function qualifies(s) { return s > 0 && (tab.length < 5 || s > tab[tab.length - 1].s); }

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
      #arcade-hi-toast.show{opacity:1;transform:translateX(-50%) scale(1);}
      #arcade-hi-init{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;
        background:rgba(8,8,22,.96);border:2px solid #ffd23a;border-radius:10px;padding:18px 30px;
        font-family:'Courier New',monospace;text-align:center;color:#eee;box-shadow:0 0 40px rgba(255,210,58,.35);}
      #arcade-hi-init .t{color:#ffd23a;font-weight:bold;letter-spacing:2px;font-size:15px;margin-bottom:6px;}
      #arcade-hi-init .s{color:#9fe;font-size:13px;margin-bottom:12px;}
      #arcade-hi-init .l{font-size:34px;font-weight:bold;letter-spacing:10px;color:#fff;
        text-shadow:0 0 12px #ffd23a;margin-bottom:10px;animation:blinkc 1s steps(2,start) infinite;}
      @keyframes blinkc{50%{opacity:.55}}
      #arcade-hi-init .h{color:#777;font-size:11px;}
      #arcade-hi-init .kb{display:none;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px;max-width:290px;}
      body.touch-ctl #arcade-hi-init .kb{display:grid;}
      #arcade-hi-init .kb button{font-family:inherit;font-size:15px;font-weight:bold;color:#eee;
        background:rgba(255,255,255,.09);border:1px solid #55557a;border-radius:6px;padding:9px 0;
        -webkit-tap-highlight-color:transparent;touch-action:manipulation;}
      #arcade-hi-init .kb button:active{background:#ffd23a;color:#101020;}
      #arcade-hi-init .kb button.ok{grid-column:span 3;background:rgba(78,204,163,.22);border-color:#4ecca3;color:#4ecca3;}
      #arcade-hi-init .kb button.del{grid-column:span 2;color:#ff8a8a;border-color:#8a4a4a;}
      #arcade-hi-table{position:absolute;top:0;right:0;z-index:9999;min-width:180px;
        background:rgba(8,8,22,.95);border:1px solid #ffd23a;border-radius:8px;padding:10px 14px;
        font-family:'Courier New',monospace;font-size:12px;color:#eee;}
      #arcade-hi-table .tt{color:#ffd23a;font-weight:bold;letter-spacing:1px;margin-bottom:6px;text-align:center;}
      #arcade-hi-table .row{display:flex;justify-content:space-between;gap:14px;padding:1px 0;}
      #arcade-hi-table .row b{color:#9fe;}`;
    document.head.appendChild(st);
    badge = document.createElement('div'); badge.id = 'arcade-hi';
    // au-dessus de la zone de jeu si possible (le #wrap des jeux est en position:relative)
    const wrap = document.getElementById('wrap');
    if (wrap) { badge.classList.add('on-wrap'); wrap.appendChild(badge); }
    else document.body.appendChild(badge);
    badge.style.pointerEvents = 'auto'; badge.style.cursor = 'pointer';
    badge.title = 'Voir le tableau des scores';
    badge.addEventListener('click', () => toggleTable());
    toast = document.createElement('div'); toast.id = 'arcade-hi-toast';
    toast.textContent = TR2('newRecord'); document.body.appendChild(toast);
    refresh();
    // guetteur de fin de partie : l'invite d'initiales s'ouvre SUR l'écran de
    // game over (avant la relance), en lisant les globaux over/running du jeu
    function gameEnded() {
      try {
        if (typeof over !== 'undefined') return over === true;
        if (typeof running !== 'undefined') return running === false;
      } catch (e) {}
      return false;
    }
    function pendingPrompt() { return !prompting && last > 0 && promptedScore !== last && qualifies(last); }
    setInterval(() => {
      if (gameEnded() && pendingPrompt()) { promptedScore = last; openPrompt(last); }
    }, 150);
    // filet de sécurité : au game over, la PREMIÈRE touche ouvre l'invite au
    // lieu de relancer la partie (aucune course possible avec le guetteur)
    window.addEventListener('keydown', (e) => {
      if (gameEnded() && pendingPrompt()) {
        e.stopImmediatePropagation(); e.preventDefault();
        promptedScore = last; openPrompt(last);
      }
    }, true);
  }
  function toggleTable(autoMs) {
    if (tablePop) { tablePop.remove(); tablePop = null; clearTimeout(tableT); if (!autoMs) return; }
    tablePop = document.createElement('div'); tablePop.id = 'arcade-hi-table';
    let html = '<div class="tt">' + TR2('bestTitle') + '</div>';
    if (!tab.length) html += '<div class="row">' + TR2('noScore') + '</div>';
    tab.forEach((e2, i) => { html += '<div class="row"><span>' + (i + 1) + '. <b>' + e2.n + '</b></span><span>' + e2.s + '</span></div>'; });
    tablePop.innerHTML = html;
    const wrap = document.getElementById('wrap');
    (document.fullscreenElement || wrap || document.body).appendChild(tablePop);
    if (autoMs) { clearTimeout(tableT); tableT = setTimeout(() => { if (tablePop) { tablePop.remove(); tablePop = null; } }, autoMs); }
  }
  function pauseGame() {
    // tous les jeux exposent des `let` globaux running/paused : on fige la partie
    try { if (typeof running !== 'undefined' && running && typeof paused !== 'undefined') paused = true; } catch (e) {}
  }
  function openPrompt(s) {
    if (prompting) return; prompting = true;
    pauseGame();                                            // la partie s'arrête pendant la saisie
    let letters = '';
    const div = document.createElement('div'); div.id = 'arcade-hi-init';
    div.innerHTML = '<div class="t">' + TR2('promptTitle') + '</div><div class="s">' + s +
      ' ' + TR2('enterInit') + '</div><div class="l"></div><div class="h">' + TR2('initHelp') + '</div>' +
      '<div class="kb"></div>';
    // en plein écran, seul l'élément fullscreen est visible : on s'y accroche
    (document.fullscreenElement || document.body).appendChild(div);
    const lb = div.querySelector('.l');
    const render = () => { lb.textContent = (letters + '···').slice(0, 3).toUpperCase().split('').join(' '); };
    render();
    const h = (e) => {
      // on n'intercepte que les keydown ; les keyup passent au jeu
      // (sinon une touche encore enfoncée resterait « collée »)
      e.stopImmediatePropagation(); e.preventDefault();
      const k = e.key;
      if (/^[a-z0-9]$/i.test(k) && letters.length < 3) { letters += k.toUpperCase(); render(); }
      else if (k === 'Backspace') { letters = letters.slice(0, -1); render(); }
      else if (k === 'Enter' || (k === ' ' && letters.length === 3)) {
        tab.push({ n: (letters || 'AAA').padEnd(3, '·'), s }); saveTab();
        window.removeEventListener('keydown', h, true);
        div.remove(); prompting = false;
        pauseGame();                                        // reste en pause : une touche de jeu relancera
        toggleTable(3500);
      }
    };
    window.addEventListener('keydown', h, true);
    // clavier à l'écran (téléphone / tablette) : mêmes actions que les touches
    const kb = div.querySelector('.kb');
    if (kb) {
      const tap = (k) => {
        h({ key: k, stopImmediatePropagation(){}, preventDefault(){} });
        if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) {}
      };
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => {
        const b = document.createElement('button'); b.textContent = L;
        b.addEventListener('click', () => tap(L)); kb.appendChild(b);
      });
      const del = document.createElement('button'); del.className = 'del'; del.textContent = '⌫';
      del.addEventListener('click', () => tap('Backspace')); kb.appendChild(del);
      const ok = document.createElement('button'); ok.className = 'ok'; ok.textContent = 'OK';
      ok.addEventListener('click', () => tap('Enter')); kb.appendChild(ok);
    }
  }
  function refresh() { if (badge) badge.innerHTML = TR2('record') + ' <b>' + best + '</b>'; }
  function showToast() {
    if (!toast) return;
    (document.fullscreenElement || document.body).appendChild(toast);   // visible aussi en plein écran
    toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 2800);
  }
  window.ArcadeHi = {
    get: () => best,
    beaten: () => beaten,
    reset() { prev = best; beaten = false; last = 0; },     // optionnel : forcer un nouveau tour
    submit(score) {
      score = Math.floor(score) || 0;
      if (score < last - 1) {                                  // score reparti à la baisse = nouvelle partie
        // …sauf si le jeu expose running/over et que la partie est ENCORE EN
        // COURS (ex. aventure où mourir coûte des points) : ne pas ouvrir
        // l'invite ni geler le jeu en pleine partie
        let live = false;
        try { live = (typeof running !== 'undefined' && running &&
                      typeof over !== 'undefined' && !over); } catch (e) {}
        if (!live) {
          // secours (jeux sans over/running) : invite si pas déjà faite au game over
          if (promptedScore !== last && qualifies(last) && badge) openPrompt(last);
          promptedScore = -1;
          prev = best; beaten = false;
        }
      }
      last = score;
      if (!beaten && prev > 0 && score > prev) { beaten = true; showToast(); }
      if (score > best) { best = score; localStorage.setItem(KEY, best); refresh(); }
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

/* ════ Manette (Gamepad API) → convertie en touches clavier, pour tous les jeux ════
   Stick / D-pad = flèches · A = Espace · X = x · B = c · Y = s · Start = p */
(function () {
  const BTN = { 12:['ArrowUp','ArrowUp'], 13:['ArrowDown','ArrowDown'],
    14:['ArrowLeft','ArrowLeft'], 15:['ArrowRight','ArrowRight'],
    0:[' ','Space'], 2:['x','KeyX'], 1:['c','KeyC'], 3:['s','KeyS'],
    4:['z','KeyZ'], 5:['r','KeyR'], 9:['p','KeyP'], 8:['i','KeyI'] };
  const state = {};
  function send(key, code, down) {
    document.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup',
      { key, code, bubbles: true, cancelable: true }));
  }
  function step() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gps) {
      if (!gp) continue;
      for (const bi in BTN) {
        const pressed = gp.buttons[bi] && gp.buttons[bi].pressed;
        const id = 'b' + bi;
        if (pressed && !state[id]) { state[id] = 1; send(BTN[bi][0], BTN[bi][1], true); }
        else if (!pressed && state[id]) { state[id] = 0; send(BTN[bi][0], BTN[bi][1], false); }
      }
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      [['al', ax < -0.45, 'ArrowLeft'], ['ar', ax > 0.45, 'ArrowRight'],
       ['au', ay < -0.45, 'ArrowUp'], ['ad', ay > 0.45, 'ArrowDown']].forEach(([id, on, key]) => {
        if (on && !state[id]) { state[id] = 1; send(key, key, true); }
        else if (!on && state[id]) { state[id] = 0; send(key, key, false); }
      });
      break;                                   // première manette seulement
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('gamepadconnected', () => {});
  step();
})();

/* ════ Plein écran : touche F (le canvas est mis à l'échelle en gardant ses proportions) ════ */
(function () {
  const st = document.createElement('style');
  st.textContent = '#wrap:fullscreen{display:flex;align-items:center;justify-content:center;background:#000;}';
  document.head.appendChild(st);
  function theCanvas(){ return document.getElementById('game') || document.querySelector('canvas'); }
  document.addEventListener('keydown', e => {
    if ((e.key === 'f' || e.key === 'F') && !e.repeat) {
      const c = theCanvas(); if (!c) return;
      // le conteneur (et pas le canvas seul) : les écrans de fin restent visibles
      const target = document.getElementById('wrap') || c.parentElement || c;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const c = theCanvas(); if (!c) return;
    if (document.fullscreenElement) {
      const k = Math.min(innerWidth / c.width, innerHeight / c.height);
      c.dataset.oldW = c.style.width || ''; c.dataset.oldH = c.style.height || '';
      c.style.width = Math.floor(c.width * k) + 'px';
      c.style.height = Math.floor(c.height * k) + 'px';
    } else {
      c.style.width = c.dataset.oldW || ''; c.style.height = c.dataset.oldH || '';
    }
  });
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

/* ════ Retour au menu : l'accueil se replace sur la vignette du jeu quitté ════ */
(function () {
  const segs = location.pathname.split('/').filter(s => s && !/index\.html?$/i.test(s));
  const game = segs.length ? decodeURIComponent(segs[segs.length - 1]) : '';
  if (document.querySelector('canvas')) {
    // page de jeu : on retient le dernier jeu visité
    try { sessionStorage.setItem('arcadeLastGame', game); } catch (e) {}
    return;
  }
  function go() {
    let last = ''; try { last = sessionStorage.getItem('arcadeLastGame') || ''; } catch (e) {}
    if (!last) return;
    const card = document.querySelector('a.card[href*="/' + last + '/"]');
    if (!card) return;
    card.scrollIntoView({ block: 'center' });
    // petit halo pour retrouver la vignette du premier coup d'œil
    card.style.transition = 'box-shadow .4s, border-color .4s';
    card.style.borderColor = '#ffd23a';
    card.style.boxShadow = '0 0 0 2px #ffd23a, 0 0 30px rgba(255,210,58,.45)';
    setTimeout(() => { card.style.borderColor = ''; card.style.boxShadow = ''; }, 1600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
  // aussi au retour via le cache navigateur (bouton précédent)
  addEventListener('pageshow', e => { if (e.persisted) go(); });
})();

/* ════ Contrôles tactiles : téléphone et tablette ════
   Croix directionnelle (8 directions) + boutons d'action, convertis en
   véritables événements clavier : tous les jeux fonctionnent sans modification.
   Forçable sur ordinateur avec ?touch=1 pour tester. */
(function () {
  const forced = /[?&]touch=1/.test(location.search);
  const isTouch = forced || (window.matchMedia && matchMedia('(pointer:coarse)').matches)
    || navigator.maxTouchPoints > 1 || 'ontouchstart' in window;
  if (!isTouch) return;

  function start() {
    if (window.__arcadeTouch) return; window.__arcadeTouch = 1;
    const cv = document.getElementById('game') || document.querySelector('canvas');
    if (!cv) return;                                   // page menu : pas de manette
    document.body.classList.add('touch-ctl');

    // zoom/défilement désactivés pour que le jeu se comporte comme une borne
    let vp = document.querySelector('meta[name=viewport]');
    if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; document.head.appendChild(vp); }
    vp.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');

    const st = document.createElement('style');
    st.textContent = `
      body.touch-ctl{overflow:hidden;justify-content:flex-start!important;padding-top:44px;
        height:auto!important;min-height:100%;touch-action:none;-webkit-user-select:none;}
      /* la barre de musique est fixée en bas : sur mobile elle recouvrirait la
         manette, on la remonte en haut à gauche, en format compact */
      body.touch-ctl #arcade-music{bottom:auto!important;top:calc(env(safe-area-inset-top,0px) + 5px)!important;
        left:6px!important;transform:none!important;max-width:40vw!important;}
      /* le badge RECORD passe SOUS la zone de jeu : au-dessus il buterait
         contre la barre de musique et les boutons utilitaires */
      body.touch-ctl #arcade-hi.on-wrap{top:auto;bottom:-26px;right:4px;}
      body.touch-ctl #arcade-hi:not(.on-wrap){top:46px;}
      body.touch-ctl #arcade-music .am-head{padding:4px 8px;gap:6px;}
      body.touch-ctl #arcade-music .am-title{font-size:11px;}
      /* le canvas est un élément flex : sans cela il serait écrasé par flex-shrink */
      body.touch-ctl #wrap,body.touch-ctl canvas{flex:0 0 auto;}
      body.touch-ctl h1{font-size:15px!important;margin:0 0 4px!important;}
      body.touch-ctl #hint{display:none;}
      body.touch-ctl canvas{width:auto!important;height:auto!important;
        max-width:97vw!important;max-height:52vh!important;touch-action:none;}
      @media (orientation:landscape){ body.touch-ctl canvas{max-height:74vh!important;}
        body.touch-ctl{padding-top:24px;} }
      #tpad{position:fixed;inset:auto 0 0 0;height:38vh;max-height:250px;z-index:9997;
        pointer-events:none;font-family:'Courier New',monospace;}
      @media (orientation:landscape){ #tpad{height:100vh;max-height:none;top:0;} }
      #tpad .z{position:absolute;pointer-events:auto;-webkit-tap-highlight-color:transparent;}
      /* remontée du bord bas : encoche + barre du navigateur (ajustée en JS) */
      #tpad{--tlift:calc(env(safe-area-inset-bottom,0px) + 44px);}
      /* croix directionnelle */
      #tdpad{left:14px;bottom:var(--tlift);width:38vw;max-width:170px;aspect-ratio:1;border-radius:50%;
        background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.13),rgba(10,10,26,.55));
        border:2px solid rgba(255,255,255,.28);box-shadow:0 0 18px rgba(0,0,0,.5);}
      #tdpad .ar{position:absolute;color:rgba(255,255,255,.65);font-size:19px;font-weight:bold;
        line-height:1;transform:translate(-50%,-50%);}
      #tdpad .nub{position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;border-radius:50%;
        transform:translate(-50%,-50%);background:rgba(255,210,58,.55);
        border:2px solid rgba(255,255,255,.7);transition:background .12s;}
      #tdpad.on .nub{background:#ffd23a;}
      /* boutons d'action */
      #tbtns{right:12px;bottom:var(--tlift);display:flex;flex-wrap:wrap-reverse;gap:10px;
        justify-content:flex-end;width:44vw;max-width:210px;}
      #tpad .b{pointer-events:auto;width:62px;height:62px;border-radius:50%;
        display:flex;align-items:center;justify-content:center;text-align:center;
        font-size:12px;font-weight:bold;letter-spacing:.5px;color:#fff;
        background:rgba(255,46,136,.32);border:2px solid rgba(255,120,180,.75);
        box-shadow:0 0 14px rgba(255,46,136,.3);-webkit-tap-highlight-color:transparent;}
      #tpad .b.act{background:#ff2e88;transform:scale(.93);}
      #tpad .b.sm{width:46px;height:46px;font-size:11px;
        background:rgba(78,204,163,.24);border-color:rgba(78,204,163,.7);box-shadow:none;}
      #tpad .b.sm.act{background:#4ecca3;color:#06202a;}
      /* barre utilitaire en haut */
      /* barre utilitaire : à droite, la barre de musique occupe la gauche */
      #ttop{position:fixed;top:calc(env(safe-area-inset-top,0px) + 5px);right:8px;left:auto;
        transform:none;z-index:9997;display:flex;gap:8px;pointer-events:none;}
      #ttop .b{pointer-events:auto;width:auto;min-width:34px;height:32px;border-radius:16px;
        padding:0 7px;font-size:12px;}
      #textra{position:fixed;right:12px;bottom:calc(38vh + 24px);z-index:9997;display:none;
        flex-wrap:wrap;justify-content:flex-end;gap:8px;width:60vw;max-width:250px;pointer-events:none;}
      @media (orientation:landscape){ #textra{bottom:auto;top:44px;} }
      #textra.open{display:flex;}`;
    document.head.appendChild(st);

    /* — envoi de vraies touches clavier — */
    const CODES = { ArrowUp:'ArrowUp', ArrowDown:'ArrowDown', ArrowLeft:'ArrowLeft', ArrowRight:'ArrowRight',
      ' ':'Space', Enter:'Enter' };
    const down = {};
    function send(key, isDown) {
      const code = CODES[key] || (/^[a-z]$/i.test(key) ? 'Key' + key.toUpperCase() : key);
      document.dispatchEvent(new KeyboardEvent(isDown ? 'keydown' : 'keyup',
        { key, code, bubbles: true, cancelable: true }));
    }
    function press(key)   { if (down[key]) return; down[key] = 1; send(key, true);
                            if (navigator.vibrate) try { navigator.vibrate(9); } catch (e) {} }
    function release(key) { if (!down[key]) return; down[key] = 0; send(key, false); }
    function releaseAll() { Object.keys(down).forEach(release); }
    window.addEventListener('blur', releaseAll);

    const pad = document.createElement('div'); pad.id = 'tpad';
    document.body.appendChild(pad);

    /* Sur iPhone, un élément `fixed` est placé par rapport au viewport de mise
       en page, qui continue SOUS la barre d'outils de Safari : les commandes
       débordent du bas. On mesure la hauteur réellement masquée et on remonte
       la manette d'autant. */
    function liftFix() {
      const vv = window.visualViewport;
      const hidden = vv
        ? Math.max(0, Math.round(document.documentElement.clientHeight - (vv.height + vv.offsetTop)))
        : 0;
      pad.style.setProperty('--tlift',
        'calc(env(safe-area-inset-bottom,0px) + ' + (44 + hidden) + 'px)');
      const ex = document.getElementById('textra');       // créé plus bas
      if (ex) ex.style.bottom = 'calc(38vh + ' + (24 + hidden) + 'px)';
    }
    if (window.visualViewport) {
      ['resize', 'scroll'].forEach(e => visualViewport.addEventListener(e, liftFix));
    }
    addEventListener('orientationchange', () => setTimeout(liftFix, 250));
    addEventListener('resize', liftFix);

    /* — croix directionnelle analogique (8 directions) — */
    const dp = document.createElement('div'); dp.className = 'z'; dp.id = 'tdpad';
    dp.innerHTML = '<div class="nub"></div>' +
      '<span class="ar" style="left:50%;top:13%">▲</span><span class="ar" style="left:50%;top:87%">▼</span>' +
      '<span class="ar" style="left:13%;top:50%">◀</span><span class="ar" style="left:87%;top:50%">▶</span>';
    pad.appendChild(dp);
    const nub = dp.querySelector('.nub');
    const DIRS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let padId = null;
    function padMove(t) {
      const r = dp.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = t.clientX - cx, dy = t.clientY - cy;
      const d = Math.hypot(dx, dy), dead = r.width * 0.16;
      const want = {};
      if (d > dead) {
        // 8 directions : au-delà de 22° d'un axe, les deux touches partent (diagonale)
        const ang = Math.atan2(-dy, dx) * 180 / Math.PI;      // 0 = droite, 90 = haut
        if (ang > -67 && ang < 67)             want.ArrowRight = 1;
        if (ang > 113 || ang < -113)           want.ArrowLeft  = 1;
        if (ang > 23  && ang < 157)            want.ArrowUp    = 1;
        if (ang < -23 && ang > -157)           want.ArrowDown  = 1;
      }
      DIRS.forEach(k => want[k] ? press(k) : release(k));
      dp.classList.toggle('on', d > dead);
      const lim = r.width * 0.3, k2 = d > lim ? lim / d : 1;
      nub.style.transform = 'translate(-50%,-50%) translate(' + (dx * k2) + 'px,' + (dy * k2) + 'px)';
    }
    function padEnd() { padId = null; DIRS.forEach(release); dp.classList.remove('on');
      nub.style.transform = 'translate(-50%,-50%)'; }
    dp.addEventListener('touchstart', e => { e.preventDefault();
      if (padId === null) { padId = e.changedTouches[0].identifier; padMove(e.changedTouches[0]); } }, { passive: false });
    dp.addEventListener('touchmove', e => { e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === padId) padMove(t); }, { passive: false });
    ['touchend', 'touchcancel'].forEach(ev => dp.addEventListener(ev, e => { e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === padId) padEnd(); }, { passive: false }));
    // souris (test sur ordinateur avec ?touch=1)
    dp.addEventListener('mousedown', e => { padId = 'm'; padMove(e);
      const mv = ev => padMove(ev), up = () => { padEnd();
        removeEventListener('mousemove', mv); removeEventListener('mouseup', up); };
      addEventListener('mousemove', mv); addEventListener('mouseup', up); });

    /* — boutons d'action (maintien géré : keydown au toucher, keyup au relâché) — */
    function mkBtn(key, label, cls) {
      const b = document.createElement('div');
      b.className = 'b' + (cls ? ' ' + cls : ''); b.textContent = label;
      const on = e => { e.preventDefault(); b.classList.add('act'); if (key) press(key); };
      const off = e => { e.preventDefault(); b.classList.remove('act'); if (key) release(key); };
      b.addEventListener('touchstart', on, { passive: false });
      ['touchend', 'touchcancel'].forEach(ev => b.addEventListener(ev, off, { passive: false }));
      b.addEventListener('mousedown', on); b.addEventListener('mouseup', off);
      b.addEventListener('mouseleave', off);
      return b;
    }

    // jeu de boutons par défaut, avec quelques adaptations par jeu
    const segs = location.pathname.split('/').filter(s => s && !/index\.html?$/i.test(s));
    const game = (segs.length ? decodeURIComponent(segs[segs.length - 1]) : '').toLowerCase();
    // boutons calqués sur les touches réellement gérées par chaque jeu
    const SETS = {
      nethack:   [[' ', 'ATTENTE'], ['.', 'RAMASSER'], ['i', 'SAC']],
      tetris:    [[' ', 'CHUTE'], ['ArrowUp', 'TOURNER']],
      outrun:    [['ArrowUp', 'GAZ'], ['ArrowDown', 'FREIN']],
      snake:     [[' ', 'TIRER']],
      pacman:    [[' ', 'START']],
      frogger:   [[' ', 'START']],
      arkanoid:  [[' ', 'LANCER']],
      bomberman: [[' ', 'BOMBE']],
      zaxxon:    [[' ', 'TIR']],
      moonpatrol:[[' ', 'SAUT'], ['x', 'TIR']],
      formulak:  [['ArrowUp', 'GAZ'], ['ArrowDown', 'FREIN']],
      alleycat:  [[' ', 'SAUT']],
      punchout:  [['x', 'GAUCHE'], ['c', 'DROITE'], [' ', 'UPPER ★']],
      queteduroi:[[' ', 'AGIR'], ['i', 'SAC']],
      commando:  [[' ', 'TIR'], ['x', 'GRENADE']],
      wolfenstein3d: [[' ', 'TIR']],
      castlewolfenstein: [[' ', 'TIR']],
      princeofpersia: [['ArrowUp', 'SAUT'], ['x', 'ÉPÉE']],
      lemmings:  [['1', '🛑'], ['2', '⛏'], ['3', '🪜'], ['4', '☂']],
      mortalkombat: [['x', 'POING'], ['c', 'PIED'], [' ', 'SAUT']],
      doubledragon: [['x', 'POING'], ['c', 'PIED'], [' ', 'SAUT']]
    };
    const actions = SETS[game] || [[' ', 'ESPACE'], ['x', 'X'], ['c', 'C']];
    const bwrap = document.createElement('div'); bwrap.className = 'z'; bwrap.id = 'tbtns';
    actions.forEach(([k, l]) => bwrap.appendChild(mkBtn(k, l)));
    pad.appendChild(bwrap);

    // touches supplémentaires (repliables) : couvre tous les jeux
    const extra = document.createElement('div'); extra.id = 'textra';
    [['s', 'S'], ['z', 'Z'], ['r', 'R'], ['i', 'I'], ['.', '.'], ['Enter', '⏎'], ['5', '5']]
      .forEach(([k, l]) => extra.appendChild(mkBtn(k, l, 'sm')));
    document.body.appendChild(extra);

    // barre du haut : pause, touches en plus, plein écran
    const top = document.createElement('div'); top.id = 'ttop';
    top.appendChild(mkBtn('p', '⏸'));
    const more = mkBtn(null, '⌨');
    more.addEventListener('click', () => extra.classList.toggle('open'));
    top.appendChild(more);
    const fs = mkBtn(null, '⛶');
    fs.addEventListener('click', () => {
      const target = document.getElementById('wrap') || cv.parentElement || cv;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
    });
    top.appendChild(fs);
    // retour au menu : en paysage le lien sous la zone de jeu peut être hors écran
    const home = mkBtn(null, '⌂');
    home.addEventListener('click', () => {
      const a = document.querySelector('a.back') || document.querySelector('a[href*="index.html"]');
      location.href = a ? a.getAttribute('href') : '../index.html';
    });
    top.appendChild(home);
    document.body.appendChild(top);

    // en plein écran, la manette doit suivre dans l'élément affiché
    document.addEventListener('fullscreenchange', () => {
      const host = document.fullscreenElement || document.body;
      [pad, extra, top].forEach(el => host.appendChild(el));
    });

    // Un appui sur la zone de jeu vaut Espace, mais SEULEMENT quand la partie
    // n'est pas en cours : sinon on volerait le clic aux jeux qui visent à la
    // souris (Lemmings, Missile Command…) ou on déclencherait une action.
    // (les globaux `let running/over` des jeux sont visibles depuis ici)
    function idle() {
      try {
        if (typeof running !== 'undefined' && !running) return true;
        if (typeof over !== 'undefined' && over) return true;
      } catch (e) {}
      return false;
    }
    cv.addEventListener('touchstart', () => {
      if (idle()) { press(' '); setTimeout(() => release(' '), 60); }
    }, { passive: true });

    liftFix();                                   // position initiale des commandes
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
