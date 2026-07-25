const SETTINGS_KEY_DN = "deathnote-display-settings";
const CURRENT_SONG_KEY_DN = "deathnote-current-song-id";

const refsDN = {
  songList: document.querySelector('#songList'),
  songSelect: document.querySelector('#songSelect'),
  songTitle: document.querySelector('#songTitle'),
  lyrics: document.querySelector('#lyrics'),
  toggleButtons: [...document.querySelectorAll('[data-toggle]')],
  sidebarToggle: document.querySelector('#sidebarToggle'),
  shell: document.querySelector('.app-shell'),
};

let deathSongs = window.deathNoteSongs || [];
let stateDN = { settings: { showZh: true, showIpa: true }, currentSongId: '' };

function initDN() {
  try { const saved = localStorage.getItem(SETTINGS_KEY_DN); if (saved) stateDN.settings = JSON.parse(saved); } catch {}
  renderSongList();
  populateSelect();
  stateDN.currentSongId = localStorage.getItem(CURRENT_SONG_KEY_DN) || deathSongs[0]?.id || '';
  renderCurrentSong();
  bindControlsDN();
  // 初始化切换按钮状态
  refsDN.toggleButtons.forEach((button) => {
    const key = button.dataset.toggle;
    const active = !!stateDN.settings[key];
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderSongList() {
  refsDN.songList.innerHTML = '';
  deathSongs.forEach((song) => {
    const item = document.createElement('button');
    item.className = 'song-item';
    item.type = 'button';
    item.dataset.id = song.id;
    item.innerHTML = `<div class="song-order">${String(song.order).padStart(2,'0')}</div><div class="song-name">${song.title}</div>`;
    item.addEventListener('click', () => selectSong(song.id));
    refsDN.songList.appendChild(item);
  });
  highlightActive();
}

function populateSelect(){
  if(!refsDN.songSelect) return;
  refsDN.songSelect.innerHTML = '';
  deathSongs.forEach(s=>{ const opt=document.createElement('option'); opt.value=s.id; opt.textContent=`${s.order}. ${s.title}`; refsDN.songSelect.appendChild(opt); });
  refsDN.songSelect.addEventListener('change', e=>selectSong(e.target.value));
}

function selectSong(id){
  stateDN.currentSongId = id;
  localStorage.setItem(CURRENT_SONG_KEY_DN, id);
  renderCurrentSong();
  highlightActive();
}

function highlightActive(){
  document.querySelectorAll('.song-item').forEach(btn=>btn.classList.toggle('is-active', btn.dataset.id===stateDN.currentSongId));
  if(refsDN.songSelect) refsDN.songSelect.value = stateDN.currentSongId;
}

function renderCurrentSong(){
  const song = deathSongs.find(s=>s.id===stateDN.currentSongId) || deathSongs[0];
  if(!song){ refsDN.songTitle.textContent='Death Note 韩语音乐剧'; refsDN.lyrics.innerHTML='<p class="empty">暂无韩语音乐剧歌词数据。</p>'; return; }
  refsDN.songTitle.textContent = `${song.title}`;
  refsDN.lyrics.innerHTML = '';
  song.lines.forEach(line=>{
    const card = document.createElement('div'); card.className='lyric-card';
    const en = document.createElement('div'); en.className='line-en'; en.textContent = line.en || '';
    card.appendChild(en);
    if(stateDN.settings.showIpa && line.ipa){ const ipa = document.createElement('div'); ipa.className='line-ipa'; ipa.textContent = line.ipa; card.appendChild(ipa); }
    if(stateDN.settings.showZh && line.zh){ const zh = document.createElement('div'); zh.className='line-zh'; zh.textContent = line.zh; card.appendChild(zh); }
    refsDN.lyrics.appendChild(card);
  });
}

function bindControlsDN(){
  refsDN.toggleButtons.forEach((button)=>{
    button.addEventListener('click',()=>{
      const key=button.dataset.toggle;
      stateDN.settings[key]=!stateDN.settings[key];
      localStorage.setItem(SETTINGS_KEY_DN, JSON.stringify(stateDN.settings));
      renderCurrentSong();
      button.classList.toggle('is-active', stateDN.settings[key]);
      button.setAttribute('aria-pressed', stateDN.settings[key] ? 'true' : 'false');
    });
  });
  refsDN.sidebarToggle?.addEventListener('click', ()=>{ refsDN.shell.classList.toggle('is-collapsed'); });
}

document.addEventListener('DOMContentLoaded', initDN);
