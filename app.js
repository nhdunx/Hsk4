// app.js — Logic ứng dụng Hanzi Learn
/* ===================== CONFIG ===================== */
const HSK_INFO = [
  {level:1, name:'Bài 1', desc:'简单的爱情 - Tình yêu đơn giản', color:'#e74c3c'},
  {level:2, name:'Bài 2', desc:'真正的朋友 - Người bạn thực sự', color:'#e67e22'},
  {level:3, name:'Bài 3', desc:'经理对我印象不错 - Giám đốc có ấn tượng tốt về tôi', color:'#f1c40f'},
  {level:4, name:'Bài 4', desc:'不要太着急赚钱 - Đừng quá vội kiếm tiền', color:'#27ae60'},
  {level:5, name:'Bài 5', desc:'只买对的，不买贵的 - Chỉ mua đồ phù hợp, không mua đồ đắt', color:'#2980b9'},
  {level:6, name:'Bài 6', desc:'一分钱一分货 - Tiền nào của nấy', color:'#8e44ad'},
  {level:7, name:'Bài 7', desc:'最好的医生是自己 - Bác sĩ tốt nhất là chính mình', color:'#34495e'},
  {level:8, name:'Bài 8', desc:'生活中不缺少美 - Cuộc sống không thiếu cái đẹp', color:'#2c3e50'},
  {level:9, name:'Bài 9', desc:'阳光总在风雨后 - Ánh nắng luôn ở sau cơn mưa', color:'#16a085'},
  {level:10, name:'Bài 10', desc:'幸福的标准 - Tiêu chuẩn của hạnh phúc', color:'#c0392b'},
  {level:11, name:'Bài 11', desc:'读书好，读好书，好读书 - Đọc sách tốt, đọc sách hay, thích đọc sách', color:'#d35400'},
  {level:12, name:'Bài 12', desc:'用心发现世界 - Dùng tâm khám phá thế giới', color:'#f39c12'},
  {level:13, name:'Bài 13', desc:'喝着茶看京剧 - Uống trà xem Kinh kịch', color:'#27ae60'},
  {level:14, name:'Bài 14', desc:'保护地球母亲 - Bảo vệ mẹ Trái Đất', color:'#2980b9'},
  {level:15, name:'Bài 15', desc:'教育孩子的艺术 - Nghệ thuật giáo dục trẻ em', color:'#8e44ad'},
  {level:16, name:'Bài 16', desc:'生活可以更美好 - Cuộc sống có thể tươi đẹp hơn', color:'#34495e'},
  {level:17, name:'Bài 17', desc:'人与自然 - Con người và thiên nhiên', color:'#2c3e50'},
  {level:18, name:'Bài 18', desc:'科技与世界 - Khoa học công nghệ và thế giới', color:'#16a085'},
  {level:19, name:'Bài 19', desc:'生活的味道 - Hương vị cuộc sống', color:'#c0392b'},
  {level:20, name:'Bài 20', desc:'路上的风景 - Phong cảnh trên đường', color:'#d35400'}
];

/* ===================== STATE ===================== */
let currentUser = {u:'Khách', access:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], role:'guest'};
let currentLevel = null;
let VOCAB = [];
let mode = 'all', shuffled = false;
let order = [];
let answers = {};
let starred = new Set();
let examCfg = {pool:'all', type:'meaning', count:10};
let quizQuestions = [], quizIdx = 0, quizResults = [];

/* ===================== PROFILE & STORAGE ===================== */
const STATE_KEY = 'hsk_app_state';
const PROFILE_CURRENT_KEY = 'hsk_profile_current';
const SCREENS = ['select-screen','grammar-screen','app-screen','exam-screen','quiz-screen','result-screen','fc-setup-screen','fc-play-screen','fc-end-screen','pt-setup-screen','pt-play-screen','pt-result-screen','py-setup-screen','py-play-screen','py-result-screen','vt-setup-screen','vt-play-screen','vt-result-screen'];
let currentProfile = '';
let profileData = {name:'', stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}};
var GRAMMAR_DATA = window.GRAMMAR_DATA || [];
var currentGrammarCategory = -1;
var grammarDataLoaded = false;
var grammarDataLoadError = false;

function getProfileStorageKey(name){
  return 'hsk_profile_' + encodeURIComponent((name||'').trim().toLowerCase());
}
function getProfileStateKey(){
  return currentProfile ? getProfileStorageKey(currentProfile) + '_state' : STATE_KEY;
}
function saveProfileData(){
  if(!currentProfile) return;
  profileData.name = currentProfile;
  profileData.updatedAt = Date.now();
  if(currentLevel){ profileData.stars[currentLevel] = [...starred]; }
  try{
    localStorage.setItem(getProfileStorageKey(currentProfile), JSON.stringify(profileData));
    localStorage.setItem(PROFILE_CURRENT_KEY, currentProfile);
  } catch(e){ console.warn('Unable to save profile data', e); }
}
function loadProfileData(name){
  if(!name) return {name:'', stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}};
  try{
    const raw = localStorage.getItem(getProfileStorageKey(name));
    if(!raw) return {name, stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}};
    const parsed = JSON.parse(raw);
    return Object.assign({name:'', stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}}, parsed, {name});
  } catch(e){
    console.warn('Unable to load profile data', e);
    return {name, stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}};
  }
}
function showProfileModal(){
  const modal = document.getElementById('profile-modal');
  const input = document.getElementById('profile-name-input');
  const msg = document.getElementById('profile-msg');
  if(modal){ modal.classList.add('show'); }
  if(input){ input.value = currentProfile || ''; }
  if(msg){ msg.textContent = ''; msg.className = 'modal-msg'; }
}
function closeProfileModal(){
  const modal = document.getElementById('profile-modal');
  if(modal) modal.classList.remove('show');
}
function saveProfileName(){
  const input = document.getElementById('profile-name-input');
  const msg = document.getElementById('profile-msg');
  const name = (input ? input.value : '').trim();
  if(!name){
    if(msg){ msg.className='modal-msg err'; msg.textContent='Vui lòng nhập tên trước khi tiếp tục.'; }
    return;
  }
  currentProfile = name;
  profileData = loadProfileData(currentProfile);
  if(profileData.appState && profileData.appState.grammarCategory >= 0){
    currentGrammarCategory = profileData.appState.grammarCategory;
  }
  saveProfileData();
  closeProfileModal();
  renderHskGrid();
  renderProfileBadge();
  if(profileData.appState && profileData.appState.currentLevel){
    selectHsk(profileData.appState.currentLevel);
  } else {
    showOnly('select-screen');
  }
}
function renderProfileBadge(){
  const badge = document.getElementById('profile-badge');
  if(badge){ badge.textContent = currentProfile ? '👤 ' + currentProfile : '👤 Người dùng'; }
}
function exportProfileData(){
  if(!currentProfile){
    const msg = document.getElementById('profile-msg');
    if(msg){ msg.className='modal-msg err'; msg.textContent='Vui lòng lưu tên trước khi xuất dữ liệu.'; }
    return;
  }
  saveProfileData();
  const blob = new Blob([JSON.stringify(profileData, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hsk-profile-' + currentProfile.replace(/\s+/g,'-') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const msg = document.getElementById('profile-msg');
  if(msg){ msg.className='modal-msg ok'; msg.textContent='Đã xuất dữ liệu thành công.'; }
}
function handleProfileImport(input){
  const file = input && input.files && input.files[0];
  if(!file){ return; }
  const reader = new FileReader();
  reader.onload = function(){
    try{
      const parsed = JSON.parse(reader.result);
      currentProfile = parsed.name || currentProfile || 'Khách';
      profileData = Object.assign({name:'', stars:{}, appState:{screen:'select-screen', currentLevel:null, grammarCategory:-1}}, parsed, {name: currentProfile});
      if(profileData.appState && profileData.appState.grammarCategory >= 0){
        currentGrammarCategory = profileData.appState.grammarCategory;
      }
      saveProfileData();
      renderHskGrid();
      renderProfileBadge();
      closeProfileModal();
      if(profileData.appState && profileData.appState.currentLevel){
        selectHsk(profileData.appState.currentLevel);
      } else {
        showOnly('select-screen');
      }
    } catch(e){
      const msg = document.getElementById('profile-msg');
      if(msg){ msg.className='modal-msg err'; msg.textContent='File không hợp lệ.'; }
    }
  };
  reader.readAsText(file);
  if(input) input.value = '';
}
function saveAppState(screenId){
  try{
    profileData.appState = { 
      screen: screenId, 
      currentLevel: currentLevel || null,
      grammarCategory: currentGrammarCategory 
    };
    if(currentProfile){
      saveProfileData();
    } else {
      localStorage.setItem(getProfileStateKey(), JSON.stringify(profileData.appState));
    }
  } catch(e){ console.warn('Unable to save app state', e); }
}
function showOnly(id){
  SCREENS.forEach(s=>{
    const screen = document.getElementById(s);
    if(screen) screen.classList.toggle('active', s===id);
  });
  const zaloFloat = document.getElementById('zalo-float');
  if(zaloFloat) zaloFloat.style.display = 'block';
  saveAppState(id);
}

function restoreAppState(){
  try{
    var stateKey = getProfileStateKey();
    var raw = localStorage.getItem(stateKey);
    if(!raw) return false;
    var state = JSON.parse(raw || '{}');
    if(!state.screen) return false;
    if(state.currentLevel && HSK_DATA['hsk'+state.currentLevel]){
      selectHsk(state.currentLevel);
    } else {
      renderHskGrid();
      showOnly('select-screen');
      return true;
    }
    if(state.screen === 'select-screen'){
      renderHskGrid();
      showOnly('select-screen');
      return true;
    }
    if(state.screen === 'grammar-screen'){
      if(state.grammarCategory >= 0 && state.grammarCategory < GRAMMAR_DATA.length){
        currentGrammarCategory = state.grammarCategory;
        renderGrammarDetail(currentGrammarCategory);
      } else {
        renderGrammarList();
      }
      showGrammarScreen();
      return true;
    }
    if(state.screen === 'app-screen'){
      showOnly('app-screen');
      return true;
    }
    if(['exam-screen','quiz-screen','result-screen'].includes(state.screen)){
      showExamSetup();
      return true;
    }
    if(['pt-setup-screen','pt-play-screen','pt-result-screen'].includes(state.screen)){
      showPtSetup();
      return true;
    }
    if(['py-setup-screen','py-play-screen','py-result-screen'].includes(state.screen)){
      showPySetup();
      return true;
    }
    if(['vt-setup-screen','vt-play-screen','vt-result-screen'].includes(state.screen)){
      showVtSetup();
      return true;
    }
    if(['fc-setup-screen','fc-play-screen','fc-end-screen'].includes(state.screen)){
      showFlashcard();
      return true;
    }
    showOnly('select-screen');
    return true;
  }catch(e){
    console.warn('Unable to restore app state', e);
    return false;
  }
}

function logout(){
  answers={}; starred=new Set(); currentLevel=null; VOCAB=[]; currentGrammarCategory=-1;
  currentUser = {u:'Khách', access:[1,2,3,4,5,6], role:'guest'};
  shuffled=false;
  document.getElementById('shuffle-btn').classList.remove('on');
  closeAllDropdowns();
  showOnly('select-screen');
}

function initApp(){
  const savedName = localStorage.getItem(PROFILE_CURRENT_KEY);
  renderHskGrid();
  loadGrammarData();
  if(savedName){
    currentProfile = savedName;
    profileData = loadProfileData(currentProfile);
    if(profileData.appState && profileData.appState.grammarCategory >= 0){
      currentGrammarCategory = profileData.appState.grammarCategory;
    }
    renderProfileBadge();
    if(!restoreAppState()){
      renderHskGrid();
      showOnly('select-screen');
    }
  } else {
    renderProfileBadge();
    renderHskGrid();
    showOnly('select-screen');
    showProfileModal();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  try {
    initApp();
  } catch (err) {
    console.error('App init failed:', err);
    renderHskGrid();
    showOnly('select-screen');
  }
}

/* ===================== AVATAR DROPDOWN ===================== */
function toggleAvatar(){
  const dd=document.getElementById('avatar-dropdown');
  if(dd) dd.classList.toggle('show');
}
function closeAllDropdowns(){
  const dd=document.getElementById('avatar-dropdown');
  if(dd) dd.classList.remove('show');
  document.getElementById('zalo-popup').classList.remove('show');
}
document.addEventListener('click',e=>{
  const dd=document.getElementById('avatar-dropdown');
  if(dd && !e.target.closest('.avatar-wrap')) dd.classList.remove('show');
  if(!e.target.closest('.zalo-float')) document.getElementById('zalo-popup').classList.remove('show');
});

/* ===================== CHANGE PASSWORD ===================== */
function showChangePassword(){
  if(currentUser && currentUser.u === 'demo'){
    document.getElementById('demo-notice').style.display='';
    document.getElementById('demo-notice').classList.add('show');
    return;
  }
  closeAllDropdowns();
  document.getElementById('pw-modal').classList.add('show');
  document.getElementById('pw-old').value='';
  document.getElementById('pw-new').value='';
  document.getElementById('pw-confirm').value='';
  const msg=document.getElementById('pw-msg'); msg.className='modal-msg'; msg.textContent='';
}
function closePwModal(){
  document.getElementById('pw-modal').classList.remove('show');
}
async function doChangePw(){
  const old=document.getElementById('pw-old').value;
  const nw=document.getElementById('pw-new').value;
  const cf=document.getElementById('pw-confirm').value;
  const msg=document.getElementById('pw-msg');
  if(nw.length<4){
    msg.className='modal-msg err'; msg.textContent='Mật khẩu mới phải từ 4 ký tự!'; return;
  }
  if(nw!==cf){
    msg.className='modal-msg err'; msg.textContent='Mật khẩu nhập lại không khớp!'; return;
  }
  // Try server API first
  try {
    if(window._authToken){
      var res = await fetch(window.location.origin+'/api/change-password', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+window._authToken},
        body: JSON.stringify({oldPassword:old, newPassword:nw})
      });
      var data = await res.json();
      if(res.ok){
        msg.className='modal-msg ok'; msg.textContent='✅ '+data.message;
        setTimeout(()=>closePwModal(),1200);
        return;
      }
      msg.className='modal-msg err'; msg.textContent=data.error; return;
    }
  } catch(e) {}
  // Fallback: local check
  if(old!==currentUser.p){
    msg.className='modal-msg err'; msg.textContent='Mật khẩu hiện tại không đúng!'; return;
  }
  currentUser.p=nw;
  msg.className='modal-msg ok'; msg.textContent='✅ Đổi mật khẩu thành công!';
  setTimeout(()=>closePwModal(),1200);
}

/* ===================== ZALO ===================== */
function toggleZaloPopup(){
  document.getElementById('zalo-popup').classList.toggle('show');
}
function showZaloContact(){
  // From login forgot password
  alert('Liên hệ Zalo Admin: 0792 739 257');
}

/* ===================== HSK GRID ===================== */
function renderHskGrid(){
  const grid=document.getElementById('hsk-grid');
  const access = currentUser.hskAccess || currentUser.access || [];
  const grammarCard = `<div class="hsk-card grammar-card" onclick="showGrammarScreen()" style="border-top:4px solid #27ae60">
      <div class="hsk-card-label">Ngữ Pháp</div>
      <div class="hsk-card-count">${GRAMMAR_DATA.length ? GRAMMAR_DATA.length + ' mục' : 'Dữ liệu ngữ pháp'}</div>
      <div class="hsk-card-desc">Ôn tập ngữ pháp HSK 4 theo cấu trúc và ví dụ.</div>
      <button class="hsk-card-btn" style="background:#27ae60;margin-top:14px">Xem ngay →</button>
    </div>`;
  grid.innerHTML = grammarCard + HSK_INFO.map(h=>{
    const data = HSK_DATA['hsk'+h.level];
    const count = data ? data.length : 0;
    // HSK 1 luôn mở cho mọi người (50 từ free)
    const isLocked = h.level === 1 ? false : access.indexOf(h.level) === -1;
    const lockedClass = isLocked ? 'locked' : '';
    const lockIcon = isLocked ? '<div class="hsk-card-lock">🔒</div>' : '';
    const clickAction = isLocked ? `showLocked()` : `selectHsk(${h.level})`;
    const btnText = isLocked ? '🔒 Mở khóa' : 'Bắt đầu học →';
    const freeNote = '';
    return `<div class="hsk-card ${lockedClass}" onclick="${clickAction}" style="border-top:4px solid ${h.color}">
      ${lockIcon}
      <div class="hsk-card-level" style="color:${isLocked?'#666':h.color}">${h.level}</div>
      <div class="hsk-card-label">${h.name}</div>
      <div class="hsk-card-count">${count} từ vựng</div>
      <div class="hsk-card-desc">${h.desc}</div>
      <button class="hsk-card-btn" style="background:${isLocked?'#888':h.color};margin-top:14px" 
        onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">${btnText}</button>
    </div>`;
  }).join('');
}

function showGrammarScreen(){
  if(!GRAMMAR_DATA.length){
    loadGrammarData();
  }
  if(currentGrammarCategory < 0 || currentGrammarCategory >= GRAMMAR_DATA.length){
    renderGrammarList();
  } else {
    renderGrammarDetail(currentGrammarCategory);
  }
  showOnly('grammar-screen');
  window.scrollTo({top:0});
}

function renderGrammarList(){
  currentGrammarCategory = -1;
  const listView = document.getElementById('grammar-list-view');
  const detailView = document.getElementById('grammar-detail-view');
  const backBtn = document.getElementById('grammar-back-btn');
  const title = document.getElementById('grammar-title');
  
  if(listView) listView.style.display = 'flex';
  if(detailView) detailView.style.display = 'none';
  if(backBtn) backBtn.style.display = 'inline-block';
  if(title) title.textContent = 'Ngữ Pháp';
  
  const grid = document.getElementById('grammar-categories-grid');
  if(!grid) return;
  
  if(!GRAMMAR_DATA.length){
    const message = grammarDataLoadError
      ? 'Không có dữ liệu ngữ pháp. Kiểm tra lại file grammar_data.js.'
      : 'Đang tải dữ liệu ngữ pháp...';
    grid.innerHTML = `<div class="grammar-loading">${message}</div>`;
    return;
  }
  
  grid.innerHTML = GRAMMAR_DATA.map((cat, idx)=>
    `<div class="grammar-category-card" onclick="renderGrammarDetail(${idx})">
      <div class="grammar-category-card-num">Bài ${idx+1}</div>
      <div class="grammar-category-card-label">${esc(cat.category || cat.A || cat.title || 'Chuyên đề')}</div>
      <button class="grammar-card-action" type="button">Xem ngay →</button>
    </div>`
  ).join('');
}

function renderGrammarDetail(idx){
  if(idx < 0 || idx >= GRAMMAR_DATA.length) return;
  currentGrammarCategory = idx;
  saveAppState('grammar-screen');
  
  const listView = document.getElementById('grammar-list-view');
  const detailView = document.getElementById('grammar-detail-view');
  const title = document.getElementById('grammar-title');
  const cat = GRAMMAR_DATA[idx];
  const categoryTitle = cat.category || cat.A || cat.title || 'Ngữ pháp';
  
  if(listView) listView.style.display = 'none';
  if(detailView) detailView.style.display = 'block';
  if(title) title.textContent = 'Ngữ Pháp - ' + (idx+1);
  
  const content = document.getElementById('grammar-detail-content');
  if(!content) return;
  
  content.innerHTML = `
    <div class="grammar-detail-back" onclick="renderGrammarList()">← Quay lại danh sách</div>
    <div class="grammar-detail-card">
      <div class="grammar-category">
        <h2>${esc(cat.category)}</h2>
        ${cat.structures.map(str=>`<div class="grammar-structure">
          <div class="grammar-pattern">${esc(str.pattern)}</div>
          <div class="grammar-meta"><span>${esc(str.pinyin)}</span><span>${esc(str.meaning)}</span></div>
          <div class="grammar-explanation">${esc(str.explanation)}</div>
          <div class="grammar-examples">${str.examples.map(ex=>`<div class="grammar-example"><div class="grammar-example-chinese">${esc(ex.chinese)}</div><div class="grammar-example-pinyin">${esc(ex.pinyin)}</div><div class="grammar-example-vn">${esc(ex.vietnamese)}</div></div>`).join('')}</div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

function loadGrammarData(){
  grammarDataLoadError = false;
  if(Array.isArray(GRAMMAR_DATA) && GRAMMAR_DATA.length){
    grammarDataLoaded = true;
    if(currentGrammarCategory < 0) renderGrammarList();
    renderHskGrid();
    return;
  }
  grammarDataLoadError = true;
  grammarDataLoaded = false;
  if(currentGrammarCategory < 0) renderGrammarList();
  renderHskGrid();
}

function showLocked(){
  document.getElementById('locked-msg').classList.add('show');
}
function closeLocked(){
  document.getElementById('locked-msg').classList.remove('show');
}
function closeDemoNotice(){
  document.getElementById('demo-notice').classList.remove('show');
}

/* ===================== SELECT HSK ===================== */
function selectHsk(level){
  currentLevel = level;
  VOCAB = HSK_DATA['hsk'+level] || [];
  order = VOCAB.map((_,i)=>i);
  answers = {};
  starred = new Set();
  shuffled = false;
  starFilter = 'all';
  pinyinHidden = false;
  mode = 'all';
  document.getElementById('shuffle-btn').classList.remove('on');
  document.getElementById('pinyin-btn').classList.remove('on-red');
  document.getElementById('hide-starred-btn').classList.remove('on-red','on-red-slash');
  document.querySelectorAll('.mode-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.getElementById('app-level-label').textContent = 'HSK'+level;
  showOnly('app-screen');
  render();
  window.scrollTo({top:0});
  // Load sao đã lưu từ server
  loadStars().then(function(){ render(); });
}
function backToSelect(){
  currentGrammarCategory = -1;
  showOnly('select-screen');
  renderHskGrid();
}

/* ===================== SPEECH ===================== */
var _audioCtx = null;
function speak(text){
  // Phương án 1: Web Speech API (hoạt động tốt trên iPhone khi có user interaction)
  if(window.speechSynthesis){
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; 
    u.rate = 0.85;
    // Tìm giọng tiếng Trung
    var voices = window.speechSynthesis.getVoices();
    for(var i=0; i<voices.length; i++){
      if(voices[i].lang && voices[i].lang.indexOf('zh') === 0){
        u.voice = voices[i];
        break;
      }
    }
    window.speechSynthesis.speak(u);
    return;
  }
  // Phương án 2: Google TTS fallback (cho thiết bị không có Speech API)
  try {
    var audio = new Audio('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=' + encodeURIComponent(text));
    audio.play().catch(function(){});
  } catch(e) {}
}

/* ===================== MAIN TABLE ===================== */
var pinyinHidden = false;
var starFilter = 'all'; // 'all' | 'only' | 'hide'
var searchQuery = '';

function setMode(m, btn){
  mode=m;
  if(m==='all') window.scrollTo({top:0,behavior:'smooth'});
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); render();
}
function togglePinyin(){
  pinyinHidden = !pinyinHidden;
  document.getElementById('pinyin-btn').classList.toggle('on-red', pinyinHidden);
  render();
}
function toggleHideStarred(){
  var btn = document.getElementById('hide-starred-btn');
  if(starFilter === 'all'){
    starFilter = 'only';
    btn.classList.add('on-red');
    btn.classList.remove('on-red-slash');
  } else if(starFilter === 'only'){
    starFilter = 'hide';
    btn.classList.add('on-red-slash');
  } else {
    starFilter = 'all';
    btn.classList.remove('on-red','on-red-slash');
  }
  render();
}
function showFlashcard(){
  // Update counts
  var t=VOCAB.length, s=starred.size;
  document.getElementById('fc-total').textContent=t;
  document.getElementById('fc-starred').textContent=s;
  document.getElementById('fc-unstarred').textContent=t-s;
  fcCfg={pool:'all',order:'seq',count:10};
  fcHidePy=false;
  document.getElementById('fc-pinyin-toggle').className='toggle-switch';
  // Reset opt buttons
  document.querySelectorAll('#fc-setup-screen .opt-btn').forEach(function(b,i){ b.classList.toggle('active', i===0); });
  document.getElementById('fc-custom-count').value='';
  showOnly('fc-setup-screen');
}
function handleSearch(input){
  searchQuery = input.value.trim().toLowerCase();
  render();
}
function toggleShuffle(){
  shuffled=!shuffled;
  document.getElementById('shuffle-btn').classList.toggle('on',shuffled);
  if(shuffled){
    order=VOCAB.map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  } else { order=VOCAB.map((_,i)=>i); }
  answers={}; render();
}
function resetAll(){ 
  answers={}; 
  searchQuery=''; 
  var si=document.getElementById('search-input'); 
  if(si) si.value='';
  starFilter='all';
  document.getElementById('hide-starred-btn').classList.remove('on-red','on-red-slash');
  pinyinHidden=false;
  document.getElementById('pinyin-btn').classList.remove('on-red');
  shuffled=false;
  document.getElementById('shuffle-btn').classList.remove('on');
  order=VOCAB.map((_,i)=>i);
  render(); 
}

function toggleStar(idx){
  if(isFreeLocked(idx)) return;
  if(starred.has(idx)) starred.delete(idx); else starred.add(idx);
  const btn=document.getElementById('star-'+idx);
  if(btn) btn.classList.toggle('starred', starred.has(idx));
  updateStarCount();
  saveStars();
}
function updateStarCount(){
  const el=document.getElementById('star-count');
  if(el) el.textContent = starred.size;
}

// Lưu sao lên server
function saveStars(){
  if(!currentLevel) return;
  if(currentProfile){
    profileData.stars = profileData.stars || {};
    profileData.stars[currentLevel] = [...starred];
    saveProfileData();
    return;
  }
  try{
    localStorage.setItem('hsk_stars_' + currentLevel, JSON.stringify([...starred]));
  }catch(e){ console.warn('saveStars localStorage failed', e); }
}
// Load stars from localStorage or profile fallback
async function loadStars(){
  if(!currentLevel) return;
  if(currentProfile){
    profileData.stars = profileData.stars || {};
    const stored = profileData.stars[currentLevel];
    if(stored){
      starred = new Set(stored);
      updateStarCount();
      return;
    }
  }
  try{
    var stored = localStorage.getItem('hsk_stars_' + currentLevel);
    if(stored){
      starred = new Set(JSON.parse(stored));
      updateStarCount();
      return;
    }
  }catch(e){ }
  if(!window._authToken) return;
  try{
    var res = await fetch(window.location.origin + '/api/stars?level=' + currentLevel, {
      headers:{'Authorization':'Bearer '+window._authToken}
    });
    if(res.ok){
      var data = await res.json();
      starred = new Set(data.stars || []);
      updateStarCount();
    }
  }catch(e){}
}

function toggleExample(idx){
  const row = document.getElementById('ex-row-'+idx);
  if(row) row.style.display = row.style.display==='none' ? 'table-row' : 'none';
}

/* Giới hạn: mọi TK đều xem free 50 từ đầu HSK 1. Từ 51 trở đi + HSK khác cần mua gói */
const FREE_LIMIT = 99999;
function isFreeOnly(){ return false; }
function isFreeLocked(originalIdx){ return false; }

function render(){
  const thead=document.getElementById('thead-row');
  const tbody=document.getElementById('tbody');

  // Filter by search
  var filteredOrder = order;
  if(searchQuery){
    filteredOrder = order.filter(function(idx){
      var w = VOCAB[idx];
      return w.hanzi.indexOf(searchQuery) !== -1 ||
             w.pinyin.toLowerCase().indexOf(searchQuery) !== -1 ||
             w.meaning.toLowerCase().indexOf(searchQuery) !== -1;
    });
  }
  // Filter by star
  if(starFilter === 'only'){
    filteredOrder = filteredOrder.filter(function(idx){
      return starred.has(idx);
    });
  } else if(starFilter === 'hide'){
    filteredOrder = filteredOrder.filter(function(idx){
      return !starred.has(idx);
    });
  }

  if(mode==='hanzi'){
    thead.innerHTML='<tr><th style="width:36px">#</th><th>Phiên âm</th><th>Nghĩa</th><th>Nhập chữ Hán</th><th></th></tr>';
  } else if(mode==='meaning'){
    thead.innerHTML='<tr><th style="width:36px">#</th><th>Chữ Hán</th><th>Phiên âm</th><th>Nhập nghĩa tiếng Việt</th><th></th></tr>';
  } else if(mode==='pinyin'){
    thead.innerHTML='<tr><th style="width:36px">#</th><th>Chữ Hán</th><th>Nghĩa</th><th>Nhập chữ Hán</th><th></th></tr>';
  } else {
    thead.innerHTML='<tr><th style="width:36px">#</th><th>Chữ Hán</th><th>Phiên âm</th><th>Nghĩa</th><th class="th-example-pc">Ví dụ</th><th style="width:60px;text-align:center">Đã nhớ</th></tr>';
  }
  document.getElementById('tbl').style.display='table';
  document.getElementById('empty-state').style.display= filteredOrder.length===0 ? 'block' : 'none';

  tbody.innerHTML = filteredOrder.map((idx,i)=>{
    const w=VOCAB[idx], a=answers[idx];
    const locked = isFreeLocked(idx);
    const rc=locked?'row-locked':(a?(a.correct?'row-correct':'row-wrong'):'');
    const icon=a&&!locked?(a.correct?'✅':'❌'):'';
    const val=a&&!locked?esc(a.value):'';
    const ic=a&&!locked?(a.correct?'correct':'wrong'):'';
    const dis=(a||locked)?'disabled':'';
    const isStarred=starred.has(idx);
    const speakBtn=locked?'🔊':`<button class="speak-btn" onclick="speak('${esc(w.hanzi)}')" title="Phát âm">🔊</button>`;
    const pinyinText = pinyinHidden ? '<span style="color:#888;font-style:italic">•••</span>' : esc(w.pinyin);

    if(mode==='hanzi'){
      return `<tr class="${rc}" id="row-${idx}">
        <td class="td-stt">${idx+1}</td>
        <td class="td-pinyin"><div class="td-pinyin-inner">${speakBtn}${pinyinText}</div></td>
        <td class="td-meaning">${esc(w.meaning)}</td>
        <td class="td-input">
          ${locked?'<span style="color:#999;font-size:12px">🔒</span>':`<input class="vocab-input ${ic}" type="text" ${dis} value="${val}"
            placeholder="Nhập chữ Hán..."
            onkeydown="if(event.key==='Enter')check(${idx},this,'hanzi')">`}
          ${a&&!a.correct&&!locked?`<div class="hint-answer">→ ${esc(w.hanzi)}</div>`:''}
        </td>
        <td class="td-result"><span class="result-icon" id="ic-${idx}">${icon}</span></td>
      </tr>`;
    } else if(mode==='meaning'){
      return `<tr class="${rc}" id="row-${idx}">
        <td class="td-stt">${idx+1}</td>
        <td class="td-hanzi">${esc(w.hanzi)}</td>
        <td class="td-pinyin"><div class="td-pinyin-inner">${speakBtn}${pinyinText}</div></td>
        <td class="td-input">
          ${locked?'<span style="color:#999;font-size:12px">🔒</span>':`<input class="vocab-input ${ic}" type="text" ${dis} value="${val}"
            placeholder="Nhập nghĩa tiếng Việt..."
            style="font-family:'Be Vietnam Pro',sans-serif;font-size:13px"
            onkeydown="if(event.key==='Enter')check(${idx},this,'meaning')">`}
          ${a&&!a.correct&&!locked?`<div class="hint-answer">→ ${esc(w.meaning)}</div>`:''}
        </td>
        <td class="td-result"><span class="result-icon" id="ic-${idx}">${icon}</span></td>
      </tr>`;
    } else if(mode==='pinyin'){
      return `<tr class="${rc}" id="row-${idx}">
        <td class="td-stt">${idx+1}</td>
        <td class="td-hanzi">${esc(w.hanzi)}</td>
        <td class="td-meaning">${esc(w.meaning)}</td>
        <td class="td-input">
          ${locked?'<span style="color:#999;font-size:12px">🔒</span>':`<input class="vocab-input ${ic}" type="text" ${dis} value="${val}"
            placeholder="Nhập chữ Hán..."
            style="font-family:'Be Vietnam Pro',sans-serif;font-size:13px"
            onkeydown="if(event.key==='Enter')check(${idx},this,'pinyin')">`}
          ${a&&!a.correct&&!locked?`<div class="hint-answer">→ ${esc(w.hanzi)}</div>`:''}
        </td>
        <td class="td-result"><span class="result-icon" id="ic-${idx}">${icon}</span></td>
      </tr>`;
    } else {
      const hasEx = w.ex_hanzi && w.ex_hanzi.trim() && !locked;
      const exPC = hasEx ? `<td class="td-example-pc"><div class="ex-hanzi">${esc(w.ex_hanzi)}</div><div class="ex-pinyin">${esc(w.ex_pinyin||'')}</div><div class="ex-viet">${esc(w.ex_viet||'')}</div></td>` : '<td class="td-example-pc"><span style="color:#555">—</span></td>';
      const tuLoai = w.tu_loai ? `<div class="tu-loai-tag">${esc(w.tu_loai)}</div>` : '';
      const recBtn = locked ? '' : `<button class="rec-word-btn" onclick="openRecordingModal('${esc(w.hanzi)}','${esc(w.pinyin)}')" title="Ghi âm phát âm">🎤</button>`;
      return `<tr class="${locked?'row-locked':''}" id="row-${idx}">
        <td class="td-stt">${idx+1}</td>
        <td class="td-hanzi">${esc(w.hanzi)}${tuLoai}</td>
        <td class="td-pinyin"><div class="td-pinyin-inner">${speakBtn}${recBtn}${pinyinText}</div></td>
        <td class="td-meaning">${esc(w.meaning)}</td>
        ${exPC}
        <td class="td-star">${locked?'🔒':`<button class="star-btn ${isStarred?'starred':''}" id="star-${idx}" onclick="toggleStar(${idx})" title="Đánh dấu đã nhớ">⭐</button>`}</td>
      </tr>`;
    }
  }).join('');
}

function check(idx, input, type){
  const w=VOCAB[idx], val=input.value.trim();
  if(!val) return;
  let correct = false;
  if(type==='hanzi'){
    correct = val===w.hanzi;
  } else if(type==='pinyin'){
    // Accept exact hanzi
    if(val === w.hanzi) {
      correct = true;
    } else {
      // Accept pinyin (with or without diacritics)
      var nu = normalizePinyin(val);
      var target = normalizePinyin(w.pinyin);
      if(nu && (nu === target || target.indexOf(nu) !== -1 || nu.indexOf(target) !== -1)) correct = true;
    }
  } else {
    // Chuẩn hóa: bỏ dấu cách thừa, lowercase
    const normalize = function(s){ return s.toLowerCase().replace(/\s*,\s*/g,',').replace(/\s*\/\s*/g,'/').replace(/\s+/g,' ').trim(); };
    const userVal = normalize(val);
    const answer = normalize(w.meaning);
    // Đúng nếu: khớp hoàn toàn, hoặc khách nhập 1 trong các nghĩa
    if(userVal === answer){
      correct = true;
    } else {
      // Tách nghĩa theo dấu phẩy hoặc /
      const parts = answer.split(/[,\/]/).map(function(p){return p.trim().toLowerCase();}).filter(function(p){return p;});
      correct = parts.indexOf(userVal) !== -1;
    }
  }
  answers[idx]={value:val, correct};
  input.className='vocab-input '+(correct?'correct':'wrong');
  input.disabled=true;
  const row=document.getElementById('row-'+idx);
  row.className=correct?'row-correct':'row-wrong';
  const ic=document.getElementById('ic-'+idx);
  ic.textContent=correct?'✅':'❌';
  ic.classList.remove('pop'); void ic.offsetWidth; ic.classList.add('pop');
  if(!correct){
    let hint=row.querySelector('.hint-answer');
    if(!hint){hint=document.createElement('div');hint.className='hint-answer';input.parentNode.appendChild(hint);}
    hint.textContent='→ '+(type==='hanzi'?w.hanzi:w.meaning);
  }
  // Auto focus next input
  setTimeout(function(){
    var allInputs = document.querySelectorAll('.vocab-input:not([disabled])');
    if(allInputs.length > 0){
      allInputs[0].focus();
      allInputs[0].scrollIntoView({behavior:'smooth', block:'center'});
    }
  }, 200);
}

/* ===================== EXAM SETUP ===================== */
var skipStarred = true;
var hidePinyinExam = false;

function showExamSetup(){
  updateStarCount();
  var maxWords = isFreeOnly() ? Math.min(VOCAB.length, FREE_LIMIT) : VOCAB.length;
  document.getElementById('exam-total').textContent = maxWords;
  examCfg = {pool:'all', type:'meaning', count:10};
  document.querySelectorAll('#exam-screen .opt-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('#exam-screen .setup-section').forEach((s,si)=>{
    const btns=s.querySelectorAll('.opt-btn');
    if(btns.length) btns[0].classList.add('active');
  });
  document.getElementById('custom-count').value='';
  document.getElementById('exam-warn').style.display='none';
  document.getElementById('exam-all-btn').textContent='Tất cả ('+maxWords+')';
  // Update progress
  updateExamProgress();
  // Update toggle state
  document.getElementById('skip-starred-toggle').className = 'toggle-switch' + (skipStarred ? ' on' : '');
  document.getElementById('hide-pinyin-toggle').className = 'toggle-switch' + (hidePinyinExam ? ' on' : '');
  showOnly('exam-screen');
}

function updateExamProgress(){
  var maxWords = isFreeOnly() ? Math.min(VOCAB.length, FREE_LIMIT) : VOCAB.length;
  var starredCount = starred.size;
  var remaining = maxWords - starredCount;
  if(remaining < 0) remaining = 0;
  var pct = maxWords > 0 ? Math.round((starredCount / maxWords) * 100) : 0;
  document.getElementById('prog-starred').textContent = starredCount;
  document.getElementById('prog-total').textContent = maxWords;
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-note').innerHTML = 'Còn <b>' + remaining + '</b> từ chưa đánh dấu';
}

function toggleSkipStarred(){
  skipStarred = !skipStarred;
  document.getElementById('skip-starred-toggle').className = 'toggle-switch' + (skipStarred ? ' on' : '');
}

function toggleHidePinyinExam(){
  hidePinyinExam = !hidePinyinExam;
  document.getElementById('hide-pinyin-toggle').className = 'toggle-switch' + (hidePinyinExam ? ' on' : '');
}

function resetStarProgress(){
  if(!confirm('Xóa hết ⭐ đã nhớ của HSK ' + currentLevel + '? Bạn sẽ kiểm tra lại từ đầu.')) return;
  starred = new Set();
  saveStars();
  updateStarCount();
  updateExamProgress();
  alert('Đã xóa hết ⭐ của HSK ' + currentLevel + '!');
}
function setExamOpt(key, val, btn){
  examCfg[key]=val;
  if(key==='count' && val===0) examCfg.count = isFreeOnly() ? Math.min(VOCAB.length, FREE_LIMIT) : VOCAB.length;
  if(btn){
    const group=btn.parentElement;
    group.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(key==='count') document.getElementById('custom-count').value='';
  }
  validateExam();
}
function validateExam(){
  const warn=document.getElementById('exam-warn');
  var maxWords = isFreeOnly() ? Math.min(VOCAB.length, FREE_LIMIT) : VOCAB.length;
  const pool = examCfg.pool==='starred' ? starred.size : maxWords;
  const cnt = examCfg.count;
  if(examCfg.pool==='starred' && starred.size===0){
    warn.textContent='⚠️ Bạn chưa đánh dấu từ nào là đã nhớ!';
    warn.style.display='block'; return false;
  }
  if(cnt > pool){
    warn.textContent=`⚠️ Số từ nhập (${cnt}) lớn hơn số từ có sẵn (${pool}). Sẽ dùng tối đa ${pool} từ.`;
    warn.style.display='block';
  } else { warn.style.display='none'; }
  return true;
}
function backToApp(){ showOnly('app-screen'); render(); }

/* ===================== START EXAM ===================== */
function startExam(){
  if(!validateExam() && examCfg.pool==='starred' && starred.size===0) return;
  if(examCfg.type==='pt'){
    startPt();
    return;
  }
  if(examCfg.type==='py'){
    startPy();
    return;
  }
  if(examCfg.type==='vt'){
    startVt();
    return;
  }
  let pool;
  if(examCfg.pool==='starred'){
    pool=[...starred].filter(function(idx){ return !isFreeLocked(idx); });
  } else {
    var maxIdx = isFreeOnly() ? Math.min(VOCAB.length, FREE_LIMIT) : VOCAB.length;
    pool=[];
    for(var i=0;i<maxIdx;i++){
      // Bỏ qua từ đã nhớ nếu toggle bật
      if(skipStarred && starred.has(i)) continue;
      pool.push(i);
    }
  }
  if(pool.length === 0){
    alert('Chúc mừng! Bạn đã nhớ hết tất cả từ vựng! Bấm "Đặt lại tiến độ" để làm lại từ đầu.');
    return;
  }
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const cnt=Math.min(examCfg.count||10, pool.length);
  pool=pool.slice(0,cnt);
  quizQuestions=pool.map(idx=>{
    let qtype=examCfg.type;
    if(qtype==='both') qtype=Math.random()<0.5?'meaning':'hanzi';
    return {idx, qtype};
  });
  quizIdx=0; quizResults=[];
  showOnly('quiz-screen');
  renderQuiz();
}


/* ===================== QUIZ ===================== */
function renderQuiz(){
  if(quizIdx>=quizQuestions.length){ showResult(); return; }
  const q=quizQuestions[quizIdx];
  const w=VOCAB[q.idx];
  const total=quizQuestions.length;
  document.getElementById('quiz-prog-text').textContent=`Câu ${quizIdx+1} / ${total}`;
  document.getElementById('quiz-bar').style.width=((quizIdx/total)*100)+'%';

  const correctIdx=q.idx;
  let wrongPool=VOCAB.map((_,i)=>i).filter(i=>i!==correctIdx);
  for(let i=wrongPool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[wrongPool[i],wrongPool[j]]=[wrongPool[j],wrongPool[i]];}
  const wrongs=wrongPool.slice(0,3);
  let choices=[correctIdx,...wrongs];
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}

  const card=document.getElementById('quiz-card');
  if(q.qtype==='meaning'){
    var pinyinDisplay = hidePinyinExam ? '<span style="color:#888">•••</span>' : esc(w.pinyin);
    card.innerHTML=`
      <div class="quiz-q-label">Chọn nghĩa tiếng Việt đúng</div>
      <div class="quiz-q-hanzi">${esc(w.hanzi)}</div>
      <button class="quiz-speak" onclick="speak('${esc(w.hanzi)}')" title="Phát âm">🔊</button>
      <div class="quiz-q-pinyin">${pinyinDisplay}</div>
      <div class="choices">
        ${choices.map(ci=>`<button class="choice-btn" onclick="pickChoice(this,${ci},${correctIdx},'meaning')">${esc(VOCAB[ci].meaning)}</button>`).join('')}
      </div>`;
  } else {
    card.innerHTML=`
      <div class="quiz-q-label">Chọn chữ Hán đúng</div>
      <div class="quiz-q-meaning">${esc(w.meaning)}</div>
      <div class="choices">
        ${choices.map(ci=>`<button class="choice-btn" onclick="pickChoice(this,${ci},${correctIdx},'hanzi')">
          <span class="choice-hanzi">${esc(VOCAB[ci].hanzi)}</span>
        </button>`).join('')}
      </div>`;
  }
}

function pickChoice(btn, chosen, correct, type){
  const card=document.getElementById('quiz-card');
  card.querySelectorAll('.choice-btn').forEach(b=>b.disabled=true);
  const isCorrect=chosen===correct;
  btn.classList.add(isCorrect?'correct-choice':'wrong-choice');
  if(!isCorrect){
    card.querySelectorAll('.choice-btn').forEach(b=>{
      const ci=parseInt(b.getAttribute('onclick').match(/pickChoice\(this,(\d+)/)[1]);
      if(ci===correct) b.classList.add('correct-choice');
    });
  }
  quizResults.push({idx:correct, correct:isCorrect, qtype:type});
  setTimeout(function(){ speak(VOCAB[correct].hanzi); }, 100);
  setTimeout(()=>{ quizIdx++; renderQuiz(); }, isCorrect?900:1500);
}

/* ===================== QUIT QUIZ ===================== */
function quitQuiz(){
  var done = quizResults.length;
  var total = quizQuestions.length;
  var correctN = quizResults.filter(function(r){ return r.correct; }).length;
  
  if(done === 0){
    // Chưa làm câu nào → thoát luôn
    backToApp();
    return;
  }
  
  // Hiện popup
  var summary = 'Bạn đã làm ' + done + '/' + total + ' câu, đúng ' + correctN + ' từ.';
  document.getElementById('quit-summary').textContent = summary;
  var saveBtn = document.getElementById('quit-save-btn');
  saveBtn.textContent = '⭐ Lưu ' + correctN + ' từ đúng & thoát';
  saveBtn.disabled = false;
  saveBtn.style.background = '';
  if(correctN === 0){
    saveBtn.textContent = 'Chưa có từ đúng để lưu';
    saveBtn.disabled = true;
    saveBtn.style.background = '#ccc';
  }
  document.getElementById('quit-modal').classList.add('show');
}

function closeQuitModal(){
  document.getElementById('quit-modal').classList.remove('show');
}

function quitAndSave(){
  // Lưu từ đúng vào ⭐
  var count = 0;
  quizResults.forEach(function(r){
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  document.getElementById('quit-modal').classList.remove('show');
  backToApp();
}

function quitNoSave(){
  document.getElementById('quit-modal').classList.remove('show');
  backToApp();
}

/* ===================== RESULT ===================== */
var quizStarChecked = new Set();

function showResult(){
  showOnly('result-screen');
  const total=quizResults.length;
  const correctN=quizResults.filter(r=>r.correct).length;
  const pct=Math.round((correctN/total)*100);
  document.getElementById('res-score').textContent=`${correctN}/${total}`;
  document.getElementById('res-sub').textContent=
    pct>=90?'🎉 Xuất sắc! Bạn thật giỏi!':
    pct>=70?'👍 Khá tốt! Tiếp tục cố gắng!':
    pct>=50?'💪 Ổn! Ôn luyện thêm nhé!':
    '📚 Cần ôn tập thêm nhiều hơn!';
  document.getElementById('res-correct').textContent=correctN;
  document.getElementById('res-wrong').textContent=total-correctN;

  // Từ đúng tick sẵn
  quizStarChecked = new Set();
  quizResults.forEach(function(r){ if(r.correct) quizStarChecked.add(r.idx); });

  const list=document.getElementById('res-list');
  list.innerHTML=quizResults.map(r=>{
    const w=VOCAB[r.idx];
    const checked = quizStarChecked.has(r.idx);
    return `<div class="result-item ${r.correct?'c':'w'}" onclick="toggleQuizStar(${r.idx}, this)">
      <div class="ri-check ${checked?'checked':''}" id="qstar-${r.idx}">${checked?'✓':''}</div>
      <div class="ri-hanzi">${esc(w.hanzi)}</div>
      <div class="ri-info">
        <div style="font-size:12px;color:var(--gray);font-style:italic">${esc(w.pinyin)}</div>
        <div style="font-size:13px">${esc(w.meaning)}</div>
      </div>
      <div class="ri-icon">${r.correct?'✅':'❌'}</div>
    </div>`;
  }).join('');

  updateSaveStarBtn();
}

function toggleQuizStar(idx, el){
  if(quizStarChecked.has(idx)){
    quizStarChecked.delete(idx);
  } else {
    quizStarChecked.add(idx);
  }
  var check = document.getElementById('qstar-'+idx);
  if(check){
    check.className = 'ri-check' + (quizStarChecked.has(idx) ? ' checked' : '');
    check.textContent = quizStarChecked.has(idx) ? '✓' : '';
  }
  updateSaveStarBtn();
}

function updateSaveStarBtn(){
  var btn = document.getElementById('btn-save-star');
  if(btn) btn.textContent = '⭐ Lưu từ đã nhớ (' + quizStarChecked.size + ' từ)';
}

function saveQuizStars(){
  console.log('saveQuizStars called, checked:', quizStarChecked.size, 'currentLevel:', currentLevel, 'token:', !!window._authToken);
  var count = 0;
  quizStarChecked.forEach(function(idx){
    if(!starred.has(idx)){
      starred.add(idx);
      count++;
    }
  });
  console.log('Added', count, 'new stars, total starred:', starred.size);
  
  // Đảm bảo currentLevel có giá trị
  if(!currentLevel){
    console.error('currentLevel is empty! Cannot save.');
    alert('Lỗi: không xác định được cấp HSK. Vui lòng quay lại và thử lại.');
    return;
  }
  
  saveStars();
  updateStarCount();
  var btn = document.getElementById('btn-save-star');
  if(btn){
    btn.textContent = '✅ Đã lưu ' + quizStarChecked.size + ' từ';
  }
}

/* ===================== FLASHCARD ===================== */
var fcCfg={pool:'all',order:'seq',count:10};
var fcHidePy=false, fcCards=[], fcIdx=0, fcFlipped=false, fcAnimDir='', fcStarred=new Set();

function setFcOpt(k,v,btn){
  fcCfg[k]=v;
  if(k==='count'&&v===0) fcCfg.count=VOCAB.length;
  if(btn){
    btn.parentElement.querySelectorAll('.opt-btn').forEach(function(b){b.classList.remove('active')});
    btn.classList.add('active');
    if(k==='count') document.getElementById('fc-custom-count').value='';
  }
}
function toggleFcPinyin(){
  fcHidePy=!fcHidePy;
  document.getElementById('fc-pinyin-toggle').className='toggle-switch'+(fcHidePy?' on':'');
}

function startFc(){
  var pool=[];
  for(var i=0;i<VOCAB.length;i++){
    if(fcCfg.pool==='starred'&&!starred.has(i)) continue;
    if(fcCfg.pool==='unstarred'&&starred.has(i)) continue;
    pool.push(i);
  }
  if(!pool.length){alert('Không có từ nào phù hợp!');return;}
  if(fcCfg.order==='rand'){
    for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
  }
  fcCards=pool.slice(0,Math.min(fcCfg.count||pool.length,pool.length));
  fcIdx=0;fcFlipped=false;fcAnimDir='';
  fcStarred=new Set();
  // Copy existing stars for cards in this session
  fcCards.forEach(function(ci){if(starred.has(ci)) fcStarred.add(ci);});
  showOnly('fc-play-screen');
  fcRender();
}

function fcRender(){
  if(fcIdx<0)fcIdx=0;
  if(fcIdx>=fcCards.length)fcIdx=fcCards.length-1;
  var ci=fcCards[fcIdx],w=VOCAB[ci],tot=fcCards.length;
  fcFlipped=false;
  var card=document.getElementById('fc-card');
  card.classList.remove('flipped');
  card.classList.remove('anim-left','anim-right');
  if(fcAnimDir){void card.offsetWidth;card.classList.add(fcAnimDir==='left'?'anim-left':'anim-right');fcAnimDir='';}
  // Progress
  document.getElementById('fc-prog-text').textContent=(fcIdx+1)+'/'+tot;
  document.getElementById('fc-prog-bar').style.width=((fcIdx+1)/tot*100)+'%';
  document.getElementById('fc-cur').textContent=fcIdx+1;
  document.getElementById('fc-tot').textContent=tot;
  // Star
  var isStar=fcStarred.has(ci);
  document.getElementById('fc-sf').classList.toggle('on',isStar);
  document.getElementById('fc-sb').classList.toggle('on',isStar);
  // Front
  document.getElementById('fc-hanzi').textContent=w.hanzi;
  document.getElementById('fc-pinyin').innerHTML=fcHidePy?'<span style="color:#ccc">•••</span>':esc(w.pinyin);
  // Back
  document.getElementById('fc-tuloai').textContent=w.tu_loai||'';
  document.getElementById('fc-meaning').textContent=w.meaning;
  if(w.ex_hanzi&&w.ex_hanzi.trim()){
    document.getElementById('fc-example').style.display='block';
    document.getElementById('fc-ex-hanzi').textContent=w.ex_hanzi;
    document.getElementById('fc-ex-pinyin').textContent=w.ex_pinyin||'';
    document.getElementById('fc-ex-viet').textContent=w.ex_viet||'';
  } else {
    document.getElementById('fc-example').style.display='none';
  }
  // Nav
  document.getElementById('fc-prev').disabled=(fcIdx===0);
  var nb=document.getElementById('fc-next');
  if(fcIdx===tot-1){nb.innerHTML='✓';nb.classList.add('fc-done');nb.disabled=false;}
  else{nb.innerHTML='▶';nb.classList.remove('fc-done');nb.disabled=false;}
}

function fcFlip(e){
  if(e&&e.target&&(e.target.closest('.fc-speak-btn')||e.target.closest('.fc-star'))) return;
  fcFlipped=!fcFlipped;
  document.getElementById('fc-card').classList.toggle('flipped',fcFlipped);
}
function fcNext(){if(fcIdx>=fcCards.length-1){fcShowEnd();return;}fcAnimDir='left';fcIdx++;fcRender();}
function fcPrev(){if(fcIdx>0){fcAnimDir='right';fcIdx--;fcRender();}}

// Keyboard
document.addEventListener('keydown',function(e){
  if(!document.getElementById('fc-play-screen').classList.contains('active')) return;
  if(document.getElementById('fc-quit-modal').classList.contains('show')) return;
  if(e.key==='ArrowRight') fcNext();
  else if(e.key==='ArrowLeft') fcPrev();
  else if(e.key===' '||e.key==='Enter'){e.preventDefault();fcFlip({});}
});

function fcToggleStar(){
  var ci=fcCards[fcIdx];
  if(fcStarred.has(ci)) fcStarred.delete(ci); else fcStarred.add(ci);
  var s=fcStarred.has(ci);
  document.getElementById('fc-sf').classList.toggle('on',s);
  document.getElementById('fc-sb').classList.toggle('on',s);
}
function fcSpeak(){
  var ci=fcCards[fcIdx],text=VOCAB[ci].hanzi;
  setTimeout(function(){ speak(text); }, 100);
}
function fcCountStarred(){
  var c=0;fcCards.forEach(function(ci){if(fcStarred.has(ci))c++;});return c;
}

// Quit modal
function showFcQuit(){
  var d=fcIdx+1,t=fcCards.length,s=fcCountStarred();
  document.getElementById('fc-quit-summary').textContent='Bạn đã lướt '+d+'/'+t+' từ, đánh dấu nhớ '+s+' từ.';
  var b=document.getElementById('fc-quit-save');
  if(s===0){b.textContent='Chưa có từ nào đánh dấu nhớ';b.disabled=true;b.style.opacity='.5';}
  else{b.textContent='⭐ Lưu '+s+' từ đã nhớ & thoát';b.disabled=false;b.style.opacity='1';}
  document.getElementById('fc-quit-modal').classList.add('show');
}
function closeFcQuit(){document.getElementById('fc-quit-modal').classList.remove('show');}
function fcQuitSave(){
  fcSaveStarsToMain();
  closeFcQuit();
  backToApp();
}
function fcQuitNoSave(){closeFcQuit();backToApp();}

// End screen
function fcShowEnd(){
  var t=fcCards.length,s=fcCountStarred();
  document.getElementById('fc-end-total').textContent=t;
  document.getElementById('fc-end-starred').textContent=s;
  var b=document.getElementById('fc-end-save');
  if(s===0){b.textContent='Chưa có từ nào đánh dấu nhớ';b.disabled=true;b.style.opacity='.5';}
  else{b.textContent='⭐ Lưu từ đã nhớ ('+s+' từ)';b.disabled=false;b.style.opacity='1';b.style.background='';}
  showOnly('fc-end-screen');
}
function fcEndSave(){
  fcSaveStarsToMain();
  var b=document.getElementById('fc-end-save');
  b.textContent='✅ Đã lưu '+fcCountStarred()+' từ!';
  b.disabled=true;
  b.style.background='#27ae60';
}

// Save flashcard stars to main starred set
function fcSaveStarsToMain(){
  fcCards.forEach(function(ci){
    if(fcStarred.has(ci)){
      starred.add(ci);
    }
  });
  saveStars();
  updateStarCount();
}

function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ===================== PRONUNCIATION TEST ===================== */
var ptCfg = {pool:'all', count:10};
var ptCards = [], ptIdx = 0, ptResults = [];
var ptRecognition = null;
var ptRecState = {
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  recognizedText: '',
  confidence: 0
};

function initSpeechRecognition(){
  if(ptRecognition) return;
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    console.warn('Speech Recognition API not supported');
    return;
  }
  ptRecognition = new SpeechRecognition();
  ptRecognition.continuous = false;
  ptRecognition.interimResults = true;
  ptRecognition.lang = 'zh-CN';
  
  ptRecognition.onstart = function(){
    document.getElementById('pt-rec-status').textContent = 'Đang nghe...';
    document.getElementById('pt-rec-result').style.display = 'none';
  };
  
  ptRecognition.onresult = function(event){
    var interim = '';
    var finalText = '';
    for(var i = event.resultIndex; i < event.results.length; i++){
      var transcript = event.results[i][0].transcript;
      if(event.results[i].isFinal){
        finalText += transcript;
      } else {
        interim += transcript;
      }
    }
    var displayText = finalText || interim;
    document.getElementById('pt-rec-status').textContent = displayText ? 'Nhận diện: ' + displayText : 'Đang nghe...';
    if(event.results[event.results.length - 1].isFinal){
      ptRecState.recognizedText = finalText.trim();
      evaluatePronunciation();
    }
  };
  
  ptRecognition.onerror = function(event){
    console.error('Speech Recognition error:', event.error);
    document.getElementById('pt-rec-status').textContent = 'Không thể nhận diện. Thử lại.';
  };
  
  ptRecognition.onend = function(){
    if(!ptRecState.recognizedText){
      document.getElementById('pt-rec-status').textContent = 'Không nhận diện được tiếng nói';
    }
  };
}

function showPtSetup(){
  var maxWords = VOCAB.length;
  document.getElementById('pt-total').textContent = maxWords;
  ptCfg = {pool:'all', count:10};
  document.querySelectorAll('#pt-setup-screen .opt-btn').forEach((b,i)=>{
    const group = b.parentElement;
    const isFirstInGroup = b === group.querySelector('.opt-btn');
    b.classList.toggle('active', isFirstInGroup);
  });
  document.getElementById('pt-custom-count').value='';
  showOnly('pt-setup-screen');
}

function setPtOpt(key, val, btn){
  ptCfg[key] = val;
  if(key==='count' && val===0) ptCfg.count = VOCAB.length;
  if(btn){
    const group = btn.parentElement;
    group.querySelectorAll('.opt-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    if(key==='count') document.getElementById('pt-custom-count').value='';
  }
}

function startPt(){
  initSpeechRecognition();
  var pool = [];
  for(var i=0; i<VOCAB.length; i++){
    if(examCfg.pool==='starred' && !starred.has(i)) continue;
    if(examCfg.pool==='unstarred' && starred.has(i)) continue;
    pool.push(i);
  }
  if(!pool.length){
    alert('Không có từ nào phù hợp!');
    return;
  }
  // Shuffle
  for(var i=pool.length-1; i>0; i--){
    var j = Math.floor(Math.random()*(i+1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  ptCards = pool.slice(0, Math.min(examCfg.count || pool.length, pool.length));
  ptIdx = 0;
  ptResults = [];
  showOnly('pt-play-screen');
  ptRender();
}

function ptRender(){
  if(ptIdx < 0) ptIdx = 0;
  if(ptIdx >= ptCards.length){
    showPtResult();
    return;
  }
  var ci = ptCards[ptIdx];
  var w = VOCAB[ci];
  var tot = ptCards.length;
  
  document.getElementById('pt-prog-text').textContent = `Câu ${ptIdx+1} / ${tot}`;
  document.getElementById('pt-prog-bar').style.width = ((ptIdx+1)/tot*100)+'%';
  
  // Display character
  document.getElementById('pt-character').textContent = w.hanzi;
  document.getElementById('pt-character-pinyin').textContent = w.pinyin;
  
  // Reset recording state
  ptRecState.recognizedText = '';
  ptRecState.confidence = 0;
  
  resetPtRecUI();
}

function resetPtRecUI(){
  document.getElementById('pt-rec-start-btn').classList.remove('hidden');
  document.getElementById('pt-rec-stop-btn').classList.add('hidden');
  document.getElementById('pt-rec-status').textContent = 'Bấm để bắt đầu ghi âm';
  document.getElementById('pt-rec-result').style.display = 'none';
  document.getElementById('pt-rec-result').className = 'pt-rec-result';
}

function ptPlayReference(){
  if(ptIdx < ptCards.length){
    speak(VOCAB[ptCards[ptIdx]].hanzi);
  }
}

async function ptStartRec(){
  try{
    ptRecState.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    ptRecState.mediaRecorder = new MediaRecorder(ptRecState.stream);
    ptRecState.audioChunks = [];
    
    ptRecState.mediaRecorder.ondataavailable = function(event){
      ptRecState.audioChunks.push(event.data);
    };
    
    ptRecState.mediaRecorder.onstop = function(){
      // Stop speech recognition gracefully
      if(ptRecognition && ptRecognition.abort){
        try{
          ptRecognition.abort();
        } catch(e){}
      }
    };
    
    ptRecState.mediaRecorder.start();
    ptRecState.isRecording = true;
    
    document.getElementById('pt-rec-start-btn').classList.add('hidden');
    document.getElementById('pt-rec-stop-btn').classList.remove('hidden');
    document.getElementById('pt-rec-status').textContent = 'Đang ghi âm...';
    
    // Start speech recognition
    if(ptRecognition){
      try{
        ptRecognition.start();
      } catch(e){
        console.warn('Speech recognition might already be running', e);
      }
    }
  } catch(error){
    console.error('Error accessing microphone:', error);
    alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền và thử lại.');
  }
}

function ptStopRec(){
  if(ptRecState.mediaRecorder && ptRecState.isRecording){
    ptRecState.mediaRecorder.stop();
    ptRecState.isRecording = false;
    
    if(ptRecState.stream){
      ptRecState.stream.getTracks().forEach(track => track.stop());
    }
    
    document.getElementById('pt-rec-start-btn').classList.remove('hidden');
    document.getElementById('pt-rec-stop-btn').classList.add('hidden');
    document.getElementById('pt-rec-status').textContent = 'Đang xử lý...';
  }
}

function evaluatePronunciation(){
  if(ptIdx >= ptCards.length) return;
  var ci = ptCards[ptIdx];
  var w = VOCAB[ci];
  var recognized = ptRecState.recognizedText.toLowerCase().trim();
  var targetHanzi = w.hanzi;
  var targetPinyin = w.pinyin.toLowerCase();
  
  // Try to match
  var isCorrect = false;
  var matchType = '';
  
  // Direct character match
  if(recognized.indexOf(targetHanzi) !== -1){
    isCorrect = true;
    matchType = 'character';
  }
  // Pinyin match (approximate)
  else if(recognized.indexOf(targetPinyin) !== -1 || 
          targetPinyin.indexOf(recognized) !== -1){
    isCorrect = true;
    matchType = 'pinyin';
  }
  // Fuzzy pinyin match (first 2 chars)
  else if(recognized.length >= 2 && targetPinyin.length >= 2 && 
          recognized.substring(0,2) === targetPinyin.substring(0,2)){
    isCorrect = true;
    matchType = 'similar';
  }
  
  // Show result
  var resultDiv = document.getElementById('pt-rec-result');
  resultDiv.style.display = 'block';
  
  if(isCorrect){
    resultDiv.className = 'pt-rec-result correct';
    resultDiv.innerHTML = `✅ Chính xác! <br><small style="font-size:12px;color:#27ae60">Nhận diện: "${recognized}"</small>`;
  } else {
    resultDiv.className = 'pt-rec-result wrong';
    resultDiv.innerHTML = `❌ Không chính xác <br><small style="font-size:12px;color:#c0392b">Nhận diện: "${recognized}"<br>Mong đợi: "${targetPinyin}"</small>`;
  }
  
  ptResults.push({
    idx: ci,
    correct: isCorrect,
    recognized: recognized,
    expected: targetPinyin,
    hanzi: targetHanzi,
    matchType: matchType
  });
  
  // Auto next after delay
  setTimeout(()=>{
    ptIdx++;
    ptRender();
  }, isCorrect ? 1500 : 2000);
}

function ptRetry(){
  resetPtRecUI();
}

function ptQuitTest(){
  var done = ptIdx;
  var total = ptCards.length;
  var correctN = ptResults.filter(r => r.correct).length;
  
  if(done === 0){
    backToApp();
    return;
  }
  
  var summary = 'Bạn đã kiểm tra ' + done + '/' + total + ' từ, đúng ' + correctN + ' từ.';
  document.getElementById('pt-quit-summary').textContent = summary;
  document.getElementById('pt-quit-modal').classList.add('show');
}

function closePtQuit(){
  document.getElementById('pt-quit-modal').classList.remove('show');
}

function ptQuitSave(){
  var count = 0;
  ptResults.forEach(r => {
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  closePtQuit();
  backToApp();
}

function ptQuitCancel(){
  closePtQuit();
  backToApp();
}

function ptSaveCorrectToStar(){
  var count = 0;
  ptResults.forEach(r => {
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  alert('✅ Đã lưu ' + count + ' từ phát âm đúng!');
  backToApp();
}

function pySaveCorrectToStar(){
  var count = 0;
  pyResults.forEach(r => {
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  alert('✅ Đã lưu ' + count + ' từ nhập đúng!');
  backToApp();
}

function showPtResult(){
  showOnly('pt-result-screen');
  var total = ptResults.length;
  var correctN = ptResults.filter(r => r.correct).length;
  var pct = Math.round((correctN/total)*100);
  
  document.getElementById('pt-res-score').textContent = `${correctN}/${total}`;
  document.getElementById('pt-res-sub').textContent = 
    pct >= 80 ? '🎉 Tuyệt vời! Phát âm rất tốt!' :
    pct >= 60 ? '👍 Tốt! Tiếp tục luyện tập!' :
    pct >= 40 ? '💪 Ổn! Cần ôn luyện thêm' :
    '📚 Cần rèn luyện nhiều hơn!';
  
  var list = document.getElementById('pt-res-list');
  list.innerHTML = ptResults.map(r => {
    return `<div class="pt-result-item ${r.correct?'correct':'wrong'}">
      <div class="pt-ri-icon">${r.correct?'✅':'❌'}</div>
      <div class="pt-ri-content">
        <div class="pt-ri-hanzi">${esc(r.hanzi)}</div>
        <div class="pt-ri-pinyin">${esc(r.expected)}</div>
        <div class="pt-ri-recognized">Nhận diện: "${esc(r.recognized)}"</div>
      </div>
    </div>`;
  }).join('');
  
  document.getElementById('pt-res-correct').textContent = correctN;
  document.getElementById('pt-res-wrong').textContent = total - correctN;
}

/* ===================== RECORDING FUNCTIONALITY ===================== */
var recordingState = {
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  stream: null,
  startTime: 0,
  timerInterval: null,
  currentHanzi: '',
  currentPinyin: ''
};

function openRecordingModal(hanzi, pinyin) {
  recordingState.currentHanzi = hanzi;
  recordingState.currentPinyin = pinyin;
  document.getElementById('rec-hanzi').textContent = hanzi;
  document.getElementById('rec-pinyin').textContent = pinyin;
  document.getElementById('recording-modal').classList.add('show');
  resetRecordingUI();
}

function closeRecordingModal() {
  // Stop recording if active
  if(recordingState.isRecording) {
    stopRecording();
  }
  // Clear states
  recordingState.audioChunks = [];
  recordingState.currentHanzi = '';
  recordingState.currentPinyin = '';
  document.getElementById('recording-modal').classList.remove('show');
}

function resetRecordingUI() {
  document.getElementById('rec-start-btn').classList.remove('hidden');
  document.getElementById('rec-stop-btn').classList.add('hidden');
  document.getElementById('playback-section').classList.add('hidden');
  document.getElementById('recording-status').textContent = 'Nhấn để bắt đầu ghi âm';
  document.getElementById('recording-time').textContent = '00:00';
  document.getElementById('recorded-audio').src = '';
  recordingState.audioChunks = [];
}

async function startRecording() {
  try {
    recordingState.stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    recordingState.mediaRecorder = new MediaRecorder(recordingState.stream);
    recordingState.audioChunks = [];
    
    recordingState.mediaRecorder.ondataavailable = function(event) {
      recordingState.audioChunks.push(event.data);
    };

    recordingState.mediaRecorder.onstop = function() {
      const audioBlob = new Blob(recordingState.audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      document.getElementById('recorded-audio').src = audioUrl;
      document.getElementById('playback-section').classList.remove('hidden');
    };

    recordingState.mediaRecorder.start();
    recordingState.isRecording = true;
    recordingState.startTime = Date.now();
    
    // Update UI
    document.getElementById('rec-start-btn').classList.add('hidden');
    document.getElementById('rec-stop-btn').classList.remove('hidden');
    document.getElementById('recording-status').textContent = 'Đang ghi âm...';
    
    // Start timer
    updateRecordingTime();
    recordingState.timerInterval = setInterval(updateRecordingTime, 100);
    
  } catch(error) {
    console.error('Error accessing microphone:', error);
    alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền và thử lại.');
  }
}

function stopRecording() {
  if(recordingState.mediaRecorder && recordingState.isRecording) {
    recordingState.mediaRecorder.stop();
    recordingState.isRecording = false;
    
    // Stop timer
    if(recordingState.timerInterval) {
      clearInterval(recordingState.timerInterval);
    }
    
    // Stop stream
    if(recordingState.stream) {
      recordingState.stream.getTracks().forEach(track => track.stop());
    }
    
    // Update UI
    document.getElementById('rec-start-btn').classList.remove('hidden');
    document.getElementById('rec-stop-btn').classList.add('hidden');
    document.getElementById('recording-status').textContent = 'Ghi âm hoàn thành!';
  }
}

function updateRecordingTime() {
  if(recordingState.isRecording) {
    const elapsed = Math.floor((Date.now() - recordingState.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    document.getElementById('recording-time').textContent = timeStr;
  }
}

function playRecording() {
  const audio = document.getElementById('recorded-audio');
  if(audio.src) {
    audio.play().catch(err => console.error('Error playing audio:', err));
  }
}

function deleteRecording() {
  resetRecordingUI();
}

function playReferenceAudio() {
  // Use the same speak function to play reference
  speak(recordingState.currentHanzi);
}

// Add recording button to table (called from render function)
// The button onclick will be: openRecordingModal('字','zì')

/* ===================== VIETNAMESE TRANSLATION TEST ===================== */
var vtCfg = { count: 10, order: 'seq', pool: 'all' };
var vtCards = [], vtIdx = 0, vtResults = [];

function showVtSetup(){
  vtCfg = { count: 10, order: 'seq', pool: 'all' };
  document.querySelectorAll('#vt-setup-screen .setup-section').forEach(function(section){
    var buttons = section.querySelectorAll('.opt-btn');
    if(buttons.length) buttons.forEach(function(btn,i){ btn.classList.toggle('active', i===0); });
  });
  document.getElementById('vt-custom-count').value='';
  document.getElementById('vt-total').textContent = VOCAB.length;
  showOnly('vt-setup-screen');
}

function setVtOpt(key, val, btn){
  vtCfg[key] = val;
  if(key==='count' && val===0) vtCfg.count = VOCAB.length;
  if(btn){
    var group = btn.parentElement;
    group.querySelectorAll('.opt-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    if(key==='count') document.getElementById('vt-custom-count').value='';
  }
}

function startVt(){
  var pool = [];
  for(var i=0;i<VOCAB.length;i++){
    if(examCfg.pool==='starred' && !starred.has(i)) continue;
    if(examCfg.pool==='unstarred' && starred.has(i)) continue;
    pool.push(i);
  }
  if(pool.length===0){
    if(examCfg.pool==='starred') alert('Không có từ đã nhớ để kiểm tra!');
    else if(examCfg.pool==='unstarred') alert('Không có từ chưa nhớ để kiểm tra!');
    else alert('Không có từ để kiểm tra!');
    return;
  }
  for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  var cnt = Math.min(examCfg.count || 10, pool.length);
  vtCards = pool.slice(0, cnt);
  vtIdx = 0; vtResults = [];
  showOnly('vt-play-screen');
  vtRender();
}

function vtRender(){
  if(vtIdx >= vtCards.length){
    showVtResult();
    return;
  }
  var ci = vtCards[vtIdx];
  var w = VOCAB[ci];
  var tot = vtCards.length;
  var promptText = (w.ex_viet && w.ex_viet.trim()) ? w.ex_viet : w.meaning;
  var answerText = (w.ex_hanzi && w.ex_hanzi.trim()) ? w.ex_hanzi : w.hanzi;
  document.getElementById('vt-prog-text').textContent = (vtIdx+1) + ' / ' + tot;
  document.getElementById('vt-prog-bar').style.width = ((vtIdx+1)/tot*100) + '%';
  document.getElementById('vt-meaning').textContent = promptText;
  document.getElementById('vt-input').dataset.answer = answerText;
  var inp = document.getElementById('vt-input');
  inp.value=''; inp.focus();
  document.getElementById('vt-feedback').textContent = '';
  renderVtCharButtons(w);
}

function renderVtCharButtons(w){
  var allHanzi = (w.ex_hanzi && w.ex_hanzi.trim()) ? w.ex_hanzi : w.hanzi;
  var chars = allHanzi.split('');
  // keep only Chinese characters
  chars = chars.filter(function(ch){ return /[\u4e00-\u9fff]/.test(ch); });
  var unique = [];
  chars.forEach(function(ch){ if(ch && unique.indexOf(ch) === -1) unique.push(ch); });
  var row = document.getElementById('vt-char-row');
  var row = document.getElementById('vt-char-row');
  if(!row){ return; }
  row.innerHTML = unique.map(function(ch){
    var safe = ch.replace(/'/g, "\\'");
    return '<button type="button" class="vt-char-btn" onclick="vtAppendChar(\''+safe+'\')">'+esc(ch)+'</button>';
  }).join('');
}

function vtAppendChar(ch){
  var inp = document.getElementById('vt-input');
  if(!inp) return;
  inp.value = inp.value + ch;
  inp.focus();
}

function vtClearInput(){
  var inp = document.getElementById('vt-input');
  if(inp){ inp.value = ''; inp.focus(); }
}

function vtHideKeyboard(){
  var inp = document.getElementById('vt-input');
  if(inp){ inp.blur(); }
}

function vtCheck(){
  if(vtIdx >= vtCards.length) return;
  var val = document.getElementById('vt-input').value.trim();
  if(!val) return;
  var ci = vtCards[vtIdx];
  var w = VOCAB[ci];
  var answerText = (w.ex_hanzi && w.ex_hanzi.trim()) ? w.ex_hanzi : w.hanzi;
  var normalizeText = function(s){ return String(s||'').replace(/[\s，。！？,.!?；；]/g,'').trim(); };
  var ok = normalizeText(val) === normalizeText(answerText);
  vtResults.push({ idx: ci, input: val, correct: ok, answer: answerText });
  var fb = document.getElementById('vt-feedback');
  if(ok){ fb.innerHTML = '✅ Đúng! Câu ví dụ: ' + answerText; }
  else { fb.innerHTML = '❌ Sai — Đáp án: ' + answerText; }
  setTimeout(function(){ vtIdx++; vtRender(); }, ok ? 800 : 1400);
}

function vtNext(){
  if(vtIdx < vtCards.length){ vtResults.push({ idx: vtCards[vtIdx], input: '', correct: false }); }
  vtIdx++; vtRender();
}

function showVtResult(){
  showOnly('vt-result-screen');
  var total = vtResults.length;
  var correctN = vtResults.filter(function(r){ return r.correct; }).length;
  var pct = total > 0 ? Math.round((correctN/total)*100) : 0;
  document.getElementById('vt-res-score').textContent = `${correctN}/${total}`;
  document.getElementById('vt-res-sub').textContent =
    pct >= 80 ? '🎉 Tuyệt vời! Dịch tiếng Việt rất tốt!' :
    pct >= 60 ? '👍 Tốt! Tiếp tục luyện tập!' :
    pct >= 40 ? '💪 Ổn! Cần ôn luyện thêm' :
    '📚 Cần rèn luyện nhiều hơn!';
  document.getElementById('vt-res-correct').textContent = correctN;
  document.getElementById('vt-res-wrong').textContent = total - correctN;
  var list = document.getElementById('vt-res-list');
  list.innerHTML = vtResults.map(function(r){
    var w = VOCAB[r.idx];
    var promptText = (w.ex_viet && w.ex_viet.trim()) ? w.ex_viet : w.meaning;
    var answerText = r.answer || ((w.ex_hanzi && w.ex_hanzi.trim()) ? w.ex_hanzi : w.hanzi);
    return `<div class="pt-result-item ${r.correct?'correct':'wrong'}">
      <div class="pt-ri-icon">${r.correct?'✅':'❌'}</div>
      <div class="pt-ri-content">
        <div class="pt-ri-hanzi">${esc(answerText)}</div>
        <div class="pt-ri-pinyin">${esc(promptText)}</div>
        <div class="pt-ri-recognized">Câu trả lời: "${esc(r.input)}"</div>
      </div>
    </div>`;
  }).join('');
}

function vtQuitTest(){
  if(vtIdx === 0 && vtResults.length === 0){
    backToApp();
    return;
  }
  var done = vtIdx;
  var total = vtCards.length;
  var correctN = vtResults.filter(function(r){ return r.correct; }).length;
  var summary = 'Bạn đã làm ' + done + '/' + total + ' từ, đúng ' + correctN + ' từ.';
  document.getElementById('vt-quit-summary').textContent = summary;
  document.getElementById('vt-quit-modal').classList.add('show');
}

function closeVtQuit(){
  document.getElementById('vt-quit-modal').classList.remove('show');
}

function vtQuitSave(){
  var count = 0;
  vtResults.forEach(function(r){
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  closeVtQuit();
  backToApp();
}

function vtQuitCancel(){
  closeVtQuit();
  backToApp();
}

function vtSaveCorrectToStar(){
  var count = 0;
  vtResults.forEach(function(r){
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  alert('✅ Đã lưu ' + count + ' từ dịch đúng!');
  backToApp();
}

/* ===================== PINYIN TYPING TEST (missing handlers) ===================== */
var pyCfg = { count: 10, order: 'seq', pool: 'all' };
var pyCards = [], pyIdx = 0, pyResults = [];

function showPySetup(){
  // initialize options
  pyCfg = { count: 10, order: 'seq', pool: 'all' };
  document.querySelectorAll('#py-setup-screen .setup-section').forEach(function(section){
    var buttons = section.querySelectorAll('.opt-btn');
    if(buttons.length) buttons.forEach(function(btn,i){ btn.classList.toggle('active', i===0); });
  });
  document.getElementById('py-custom-count').value='';
  document.getElementById('py-total').textContent = VOCAB.length;
  showOnly('py-setup-screen');
}

function setPyOpt(key, val, btn){
  pyCfg[key] = val;
  if(key==='count' && val===0) pyCfg.count = VOCAB.length;
  if(btn){
    var group = btn.parentElement;
    group.querySelectorAll('.opt-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    if(key==='count') document.getElementById('py-custom-count').value='';
  }
}

function normalizePinyin(s){
  if(!s) return '';
  // lower case, remove diacritics, remove spaces
  try{ s = s.toLowerCase(); }catch(e){}
  // decompose unicode and strip combining marks
  s = s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  s = s.replace(/\s+/g,'').replace(/[^a-z0-9/]/g,'');
  return s;
}

function startPy(){
  var pool = [];
  for(var i=0;i<VOCAB.length;i++){
    if(examCfg.pool==='starred' && !starred.has(i)) continue;
    if(examCfg.pool==='unstarred' && starred.has(i)) continue;
    pool.push(i);
  }
  if(pool.length===0){
    if(examCfg.pool==='starred') alert('Không có từ đã nhớ để kiểm tra!');
    else if(examCfg.pool==='unstarred') alert('Không có từ chưa nhớ để kiểm tra!');
    else alert('Không có từ để kiểm tra!');
    return;
  }
  for(var i=pool.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
  var cnt = Math.min(examCfg.count || 10, pool.length);
  pyCards = pool.slice(0, cnt);
  pyIdx = 0; pyResults = [];
  showOnly('py-play-screen');
  pyRender();
}

function showPyResult(){
  showOnly('py-result-screen');
  var total = pyResults.length;
  var correctN = pyResults.filter(r => r.correct).length;
  var pct = Math.round((correctN/total)*100);
  
  document.getElementById('py-res-score').textContent = `${correctN}/${total}`;
  document.getElementById('py-res-sub').textContent = 
    pct >= 80 ? '🎉 Tuyệt vời! Nhập Pinyin rất tốt!' :
    pct >= 60 ? '👍 Tốt! Tiếp tục luyện tập!' :
    pct >= 40 ? '💪 Ổn! Cần ôn luyện thêm' :
    '📚 Cần rèn luyện nhiều hơn!';
  
  var list = document.getElementById('py-res-list');
  list.innerHTML = pyResults.map(r => {
    var w = VOCAB[r.idx];
    return `<div class="pt-result-item ${r.correct?'correct':'wrong'}">
      <div class="pt-ri-icon">${r.correct?'✅':'❌'}</div>
      <div class="pt-ri-content">
        <div class="pt-ri-hanzi">${esc(w.hanzi)}</div>
        <div class="pt-ri-pinyin">${esc(w.pinyin)}</div>
        <div class="pt-ri-recognized">Nhập: "${esc(r.input)}"</div>
      </div>
    </div>`;
  }).join('');
  
  document.getElementById('py-res-correct').textContent = correctN;
  document.getElementById('py-res-wrong').textContent = total - correctN;
}

function pyRender(){
  if(pyIdx >= pyCards.length){
    // finish: show result screen
    showPyResult();
    return;
  }
  var ci = pyCards[pyIdx];
  var w = VOCAB[ci];
  var tot = pyCards.length;
  document.getElementById('py-prog-text').textContent = (pyIdx+1) + ' / ' + tot;
  document.getElementById('py-prog-bar').style.width = ((pyIdx+1)/tot*100) + '%';
  document.getElementById('py-hanzi').textContent = w.hanzi;
  document.getElementById('py-meaning').textContent = w.meaning;
  var inp = document.getElementById('py-input');
  inp.value=''; inp.focus();
  document.getElementById('py-feedback').textContent = '';
}

function pyCheck(){
  if(pyIdx >= pyCards.length) return;
  var val = document.getElementById('py-input').value.trim();
  if(!val) return;
  var ci = pyCards[pyIdx];
  var w = VOCAB[ci];
  var user = val.trim();
  var ok = false;
  // Accept exact hanzi
  if(user === w.hanzi) ok = true;
  // Accept pinyin (with or without diacritics)
  var nu = normalizePinyin(user);
  var target = normalizePinyin(w.pinyin);
  if(nu && (nu === target || target.indexOf(nu) !== -1 || nu.indexOf(target) !== -1)) ok = true;
  pyResults.push({ idx: ci, input: user, correct: ok });
  var fb = document.getElementById('py-feedback');
  if(ok){ fb.innerHTML = '✅ Đúng! ' + (w.pinyin ? ('Pinyin: ' + w.pinyin) : ''); }
  else { fb.innerHTML = '❌ Sai — Đáp án: ' + (w.pinyin || w.hanzi); }
  // next
  setTimeout(function(){ pyIdx++; pyRender(); }, ok ? 800 : 1400);
}

function pyNext(){
  // skip current
  if(pyIdx < pyCards.length){ pyResults.push({ idx: pyCards[pyIdx], input: '', correct: false }); }
  pyIdx++; pyRender();
}

function showPyResult(){
  var total = pyResults.length;
  var correctN = pyResults.filter(r => r.correct).length;
  var done = pyIdx;
  var summary = 'Bạn đã hoàn thành ' + done + '/' + total + ' từ, đúng ' + correctN + ' từ.';
  document.getElementById('py-quit-summary').textContent = summary;
  document.getElementById('py-quit-modal').classList.add('show');
}

function pyQuitTest(){
  if(pyIdx === 0 && pyResults.length === 0){
    backToApp();
    return;
  }
  var done = pyIdx;
  var total = pyCards.length;
  var correctN = pyResults.filter(function(r){ return r.correct; }).length;
  var summary = 'Bạn đã làm ' + done + '/' + total + ' từ, đúng ' + correctN + ' từ.';
  document.getElementById('py-quit-summary').textContent = summary;
  document.getElementById('py-quit-modal').classList.add('show');
}

function closePyQuit(){
  document.getElementById('py-quit-modal').classList.remove('show');
}

function pyQuitSave(){
  var count = 0;
  pyResults.forEach(r => {
    if(r.correct && !starred.has(r.idx)){
      starred.add(r.idx);
      count++;
    }
  });
  saveStars();
  updateStarCount();
  closePyQuit();
  backToApp();
}

function pyQuitCancel(){
  closePyQuit();
  backToApp();
}


