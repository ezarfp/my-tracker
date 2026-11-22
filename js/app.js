function switchTab(tabName) {
  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabName);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const active = btn.dataset.tab === tabName;
    btn.className = active
      ? 'nav-btn flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-indigo-600 text-white shadow-md transition'
      : 'nav-btn flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-slate-500 dark:text-slate-400 transition';
  });

  if (tabName === 'duit' && typeof renderChartsKeuangan === 'function') {
    setTimeout(() => renderChartsKeuangan(), 50);
  }
  lucide.createIcons();
}

function switchSubKuliah(subName) {
  document.querySelectorAll('.sub-kuliah').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('sub-' + subName);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.sub-kuliah-btn').forEach(btn => {
    const active = btn.dataset.sub === subName;
    btn.className = active
      ? 'sub-kuliah-btn flex-1 py-2 rounded-xl text-xs font-extrabold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm transition'
      : 'sub-kuliah-btn flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 transition';
  });
  lucide.createIcons();
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function showToast(msg) {
  const toast = document.getElementById('toastBox');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
  }, 3000);
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ezar_dark_mode', isDark);
  if (typeof renderChartsKeuangan === 'function') renderChartsKeuangan();
  lucide.createIcons();
}

if (localStorage.getItem('ezar_dark_mode') === 'true') {
  document.documentElement.classList.add('dark');
}

// ==========================================
// USER PROFILE (4 FIELDS) & TIMEZONE SETTINGS
// ==========================================
function applyUserProfile() {
  const firstName = (userProfile.nama || 'User').split(' ')[0];
  const { label: tzLabel } = getActiveTimezoneConfig();

  const greetingEl = document.getElementById('homeGreeting');
  if (greetingEl) greetingEl.textContent = `Halo, ${firstName} 👋`;

  const dateHeader = document.getElementById('homeDateHeader');
  if (dateHeader) {
    const hariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()];
    dateHeader.textContent = `${hariIni}, ${formatDisplayDate(getTodayDateStr())} • ${tzLabel}`;
  }

  const kulSub = document.getElementById('kuliahSubHeader');
  if (kulSub) kulSub.textContent = `${userProfile.kelas} • ${userProfile.universitas}`;

  const profName = document.getElementById('profileDisplayName');
  if (profName) profName.textContent = userProfile.nama;
  const profUniv = document.getElementById('profileDisplayUniv');
  if (profUniv) profUniv.textContent = userProfile.universitas;
  const profJurusan = document.getElementById('profileDisplayJurusan');
  if (profJurusan) profJurusan.textContent = `${userProfile.jurusan} • ${userProfile.kelas}`;

  const inNama = document.getElementById('inputProfNama');
  if (inNama) {
    inNama.value = userProfile.nama;
    document.getElementById('inputProfUniv').value = userProfile.universitas;
    document.getElementById('inputProfJurusan').value = userProfile.jurusan;
    document.getElementById('inputProfKelas').value = userProfile.kelas;
  }

  const tzSelect = document.getElementById('selectTimezonePref');
  if (tzSelect) {
    tzSelect.value = localStorage.getItem('ezar_tz_pref') || 'auto';
  }

  const budgetIn = document.getElementById('inputBudgetBulanan');
  if (budgetIn) budgetIn.value = budgetBulanan;

  if (userProfile.foto) {
    const imgHome = document.getElementById('homeAvatarImg');
    const imgProf = document.getElementById('profileAvatarImg');
    if (imgHome) imgHome.src = userProfile.foto;
    if (imgProf) imgProf.src = userProfile.foto;
  }

  const lastSync = localStorage.getItem('ezar_last_sync');
  const lastSyncEl = document.getElementById('lastSyncTime');
  if (lastSync && lastSyncEl) lastSyncEl.textContent = `Sync: ${lastSync}`;
}

function simpanProfil(e) {
  e.preventDefault();
  userProfile.nama = document.getElementById('inputProfNama').value.trim() || 'Ezar Faad Pratama';
  userProfile.universitas = document.getElementById('inputProfUniv').value.trim() || 'Telkom University Purwokerto';
  userProfile.jurusan = document.getElementById('inputProfJurusan').value.trim() || 'S1 Teknik Informatika';
  userProfile.kelas = document.getElementById('inputProfKelas').value.trim() || 'PS1IF-14-REG-03';
  localStorage.setItem('ezar_profile_v7', JSON.stringify(userProfile));
  applyUserProfile();
  showToast('Profil lengkap berhasil disimpan!');
}

function ubahZonaWaktu(val) {
  localStorage.setItem('ezar_tz_pref', val);
  sanitizeAllData();
  applyUserProfile();
  renderAll();
  const { label } = getActiveTimezoneConfig();
  showToast(`Zona waktu aktif: ${label}`);
}

function uploadFotoProfil(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      userProfile.foto = canvas.toDataURL('image/jpeg', 0.8);
      localStorage.setItem('ezar_profile_v7', JSON.stringify(userProfile));
      applyUserProfile();
      showToast('Foto profil diperbarui!');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ==========================================
// POMODORO FOCUS TIMER
// ==========================================
let pomoSeconds = 25 * 60;
let pomoInterval = null;

function updatePomoDisplay() {
  const m = String(Math.floor(pomoSeconds / 60)).padStart(2, '0');
  const s = String(pomoSeconds % 60).padStart(2, '0');
  const el = document.getElementById('pomoTimerDisplay');
  if (el) el.textContent = `${m}:${s}`;
}

function startPomodoro() {
  if (pomoInterval) return;
  pomoInterval = setInterval(() => {
    if (pomoSeconds > 0) {
      pomoSeconds--;
      updatePomoDisplay();
    } else {
      clearInterval(pomoInterval);
      pomoInterval = null;
      if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 });
      showToast('🎉 Sesi Fokus 25 Menit Selesai! Waktunya istirahat.');
    }
  }, 1000);
  showToast('Timer Fokus dimulai!');
}

function pausePomodoro() {
  clearInterval(pomoInterval);
  pomoInterval = null;
}

function resetPomodoro() {
  pausePomodoro();
  pomoSeconds = 25 * 60;
  updatePomoDisplay();
}

// ==========================================
// ONLINE / OFFLINE & MASTER RENDER
// ==========================================
function updateOnlineStatus() {
  const dot = document.getElementById('onlineDot');
  const label = document.getElementById('onlineLabel');
  if (dot && label) {
    if (navigator.onLine) {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      label.textContent = 'Online';
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-amber-500';
      label.textContent = 'Offline';
    }
  }
  updateSyncBadge();
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function renderAll() {
  renderKeuangan();
  renderJadwal();
  renderTugas();
  renderUjian();
  renderNilai();
  renderRutinitas();
  updateSyncBadge();
  lucide.createIcons();
}

applyUserProfile();
updateOnlineStatus();
renderAll();