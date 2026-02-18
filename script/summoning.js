// ═══ ITEM INFO DATABASE ═══
// Format: { unlock, get, desc }
// Ganti [write on here] dengan teks kamu sendiri!
const ITEM_INFO = {
  'summoning-potion': {
    unlock: 'Fishing',
    get: 'Crafting on Placed Bottle: \n\n Moonglow ×1\n Bottled Water ×1\n Variegated Lardfish ×1',
    desc: `- Moonglow:
    Can get on block Jungle Grass 
    
    ->Glass:
    Craft Any Sand Block ×2 on Furnace
    Craft Any Glass Platfrom ×2 By Hand
    Craft Glass Wall ×4 on Work Bench

    ->Bottle:
    Craft Glass on Furnace

    - Bottled Water:
    Craft Bottle on Water
    
    - Variegated Lardfish:\n Can get fish on biome Underground Jungle` },
  'firecracker': { unlock: 'After Defeated Boss Wall of Flesh', get: '25% Chance of Dropped Boss', desc: '—' },
  'terraprisma': { unlock: 'After Defeated Boss Empress of Light', get: 'Must be 100% Damage on Daytime', desc: '—' },
  'cobwhip': { unlock: 'First Item', get: 'Crafting on Loom: \n\n Cobweb ×30\n Any Wood ×10', desc: 'Dont Use for Bosses' },
};

// ═══ POPUP LOGIC ═══
let activePopupId = null;

function getItemImg(id) {
  // Cari img src dari DOM item yang ada
  const wrap = document.querySelector(`.item-wrap[data-item-id="${id}"]`);
  if (!wrap) return '';
  const img = wrap.querySelector('.item img');
  return img ? img.src : '';
}
function getItemName(id) {
  const wrap = document.querySelector(`.item-wrap[data-item-id="${id}"]`);
  if (!wrap) return id;
  return wrap.querySelector('.item').textContent.trim();
}

function openPopup(e, id) {
  e.stopPropagation();
  const popup = document.getElementById('itemPopup');
  const info = ITEM_INFO[id] || {};

  document.getElementById('popupImg').src = getItemImg(id);
  document.getElementById('popupName').textContent = getItemName(id);

  const sections = [
    { sectionId: 'psUnlock', textId: 'popupUnlock', val: info.unlock },
    { sectionId: 'psGet',    textId: 'popupGet',    val: info.get },
    { sectionId: 'psDesc',   textId: 'popupDesc',   val: info.desc },
  ];

  sections.forEach(({ sectionId, textId, val }) => {
    const sec = document.getElementById(sectionId);
    const divider = sec.nextElementSibling; // .popup-divider setelah section
    if (!val || val === '—') {
      sec.style.display = 'none';
      if (divider && divider.classList.contains('popup-divider')) divider.style.display = 'none';
    } else {
      sec.style.display = '';
      if (divider && divider.classList.contains('popup-divider')) divider.style.display = '';
      document.getElementById(textId).innerText = val;
    }
  });

  // Posisi popup dekat tombol ℹ
  // position:fixed → koordinat viewport, JANGAN tambah scrollY
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const pw = 280;
  const ph = 300; // estimated max height
  const margin = 8;
  let left = rect.right + margin;
  let top = rect.top;

  // Jangan keluar layar kanan → tampilkan di kiri tombol
  if (left + pw > window.innerWidth - margin) {
    left = rect.left - pw - margin;
  }
  // Jangan keluar layar kiri
  if (left < margin) left = margin;

  // Jangan keluar layar bawah
  if (top + ph > window.innerHeight - margin) {
    top = window.innerHeight - ph - margin;
  }
  // Jangan keluar layar atas
  if (top < margin) top = margin;

  popup.style.left = Math.max(margin, left) + 'px';
  popup.style.top = top + 'px';
  popup.classList.remove('visible');
  void popup.offsetWidth; // force reflow for animation
  popup.classList.add('visible');
  activePopupId = id;
}

function closePopup() {
  document.getElementById('itemPopup').classList.remove('visible');
  activePopupId = null;
}

// Klik di luar popup → tutup
document.addEventListener('click', function(e) {
  const popup = document.getElementById('itemPopup');
  if (popup.classList.contains('visible') && !popup.contains(e.target)) {
    closePopup();
  }
});

// ═══ ITEM STATE LOGIC ═══
const STAGE_KEY = 'terraria-summoning';
const ITEMS_KEY = 'terraria-summoning-items';
const CYCLE = ['none', 'owned', 'skip'];
let itemStates = {};

function loadItems() {
  try { itemStates = JSON.parse(localStorage.getItem(ITEMS_KEY) || '{}'); }
  catch(e) { itemStates = {}; }
}
function saveItems() { localStorage.setItem(ITEMS_KEY, JSON.stringify(itemStates)); }

function applyItemId(id) {
  const s = itemStates[id] || 'none';
  document.querySelectorAll(`.item-wrap[data-item-id="${id}"]`).forEach(w => {
    w.dataset.state = s;
    w.querySelector('.item-btn').dataset.s = s;
  });
}

function applyAll() {
  const seen = new Set();
  document.querySelectorAll('.item-wrap[data-item-id]').forEach(w => {
    const id = w.dataset.itemId;
    if (!seen.has(id)) { seen.add(id); applyItemId(id); }
  });
  updateSummary();
}

function cycleItem(btn) {
  const id = btn.closest('.item-wrap').dataset.itemId;
  const cur = itemStates[id] || 'none';
  const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
  if (next === 'none') delete itemStates[id]; else itemStates[id] = next;
  saveItems();
  applyItemId(id);
  updateSummary();
}

function updateSummary() {
  let owned = 0, skip = 0;
  const names = [];
  const seen = new Set();
  document.querySelectorAll('.item-wrap[data-item-id]').forEach(w => {
    const id = w.dataset.itemId;
    if (seen.has(id)) return;
    seen.add(id);
    const s = itemStates[id];
    if (s === 'owned') { owned++; names.push(w.querySelector('.item').textContent.trim()); }
    if (s === 'skip') skip++;
  });
  document.getElementById('ownedCount').textContent = owned;
  document.getElementById('skipCount').textContent = skip;
  const el = document.getElementById('ownedNames');
  if (owned === 0 && skip === 0) el.textContent = '— no items marked yet';
  else el.textContent = owned > 0 ? '✓ ' + names.join(', ') : (skip > 0 ? skip + ' item di-skip' : '');
}

function applyRecBadges() {
  document.querySelectorAll('.rec-badge').forEach(span => {
    const val = parseInt(span.textContent.trim(), 10);
    if (isNaN(val)) return;
    const tier = Math.max(10, Math.min(100, Math.floor(val / 10) * 10));
    span.classList.add('rec-' + tier);
    span.textContent = val + '%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => span.classList.add('rec-ready'));
    });
  });
}

// ═══ RESET ALL (item + stage) ═══
function resetAll() {
  // Reset items
  itemStates = {};
  saveItems();
  applyAll();
  // Reset stages
  localStorage.removeItem(STAGE_KEY);
  loadStages();
  // Tutup popup kalau terbuka
  closePopup();
}

// ═══ STAGE LOGIC ═══
function stages() { return Array.from(document.querySelectorAll('div.stage')); }

function saveStages() {
  localStorage.setItem(STAGE_KEY, JSON.stringify(stages().map(s => s.classList.contains('done'))));
  renderProgress();
}

function loadStages() {
  stages().forEach((s, i) => { s.querySelector('.stage-index').textContent = i + 1; });
  let data = [];
  try { data = JSON.parse(localStorage.getItem(STAGE_KEY) || '[]'); } catch(e) {}
  stages().forEach((s, i) => {
    const b = s.querySelector('.stage-body');
    b.style.transition = 'none';
    if (data[i] === true) {
      s.classList.add('done');
      b.style.maxHeight = '0';
      b.style.opacity = '0';
      s.querySelector('.done-label').style.display = 'inline';
      s.querySelector('.stage-checkbox').checked = true;
    } else {
      s.classList.remove('done');
      b.style.maxHeight = '2000px';
      b.style.opacity = '1';
      s.querySelector('.done-label').style.display = 'none';
      s.querySelector('.stage-checkbox').checked = false;
    }
    setTimeout(() => { b.style.transition = ''; }, 100);
  });
  renderProgress();
}

function toggleStage(h) {
  const s = h.closest('div.stage'), b = s.querySelector('.stage-body');
  const nd = !s.classList.contains('done');
  if (nd) {
    s.classList.add('done');
    b.style.maxHeight = '0'; b.style.opacity = '0';
    s.querySelector('.done-label').style.display = 'inline';
    s.querySelector('.stage-checkbox').checked = true;
  } else {
    s.classList.remove('done');
    b.style.maxHeight = '2000px'; b.style.opacity = '1';
    s.querySelector('.done-label').style.display = 'none';
    s.querySelector('.stage-checkbox').checked = false;
  }
  saveStages();
}

function renderProgress() {
  const all = stages();
  const done = all.map((s, i) => s.classList.contains('done') ? i + 1 : null).filter(Boolean);
  let t = `${done.length} / ${all.length} completed`;
  if (done.length) t += ` · Stage ${done.join(', ')}`;
  document.getElementById('progressText').textContent = t;
}

window.addEventListener('DOMContentLoaded', () => {
  loadItems();
  loadStages();
  applyAll();
  applyRecBadges();

  document.querySelectorAll('.item-wrap[data-item-id]').forEach(w => {
    const id = w.dataset.itemId;
    if (!ITEM_INFO[id]) {
      const btn = w.querySelector('.tooltip-btn');
      if (btn) btn.style.display = 'none';
    }
  });
});